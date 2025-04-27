FROM node:18-alpine AS builder
WORKDIR /build

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:18-alpine AS final
WORKDIR /app

COPY --from=builder /build/node_modules ./node_modules
COPY --from=builder /build/dist        ./dist

CMD ["node", "dist/index.js"]
