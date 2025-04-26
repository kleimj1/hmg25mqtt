# syntax=docker/dockerfile:1
ARG BUILD_FROM
FROM ${BUILD_FROM}

WORKDIR /build

COPY package*.json ./
COPY tsconfig.json ./
COPY src/ ./src/

RUN apk add --no-cache nodejs \
  && npm ci \
  && npm run build \
  && npm ci --only=production

WORKDIR /app

COPY package.json ./
COPY --from=0 /build/node_modules ./node_modules
COPY --from=0 /build/dist/ ./dist/
COPY ha_addon/run.sh /

RUN chmod a+x /run.sh

CMD ["/run.sh"]
