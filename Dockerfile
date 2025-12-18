# ===== base stage =====
FROM oven/bun:alpine AS base
WORKDIR /app

# ===== deps stage - all dependencies =====
FROM base AS deps
COPY package.json bun.lock ./
COPY services/backend/scripts ./services/backend/scripts
COPY services/backend/package.json ./services/backend/
COPY services/telegram/package.json ./services/telegram/
COPY services/frontend/package.json ./services/frontend/
RUN bun install --frozen-lockfile

# ===== backend build =====
FROM deps AS backend-build
COPY services/backend ./services/backend
WORKDIR /app/services/backend

# ===== telegram build =====
FROM deps AS telegram-build
COPY services/telegram ./services/telegram
WORKDIR /app/services/telegram

# ===== frontend build =====
FROM deps AS frontend-build
COPY services/frontend ./services/frontend
WORKDIR /app/services/frontend
RUN bun run build

# ===== backend production =====
FROM base AS backend
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/services/backend/node_modules ./services/backend/node_modules
COPY services/backend ./services/backend
WORKDIR /app/services/backend
ENV NODE_ENV=production
EXPOSE 8080
CMD ["bun", "run", "start"]

# ===== telegram production =====
FROM base AS telegram
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/services/telegram/node_modules ./services/telegram/node_modules
COPY services/telegram ./services/telegram
WORKDIR /app/services/telegram
ENV NODE_ENV=production
EXPOSE 8081
CMD ["bun", "run", "start"]

# ===== frontend production =====
FROM base AS frontend
WORKDIR /app
COPY --from=frontend-build /app/services/frontend/build ./build
COPY --from=frontend-build /app/services/frontend/package.json ./
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
CMD ["bun", "./build/index.js"]

# ===== migrator =====
FROM deps AS migrator
WORKDIR /app/services/backend
COPY services/backend ./
CMD ["bun", "run", "db:migrate"]
