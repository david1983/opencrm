# Build stage for client
FROM node:20-alpine AS client-builder

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Copy workspace package files
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy client source
COPY client/ ./client/

# Build client
WORKDIR /app/client
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Copy server package files
COPY server/package*.json ./server/

# Install only production dependencies
RUN npm ci --omit=dev

# Copy server source
COPY server/ ./server/

# Copy built client from builder stage
COPY --from=client-builder /app/client/dist ./client/dist

# Set environment
ENV NODE_ENV=production
ENV PORT=5000

# Expose port
EXPOSE 5000

# Start server
WORKDIR /app/server
CMD ["node", "src/server.js"]