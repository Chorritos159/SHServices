from fastapi import FastAPI, Request, Response, HTTPException, Body, Depends, Security
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

# Obtenemos la URL del frontend desde el entorno
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173").strip().strip('"').strip("'")

# --- CONFIGURACIÓN DE CORS (Permitir al Frontend conectarse) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_URL,
        "http://localhost:5173",  # Respaldo explícito
        "http://127.0.0.1:5173"   # Respaldo explícito
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mapa de enrutamiento interno
SERVICIOS = {
    "tickets": "http://ticket-service:8001",
    "almacen": "http://almacen-service:8002",
    "auth": "http://auth-service:8003"
}

# --- CONFIGURACIÓN DE SEGURIDAD CRÍTICA ---
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
security = HTTPBearer()

# 1. AUTENTICACIÓN (AuthN)
def verificar_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="El token ha expirado. Inicie sesión nuevamente.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido, corrupto o falsificado.")

# 2. AUTORIZACIÓN (AuthZ)
def verificar_permisos_operativos(usuario_token: dict = Depends(verificar_token)):
    rol_usuario = usuario_token.get("rol")
    if rol_usuario not in ["RECEPCIONISTA", "TECNICO", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Acceso denegado: Privilegios insuficientes.")
    return usuario_token


# --- RUTAS DE AUTENTICACIÓN E IDENTIDAD (IAM) ---

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

@app.post("/api/v1/auth/registro")
async def proxy_registro(payload: dict = Body(...), usuario_token: dict = Depends(verificar_permisos_operativos)):
    if usuario_token.get("rol") != "ADMIN":
        raise HTTPException(status_code=403, detail="Solo los administradores pueden registrar personal.")
    
    url = f"{SERVICIOS['auth']}/api/v1/auth/registro"
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=payload, timeout=10.0)
        if response.status_code >= 400:
            raise HTTPException(status_code=response.status_code, detail=response.json().get("detail"))
        return response.json()

@app.get("/api/v1/auth/usuarios")
async def proxy_listar_usuarios(usuario_token: dict = Depends(verificar_permisos_operativos)):
    if usuario_token.get("rol") != "ADMIN":
        raise HTTPException(status_code=403, detail="Solo admins pueden ver el directorio.")
    
    url = f"{SERVICIOS['auth']}/api/v1/auth/usuarios"
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, timeout=10.0)
            return response.json()
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Servicio de Autenticación no disponible.")


# --- TICKETS ---

@app.get("/api/v1/tickets")
async def proxy_obtener_tickets(request: Request, token: dict = Depends(verificar_permisos_operativos)):
    sede = token.get("sede_asignada", "PIURA")
    params = dict(request.query_params)
    if token.get("rol") != "ADMIN": params["sede"] = sede

    headers = {"x-usuario-id": str(token.get("id_usuario")), "x-usuario-rol": str(token.get("rol")), "x-usuario-sede": str(sede)}
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{SERVICIOS['tickets']}/api/v1/tickets", params=params, headers=headers, timeout=10.0)
        try:
            return response.json()
        except Exception:
            raise HTTPException(status_code=502, detail=f"Error interno del Servicio de Tickets: {response.text}")

@app.post("/api/v1/tickets")
async def proxy_crear_ticket(payload: dict = Body(...), token: dict = Depends(verificar_permisos_operativos)):
    sede = token.get("sede_asignada", "PIURA")
    if token.get("rol") != "ADMIN": payload["sede"] = sede

    headers = {"x-usuario-id": str(token.get("id_usuario")), "x-usuario-rol": str(token.get("rol")), "x-usuario-sede": str(sede)}
    async with httpx.AsyncClient() as client:
        response = await client.post(f"{SERVICIOS['tickets']}/api/v1/tickets", json=payload, headers=headers, timeout=10.0)
        try:
            if response.status_code >= 400: raise HTTPException(status_code=response.status_code, detail=response.json())
            return response.json()
        except Exception as e:
            if isinstance(e, HTTPException): raise e
            raise HTTPException(status_code=502, detail=f"Fallo al procesar el ticket: {response.text}")

@app.api_route("/api/v1/tickets/{path:path}", methods=["GET", "PUT", "PATCH", "DELETE"])
async def proxy_tickets_subrutas(request: Request, path: str, payload: Optional[dict] = Body(None), token: dict = Depends(verificar_permisos_operativos)):
    sede = token.get("sede_asignada", "PIURA")
    headers = {"x-usuario-id": str(token.get("id_usuario")), "x-usuario-rol": str(token.get("rol")), "x-usuario-sede": str(sede)}
    async with httpx.AsyncClient() as client:
        response = await client.request(request.method, f"{SERVICIOS['tickets']}/api/v1/tickets/{path}", json=payload, headers=headers, timeout=10.0)
        try:
            return response.json()
        except Exception:
            raise HTTPException(status_code=502, detail=f"Error en ruta dinámica: {response.text}")


