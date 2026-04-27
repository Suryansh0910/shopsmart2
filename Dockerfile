FROM node:20-alpine AS frontend-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

FROM node:20-alpine AS backend-builder
WORKDIR /app/server
RUN apk add --no-cache python3 make g++ 
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY server/ ./

FROM node:20-alpine
WORKDIR /app
COPY --from=frontend-builder /app/client/dist ./client/dist
COPY --from=backend-builder /app/server ./server

WORKDIR /app/server
RUN mkdir -p data && node src/db/seed.js
ENV NODE_ENV=production
EXPOSE 5001
CMD ["node", "src/index.js"]
