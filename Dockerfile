# ---------- Build stage ----------
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root workspace config
COPY package.json package-lock.json ./

# Copy workspace package.json files
COPY shared/package.json shared/package.json
COPY backend/package.json backend/package.json

# Copy prisma schema (needed for prisma generate during install)
COPY backend/prisma backend/prisma

# Install all dependencies (workspaces resolve locally)
RUN npm ci

# Generate Prisma client (must happen before tsc so types are available)
RUN npx -w backend prisma generate

# Copy source code
COPY shared/ shared/
COPY backend/ backend/
COPY tsconfig.base.json ./

# Build shared first, then backend
RUN npm run build -w shared && npm run build -w backend

# ---------- Production stage ----------
FROM node:22-alpine AS runner

WORKDIR /app

# Copy root workspace config
COPY package.json package-lock.json ./

# Copy workspace package.json files
COPY shared/package.json shared/package.json
COPY backend/package.json backend/package.json

# Copy prisma schema
COPY backend/prisma backend/prisma

# Install production dependencies only
RUN npm ci --omit=dev

# Generate Prisma client in production image
RUN npx -w backend prisma generate

# Copy built artifacts from builder
COPY --from=builder /app/shared/dist shared/dist
COPY --from=builder /app/backend/dist backend/dist

EXPOSE 3333

CMD ["node", "backend/dist/src/server.js"]
