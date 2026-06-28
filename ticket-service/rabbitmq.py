import aio_pika
import json
import os

# La URL coincide con tu Docker (admin / password123 / puerto 5672)
RABBITMQ_URL = "amqp://admin:password123@rabbitmq:5672/"

async def publicar_evento(exchange_name: str, routing_key: str, mensaje: dict):
    try:
        # 1. Conectar al broker de RabbitMQ
        conexion = await aio_pika.connect_robust(RABBITMQ_URL)
        
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