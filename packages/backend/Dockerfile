# syntax=docker/dockerfile:1
# Build context: repository root  ->  docker build -f packages/backend/Dockerfile -t circufi-api .
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/backend/package.json packages/backend/
COPY packages/frontend/package.json packages/frontend/
RUN npm ci --workspace=@circufi/shared --workspace=@circufi/backend --include-workspace-root=false
COPY packages/shared packages/shared
COPY packages/backend packages/backend
RUN npm run build -w @circufi/shared && npm run build -w @circufi/backend

FROM node:20-alpine
ENV NODE_ENV=production PORT=5000
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/backend/package.json ./packages/backend/package.json
COPY --from=build /app/packages/backend/dist ./packages/backend/dist
USER node
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:5000/health || exit 1
CMD ["node", "packages/backend/dist/index.js"]
