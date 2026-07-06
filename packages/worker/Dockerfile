FROM node:22-slim AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/worker/package.json packages/worker/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile
COPY packages/worker/ packages/worker/
COPY packages/shared/ packages/shared/
RUN pnpm --filter @pacifica/worker build

FROM node:22-slim AS runtime
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/worker/package.json packages/worker/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile --prod
COPY --from=builder /app/packages/worker/dist/ packages/worker/dist/
CMD ["node", "packages/worker/dist/index.js"]
