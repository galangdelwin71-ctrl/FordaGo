# ==============================================================================
# FordaGo Frontend Multi-Stage Dockerfile (Ionic / Angular + Nginx)
# Compatible with Podman & Docker
# ==============================================================================

# --- Stage 1: Build Angular / Ionic SPA ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package descriptors first
COPY package.json package-lock.json ./

# Install dependencies (use legacy peer deps if needed for Ionic/Angular packages)
RUN npm install --legacy-peer-deps

# Copy application source code
COPY . .

# Build production bundle (outputs to www/)
RUN npm run build -- --configuration production

# --- Stage 2: Serve compiled SPA with lightweight Nginx ---
FROM nginx:alpine

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/www /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
