from fastapi import FastAPI, Depends, HTTPException
from rabbitmq import publicar_evento
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from sqlalchemy.orm import selectinload
from sqlalchemy.future import select
import uvicorn
import uuid

from database import engine, Base, get_db
from models import Ticket, TicketDetalleProducto, CatalogoServicio
from schemas import TicketCreate, TicketResponse, TicketReparar

app = FastAPI(
    title="Servicio de Gestión de Tickets - SHServices", 
    version="2.0.0"
)

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.execute(text("CREATE SCHEMA IF NOT EXISTS esquema_tickets"))
        await conn.run_sync(Base.metadata.create_all)

# --- NUEVO: ENDPOINT PARA LISTAR TICKETS ---
@app.get("/api/v1/tickets")
async def listar_tickets(sede: str = None, db: AsyncSession = Depends(get_db)):
    # Si nos pasan la sede, filtramos. Si no, devolvemos todos.
    if sede:
        query = select(Ticket).where(Ticket.sede == sede).order_by(Ticket.fecha_registro.desc())
    else:
        query = select(Ticket).order_by(Ticket.fecha_registro.desc())
        
    resultado = await db.execute(query)
    tickets = resultado.scalars().all()
    return tickets

@app.post("/api/v1/tickets", response_model=TicketResponse, status_code=201)
async def crear_ticket(payload: TicketCreate, db: AsyncSession = Depends(get_db)):
    prefijo = "VEN" if payload.tipo_documento == "NOTA_VENTA" else "ORD"
    # Tomamos la sede dinámicamente del payload que envía React (Ej. "PIURA" o "TALARA")
    sede_actual = payload.sede.upper() if payload.sede else "PIURA"
    
    id_ticket_generado = f"{prefijo}-{sede_actual[:3]}-{str(uuid.uuid4())[:4].upper()}"

    # Estado modificado para alinear con el Kanban: PENDIENTE en vez de EN_COLA
    estado_inicial = "COMPLETADO" if payload.tipo_documento == "NOTA_VENTA" else "PENDIENTE"

    nuevo_ticket = Ticket(
        id_ticket=id_ticket_generado,
        tipo_documento=payload.tipo_documento,
        documento_cliente=payload.documento_cliente, # Actualizado
        nombre_cliente=payload.nombre_cliente,       # Nuevo
        estado=estado_inicial,
        sede=sede_actual,
        equipo=payload.equipo,
        caracteristicas=payload.caracteristicas,     # Nuevo
        fallas=payload.fallas                        # Actualizado de 'falla'
    )

    db.add(nuevo_ticket)
    await db.flush() 

    monto_total = payload.monto_total or 0.0

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

    query = select(Ticket).options(selectinload(Ticket.detalles)).where(Ticket.id_ticket == id_ticket_generado)
    resultado = await db.execute(query)
    ticket_completo = resultado.scalars().first()

    evento_payload = {
        "eventId": str(uuid.uuid4()),
        "correlationId": id_ticket_generado,
        "producer": "ServicioGestionTickets",
        "payload": {
            "id_ticket": id_ticket_generado,
            "tipo_documento": payload.tipo_documento,
            "estado": estado_inicial,
            "sede": sede_actual,
            "monto_total": monto_total
        }
    }

    if payload.tipo_documento == "ORDEN_SERVICIO":
        evento_payload["eventType"] = "TicketEnCola"
        evento_payload["payload"]["equipo"] = payload.equipo
        await publicar_evento("tickets.eventos", "ticket.encola", evento_payload)
        
    elif payload.tipo_documento == "NOTA_VENTA":
        evento_payload["eventType"] = "VentaCompletada"
        await publicar_evento("tickets.eventos", "venta.completada", evento_payload)

    return ticket_completo

@app.patch("/api/v1/tickets/{id_ticket}/iniciar", response_model=TicketResponse)
async def iniciar_reparacion(id_ticket: str, db: AsyncSession = Depends(get_db)):
    query = select(Ticket).options(selectinload(Ticket.detalles)).where(Ticket.id_ticket == id_ticket)
    resultado = await db.execute(query)
    ticket_db = resultado.scalars().first()

    if not ticket_db:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    if ticket_db.estado != "PENDIENTE":
        raise HTTPException(status_code=400, detail="Solo los tickets PENDIENTES pueden iniciar proceso.")

    ticket_db.estado = "EN_PROCESO"
    await db.commit()
    await db.refresh(ticket_db)

    return ticket_db

@app.patch("/api/v1/tickets/{id_ticket}/reparar", response_model=TicketResponse)
async def reparar_ticket(id_ticket: str, payload: TicketReparar, db: AsyncSession = Depends(get_db)):
    query = select(Ticket).options(selectinload(Ticket.detalles)).where(Ticket.id_ticket == id_ticket)
    resultado = await db.execute(query)
    ticket_db = resultado.scalars().first()

    if not ticket_db:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    if ticket_db.tipo_documento != "ORDEN_SERVICIO":
        raise HTTPException(status_code=400, detail="Solo las Órdenes de Servicio pueden ser reparadas en el taller")
    if ticket_db.estado not in ["PENDIENTE", "EN_PROCESO"]:
        raise HTTPException(status_code=400, detail=f"El ticket no se puede reparar. Estado actual: {ticket_db.estado}")

    ticket_db.estado = "REPARADO" # Estado final del Kanban
    ticket_db.id_tecnico_asignado = payload.id_tecnico

    costo_repuestos = 0.0
    if payload.repuestos_usados:
        for item in payload.repuestos_usados:
            detalle = TicketDetalleProducto(
                id_ticket=id_ticket,
                sku_producto=item.sku_producto,
                cantidad=item.cantidad,
                precio_unitario=item.precio_unitario
            )
            db.add(detalle)
            costo_repuestos += (item.cantidad * item.precio_unitario)
    
    ticket_db.monto_total += costo_repuestos
    
    await db.commit()
    await db.refresh(ticket_db)

    evento_payload = {
        "eventId": str(uuid.uuid4()),
        "correlationId": id_ticket,
        "producer": "ServicioGestionTickets",
        "eventType": "TicketReparado",
        "payload": {
            "id_ticket": id_ticket,
            "estado": "REPARADO",
            "id_tecnico": payload.id_tecnico,
            "repuestos_usados": [item.dict() for item in payload.repuestos_usados]
        }
    }
    
    await publicar_evento("tickets.eventos", "ticket.reparado", evento_payload)

    return ticket_db

@app.patch("/api/v1/tickets/{id_ticket}/entregar", response_model=TicketResponse)
async def entregar_ticket(id_ticket: str, db: AsyncSession = Depends(get_db)):
    query = select(Ticket).options(selectinload(Ticket.detalles)).where(Ticket.id_ticket == id_ticket)
    resultado = await db.execute(query)
    ticket_db = resultado.scalars().first()

    if not ticket_db:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")

    if ticket_db.estado != "REPARADO":
        raise HTTPException(status_code=400, detail="El equipo aún no ha sido reparado por el taller.")

    ticket_db.estado = "ENTREGADO"

    await db.commit()
    await db.refresh(ticket_db)

    return ticket_db

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)