# --- RUTAS DE ALMACÉN ---
@app.api_route("/api/v1/almacen/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy_almacen(request: Request, path: str, payload: Optional[dict] = Body(None), usuario_token: dict = Depends(verificar_permisos_operativos)):
    url = f"{SERVICIOS['almacen']}/api/v1/almacen/{path}"
    headers_seguros = {
        "x-usuario-id": str(usuario_token.get("id_usuario")),
        "x-usuario-rol": str(usuario_token.get("rol")),
        "x-usuario-sede": str(usuario_token.get("sede_asignada", "PIURA"))
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.request(method=request.method, url=url, json=payload if payload else None, headers=headers_seguros, timeout=10.0)
            if response.status_code >= 400:
                raise HTTPException(status_code=response.status_code, detail=response.json())
            return response.json()
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="El Servicio de Almacén no se encuentra disponible.")

@app.get("/api/v1/notificaciones")
async def proxy_get_notificaciones(request: Request):
    """Proxy con patrón de Resiliencia (Timeout) y Seguridad Perimetral"""
    async with httpx.AsyncClient() as client:
        try:
            # Reenviamos las cabeceras (incluyendo los headers inyectados x-usuario)
            headers = dict(request.headers)
            headers.pop("host", None) 
            
            # CONCEPTO SOA: TIMEOUT (Evitamos colgar el Gateway)
            res = await client.get(
                "http://notificaciones-service:8004/api/v1/notificaciones",
                headers=headers,
                timeout=3.0  # Si no responde en 3 segundos, aborta.
            )
            return Response(content=res.content, status_code=res.status_code, media_type="application/json")
            
        except httpx.RequestError as e:
            # CONCEPTO SOA: DEGRADACIÓN ELEGANTE (Si el servicio cae, devolvemos lista vacía en vez de Error 500)
            print(f" Falla de resiliencia en Notificaciones: {e}")
            return []

@app.post("/api/v1/notificaciones/marcar-leidas")
async def proxy_marcar_notificaciones(request: Request):
    async with httpx.AsyncClient() as client:
        try:
            headers = dict(request.headers)
            headers.pop("host", None)
            
            res = await client.post(
                "http://notificaciones-service:8004/api/v1/notificaciones/marcar-leidas",
                headers=headers,
                timeout=3.0
            )
            return Response(content=res.content, status_code=res.status_code, media_type="application/json")
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Servicio de notificaciones temporalmente inaccesible")

@app.get("/api/v1/usuarios")
async def proxy_listar_usuarios(request: Request):
    """Obtiene la lista del personal de forma resiliente"""
    async with httpx.AsyncClient() as client:
        try:
            headers = dict(request.headers)
            headers.pop("host", None)
            # Reenviamos la petición al puerto 8003 (auth-service)
            res = await client.get("http://auth-service:8003/api/v1/auth/usuarios", headers=headers, timeout=5.0)
            return Response(content=res.content, status_code=res.status_code, media_type="application/json")
        except httpx.RequestError as e:
            print(f"⚠️ Error conectando al auth-service: {e}")
            raise HTTPException(status_code=503, detail="Servicio de autenticación inalcanzable")

@app.post("/api/v1/usuarios/registro")
async def proxy_registrar_usuario(request: Request):
    """Crea un nuevo usuario (Solo Administradores)"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token no proporcionado")
    
    token = auth_header.split(" ")[1]
    
    # Decodificar el token para verificar que sea ADMIN
    try:
        # Leemos el payload del token
        import jwt
        payload = jwt.decode(token, options={"verify_signature": False}) 
    except Exception:
        raise HTTPException(status_code=401, detail="Token inválido")
        
    if payload.get("rol") != "ADMIN":
        raise HTTPException(status_code=403, detail="Acceso denegado. Solo administradores.")
        
    # Si es ADMIN, enviamos la creación al auth-service
    async with httpx.AsyncClient() as client:
        try:
            headers = dict(request.headers)
            headers.pop("host", None)
            body = await request.body() # Capturamos los datos del formulario de React
            
            res = await client.post("http://auth-service:8003/api/v1/auth/registro", headers=headers, content=body, timeout=5.0)
            return Response(content=res.content, status_code=res.status_code, media_type="application/json")
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Servicio de autenticación inalcanzable")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)