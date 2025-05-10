ARG BUILD_FROM
FROM $BUILD_FROM

ENV LANG C.UTF-8

# Install Node.js + npm
RUN apk add --no-cache nodejs npm

# Arbeitsverzeichnis
WORKDIR /app

# Kopiere package.json und installiere nur runtime-deps
COPY ../package.json ../package-lock.json ./
RUN npm install --omit=dev

# Kopiere kompilierten Code
COPY dist ./dist
COPY run.sh /run.sh
RUN chmod +x /run.sh

CMD ["/run.sh"]
