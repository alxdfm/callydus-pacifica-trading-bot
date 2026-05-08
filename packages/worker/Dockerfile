FROM node:22-slim
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile --prod
COPY packages/worker/dist/ ./dist/
CMD ["node", "dist/index.js"]
