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
    tipo_documento: str = Field(..., pattern="^(NOTA_VENTA|ORDEN_SERVICIO)$")
    id_cliente: str
    
    # Campos exclusivos para Orden de Servicio
    equipo: Optional[str] = Field(None, description="Ej: Laptop Lenovo ThinkPad P15")
    falla: Optional[str] = Field(None, description="Ej: Pantalla rota")
    
    # Campos exclusivos para Nota de Venta
    detalles: Optional[List[ItemDetalle]] = Field(default_factory=list)

    # El Validador de Negocio (Fail-Fast en la entrada)
    @model_validator(mode='after')
    def validar_campos_por_tipo(self):
        if self.tipo_documento == 'ORDEN_SERVICIO':
            if not self.equipo or not self.falla:
                raise ValueError('Error: Una ORDEN_SERVICIO requiere ingresar obligatoriamente el "equipo" y la "falla".')
        
        elif self.tipo_documento == 'NOTA_VENTA':
            if not self.detalles or len(self.detalles) == 0:
                raise ValueError('Error: Una NOTA_VENTA requiere ingresar al menos un producto en los "detalles".')
        
        return self

# --- 4. ESQUEMA DE RESPUESTA GLOBAL ---
class TicketResponse(BaseModel):
    id_ticket: str
    tipo_documento: str
    estado: str
    id_cliente: str
    sede: str
    monto_total: float
    fecha_registro: datetime
    
    # Los opcionales regresan en la respuesta (serán nulos dependiendo del tipo)
    equipo: Optional[str] = None
    falla: Optional[str] = None
    id_tecnico_asignado: Optional[str] = None
    id_servicio_aplicado: Optional[str] = None
    
    # El historial de productos asociados al ticket
    detalles: List[ItemDetalleResponse] = []

    class Config:
        from_attributes = True