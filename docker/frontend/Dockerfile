# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY frontend/package*.json ./
RUN npm ci

# Copy source files and build
COPY frontend/ ./
RUN npm run build

# Output stage
FROM alpine:latest
WORKDIR /dist
COPY --from=builder /app/dist /dist
CMD ["sleep", "infinity"]
