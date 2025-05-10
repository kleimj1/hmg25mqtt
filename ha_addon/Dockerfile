ARG BUILD_FROM
FROM $BUILD_FROM

ENV LANG C.UTF-8

# Install Node.js for runtime
RUN apk add --no-cache nodejs

# Set working directory
WORKDIR /app

# Copy compiled TypeScript output
COPY dist ./dist

# Copy startup script
COPY run.sh /run.sh
RUN chmod +x /run.sh

# Entry point for the add-on
CMD [ "/run.sh" ]
