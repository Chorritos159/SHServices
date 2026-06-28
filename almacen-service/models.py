from sqlalchemy import Column, String, Float, Integer, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
import uuid

class Producto(Base):
    __tablename__ = "productos"
    __table_args__ = {'schema': 'esquema_almacen'}

    sku = Column(String, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    categoria = Column(String, nullable=False) # Ej: REPUESTO, ACCESORIO
    precio_unitario = Column(Float, nullable=False)

    stocks = relationship("StockSede", back_populates="producto")

class StockSede(Base):
    __tablename__ = "stock_sedes"
    __table_args__ = {'schema': 'esquema_almacen'}

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    sku_producto = Column(String, ForeignKey("esquema_almacen.productos.sku"), nullable=False)
    sede = Column(String, nullable=False) # PIURA, TALARA
    cantidad_actual = Column(Integer, default=0, nullable=False)

    producto = relationship("Producto", back_populates="stocks")