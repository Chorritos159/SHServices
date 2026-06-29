import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker

# Docker inyecta la URL completa construida con las credenciales del .env
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_async_engine(SQLALCHEMY_DATABASE_URL, echo=False)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()

async def get_db():
    async with async_session() as session:
        yield session