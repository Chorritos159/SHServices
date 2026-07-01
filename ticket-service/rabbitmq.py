import aio_pika
import json
import os

RABBITMQ_URL = os.getenv("RABBITMQ_URL")

async def publicar_evento(exchange_name: str, routing_key: str, mensaje: dict):
    try:
        conexion = await aio_pika.connect_robust(RABBITMQ_URL)
        
        async with conexion:
            canal = await conexion.channel()
            
            exchange = await canal.declare_exchange(
                exchange_name, 
                aio_pika.ExchangeType.TOPIC, 
                durable=True
            )
            
            await exchange.publish(
                aio_pika.Message(
                    body=json.dumps(mensaje).encode(),
                    content_type="application/json"
                ),
                routing_key=routing_key,
            )
            print(f" [RabbitMQ] Evento emitido con éxito: {routing_key}")
    except Exception as e:
        print(f" [RabbitMQ] Error al publicar evento: {e}")