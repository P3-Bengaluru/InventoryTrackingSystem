
FROM node:20-alpine

WORKDIR /app

# Install curl so healthcheck (curl) works inside the container
RUN apk add --no-cache curl

COPY package.json package-lock.json* ./
RUN npm install --production

COPY . .

RUN mkdir -p /app/server/uploads/assets

EXPOSE 3001

USER node

CMD ["node", "src/app.js"]
