# Build from repository root:
#   docker build -f services/orders-service/Dockerfile .
FROM node:20-alpine AS dev
WORKDIR /usr/src/app
RUN corepack enable pnpm
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/orders-service/package.json services/orders-service/package.json
COPY contracts/package.json contracts/package.json
RUN pnpm install --frozen-lockfile

FROM node:20-alpine AS build
WORKDIR /usr/src/app
RUN corepack enable pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/orders-service/package.json services/orders-service/package.json

RUN pnpm install --frozen-lockfile

COPY services/orders-service ./services/orders-service
COPY contracts ./contracts

RUN pnpm --filter ./services/orders-service... run build

FROM node:20-alpine AS tools
WORKDIR /usr/src/app
RUN corepack enable pnpm && corepack prepare pnpm@10.31.0 --activate

COPY --from=dev /usr/src/app/node_modules ./node_modules
COPY --from=dev /usr/src/app/package.json ./package.json
COPY --from=dev /usr/src/app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=dev /usr/src/app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY services/orders-service ./services/orders-service
COPY contracts ./contracts

WORKDIR /usr/src/app/services/orders-service

FROM node:20-alpine AS prod
WORKDIR /usr/src/app
RUN corepack enable pnpm

COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/services/orders-service/dist ./dist
COPY contracts/proto /usr/contracts/proto

RUN chown -R node:node /usr/src/app
USER node
CMD ["node", "dist/src/main.js"]

FROM gcr.io/distroless/nodejs20-debian12:nonroot AS prod-distroless
WORKDIR /usr/src/app
COPY --chown=nonroot:nonroot --from=prod /usr/src/app/node_modules ./node_modules
COPY --chown=nonroot:nonroot --from=prod /usr/src/app/dist ./dist
COPY --chown=nonroot:nonroot contracts/proto /usr/contracts/proto
CMD ["dist/src/main.js"]