from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import uuid

# 1. Catálogo de Servicios (Mantenimiento, Formateo, etc.)
class CatalogoServicio(Base):
    __tablename__ = "catalogo_servicios"
    __table_args__ = {'schema': 'esquema_tickets'}

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    nombre = Column(String, nullable=False)
    precio_base = Column(Float, nullable=False)

# 2. Tickets (Cabecera Unificada para Órdenes y Ventas)
class Ticket(Base):
    __tablename__ = "tickets"
    __table_args__ = {'schema': 'esquema_tickets'}

    # Llave primaria inteligente: Ej. VEN-PIU-001 o ORD-PIU-001
    id_ticket = Column(String, primary_key=True, index=True) 
    
    tipo_documento = Column(String, nullable=False) # NOTA_VENTA o ORDEN_SERVICIO
    documento_cliente = Column(String, nullable=False) # DNI / RUC (antes id_cliente)
    nombre_cliente = Column(String, nullable=False) # Nombre completo o Razón Social
    estado = Column(String, nullable=False) # COMPLETADO (Venta) o EN_COLA (Orden)
    sede = Column(String, nullable=False)
    monto_total = Column(Float, default=0.0)
    monto_total_final = Column(Float, default=0.0)
    fecha_registro = Column(DateTime, default=datetime.utcnow)
    fecha_entrega = Column(DateTime, nullable=True)
    # (Quedarán automáticamente en NULL si es una Nota de Venta)
    equipo = Column(String, nullable=True)
    caracteristicas = Column(String, nullable=True) # Cargador, golpes, etc.
    fallas = Column(String, nullable=True) # Falla reportada por el cliente
    telefono_cliente = Column(String, default="No registrado")
    notas_tecnico = Column(String, default="Sin notas del técnico.")
    id_usuario_recepcion = Column(String, nullable=True)
    id_tecnico_asignado = Column(String, nullable=True)
    id_servicio_aplicado = Column(String, nullable=True)
    idempotency_key = Column(String, unique=True, index=True, nullable=True)

    # Relación bidireccional con los detalles de productos
    detalles = relationship("TicketDetalleProducto", back_populates="ticket")

# 3. Detalles de Productos (El carrito de compras o repuestos)
class TicketDetalleProducto(Base):
    __tablename__ = "ticket_detalles_productos"
    __table_args__ = {'schema': 'esquema_tickets'}

    id_detalle = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    id_ticket = Column(String, ForeignKey("esquema_tickets.tickets.id_ticket"), nullable=False)
    sku_producto = Column(String, nullable=False)
    cantidad = Column(Integer, nullable=False)
    precio_unitario = Column(Float, nullable=False)

    ticket = relationship("Ticket", back_populates="detalles")