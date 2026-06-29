import asyncio
import os
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from passlib.context import CryptContext
from database import engine, Base
from models import Usuario

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def sembrar_admins():
    async with engine.begin() as conn:
        await conn.execute(text("CREATE SCHEMA IF NOT EXISTS esquema_auth"))
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSession(engine) as session:
        # Extraemos los datos del .env sin dejar ningún respaldo en el código
        equipo = [
            {"user": os.getenv("ADMIN1_USER"), "pass": os.getenv("ADMIN1_PASS")},
            {"user": os.getenv("ADMIN2_USER"), "pass": os.getenv("ADMIN2_PASS")},
            {"user": os.getenv("ADMIN3_USER"), "pass": os.getenv("ADMIN3_PASS")}
        ]

        for admin in equipo:
            if admin["user"] and admin["pass"]:
                hash_seguro = pwd_context.hash(admin["pass"])
                nuevo_admin = Usuario(
                    id_usuario=admin["user"],
                    password_hash=hash_seguro,
                    rol="ADMIN",
                    sede="PIURA"
                )
                session.add(nuevo_admin)
                try:
                    await session.commit()
                    print(f"✅ ¡Admin '{admin['user']}' creado con éxito!")
                except Exception:
                    await session.rollback() # Previene que la BD se bloquee si el usuario ya existe
                    print(f"⚠️ El usuario '{admin['user']}' ya está registrado.")
            else:
                print("❌ Faltan credenciales en el archivo .env para uno de los usuarios.")

if __name__ == "__main__":
    asyncio.run(sembrar_admins())