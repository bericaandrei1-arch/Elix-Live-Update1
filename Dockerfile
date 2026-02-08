FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application (Vite)
RUN npm run build

# Expose port
EXPOSE 3000

# Start the monolithic server (Express + WebSocket + Static Files)
CMD ["npm", "start"]
