# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files and install production dependencies only
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --prod --frozen-lockfile

# Copy built assets from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server

# Expose port
EXPOSE 3000

# Start the server
CMD ["node", "server/index.js"]