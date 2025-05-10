ARG BUILD_FROM
FROM ghcr.io/home-assistant/aarch64-base:latest



ENV LANG=C.UTF-8

RUN apk add --no-cache nodejs

WORKDIR /app

WORKDIR /app
COPY run.sh ./run.sh
RUN chmod +x run.sh
CMD [ "./run.sh" ]
