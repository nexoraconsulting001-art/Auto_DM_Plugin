# Bhava's company website: built with Node, served by a small Caddy (no TLS here; the server's Caddy does that).
FROM node:22-alpine AS build
WORKDIR /site
COPY package.json build.mjs site.config.json ./
COPY pages pages
COPY src src
COPY brand brand
# Empty for the normal build. "--release" refuses to build while site.config.json has open details.
ARG BUILD_FLAGS=
RUN node build.mjs $BUILD_FLAGS

FROM caddy:2-alpine
COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /site/dist /srv
