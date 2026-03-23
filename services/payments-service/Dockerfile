# Build from repository root:
#   docker build -f services/payments-service/Dockerfile .

FROM node:20-alpine AS build
WORKDIR /repo
RUN corepack enable pnpm
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY services/orders-service/package.json ./services/orders-service/
COPY services/payments-service/package.json ./services/payments-service/
RUN pnpm install --frozen-lockfile --filter "./services/payments-service"
COPY services/payments-service ./services/payments-service
COPY contracts/proto ./contracts/proto
RUN pnpm --filter "./services/payments-service" run build

FROM node:20-alpine AS prod
WORKDIR /repo
RUN corepack enable pnpm
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY services/orders-service/package.json ./services/orders-service/
COPY services/payments-service/package.json ./services/payments-service/
RUN pnpm install --frozen-lockfile --filter "./services/payments-service" --prod
COPY --from=build /repo/services/payments-service/dist ./services/payments-service/dist
COPY --from=build /repo/contracts/proto /usr/contracts/proto
WORKDIR /repo/services/payments-service
RUN chown -R node:node /repo/services/payments-service
USER node
CMD ["node", "dist/main.js"]
