#!/usr/bin/env bash

set -euo pipefail

APP_DIR="/var/www/board_ai"
BRANCH="develop"

cd "$APP_DIR"

echo "[1/5] Переключение на ветку $BRANCH"
git checkout "$BRANCH"
git pull

echo "[2/5] Установка зависимостей"
npm install

echo "[3/5] Сборка приложения"
npm run build

echo "[4/5] Перезапуск через PM2"
pm2 startOrReload ecosystem.config.js --env production

echo "[5/5] Готово"
pm2 status
