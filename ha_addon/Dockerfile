FROM ghcr.io/hassio-addons/base:14.2.2
# Installiere Node.js und npm
RUN apk add --no-cache nodejs npm
# Kopiere package.json und tsconfig.json und installiere deps
COPY ../package*.json ../tsconfig.json ./
RUN npm install

# Kopiere den Quellcode
COPY ../src ./src

# Kompiliere TypeScript → dist/
RUN npm run build
WORKDIR /app

# Jetzt Add-on-Laufzeit vorbereiten
WORKDIR /app
COPY dist ./dist
COPY run.sh ./
RUN chmod a+x /run.sh

CMD [ "/run.sh" ]
