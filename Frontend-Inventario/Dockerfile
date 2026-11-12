# ---------- Build (Angular) ----------
# @angular/cli 22 exige Node ^22.22.3 || ^24.15.0; node:24 lo cumple.
FROM node:24-alpine AS build
WORKDIR /app

# Instalación reproducible con package-lock.json (capa cacheable).
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

# URL del API que usará el navegador. Por defecto es relativa ("/api/v1/") y Nginx
# la reenvía al backend (ver nginx.conf.template), así no hay CORS ni URLs fijas.
# En Northflank se puede cambiar como "build argument" si el backend tiene dominio propio,
# por ejemplo: API_URL=https://mi-backend.code.run/api/v1/
ARG API_URL=/api/v1/

# Se reemplaza src/app/enviroments.ts SOLO dentro de la imagen; tu archivo local
# (apuntando a http://127.0.0.1:8080) no se modifica.
RUN printf "export const enviroment = {\n  apiUrl: '%s',\n  production: true,\n};\n" "$API_URL" \
    > src/app/enviroments.ts

RUN npm run build -- --configuration production

# Angular 17+ genera dist/<proyecto>/browser; se localiza el index.html generado.
RUN set -eux; \
    mkdir -p /site; \
    INDEX_FILE="$(find /app/dist -path '*/browser/index.html' -print -quit)"; \
    if [ -z "$INDEX_FILE" ]; then \
      INDEX_FILE="$(find /app/dist -type f -name index.html -print -quit)"; \
    fi; \
    test -n "$INDEX_FILE"; \
    cp -a "$(dirname "$INDEX_FILE")"/. /site/

# ---------- Runtime (Nginx) ----------
FROM nginx:1.28-alpine AS runtime

# La imagen oficial procesa /etc/nginx/templates/*.template con envsubst al arrancar.
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /site/ /usr/share/nginx/html/

# Valores por defecto (red interna tipo Northflank). En Render se sobreescriben:
#   API_SCHEME=https
#   API_UPSTREAM=mi-backend.onrender.com
#   API_HOST=mi-backend.onrender.com
# NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1 hace que la imagen de Nginx calcule
# NGINX_LOCAL_RESOLVERS (DNS del contenedor) y lo use la plantilla en "resolver".
ENV PORT=8080 \
    NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1 \
    API_SCHEME=http \
    API_UPSTREAM=backend:8080 \
    API_HOST=backend

EXPOSE 8080

# Sin HEALTHCHECK de Docker: configura el health check de la plataforma en GET /health.
