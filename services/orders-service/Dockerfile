# Build from repository root (monorepo: orders + shared contracts):
#   docker build -f services/orders-service/Dockerfile .
#
# DEPS STAGE — all deps (dev + prod) for build / hot-reload / tools
FROM node:20-alpine AS dev
WORKDIR /usr/src/app
RUN corepack enable pnpm
COPY services/orders-service/package.json services/orders-service/pnpm-lock.yaml ./
RUN pnpm i --frozen-lockfile

# BUILD STAGE — compile TypeScript to dist/
FROM node:20-alpine AS build
WORKDIR /usr/src/app
RUN corepack enable pnpm
COPY --from=dev /usr/src/app/node_modules ./node_modules
COPY services/orders-service/tsconfig*.json services/orders-service/nest-cli.json services/orders-service/package.json ./
COPY services/orders-service/src ./src/
RUN pnpm run build

# TOOLS STAGE — one-off jobs: migrate + seed (needs ts-node + source files)
FROM node:20-alpine AS tools
WORKDIR /usr/src/app
RUN corepack enable pnpm && corepack prepare pnpm@10.31.0 --activate
COPY --from=dev /usr/src/app/node_modules ./node_modules
COPY services/orders-service/package.json services/orders-service/pnpm-lock.yaml services/orders-service/tsconfig*.json services/orders-service/nest-cli.json ./
COPY services/orders-service/data-source.ts services/orders-service/seed.ts ./
COPY services/orders-service/src ./src/

# PROD STAGE — minimal runtime image (node:alpine, non-root)
FROM node:20-alpine AS prod
WORKDIR /usr/src/app
RUN corepack enable pnpm
COPY services/orders-service/package.json services/orders-service/pnpm-lock.yaml ./
RUN pnpm i --frozen-lockfile --prod
COPY --from=build /usr/src/app/dist ./dist
COPY contracts/proto /usr/contracts/proto
RUN chown -R node:node /usr/src/app
USER node
CMD ["node", "dist/main.js"]

# PROD-DISTROLESS STAGE — distroless runtime (no shell, nonroot uid 65532)
FROM gcr.io/distroless/nodejs20-debian12:nonroot AS prod-distroless
WORKDIR /usr/src/app
COPY --chown=nonroot:nonroot --from=prod /usr/src/app/node_modules ./node_modules
COPY --chown=nonroot:nonroot --from=build /usr/src/app/dist ./dist
COPY --chown=nonroot:nonroot contracts/proto /usr/contracts/proto
CMD ["dist/main.js"]
