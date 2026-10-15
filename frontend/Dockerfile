# ==========================================
# Etapa 1: Build de React/Vite
# ==========================================
FROM node:24-alpine AS builder

WORKDIR /app

# Copiamos los archivos de dependencias
COPY package.json package-lock.json ./

# Instalamos dependencias
RUN npm ci

# Copiamos el código fuente
COPY . .

# Variables de Vite
ARG VITE_API_URL
ARG VITE_AVATAR_STORAGE_URL

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_AVATAR_STORAGE_URL=$VITE_AVATAR_STORAGE_URL

# Generamos el build de producción
RUN npm run build


# ==========================================
# Etapa 2: Servidor Nginx
# ==========================================
FROM nginx:alpine

# Eliminamos configuración por defecto
RUN rm /etc/nginx/conf.d/default.conf

# Copiamos nuestra configuración
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiamos el build de React
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]