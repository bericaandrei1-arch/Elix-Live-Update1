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

# Pass Env Vars to Build
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_AGORA_APP_ID
ARG VITE_STRIPE_PUBLISHABLE_KEY
ARG VITE_ALLOW_LOCAL_AUTH

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_AGORA_APP_ID=$VITE_AGORA_APP_ID
ENV VITE_STRIPE_PUBLISHABLE_KEY=$VITE_STRIPE_PUBLISHABLE_KEY
ENV VITE_ALLOW_LOCAL_AUTH=$VITE_ALLOW_LOCAL_AUTH

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
ARG PORT=8080
ENV PORT=${PORT}
EXPOSE ${PORT}

CMD ["npm", "start"]
