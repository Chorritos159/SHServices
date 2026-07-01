from sqlalchemy import Column, String, Integer, Float, DateTime
from database import Base
from datetime import datetime
import uuid


def generar_id_producto():
    return f"PROD-{str(uuid.uuid4())[:8].upper()}"


class Producto(Base):
    __tablename__ = "inventario"

    id_producto = Column(String, primary_key=True, default=generar_id_producto)
    nombre = Column(String, nullable=False, index=True)
    descripcion = Column(String)

    categoria = Column(String, nullable=False, default="VENTA_PUBLICA")

    stock = Column(Integer, default=0, nullable=False)
    precio_unitario = Column(Float, default=0.0, nullable=False)

    sede = Column(String, nullable=False, index=True)

    fecha_ingreso = Column(DateTime, default=datetime.utcnow)


class EventoProcesado(Base):
    __tablename__ = "eventos_procesados"

    event_id = Column(String, primary_key=True)
    fecha_procesamiento = Column(DateTime, default=datetime.utcnow)