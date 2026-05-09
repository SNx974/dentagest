# ── Stage 1 : build React ────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --frozen-lockfile

COPY index.html vite.config.js ./
COPY src ./src
RUN npm run build

# ── Stage 2 : serveur Node.js ────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Dépendances serveur seulement
COPY server/package*.json ./
RUN npm ci --production

# Code serveur
COPY server/ .

# Frontend buildé → dossier public du serveur
COPY --from=frontend-builder /app/dist ./public

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "index.js"]
