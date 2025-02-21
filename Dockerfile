# syntax = docker/dockerfile:1
ARG NODE_VERSION=20.18.0

# Base stage
FROM node:${NODE_VERSION}-slim as base
ARG PORT=3000
WORKDIR /src

# Install Chrome dependencies - adding this to base so it's available in final stage too
RUN apt-get update && apt-get install -y \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpango-1.0-0 \
    libcairo2 \
    libatspi2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Build stage
FROM base as build
# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY --link package.json pnpm-lock.yaml .
RUN pnpm install

# Copy the rest of the application
COPY --link . .
RUN pnpm run build

# Production stage
FROM base
ENV PORT=$PORT
ENV NODE_ENV=production
COPY --from=build /src/.output /src/.output

# Added for Puppeteer - ensure we have a writable /tmp
RUN mkdir -p /tmp \
    && chmod 1777 /tmp

CMD [ "node", ".output/server/index.mjs" ]