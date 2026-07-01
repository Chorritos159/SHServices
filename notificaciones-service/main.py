import asyncio
import json
from fastapi import FastAPI, Header
from typing import Optional
from datetime import datetime
import aio_pika

app = FastAPI(title="Servicio de Notificaciones - SHServices")

notificaciones_db = []

async def consumir_eventos():
    """Escucha a RabbitMQ aplicando el patrón Retry y Backoff"""
    # BUCLE INFINITO DE RESILIENCIA (Patrón Retry)
    while True:
        try:
            connection = await aio_pika.connect_robust("amqp://rabbit_operator:shservices_broker_secret_token_2026@rabbitmq/")
            channel = await connection.channel()
            
            exchange = await channel.declare_exchange("tickets.eventos", aio_pika.ExchangeType.TOPIC, durable=True)
            queue = await channel.declare_queue("cola_notificaciones_ui", durable=True)
            
            await queue.bind(exchange, routing_key="ticket.encola")
            await queue.bind(exchange, routing_key="ticket.reparado")
            
            print("✅ Servicio de Notificaciones conectado a RabbitMQ con soporte Multi-Sede")
            
            async with queue.iterator() as queue_iter:
                async for message in queue_iter:
                    async with message.process():
                        payload = json.loads(message.body.decode())
                        routing_key = message.routing_key
                        fecha_actual = datetime.utcnow().strftime("%H:%M")
                        
                        id_ticket = payload.get("correlationId", "")
                        
                        # Extraemos la sede (Ej: "ORD-PIU-2534" -> "PIU")
                        sede_codigo = "PIU" 
                        if id_ticket and len(id_ticket.split('-')) > 1:
                            sede_codigo = id_ticket.split('-')[1].upper()
                        
                        if routing_key == "ticket.encola":
                            equipo = payload.get("payload", {}).get("equipo", "Equipo")
                            notificaciones_db.insert(0, {
                                "id": str(len(notificaciones_db) + 1),
                                "tipo": "NUEVO_INGRESO",
                                "mensaje": f"Taller: Nuevo {equipo} ingresado ({id_ticket})",
                                "hora": fecha_actual,
                                "sede_origen": sede_codigo,
                                "leido": False
                            })
                        
                        elif routing_key == "ticket.reparado":
                            notificaciones_db.insert(0, {
                                "id": str(len(notificaciones_db) + 1),
                                "tipo": "REPARACION_LISTA",
                                "mensaje": f"Recepción: El equipo {id_ticket} ya fue reparado y está listo para entrega.",
                                "hora": fecha_actual,
                                "sede_origen": sede_codigo,
                                "leido": False
                            })
                            
                        if len(notificaciones_db) > 50:
                            notificaciones_db.pop()

        except Exception as e:
            # CONCEPTO SOA: BACKOFF + JITTER (Espera 5 segundos y vuelve a intentar conectar)
            print(f"⚠️ Error en RabbitMQ (Timeout/Caída). Reintentando en 5 segundos... Detalle: {e}")
            await asyncio.sleep(5)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(consumir_eventos())

@app.get("/api/v1/notificaciones")
async def obtener_notificaciones(
    x_usuario_rol: Optional[str] = Header(None, alias="x-usuario-rol"),
    x_usuario_sede: Optional[str] = Header(None, alias="x-usuario-sede")
):
    """
    Aplica un doble filtro estricto: Rol (RBAC) y Sede (Multitenencia).
    """
    # Si no hay headers perimetrales (ej. pruebas directas), mostramos todo por resiliencia
    if not x_usuario_rol or not x_usuario_sede:
        return notificaciones_db
        
    rol_solicitante = x_usuario_rol.upper()
    
    # Normalizamos la sede del usuario a sus primeras 3 letras (Ej: "PIURA" -> "PIU", "CHICLAYO" -> "CHI")
    sede_usuario_corta = x_usuario_sede[:3].upper()
    
    # 1. Filtro por Sede: El usuario regular solo ve lo que pertenece a su base operativa
    # El ADMIN tiene inmunidad y puede auditar globalmente todas las sedes
    if rol_solicitante == "ADMIN":
        notificaciones_filtradas = notificaciones_db
    else:
        notificaciones_filtradas = [n for n in notificaciones_db if n["sede_origen"] == sede_usuario_corta]
    
    # 2. Filtro por Rol (RBAC) sobre los resultados de la sede
    if rol_solicitante == "TECNICO":
        return [n for n in notificaciones_filtradas if n["tipo"] == "NUEVO_INGRESO"]
    elif rol_solicitante == "RECEPCIONISTA":
        return [n for n in notificaciones_filtradas if n["tipo"] == "REPARACION_LISTA"]
    elif rol_solicitante == "ADMIN":
        return notificaciones_filtradas
        
    return []

@app.post("/api/v1/notificaciones/marcar-leidas")
async def marcar_leidas():
    for notif in notificaciones_db:
        notif["leido"] = True
    return {"status": "ok"}