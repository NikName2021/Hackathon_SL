# syntax=docker/dockerfile:1.4

# 1. Build React app
FROM node:lts AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# 2. Nginx setup for production
FROM nginx:alpine

WORKDIR /usr/share/nginx/html

# Copy custom nginx config
COPY nginx/local_nginx.conf /etc/nginx/conf.d/default.conf

# Remove default nginx static assets
RUN rm -rf ./*

# Copy static assets from build stage (Vite outDir is 'build')
COPY --from=build /app/build .

EXPOSE 80
ENTRYPOINT ["nginx", "-g", "daemon off;"]
