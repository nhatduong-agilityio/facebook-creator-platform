# syntax=docker/dockerfile:1.7

FROM node:22-alpine

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV CI=1
ENV HUSKY=0

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json

RUN pnpm install --filter api... --frozen-lockfile

COPY apps/api ./apps/api

WORKDIR /app/apps/api

RUN pnpm build

EXPOSE 3000

CMD [ "pnpm", "start" ]
