import jwt
from datetime import datetime, timedelta, timezone

SECRET_KEY = "shservices_super_secreto_2026"
ALGORITHM = "HS256"

def crear_token_prueba(id_usuario: str, rol: str, sede: str):
    expiracion = datetime.now(timezone.utc) + timedelta(hours=1)
    
    payload = {
        "id_usuario": id_usuario,
        "rol": rol,
        "sede_asignada": sede,
        "exp": expiracion
    }
    
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    print(f"\n=== TOKEN GENERADO PARA: {rol} ({id_usuario}) ===")
    print(token)
    print("====================================================\n")

if __name__ == "__main__":
    print("Generando tokens de acceso temporal para pruebas en Swagger...")
    
    crear_token_prueba(id_usuario="Recep01", rol="RECEPCIONISTA", sede="PIURA")

    crear_token_prueba(id_usuario="Yassir159", rol="TECNICO", sede="PIURA")
    
    crear_token_prueba(id_usuario="AdminMaster", rol="ADMIN", sede="PIURA")

    crear_token_prueba(id_usuario="72145678", rol="CLIENTE", sede="PIURA")