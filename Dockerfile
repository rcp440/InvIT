# Build stage — instala dependencias
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# Runtime stage — imagen final mínima
FROM node:20-alpine AS runtime
WORKDIR /app

# Usuario sin privilegios
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copiar dependencias y código
COPY --from=deps /app/node_modules ./node_modules
COPY --chown=appuser:appgroup . .

# No exponer .env ni scripts de DB en producción
RUN rm -rf database/seeds database/demo.js database/reset_superadmin.js \
           database/check_superadmin.js .env

USER appuser

EXPOSE 3000

ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
