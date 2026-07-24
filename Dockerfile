FROM node:24-alpine AS deps

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

FROM node:24-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate
RUN npm run build

FROM node:24-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME=0.0.0.0

# `output: standalone` já traz um node_modules mínimo dentro de .next/standalone —
# não precisa copiar o node_modules completo do builder.
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

EXPOSE 3001

CMD ["node", "server.js"]
