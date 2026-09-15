FROM node:18-bullseye-slim AS build
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --silent

# Build the app
COPY . .
RUN npm run build

FROM nginx:alpine AS runtime

# Copy built assets from builder
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
