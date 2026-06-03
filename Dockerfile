# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/backend/package*.json ./packages/backend/
COPY packages/frontend/package*.json ./packages/frontend/

# Install dependencies
RUN npm run setup

# Copy source code
COPY . .

# Build all packages
RUN npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

# Copy built artifacts
COPY --from=builder /app/packages/backend/dist ./backend/dist
COPY --from=builder /app/packages/backend/node_modules ./backend/node_modules
COPY --from=builder /app/packages/shared/dist ./shared/dist

# Copy frontend build
COPY --from=builder /app/packages/frontend/dist ./frontend/dist

EXPOSE 5000

CMD ["node", "backend/dist/index.js"]