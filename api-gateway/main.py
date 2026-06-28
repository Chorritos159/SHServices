from fastapi import FastAPI, Request, HTTPException, Body, Depends, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
import httpx
import jwt
import uvicorn

app = FastAPI(
    title="API Gateway Centralizado - SHServices",
    description="Punto de entrada protegido con cifrado y validación de roles JWT",
    version="2.0.0"
)

# Mapa de enrutamiento interno hacia los microservicios aislados
SERVICIOS = {
    "tickets": "http://ticket-service:8001",
    "almacen": "http://almacen-service:8002"
}

# --- CONFIGURACIÓN DE SEGURIDAD CRÍTICA ---
security = HTTPBearer()
SECRET_KEY = "shservices_super_secreto_2026"
ALGORITHM = "HS256"

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