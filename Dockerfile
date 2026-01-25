# syntax=docker/dockerfile:1

FROM node:24-alpine AS base
WORKDIR /app
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci
COPY . .

FROM base AS dev
EXPOSE 5173
CMD ["npm", "run", "dev"]

FROM base AS test
CMD ["npm", "run", "test"]

FROM base AS build
RUN npm run build

FROM build AS preview
EXPOSE 4173
CMD ["npm", "run", "preview"]
