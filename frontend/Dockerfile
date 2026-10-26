# Node is only needed to build; the final image is nginx serving static
# files and forwarding API and admin requests to Django.
FROM node:24.22.1-alpine AS build

# Corepack installs the pnpm version named in package.json's packageManager.
RUN corepack enable
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

COPY . .
RUN pnpm build


FROM nginx:1.30.6-alpine

# The image fills ${BACKEND_URL} from the environment at startup and writes
# the result to /etc/nginx/conf.d/default.conf.
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
