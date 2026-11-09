# Single-service image: API + built React site on one port.
FROM node:22-slim AS build
WORKDIR /app
COPY client/package*.json client/
RUN cd client && npm ci
COPY server/package*.json server/
RUN cd server && npm ci
COPY client client
COPY server server
RUN cd client && npm run build && cd ../server && npm run build && npm prune --omit=dev

FROM node:22-slim
ENV NODE_ENV=production SERVE_CLIENT=true CLIENT_DIST=/app/client/dist PORT=4000
WORKDIR /app/server
COPY --from=build /app/server/node_modules ./node_modules
COPY --from=build /app/server/dist ./dist
COPY --from=build /app/server/drizzle ./drizzle
COPY --from=build /app/server/package.json ./package.json
COPY --from=build /app/client/dist /app/client/dist
RUN mkdir -p uploads && chown -R node:node /app
USER node
EXPOSE 4000
# Apply migrations, run the (idempotent) seed — creates the owner from SEED_ADMIN_* only if missing — then start
CMD ["sh", "-c", "node dist/db/migrate.js && node dist/db/seed.js && node dist/index.js"]
