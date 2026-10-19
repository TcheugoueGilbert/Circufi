# syntax=docker/dockerfile:1
# Build context: repository root  ->  docker build -f packages/frontend/Dockerfile \
#   --build-arg NEXT_PUBLIC_API_URL=https://api.example.com/api -t circufi-web .
FROM node:20-alpine AS build
WORKDIR /app
# NEXT_PUBLIC_* values are inlined at build time, so the API URL must be known here
ARG NEXT_PUBLIC_API_URL=http://localhost:5000/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/backend/package.json packages/backend/
COPY packages/frontend/package.json packages/frontend/
RUN npm ci --workspace=@circufi/frontend --include-workspace-root=false
COPY packages/frontend packages/frontend
RUN npm run build -w @circufi/frontend

FROM node:20-alpine
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
COPY --from=build /app/packages/frontend/.next/standalone ./
COPY --from=build /app/packages/frontend/.next/static ./packages/frontend/.next/static
USER node
EXPOSE 3000
CMD ["node", "packages/frontend/server.js"]
