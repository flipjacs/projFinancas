# syntax=docker/dockerfile:1.7

# ---- Builder ----
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (better cache hits when only source changes).
# BuildKit cache mount keeps the npm store warm across builds.
COPY package.json package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm \
    if [ -f package-lock.json ]; then \
      npm ci --no-audit --no-fund; \
    else \
      npm install --no-audit --no-fund; \
    fi

COPY . .

# VITE_API_URL is baked into the bundle at build time. Leave empty to use
# same-origin requests (production deploys typically set this via Compose).
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL
ENV NODE_ENV=production

RUN npm run build && npm prune --omit=dev

# ---- Runtime ----
FROM nginx:1.27-alpine AS runtime

# Drop the default site config so ours is the only one served.
RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/app.conf
COPY --from=builder /app/dist /usr/share/nginx/html

# Drop privileges: nginx:alpine ships with a non-root `nginx` user and pre-
# created PID/log dirs, but we need to give it write access on the cache
# dirs nginx uses at runtime.
RUN chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx \
    && chmod -R g+rwx /var/cache/nginx

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -q --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
