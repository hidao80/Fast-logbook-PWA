# ビルドステージ
FROM node:24.11.1-bookworm-slim AS builder

# 作業ディレクトリを設定
WORKDIR /app

# package.json をコピー（依存関係のインストール用）
COPY package*.json ./

# 依存関係をインストール（存在する場合）
RUN if [ -f package-lock.json ]; then npm ci; \
  elif [ -f package.json ]; then npm install; \
  fi

# アプリケーションファイルをコピー
COPY . .

# ビルドスクリプトが存在する場合は実行
RUN if grep -q "\"build\"" package.json; then npm run build; \
  else echo "No build script found, skipping build step"; \
  fi

# 本番ステージ - Nginx
FROM nginx:alpine

# メンテナ情報
LABEL maintainer="Fast-logbook-PWA"

# タイムゾーンの設定
RUN apk add --no-cache tzdata
ENV TZ=Asia/Tokyo

# ビルド成果物をコピー
# まずすべてのファイルをコピーし、dist が存在する場合はそれを上書き
COPY --from=builder /app /usr/share/nginx/html/
# dist ディレクトリが存在する場合は、その内容でルートを上書き
RUN if [ -d /usr/share/nginx/html/dist ]; then \
  cp -r /usr/share/nginx/html/dist/* /usr/share/nginx/html/ && \
  rm -rf /usr/share/nginx/html/dist; \
  fi

# Nginx 設定ファイルをコピー（PWA用の設定）
RUN echo 'server { \
  listen 80; \
  server_name localhost; \
  root /usr/share/nginx/html; \
  index index.html; \
  location / { \
  try_files $uri $uri/ /index.html; \
  add_header Cache-Control "no-cache"; \
  } \
  location /sw.js { \
  add_header Cache-Control "no-cache"; \
  add_header Service-Worker-Allowed "/"; \
  } \
  location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ { \
  expires 1y; \
  add_header Cache-Control "public, immutable"; \
  } \
  }' > /etc/nginx/conf.d/default.conf

# ポート80を公開
EXPOSE 80

# Nginx を起動
CMD ["nginx", "-g", "daemon off;"]
