from pydantic import BaseModel, Field, model_validator
from typing import Optional, List
from datetime import datetime

# --- 1. ESQUEMAS PARA CATÁLOGO DE SERVICIOS ---
class ServicioResponse(BaseModel):
    id: str
    nombre: str
    precio_base: float

    class Config:
        from_attributes = True

# --- 2. ESQUEMAS PARA DETALLES DE PRODUCTOS (EL CARRITO) ---
class ItemDetalle(BaseModel):
    sku_producto: str
    cantidad: int = Field(gt=0, description="Cantidad a comprar o usar")
    precio_unitario: float = Field(ge=0.0, description="Precio al momento de la operación")

class ItemDetalleResponse(ItemDetalle):
    id_detalle: str

    class Config:
        from_attributes = True

# --- 3. ESQUEMAS PARA TICKETS (ENTRADA INTELIGENTE) ---
class TicketCreate(BaseModel):
    # Por defecto, el formulario de Recepción creará Órdenes de Servicio
    tipo_documento: str = Field(default="ORDEN_SERVICIO", pattern="^(NOTA_VENTA|ORDEN_SERVICIO)$")
    documento_cliente: str = Field(..., description="DNI o RUC")
    nombre_cliente: str = Field(..., description="Nombre completo o Empresa")
    telefono_cliente: str = Field(default="No registrado", description="Teléfono del cliente")
    sede: Optional[str] = Field(None, description="Inyectado por el API Gateway o el Frontend")
    monto_total: Optional[float] = Field(0.0, description="Monto inicial a cobrar")
    
    # Campos exclusivos para Orden de Servicio
    equipo: Optional[str] = Field(None, description="Ej: Laptop Lenovo ThinkPad L15")
    caracteristicas: Optional[str] = Field(None, description="Ej: Cargador, raspones, etc.")
    fallas: Optional[str] = Field(None, description="Ej: Pantalla rota")
    
    # Campos exclusivos para Nota de Venta
    detalles: Optional[List[ItemDetalle]] = Field(default_factory=list)

    @model_validator(mode='after')
    def validar_campos_por_tipo(self):
        if self.tipo_documento == 'ORDEN_SERVICIO':
            if not self.equipo or not self.fallas:
                raise ValueError('Error: Una ORDEN_SERVICIO requiere ingresar obligatoriamente el "equipo" y las "fallas".')
        elif self.tipo_documento == 'NOTA_VENTA':
            if not self.detalles or len(self.detalles) == 0:
                raise ValueError('Error: Una NOTA_VENTA requiere ingresar al menos un producto en los "detalles".')
        return self

# --- 4. ESQUEMA DE RESPUESTA GLOBAL ---
class TicketResponse(BaseModel):
    id_ticket: str
    tipo_documento: str
    estado: str
    documento_cliente: str
    nombre_cliente: str
    sede: str
    monto_total: float
    fecha_registro: datetime
    
    # Los opcionales regresan en la respuesta
    equipo: Optional[str] = None
    caracteristicas: Optional[str] = None
    fallas: Optional[str] = None
    id_tecnico_asignado: Optional[str] = None
    id_servicio_aplicado: Optional[str] = None
    
    # El historial de productos asociados al ticket
    detalles: List[ItemDetalleResponse] = []

    class Config:
        from_attributes = True

# --- 5. ESQUEMA PARA ACTUALIZAR (EL TÉCNICO REPARA) ---
class ReparacionData(BaseModel):
    notas_tecnico: str = Field(default="", description="Observaciones del técnico sobre la reparación")
    monto_total_final: float = Field(ge=0.0, description="Precio final dictado por el técnico")
    repuestos_usados: Optional[List[ItemDetalle]] = Field(default_factory=list)

class TicketReparar(ReparacionData):
    id_tecnico: str = Field(..., description="ID del técnico que realiza el trabajo")