# syntax=docker/dockerfile:1.7
FROM node:22-alpine AS build
WORKDIR /app

# La instalación reproducible requiere package-lock.json.
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline --no-audit --no-fund

COPY . .

# El frontend consultaba el backend local durante desarrollo.
# En producción se usa la misma URL pública mediante el proxy de Nginx.
RUN if [ -d src ]; then \
      find src -type f \( -name '*.ts' -o -name '*.js' -o -name '*.json' \) \
        -exec sed -i \
          -e 's#http://127.0.0.1:8080##g' \
          -e 's#http://localhost:8080##g' {} +; \
    fi

RUN npm run build -- --configuration production

# Detecta el index.html generado por Angular (browser/ en builders recientes).
RUN set -eux; \
    mkdir -p /site; \
    INDEX_FILE="$(find /app/dist -path '*/browser/index.html' -print -quit)"; \
    if [ -z "$INDEX_FILE" ]; then \
      INDEX_FILE="$(find /app/dist -type f -name index.html -print -quit)"; \
    fi; \
    test -n "$INDEX_FILE"; \
    cp -a "$(dirname "$INDEX_FILE")"/. /site/

FROM nginx:1.28-alpine AS runtime
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /site/ /usr/share/nginx/html/

# El nombre DNS interno del backend se puede sobreescribir en el despliegue.
ENV API_UPSTREAM=backend:8080
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/health || exit 1
