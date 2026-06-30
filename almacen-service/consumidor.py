import asyncio
import json
import traceback
from sqlalchemy.future import select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import AsyncSession
from database import engine  # Solo importamos el motor, que es seguro
from models import Producto, EventoProcesado

# Fabricamos la sesión asíncrona aquí mismo de forma autónoma
SessionWorker = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

async def procesar_descuento(mensaje_body: str):
    """
    Esta función procesa el mensaje de RabbitMQ garantizando Idempotencia.
    """
    try:
        data = json.loads(mensaje_body)
        event_id = data.get("eventId")
        repuestos = data.get("repuestos_usados", [])

        if not event_id:
            print("⚠️ Mensaje sin eventId. Ignorando por seguridad.")
            return True # Retornamos True para hacer ACK y sacarlo de la cola

        # Usamos nuestra nueva SessionWorker
        async with SessionWorker() as db:
            # 1. VERIFICACIÓN DE IDEMPOTENCIA
            query_evento = select(EventoProcesado).where(EventoProcesado.event_id == event_id)
            resultado_evento = await db.execute(query_evento)
            evento_existente = resultado_evento.scalars().first()

            if evento_existente:
                print(f"🛡️ Idempotencia activa: El evento {event_id} ya fue procesado. Ignorando duplicado.")
                return True # Hacemos ACK sin tocar el stock

            # 2. DESCONTAR STOCK (Solo si el evento es nuevo)
            for repuesto in repuestos:
                id_prod = repuesto.get("id_producto")
                if id_prod:
                    query_prod = select(Producto).where(Producto.id_producto == id_prod)
                    res_prod = await db.execute(query_prod)
                    producto_db = res_prod.scalars().first()

                    if producto_db and producto_db.stock > 0:
                        producto_db.stock -= 1
                        print(f"📦 Stock descontado para: {producto_db.nombre} (-1)")

            # 3. REGISTRAR EL EVENTO COMO PROCESADO
            nuevo_evento = EventoProcesado(event_id=event_id)
            db.add(nuevo_evento)
            
            await db.commit()
            print(f"✅ Evento {event_id} procesado exitosamente.")
            return True

    except Exception as e:
        print(f"❌ Error al procesar mensaje: {e}")
        traceback.print_exc()
        return False # Retornamos False para hacer NACK y que RabbitMQ lo reintente (Retry Pattern)

async def main():
    print("⏳ Worker del Almacén iniciado. Inicializando servicios...")
    try:
        # ---------------------------------------------------------
        # Aquí debes colocar tu código de conexión a RabbitMQ 
        # (ej. aio_pika.connect_robust("amqp://rabbit_operator:password@broker/"))
        # y suscribirte a la cola de descuentos.
        # ---------------------------------------------------------
        
        print("✅ Worker conectado y escuchando eventos en RabbitMQ...")
        
        # Este bucle infinito mantiene el contenedor vivo
        while True:
            await asyncio.sleep(3600)
            
    except Exception as e:
        print(f"❌ Error crítico en el Worker: {e}")

if __name__ == "__main__":
    # Ejecutamos el bucle asíncrono principal
    asyncio.run(main())