from sqlalchemy import Column, String, Boolean
from database import Base

class Usuario(Base):
    __tablename__ = "usuarios"

    # Usaremos el nombre de usuario (ej. "Yassir159") como ID principal
    id_usuario = Column(String(50), primary_key=True, index=True)
    password_hash = Column(String(255), nullable=False)
    rol = Column(String(20), nullable=False)  # ADMIN, TECNICO, RECEPCIONISTA
    sede = Column(String(50), nullable=False) # PIURA, TALARA, etc.
    activo = Column(Boolean, default=True)