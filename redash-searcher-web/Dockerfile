# ref: https://github.com/vercel/next.js/blob/f7b654e875f474882913a8bd8eee3969e97101d7/examples/with-docker/Dockerfile

# Install dependencies only when needed
FROM node:19.9-bullseye-slim AS deps

WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi


# Rebuild the source code only when needed
FROM node:19.9-bullseye-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://redash-searcher-web.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
# ENV NEXT_TELEMETRY_DISABLED 1

# set public env vars to be replaced at runtime
ENV NEXT_PUBLIC_REDASH__URL=APP_NEXT_PUBLIC_REDASH__URL
ENV NEXT_PUBLIC_APP__URL=APP_NEXT_PUBLIC_APP__URL
RUN yarn build

# If using npm comment out above and use below instead
# RUN npm run build

# Production image, copy all the files and run next
FROM node:19.9-bullseye-slim AS runner
WORKDIR /app

ENV NODE_ENV production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 redash-searcher
RUN adduser --system --uid 1001 redash-searcher-web

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nexjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=redash-searcher-web:redash-searcher /app/.next/standalone ./
COPY --from=builder --chown=redash-searcher-web:redash-searcher /app/.next/server ./.next/server
COPY --from=builder --chown=redash-searcher-web:redash-searcher /app/.next/static ./.next/static

USER redash-searcher-web

EXPOSE 3000

ENV PORT 3000

COPY --chown=redash-searcher-web:redash-searcher entrypoint.sh ./

ENTRYPOINT [ "bash", "entrypoint.sh" ]

CMD ["node", "server.js"]
