FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY . .
RUN node scripts/build.mjs

FROM node:24-bookworm-slim
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000 DATABASE_PATH=/app/data/contacts.sqlite
WORKDIR /app
COPY --from=build --chown=node:node /app/dist/ ./
RUN mkdir -p /app/data && chown node:node /app/data
USER node
EXPOSE 3000
CMD ["node", "server.js"]
