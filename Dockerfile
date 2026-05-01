# Use Node.js as base
FROM node:20-slim AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# Production image
FROM node:20-slim

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm install --production

# Copy built assets and server
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts

# We use tsx to run the server.ts directly or compile it.
# Node 22+ supports TS, but we are on Node 20 here usually.
# So we use tsx which is in devDependencies.
RUN npm install -g tsx

EXPOSE 3000

CMD ["tsx", "server.ts"]
