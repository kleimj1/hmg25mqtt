# Global ARG so BuildKit can inject it into FROM
ARG BUILD_FROM=ghcr.io/hassio-addons/base:14.2.2

# Stage 1: build your code
FROM node:18-alpine AS builder
WORKDIR /build

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Stage 2: runtime image
FROM ${BUILD_FROM} AS final

LABEL io.hass.type="addon"
LABEL io.hass.version="14.2.2"
LABEL io.hass.arch="amd64,arm64,armv7"

WORKDIR /app

COPY --from=builder /build/node_modules ./node_modules
COPY --from=builder /build/dist        ./dist

# Kopiere run.sh aus dem aktuellen Verzeichnis
COPY run.sh /run.sh
RUN chmod +x /run.sh

CMD [ "/run.sh" ]
