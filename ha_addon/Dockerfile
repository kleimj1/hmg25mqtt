ARG BUILD_FROM
FROM $BUILD_FROM


ENV LANG=C.UTF-8

RUN apk add --no-cache nodejs

WORKDIR /app

COPY dist ./dist
COPY run.sh ./
RUN chmod +x /run.sh

CMD [ "/run.sh" ]
