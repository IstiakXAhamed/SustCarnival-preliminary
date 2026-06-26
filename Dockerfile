FROM node:22-alpine AS builder
WORKDIR /app
COPY backend/package.json backend/pnpm-lock.yaml* backend/pnpm-workspace.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile --ignore-scripts
COPY backend/ ./
RUN pnpm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=384"
COPY backend/package.json backend/pnpm-lock.yaml* backend/pnpm-workspace.yaml ./
RUN corepack enable && pnpm install --prod --frozen-lockfile --ignore-scripts && pnpm store prune
COPY --from=builder /app/dist ./dist
EXPOSE 8080
CMD ["node", "dist/main.js"]
