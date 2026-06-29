from fastapi import FastAPI, Request, HTTPException, Body, Depends, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import httpx
import jwt
import uvicorn
import os

app = FastAPI(
    title="API Gateway Centralizado - SHServices",
    description="Punto de entrada protegido con cifrado y validación de roles JWT",
    version="2.0.0"
)

# --- CONFIGURACIÓN DE CORS (Permitir al Frontend conectarse) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite peticiones desde cualquier origen (localhost:5173)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mapa de enrutamiento interno hacia los microservicios aislados
SERVICIOS = {
    "tickets": "http://ticket-service:8001",
    "almacen": "http://almacen-service:8002",
    "auth": "http://auth-service:8003"
}

# --- CONFIGURACIÓN DE SEGURIDAD CRÍTICA ---
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
security = HTTPBearer()

# 1. AUTENTICACIÓN (AuthN): Valida la firma y vigencia del token JWT
def verificar_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="El token operativo ha expirado. Inicie sesión nuevamente.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token de acceso inválido, corrupto o falsificado.")

# 2. AUTORIZACIÓN (AuthZ): Verifica si el rol tiene privilegios operativos
def verificar_permisos_operativos(usuario_token: dict = Depends(verificar_token)):
    rol_usuario = usuario_token.get("rol")
    roles_permitidos = ["RECEPCIONISTA", "TECNICO", "ADMIN"]
    
    if rol_usuario not in roles_permitidos:
        raise HTTPException(
            status_code=403, 
            detail=f"Acceso denegado: El rol '{rol_usuario}' no posee permisos para realizar operaciones en esta plataforma."
        )
    return usuario_token


# --- PROXIES REVERSOS ASÍNCRONOS PROTEGIDOS ---

# --- RUTAS DE AUTENTICACIÓN E IDENTIDAD (IAM) ---

# 1. Login (RUTA PÚBLICA: No requiere token)
@app.post("/api/v1/auth/login")
async def proxy_login(payload: dict = Body(...)):
    url = f"{SERVICIOS['auth']}/api/v1/auth/login"
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload, timeout=10.0)
            if response.status_code >= 400:
                raise HTTPException(status_code=response.status_code, detail=response.json().get("detail", "Error de autenticación"))
            return response.json()
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="El Servicio de Autenticación no está disponible.")

# 2. Registro (RUTA PROTEGIDA: Solo para Administradores)
@app.post("/api/v1/auth/registro")
async def proxy_registro(
    payload: dict = Body(...),
    usuario_token: dict = Depends(verificar_permisos_operativos)
):
    if usuario_token.get("rol") != "ADMIN":
        raise HTTPException(status_code=403, detail="Estrictamente prohibido: Solo los administradores pueden registrar personal.")
    
    url = f"{SERVICIOS['auth']}/api/v1/auth/registro"
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=payload, timeout=10.0)
        if response.status_code >= 400:
            raise HTTPException(status_code=response.status_code, detail=response.json().get("detail"))
        return response.json()

# Enrutador para la raíz de Gestión de Tickets (POST)
@app.post("/api/v1/tickets")
async def proxy_tickets_raiz(
    payload: dict = Body(...),
    usuario_token: dict = Depends(verificar_permisos_operativos)
):
    url = f"{SERVICIOS['tickets']}/api/v1/tickets"
    
    # Inyección perimetral segura de identidad para evitar Spoofing
    headers_seguros = {
        "x-usuario-id": str(usuario_token.get("id_usuario")),
        "x-usuario-rol": str(usuario_token.get("rol")),
        "x-usuario-sede": str(usuario_token.get("sede_assigned", usuario_token.get("sede_asignada", "PIURA")))
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                url=url,
                json=payload,
                headers=headers_seguros,
                timeout=10.0
            )
            if response.status_code >= 400:
                raise HTTPException(status_code=response.status_code, detail=response.json())
            return response.json()
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="El Servicio de Gestión de Tickets no se encuentra disponible.")


# Enrutador dinámico para subrutas de Tickets (PATCH, GET, PUT, DELETE)
@app.api_route("/api/v1/tickets/{path:path}", methods=["GET", "PUT", "PATCH", "DELETE"])
async def proxy_tickets_subrutas(
    request: Request, 
    path: str, 
    payload: Optional[dict] = Body(None),
    usuario_token: dict = Depends(verificar_permisos_operativos)
):
    url = f"{SERVICIOS['tickets']}/api/v1/tickets/{path}"
    
    headers_seguros = {
        "x-usuario-id": str(usuario_token.get("id_usuario")),
        "x-usuario-rol": str(usuario_token.get("rol")),
        "x-usuario-sede": str(usuario_token.get("sede_assigned", usuario_token.get("sede_asignada", "PIURA")))
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.request(
                method=request.method,
                url=url,
                json=payload if payload else None,
                headers=headers_seguros,
                timeout=10.0
            )
            if response.status_code >= 400:
                raise HTTPException(status_code=response.status_code, detail=response.json())
            return response.json()
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="El Servicio de Gestión de Tickets no se encuentra disponible.")


# Enrutador dinámico para el Almacén e Inventario
@app.api_route("/api/v1/almacen/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy_almacen(
    request: Request,
    path: str,
    payload: Optional[dict] = Body(None),
    usuario_token: dict = Depends(verificar_permisos_operativos)
):
    url = f"{SERVICIOS['almacen']}/api/v1/almacen/{path}"
    
    headers_seguros = {
        "x-usuario-id": str(usuario_token.get("id_usuario")),
        "x-usuario-rol": str(usuario_token.get("rol")),
        "x-usuario-sede": str(usuario_token.get("sede_assigned", usuario_token.get("sede_asignada", "PIURA")))
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.request(
                method=request.method,
                url=url,
                json=payload if payload else None,
                headers=headers_seguros,
                timeout=10.0
            )
            if response.status_code >= 400:
                raise HTTPException(status_code=response.status_code, detail=response.json())
            return response.json()
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="El Servicio de Almacén no se encuentra disponible.")


if __name__ == "__main__":
    # Corre de forma pública en el puerto tradicional 8000
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)