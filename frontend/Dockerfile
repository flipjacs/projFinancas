# syntax=docker/dockerfile:1.7

# ---- Builder ----
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (better cache hits when only source changes).
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then \
      npm ci --no-audit --no-fund; \
    else \
      npm install --no-audit --no-fund; \
    fi

COPY . .

# VITE_API_URL is baked into the bundle at build time. Leave empty to use
# same-origin requests (production deploys typically set this via Compose).
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ---- Runtime ----
FROM nginx:1.27-alpine AS runtime

# Drop the default site config so ours is the only one served.
RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/app.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -q --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
