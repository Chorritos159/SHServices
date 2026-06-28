from pydantic import BaseModel, Field

class ProductoBase(BaseModel):
    sku: str = Field(..., description="Ej: PANTALLA-LAP-15")
    nombre: str
    categoria: str
    precio_unitario: float

class ProductoResponse(ProductoBase):
    class Config:
        from_attributes = True

class StockBase(BaseModel):
    sede: str = Field(..., description="Ej: PIURA o TALARA")
    cantidad_actual: int

class StockResponse(StockBase):
    id: str
    sku_producto: str

    class Config:
        from_attributes = True