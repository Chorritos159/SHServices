from fastapi import FastAPI, Depends, HTTPException, Header, BackgroundTasks
from pydantic import BaseModel
from rabbitmq import publicar_evento, notificar_descuento_almacen
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from sqlalchemy.orm import selectinload
from sqlalchemy.future import select
import uvicorn
import uuid
import traceback
import json
import pika
from datetime import datetime
from typing import Optional

from database import engine, Base, get_db
from models import Ticket, TicketDetalleProducto, CatalogoServicio
from schemas import TicketCreate, TicketResponse

class ReparacionData(BaseModel):
    notas_tecnico: str
    monto_total_final: float
    repuestos_usados: list = []

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
async def crear_ticket(
    ticket: TicketCreate,
    db: AsyncSession = Depends(get_db),
    x_usuario_id: str = Header(..., alias="x-usuario-id"),
    x_usuario_sede: str = Header(..., alias="x-usuario-sede"),
    x_usuario_rol: str = Header(..., alias="x-usuario-rol"),
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key")
):
    if idempotency_key:
        query = select(Ticket).where(Ticket.idempotency_key == idempotency_key)
        resultado = await db.execute(query)
        ticket_existente = resultado.scalars().first()

        if ticket_existente:
            return ticket_existente

    prefijo = "VEN" if ticket.tipo_documento == "NOTA_VENTA" else "ORD"
    sede_actual = x_usuario_sede.upper() if x_usuario_sede else (ticket.sede.upper() if getattr(ticket, "sede", None) else "PIURA")

    id_ticket_generado = f"{prefijo}-{sede_actual[:3]}-{str(uuid.uuid4())[:4].upper()}"

    estado_inicial = "PENDIENTE" if ticket.tipo_documento == "ORDEN_SERVICIO" else "ENTREGADO"

    nuevo_ticket = Ticket(
        id_ticket=id_ticket_generado,
        tipo_documento=ticket.tipo_documento,
        documento_cliente=ticket.documento_cliente,
        nombre_cliente=ticket.nombre_cliente,
        telefono_cliente=ticket.telefono_cliente,
        equipo=ticket.equipo,
        caracteristicas=ticket.caracteristicas,
        fallas=ticket.fallas,
        monto_total=ticket.monto_total or 0.0,
        sede=sede_actual,
        estado=estado_inicial,
        id_usuario_recepcion=x_usuario_id,
        idempotency_key=idempotency_key
    )

    db.add(nuevo_ticket)
    await db.flush()

    monto_total = ticket.monto_total or 0.0

    if ticket.tipo_documento == "NOTA_VENTA" and ticket.detalles:
        for item in ticket.detalles:
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
            "tipo_documento": ticket.tipo_documento,
            "estado": estado_inicial,
            "sede": sede_actual,
            "monto_total": monto_total
        }
    }

    if ticket.tipo_documento == "ORDEN_SERVICIO":
        evento_payload["eventType"] = "TicketEnCola"
        evento_payload["payload"]["equipo"] = ticket.equipo
        await publicar_evento("tickets.eventos", "ticket.encola", evento_payload)

    elif ticket.tipo_documento == "NOTA_VENTA":
        evento_payload["eventType"] = "VentaCompletada"
        await publicar_evento("tickets.eventos", "venta.completada", evento_payload)

        try:
            event_id = str(uuid.uuid4())
            repuestos_para_descontar = [
                {
                    "id_producto": detalle.sku_producto,
                    "cantidad": detalle.cantidad
                }
                for detalle in ticket.detalles
            ]

            payload = {
                "eventId": event_id,
                "correlationId": nuevo_ticket.id_ticket,
                "repuestos_usados": repuestos_para_descontar,
                "timestamp": str(datetime.utcnow())
            }

            parametros = pika.URLParameters("amqp://rabbit_operator:shservices_broker_secret_token_2026@rabbitmq/")
            conexion_rmq = pika.BlockingConnection(parametros)
            canal = conexion_rmq.channel()
            canal.queue_declare(queue='cola_descuentos_almacen', durable=True)
            canal.basic_publish(
                exchange='',
                routing_key='cola_descuentos_almacen',
                body=json.dumps(payload),
                properties=pika.BasicProperties(delivery_mode=2)
            )
            conexion_rmq.close()
            print(f"✅ Venta Directa: Descuento encolado en RabbitMQ {event_id}")
        except Exception as e:
            print(f"⚠️ Error RabbitMQ en Venta: {e}")
            traceback.print_exc()

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

@app.patch("/api/v1/tickets/{id_ticket}/reparar")
async def reparar_ticket(
    id_ticket: str, 
    data: ReparacionData, 
    db: AsyncSession = Depends(get_db),
    x_usuario_id: str = Header(...)
):
    query = select(Ticket).where(Ticket.id_ticket == id_ticket)
    resultado = await db.execute(query)
    ticket_db = resultado.scalars().first()

    if not ticket_db:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")

    ticket_db.estado = "REPARADO"
    ticket_db.notas_tecnico = data.notas_tecnico
    ticket_db.monto_total_final = data.monto_total_final
    ticket_db.id_tecnico_asignado = x_usuario_id
    
    await db.commit()
    await db.refresh(ticket_db)
    
    # 2. Despacho asíncrono a RabbitMQ para descuento de inventario en Almacén
    if hasattr(data, 'repuestos_usados') and data.repuestos_usados:
        repuestos_para_descontar = [
            {
                "id_producto": getattr(repuesto, "id_producto", repuesto.get("id_producto")),
                "cantidad": getattr(repuesto, "cantidad", repuesto.get("cantidad", 1))
            }
            for repuesto in data.repuestos_usados
        ]
        notificar_descuento_almacen(ticket_db.id_ticket, repuestos_para_descontar)

    return {
        "id_ticket": ticket_db.id_ticket,
        "estado": ticket_db.estado,
        "monto_total_final": ticket_db.monto_total_final,
        "mensaje": "Reparado"
    }

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
    ticket_db.fecha_entrega = datetime.utcnow()

    await db.commit()
    await db.refresh(ticket_db)

    return ticket_db

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)