from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import text
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
import jwt
import uvicorn
from pydantic import BaseModel
import os

from database import engine, Base, get_db
from models import Usuario

app = FastAPI(title="Servicio de Autenticación e Identidad - SHServices")

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class LoginRequest(BaseModel):
    usuario: str
    password: str

class RegistroRequest(BaseModel):
    usuario: str
    password: str
    rol: str
    sede: str

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.execute(text("CREATE SCHEMA IF NOT EXISTS esquema_auth"))
        await conn.run_sync(Base.metadata.create_all)


from sqlalchemy import func

@app.post("/api/v1/auth/login")
async def login(credenciales: LoginRequest, db: AsyncSession = Depends(get_db)):
    query = select(Usuario).where(func.lower(Usuario.id_usuario) == func.lower(credenciales.usuario))
    resultado = await db.execute(query)
    usuario_db = resultado.scalars().first()

    if not usuario_db or not usuario_db.activo:
        raise HTTPException(status_code=401, detail="Usuario incorrecto o inactivo")
    
    if not pwd_context.verify(credenciales.password, usuario_db.password_hash):
        raise HTTPException(status_code=401, detail="Contraseña incorrecta")

    expiracion = datetime.now(timezone.utc) + timedelta(hours=8)
    payload = {
        "id_usuario": usuario_db.id_usuario,
        "rol": usuario_db.rol,
        "sede_asignada": usuario_db.sede,
        "exp": expiracion
    }
    
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return {"access_token": token, "token_type": "bearer", "rol": usuario_db.rol}

@app.post("/api/v1/auth/registro")
async def registrar_usuario(nuevo_usuario: RegistroRequest, db: AsyncSession = Depends(get_db)):
    
    query = select(Usuario).where(Usuario.id_usuario == nuevo_usuario.usuario)
    resultado = await db.execute(query)
    if resultado.scalars().first():
        raise HTTPException(status_code=400, detail="El nombre de usuario ya está registrado")

    hash_seguro = pwd_context.hash(nuevo_usuario.password)

    db_user = Usuario(
        id_usuario=nuevo_usuario.usuario,
        password_hash=hash_seguro,
        rol=nuevo_usuario.rol,
        sede=nuevo_usuario.sede
    )
    db.add(db_user)
    await db.commit()
    return {"mensaje": f"Usuario {nuevo_usuario.usuario} creado exitosamente con rol {nuevo_usuario.rol}"}


@app.get("/api/v1/auth/usuarios")
async def listar_usuarios(db: AsyncSession = Depends(get_db)):
    query = select(Usuario.id_usuario, Usuario.rol, Usuario.sede, Usuario.activo)
    resultado = await db.execute(query)
    usuarios = resultado.all()
    
    return [
        {"id": u.id_usuario, "rol": u.rol, "sede": u.sede, "activo": u.activo} 
        for u in usuarios
    ]

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8003, reload=True)