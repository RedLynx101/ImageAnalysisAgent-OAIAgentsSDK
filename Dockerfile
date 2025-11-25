# Base image with Node 22
FROM node:22-alpine AS base
WORKDIR /app

# Install dependencies only
FROM base AS deps
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
COPY apps/worker/package*.json ./apps/worker/
COPY packages/shared/package*.json ./packages/shared/
COPY packages/agent/package*.json ./packages/agent/
COPY packages/pdf/package*.json ./packages/pdf/
COPY packages/email/package*.json ./packages/email/
RUN npm install

# Development image
FROM base AS dev
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Create directories for uploads and reports
RUN mkdir -p uploads reports

# Build packages
FROM dev AS builder
RUN npm run build --workspace=@repo/shared
RUN npm run build --workspace=@repo/agent
RUN npm run build --workspace=@repo/pdf
RUN npm run build --workspace=@repo/email

# Web production build
FROM builder AS web-builder
RUN npm run build --workspace=apps/web

# Production web image
FROM base AS web-prod
COPY --from=deps /app/node_modules ./node_modules
COPY --from=web-builder /app/apps/web/.next ./apps/web/.next
COPY --from=web-builder /app/apps/web/public ./apps/web/public
COPY --from=web-builder /app/apps/web/package.json ./apps/web/package.json
COPY --from=builder /app/packages ./packages
COPY package*.json ./
RUN mkdir -p uploads reports
EXPOSE 3000
CMD ["npm", "run", "start", "--workspace=apps/web"]

