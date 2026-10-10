# Railway image: Express API + public/ frontend. SQLite file lives at $DB_PATH (default ./mektebai.db).
FROM node:22-bookworm-slim

ENV NODE_ENV=production
WORKDIR /app

# better-sqlite3 normally uses a prebuilt binary; build tools are only a fallback.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
 && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

# Demo data is added on every start; seed.js exits early if it already exists.
CMD ["sh", "-c", "node seed.js && node server.js"]
