from fastapi import FastAPI, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
from typing import List, Optional
import uvicorn

from models import Base, Producto
from database import engine, get_db

app = FastAPI(title="Microservicio de Almacén - SHServices")


class ProductoCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    categoria: str
    stock: int
    precio_unitario: float


class ProductoResponse(ProductoCreate):
    id_producto: str
    sede: str

    class Config:
        from_attributes = True


@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


@app.post("/api/v1/almacen/productos", response_model=ProductoResponse)
async def crear_producto(
    producto: ProductoCreate,
    db: AsyncSession = Depends(get_db),
    x_usuario_sede: str = Header(...),
    x_usuario_rol: str = Header(...)
):
    if x_usuario_rol not in ["ADMIN", "TECNICO"]:
        raise HTTPException(status_code=403, detail="No autorizado para modificar inventario.")

    nuevo_producto = Producto(
        nombre=producto.nombre,
        descripcion=producto.descripcion,
        categoria=producto.categoria,
        stock=producto.stock,
        precio_unitario=producto.precio_unitario,
        sede=x_usuario_sede
    )
    db.add(nuevo_producto)
    await db.commit()
    await db.refresh(nuevo_producto)
    return nuevo_producto


@app.get("/api/v1/almacen/productos", response_model=List[ProductoResponse])
async def listar_productos(
    categoria: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    x_usuario_sede: str = Header(...),
    x_usuario_rol: str = Header(...)
):
    query = select(Producto)

    if x_usuario_rol != "ADMIN":
        query = query.where(Producto.sede == x_usuario_sede)

    if categoria:
        query = query.where(Producto.categoria == categoria)

    result = await db.execute(query)
    return result.scalars().all()


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8002, reload=True)