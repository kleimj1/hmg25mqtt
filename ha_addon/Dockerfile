# ─────────────────────────────────────────────────────────────
# Global ARG für das Runtime-Base-Image
# Muss vor jedem FROM stehen, damit es in FROM ${BUILD_FROM} genutzt werden kann
# ─────────────────────────────────────────────────────────────
ARG BUILD_FROM=ghcr.io/hassio-addons/base:14.2.2

# ─────────────────────────────────────────────────────────────
# Stage 1: Build your TypeScript/Node.js code
# ─────────────────────────────────────────────────────────────
FROM node:18-alpine AS builder
WORKDIR /build

# Install all dependencies (including dev for build)
COPY package*.json ./
RUN npm ci

# Copy source & compile
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ─────────────────────────────────────────────────────────────
# Stage 2: Runtime image basierend auf HA Add-on Base
# ─────────────────────────────────────────────────────────────
FROM ${BUILD_FROM} AS final

LABEL io.hass.type="addon"
LABEL io.hass.version="14.2.2"
LABEL io.hass.arch="amd64,arm64,armv7"

WORKDIR /app

# Copy production deps + compiled output
COPY --from=builder /build/node_modules ./node_modules
COPY --from=builder /build/dist        ./dist

# Copy entrypoint
COPY run.sh /run.sh
RUN chmod +x /run.sh

CMD [ "/run.sh" ]
