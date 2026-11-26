FROM node:22-bookworm-slim AS base
WORKDIR /app
RUN mkdir -p /media && chown node:node /app /media
USER node
COPY --chown=node:node package.json package-lock.json ./

# Development: all dependencies, nodemon (used by docker-compose.yml)
FROM base AS dev
RUN npm ci
COPY --chown=node:node . .
EXPOSE 5000
CMD ["npm", "run", "dev"]

# Production (used in Stage 12): runtime dependencies only, plain node
FROM base AS prod
ENV NODE_ENV=production
RUN npm ci --omit=dev
COPY --chown=node:node . .
EXPOSE 5000
CMD ["node", "src/server.js"]