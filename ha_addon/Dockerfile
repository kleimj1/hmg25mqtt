FROM ghcr.io/hassio-addons/base:14.2.2
# Installiere Node.js und npm
RUN apk add --no-cache nodejs npm
WORKDIR /app

COPY run.sh /run.sh
RUN chmod +x /run.sh

CMD [ "/run.sh" ]
