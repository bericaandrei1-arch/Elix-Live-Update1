# Stage 1: Build
FROM node:20-alpine AS builder

# Increase memory for build
ENV NODE_OPTIONS="--max-old-space-size=4096"

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with speed optimizations
RUN npm install --no-audit --no-fund --legacy-peer-deps

# Copy source
COPY . .

# Build
RUN npm run build

# Prune dev deps
RUN npm prune --production --legacy-peer-deps

# Stage 2: Run
FROM node:20-alpine

WORKDIR /app

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/package.json ./
COPY --from=builder /app/tsconfig.json ./

# Do NOT copy .env — Railway injects env vars; .env would override PORT
# COPY --from=builder /app/.env* ./

# Railway sets PORT dynamically — default to 8080 if not set
ENV PORT=${PORT:-8080}
EXPOSE 8080

CMD ["npm", "start"]
