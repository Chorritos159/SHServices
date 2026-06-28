from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from sqlalchemy.orm import selectinload
from sqlalchemy.future import select
import uvicorn
import uuid

from database import engine, Base, get_db
from models import Ticket, TicketDetalleProducto, CatalogoServicio
from schemas import TicketCreate, TicketResponse

app = FastAPI(
    title="Servicio de Gestión de Tickets - SHServices", 
    version="2.0.0"
)

@app.on_event("startup")
async def startup():
    # Al iniciar, creamos el esquema y las tablas limpias
    async with engine.begin() as conn:
        await conn.execute(text("CREATE SCHEMA IF NOT EXISTS esquema_tickets"))
        await conn.run_sync(Base.metadata.create_all)

@app.post("/api/v1/tickets", response_model=TicketResponse, status_code=201)
async def crear_ticket(payload: TicketCreate, db: AsyncSession = Depends(get_db)):
    # 1. Generamos el ID Inteligente (Ej. VEN-PIU-XXXX o ORD-PIU-XXXX)
    prefijo = "VEN" if payload.tipo_documento == "NOTA_VENTA" else "ORD"
    
    # Temporal: Simulamos la sede hasta que conectemos el API Gateway
    sede_actual = "PIURA" 
    id_ticket_generado = f"{prefijo}-{sede_actual[:3].upper()}-{str(uuid.uuid4())[:4].upper()}"

    # Regla de Negocio: La venta se completa de inmediato, la orden pasa a la cola del taller
    estado_inicial = "COMPLETADO" if payload.tipo_documento == "NOTA_VENTA" else "EN_COLA"

    # 2. Creamos la Cabecera del Ticket
    nuevo_ticket = Ticket(
        id_ticket=id_ticket_generado,
        tipo_documento=payload.tipo_documento,
        id_cliente=payload.id_cliente,
        estado=estado_inicial,
        sede=sede_actual,
        equipo=payload.equipo,
        falla=payload.falla
    )

    db.add(nuevo_ticket)
    # Hacemos un flush para que PostgreSQL reconozca el ID antes del commit final
    await db.flush() 

    monto_total = 0.0

    # 3. Si es Nota de Venta, guardamos los productos en el "carrito"
    if payload.tipo_documento == "NOTA_VENTA" and payload.detalles:
        for item in payload.detalles:
            detalle = TicketDetalleProducto(
                id_ticket=id_ticket_generado,
                sku_producto=item.sku_producto,
                cantidad=item.cantidad,
                precio_unitario=item.precio_unitario
            )
            db.add(detalle)
            monto_total += (item.cantidad * item.precio_unitario)
    
    nuevo_ticket.monto_total = monto_total
    await db.commit()

    # 4. Recuperamos el ticket con sus relaciones cargadas para responderle al frontend
    query = select(Ticket).options(selectinload(Ticket.detalles)).where(Ticket.id_ticket == id_ticket_generado)
    resultado = await db.execute(query)
    ticket_completo = resultado.scalars().first()

    return ticket_completo

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)