import aio_pika
import json
import pika
import uuid
import traceback
from datetime import datetime

# Usamos la credencial criptográfica de forma directa para evitar fallos de variables de entorno en Docker
URL_SEGURA_RABBITMQ = "amqp://rabbit_operator:shservices_broker_secret_token_2026@rabbitmq/"

async def publicar_evento(exchange_name: str, routing_key: str, mensaje: dict):
    try:
        # 1. Conectar al broker de RabbitMQ con la llave maestra
        conexion = await aio_pika.connect_robust(URL_SEGURA_RABBITMQ)
        
        async with conexion:
            # 2. Abrir un canal de comunicación
            canal = await conexion.channel()
            
            # 3. Declarar el Exchange (Tipo Topic para enrutamiento inteligente)
            exchange = await canal.declare_exchange(
                exchange_name, 
                aio_pika.ExchangeType.TOPIC, 
                durable=True
            )
            
            # 4. Publicar el mensaje convertido a JSON
            await exchange.publish(
                aio_pika.Message(
                    body=json.dumps(mensaje).encode(),
                    content_type="application/json"
                ),
                routing_key=routing_key,
            )
            print(f"✅ [RabbitMQ] Evento emitido con éxito: {routing_key}")
    except Exception as e:
        print(f"❌ [RabbitMQ] Error al publicar evento: {e}")

def notificar_descuento_almacen(id_ticket: str, repuestos: list):
    """
    Toma una lista de repuestos y envía el evento asíncrono a RabbitMQ
    """
    try:
        event_id = str(uuid.uuid4())
        payload = {
            "eventId": event_id,
            "correlationId": id_ticket,
            "repuestos_usados": repuestos,
            "timestamp": str(datetime.utcnow())
        }

        parametros = pika.URLParameters("amqp://rabbit_operator:shservices_broker_secret_token_2026@rabbitmq/")
        conexion = pika.BlockingConnection(parametros)
        canal = conexion.channel()
        
        canal.queue_declare(queue='cola_descuentos_almacen', durable=True)
        canal.basic_publish(
            exchange='',
            routing_key='cola_descuentos_almacen',
            body=json.dumps(payload),
            properties=pika.BasicProperties(delivery_mode=2)
        )
        conexion.close()
        print(f"✅ Evento de descuento encolado exitosamente: {event_id}")
    except Exception as e:
        print(f"⚠️ Error RabbitMQ: {e}")
        traceback.print_exc()