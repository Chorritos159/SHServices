import asyncio
import json
import traceback
import aio_pika
from sqlalchemy.future import select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import AsyncSession
from database import engine
from models import Producto, EventoProcesado

# Fabricamos la sesión asíncrona aquí mismo de forma autónoma
SessionWorker = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

async def procesar_descuento(mensaje_body: str):
    """
    Procesa el mensaje de RabbitMQ garantizando Idempotencia y descontando la cantidad exacta.
    """
    print(f"📩 RAW MESSAGE RECEIVED: {mensaje_body}") # <-- ESTO NOS DIRÁ LA VERDAD
    try:
        data = json.loads(mensaje_body)
        event_id = data.get("eventId")
        repuestos = data.get("repuestos_usados", [])

        if not event_id:
            print("⚠️ Mensaje sin eventId. Ignorando por seguridad.")
            return True 

        async with SessionWorker() as db:
            # 1. VERIFICACIÓN DE IDEMPOTENCIA
            query_evento = select(EventoProcesado).where(EventoProcesado.event_id == event_id)
            resultado_evento = await db.execute(query_evento)
            evento_existente = resultado_evento.scalars().first()

            if evento_existente:
                print(f"🛡️ Idempotencia activa: El evento {event_id} ya fue procesado.")
                return True 

            # 2. DESCONTAR STOCK EXACTO
            for repuesto in repuestos:
                id_prod = repuesto.get("id_producto")
                cantidad = int(repuesto.get("cantidad", 1)) # <-- Leemos la cantidad real que envió el Taller/POS

                if id_prod:
                    query_prod = select(Producto).where(Producto.id_producto == id_prod)
                    res_prod = await db.execute(query_prod)
                    producto_db = res_prod.scalars().first()

                    if producto_db and producto_db.stock >= cantidad:
                        producto_db.stock -= cantidad
                        print(f"📦 Stock descontado para: {producto_db.nombre} (-{cantidad})")
                    elif producto_db:
                        print(f"⚠️ Alerta: Stock insuficiente para {producto_db.nombre}. Solicitado: {cantidad}, Disponible: {producto_db.stock}")

            # 3. REGISTRAR EL EVENTO COMO PROCESADO
            nuevo_evento = EventoProcesado(event_id=event_id)
            db.add(nuevo_evento)
            
            await db.commit()
            print(f"✅ Evento {event_id} procesado exitosamente en BD.")
            return True

    except Exception as e:
        print(f"❌ Error al procesar mensaje: {e}")
        traceback.print_exc()
        return False

async def main():
    print("⏳ Worker del Almacén iniciando...")
    try:
        # CONEXIÓN REAL A RABBITMQ (Reintentará automáticamente si falla)
        connection = await aio_pika.connect_robust("amqp://rabbit_operator:shservices_broker_secret_token_2026@rabbitmq/")
        
        async with connection:
            channel = await connection.channel()
            # Declaramos la misma cola que usa el ticket-service
            queue = await channel.declare_queue("cola_descuentos_almacen", durable=True)
            
            print("✅ Worker conectado y escuchando eventos de descuentos...")
            
            # Consumir mensajes de forma continua
            async with queue.iterator() as queue_iter:
                async for message in queue_iter:
                    async with message.process(): # Esto hace el ACK automático si no hay errores
                        body = message.body.decode()
                        await procesar_descuento(body)
                        
    except Exception as e:
        print(f"❌ Error crítico en la conexión del Worker: {e}")

if __name__ == "__main__":
    asyncio.run(main())