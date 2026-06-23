# ---- Build Stage ----
FROM node:20-alpine AS build

# 国内镜像：Alpine apk、npm
ARG APK_MIRROR=mirrors.aliyun.com
ARG NPM_REGISTRY=https://registry.npmmirror.com

RUN sed -i "s|dl-cdn.alpinelinux.org|${APK_MIRROR}|g" /etc/apk/repositories \
    && apk add --no-cache --update tzdata \
    && cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime \
    && echo "Asia/Shanghai" > /etc/timezone

RUN npm config set registry "${NPM_REGISTRY}" \
    && npm install -g pnpm@latest

WORKDIR /app

COPY package.json pnpm-lock.yaml* package-lock.json* ./

RUN if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; \
    elif [ -f package-lock.json ]; then npm ci; \
    else npm install; fi

COPY . .

RUN npm run build

# ---- Production Stage ----
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
    CMD wget -q --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
