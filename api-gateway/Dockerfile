# Usamos una imagen oficial y ligera de Python
FROM python:3.11-slim

# Establecemos el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos el archivo de dependencias y las instalamos
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiamos el código fuente (main.py)
COPY . .

# Exponemos el puerto 8000 hacia la red interna de Docker
EXPOSE 8000

# Comando para encender el escudo cuando el contenedor arranque
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]