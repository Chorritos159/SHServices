from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from sqlalchemy.future import select
import uvicorn
import asyncio
import aio_pika
import json

from database import engine, Base, get_db, SessionLocal
from models import Producto, StockSede
from schemas import ProductoBase, ProductoResponse, StockBase, StockResponse

app = FastAPI(
    title="Servicio de Almacén e Inventario - SHServices",
    version="1.0.0"
)

# Configuración de RabbitMQ
RABBITMQ_URL = "amqp://admin:password123@localhost:5672/"

# --- CONSUMIDOR ASÍNCRONO DE RABBITMQ ---
async def procesar_evento_inventario(mensaje: aio_pika.IncomingMessage):
    async with mensaje.process():
        cuerpo = json.loads(mensaje.body.decode())
        routing_key = mensaje.routing_key
        print(f"📦 [Almacén] Evento recibido desde RabbitMQ: {routing_key}")
        
        payload = cuerpo.get("payload", {})
        sede_origen = payload.get("sede", "PIURA") 
        
        elementos_usados = []
        if routing_key == "ticket.reparado":
            elementos_usados = payload.get("repuestos_usados", [])

        if not elementos_usados:
            return

        # Lógica para descontar el stock de manera asíncrona
        async with SessionLocal() as db:
            for item in elementos_usados:
                sku = item.get("sku_producto")
                cantidad_usada = item.get("cantidad", 0)
                
                query = select(StockSede).where(
                    StockSede.sku_producto == sku,
                    StockSede.sede == sede_origen
                )
                resultado = await db.execute(query)
                stock_actual = resultado.scalars().first()
                
                if stock_actual:
                    stock_actual.cantidad_actual -= cantidad_usada
                    db.add(stock_actual)
                    print(f"📉 [Almacén] Stock descontado exitosamente: {sku} (-{cantidad_usada}) en {sede_origen}")
                else:
                    print(f"⚠️ [Almacén] ALERTA: Producto {sku} no encontrado en inventario de {sede_origen}")
            
            await db.commit()

async def iniciar_consumidor_rabbitmq():
    try:
        conexion = await aio_pika.connect_robust(RABBITMQ_URL)
        canal = await conexion.channel()
        
        exchange = await canal.declare_exchange("tickets.eventos", aio_pika.ExchangeType.TOPIC, durable=True)
        cola = await canal.declare_queue("almacen_actualizacion_stock", durable=True)
        
        # El almacén se suscribe a los eventos de tickets reparados
        await cola.bind(exchange, routing_key="ticket.reparado")
        
        await cola.consume(procesar_evento_inventario)
        print("🎧 [Almacén] Escuchando eventos de actualización de stock en tiempo real...")
    except Exception as e:
        print(f"❌ [RabbitMQ] Error conectando el consumidor del almacén: {e}")

@app.on_event("startup")
async def startup():
    # 1. Crear el esquema de base de datos para almacén
    async with engine.begin() as conn:
        await conn.execute(text("CREATE SCHEMA IF NOT EXISTS esquema_almacen"))
        await conn.run_sync(Base.metadata.create_all)
    
    # 2. Encender el oído del almacén (RabbitMQ) en segundo plano
    asyncio.create_task(iniciar_consumidor_rabbitmq())

# --- ENDPOINTS HTTP SÍNCRONOS (Para gestión inicial del admin) ---
@app.post("/api/v1/almacen/productos", response_model=ProductoResponse, status_code=201)
async def registrar_producto(payload: ProductoBase, db: AsyncSession = Depends(get_db)):
    nuevo_producto = Producto(**payload.model_dump())
    db.add(nuevo_producto)
    await db.commit()
    await db.refresh(nuevo_producto)
    return nuevo_producto

@app.post("/api/v1/almacen/stock/{sku}", response_model=StockResponse, status_code=201)
async def agregar_stock(sku: str, payload: StockBase, db: AsyncSession = Depends(get_db)):
    nuevo_stock = StockSede(sku_producto=sku, sede=payload.sede, cantidad_actual=payload.cantidad_actual)
    db.add(nuevo_stock)
    await db.commit()
    await db.refresh(nuevo_stock)
    return nuevo_stock

if __name__ == "__main__":
    # Importante: Corre en el puerto 8002 para no chocar con el ticket-service
    uvicorn.run("main:app", host="0.0.0.0", port=8002, reload=True)