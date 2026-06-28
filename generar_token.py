import jwt
from datetime import datetime, timedelta, timezone

# Debe ser EXACTAMENTE la misma clave que pusimos en api-gateway/main.py
SECRET_KEY = "shservices_super_secreto_2026"
ALGORITHM = "HS256"

def crear_token_prueba(id_usuario: str, rol: str, sede: str):
    # Tiempo de expiración: 1 hora desde ahora
    expiracion = datetime.now(timezone.utc) + timedelta(hours=1)
    
    payload = {
        "id_usuario": id_usuario,
        "rol": rol,
        "sede_asignada": sede,
        "exp": expiracion
    }
    
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    print(f"\n=== TOKEN GENERADO PARA {rol} ===")
    print(token)
    print("===================================\n")

# ... (tu código de arriba se mantiene igual) ...

# 1. Generar token para RECEPCIÓN (Inicia el proceso BPM)
crear_token_prueba(id_usuario="Recep01", rol="RECEPCIONISTA", sede="PIURA")

# 2. Generar token para tu usuario TÉCNICO (El que va a reparar)
crear_token_prueba(id_usuario="Yassir159", rol="TECNICO", sede="PIURA")

# 3. Generar token para un CLIENTE (Para probar que el candado funciona)
crear_token_prueba(id_usuario="72145678", rol="CLIENTE", sede="PIURA")