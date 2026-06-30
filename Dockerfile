FROM node:20-alpine

WORKDIR /app

# Application code (no npm install — zero runtime dependencies)
COPY package.json server.js server-utils.js store-profiles.js verticals.js planner-sensei-cost.js ./
COPY data ./data
COPY models ./models
COPY *.html ./
COPY planner-*.js ./
COPY libs ./libs

RUN mkdir -p /app/data && chown -R node:node /app

USER node

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

# Persist configuration writes (store-profiles, verticals)
VOLUME ["/app/data"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "server.js"]
