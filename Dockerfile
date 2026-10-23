# syntax=docker/dockerfile:1

# Multi-stage build for the SupportAI frontend (Next.js 15, App Router, TypeScript).
#
# Two things about Next.js matter here:
#   * NEXT_PUBLIC_* variables are inlined into the client bundle AT BUILD TIME, not read at
#     runtime. So NEXT_PUBLIC_API_BASE_URL must be passed as a build arg - an env var set only
#     on `docker run` would reach the server but never the browser.
#   * next.config.ts sets `output: "standalone"`, so the runner stage ships a self-contained
#     server with only the node_modules actually imported.

# --------------------------------------------------------------------------- deps
FROM node:22-alpine AS deps

WORKDIR /app

# `npm ci` (not `npm install`) so the image matches package-lock.json exactly - same as CI.
COPY package.json package-lock.json ./
RUN npm ci

# --------------------------------------------------------------------------- builder
FROM node:22-alpine AS builder

WORKDIR /app

# Default matches .env.example. docker-compose.yml overrides it from the host environment.
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# `next build` fails on a missing public/ directory in standalone mode; the app currently has no
# static assets, so create the empty directory rather than special-casing the COPY.
RUN mkdir -p public && npm run build

# --------------------------------------------------------------------------- runner
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Run as the unprivileged user node (uid/gid 1000), which the base image already provides.
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

USER node

EXPOSE 3000

CMD ["node", "server.js"]