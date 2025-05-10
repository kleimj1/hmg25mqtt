ARG BUILD_FROM
FROM $BUILD_FROM

ENV LANG C.UTF-8

# Installiere Node.js zur Laufzeit
RUN apk add --no-cache nodejs

# Setze Arbeitsverzeichnis
WORKDIR /app

# Kopiere vorbereitete node_modules aus CI (siehe Workflow!)
COPY node_modules ./node_modules

# Kopiere den kompilierten Code
COPY dist ./dist

# Kopiere das Startskript
COPY run.sh /run.sh
RUN chmod +x /run.sh

# Starte das Add-on
CMD ["/run.sh"]
