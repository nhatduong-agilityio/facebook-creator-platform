# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV CI=1
ENV HUSKY=0

RUN corepack enable

WORKDIR /app

FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json

RUN pnpm install --filter api... --frozen-lockfile

FROM deps AS build

COPY apps/api ./apps/api

RUN pnpm --filter api build
RUN pnpm deploy --filter api --prod /prod/api --legacy

FROM node:22-alpine AS runtime

ENV NODE_ENV=production

WORKDIR /app

RUN addgroup -S nodejs && adduser -S nodejs -G nodejs

COPY --from=build --chown=nodejs:nodejs /prod/api/package.json ./package.json
COPY --from=build --chown=nodejs:nodejs /prod/api/node_modules ./node_modules
COPY --from=build --chown=nodejs:nodejs /app/apps/api/dist ./dist

USER nodejs

EXPOSE 3000

CMD ["node", "dist/main.js"]
