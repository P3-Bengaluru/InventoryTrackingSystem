
FROM node:20-alpine

WORKDIR /app

# Install runtime tools needed by the container startup checks
RUN apk add --no-cache curl postgresql-client

COPY package.json package-lock.json* ./
RUN npm install --production

COPY . .

RUN mkdir -p /app/server/uploads/assets
COPY docker-entrypoint.sh ./
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 3001

USER node

ENTRYPOINT ["./docker-entrypoint.sh"]
