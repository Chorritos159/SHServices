@echo off
echo ===================================================
echo   Iniciando Ecosistema SHServices - Microservicios
echo ===================================================

cd C:\SHServices

echo [1/7] Levantando Infraestructura (PostgreSQL y RabbitMQ)...
docker-compose up -d

echo.
echo [!] Esperando 10 segundos a que la base de datos despierte por completo...
timeout /t 10 /nobreak

echo [2/7] Levantando API Gateway (Puerto 8000)...
start powershell -ExecutionPolicy Bypass -NoExit -Command "cd api-gateway; .\venv\Scripts\Activate; uvicorn main:app --reload --port 8000"

echo [3/7] Levantando Servicio de Tickets (Puerto 8001)...
start powershell -ExecutionPolicy Bypass -NoExit -Command "cd ticket-service; .\venv\Scripts\Activate; uvicorn main:app --reload --port 8001"

echo [4/7] Levantando Servicio de Almacen (Puerto 8002)...
start powershell -ExecutionPolicy Bypass -NoExit -Command "cd almacen-service; .\venv\Scripts\Activate; uvicorn main:app --reload --port 8002"

echo [5/7] Levantando Servicio de Auditoria (Puerto 8003)...
start powershell -ExecutionPolicy Bypass -NoExit -Command "cd auditoria-service; .\venv\Scripts\Activate; uvicorn main:app --reload --port 8003"

echo [6/7] Levantando Servicio de Autenticacion (Puerto 8004)...
start powershell -ExecutionPolicy Bypass -NoExit -Command "cd auth-service; .\venv\Scripts\Activate; uvicorn main:app --reload --port 8004"

echo [7/7] Levantando Servicio de Notificaciones (Puerto 8005)...
start powershell -ExecutionPolicy Bypass -NoExit -Command "cd notificaciones-service; .\venv\Scripts\Activate; uvicorn main:app --reload --port 8005"

echo.
echo ¡Todos los servicios han sido lanzados en ventanas separadas!
pause