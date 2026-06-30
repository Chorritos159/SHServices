FROM node:20-alpine

WORKDIR /app

# Copiamos los archivos de dependencias e instalamos
COPY package*.json ./
RUN npm install

# Copiamos el resto del código
COPY . .

# Vite por defecto corre en el puerto 5173
EXPOSE 5173

# Arrancamos Vite con la opción --host para permitir conexiones externas al contenedor
CMD ["npm", "run", "dev", "--", "--host"]
