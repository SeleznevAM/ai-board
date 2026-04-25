# Развертывание `board-ai` на VPS `91.132.162.150`

## 1. Подключение

```bash
ssh root@91.132.162.150
```

## 2. Установка системных пакетов

```bash
apt update && apt upgrade -y
apt install -y git curl nginx
```

## 3. Установка Node.js 22 и PM2

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
npm install -g pm2
```

Проверка:

```bash
node -v
npm -v
pm2 -v
```

## 4. Клонирование проекта

```bash
mkdir -p /var/www
cd /var/www
git clone <URL_РЕПОЗИТОРИЯ> board_ai
cd /var/www/board_ai
git checkout develop
```

Если проект уже есть на сервере:

```bash
cd /var/www/board_ai
git checkout develop
git pull
```

## 5. Production-переменные

Создай файл:

```bash
nano /var/www/board_ai/.env.production
```

Содержимое:

```env
YOUTRACK_BASE_URL=https://lofi45119.youtrack.cloud/
YOUTRACK_TOKEN=ТВОЙ_ТОКЕН_YOUTRACK
NEXT_PUBLIC_YOUTRACK_BASE_URL=https://lofi45119.youtrack.cloud/
PORT=3000
```

## 6. Установка зависимостей и сборка

```bash
cd /var/www/board_ai
npm install
npm run build
```

## 7. Запуск приложения

Сделай скрипт исполняемым:

```bash
cd /var/www/board_ai
chmod +x deploy.sh
```

Первый запуск через PM2:

```bash
cd /var/www/board_ai
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

После `pm2 startup` выполни команду, которую покажет PM2, затем еще раз:

```bash
pm2 save
```

Проверка:

```bash
pm2 status
pm2 logs board-ai
```

## 8. Настройка Nginx

Скопируй готовый конфиг:

```bash
cp /var/www/board_ai/deploy/nginx.board-ai.conf /etc/nginx/sites-available/board-ai
ln -sf /etc/nginx/sites-available/board-ai /etc/nginx/sites-enabled/board-ai
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
```

## 9. Firewall

Если используешь `ufw`:

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
ufw status
```

## 10. Проверка после запуска

Открой в браузере:

```text
http://91.132.162.150
```

## 11. Как обновлять приложение

После новых коммитов:

```bash
cd /var/www/board_ai
./deploy.sh
```

## 12. Если приложение не открылось

Проверь по порядку:

```bash
pm2 status
pm2 logs board-ai
systemctl status nginx
nginx -t
curl http://127.0.0.1:3000
curl http://91.132.162.150
```

## 13. Что именно запускать

После первого разворота основной запуск делается не через `npm run dev`, а так:

```bash
cd /var/www/board_ai
pm2 start ecosystem.config.js
```

А все последующие обновления так:

```bash
cd /var/www/board_ai
./deploy.sh
```
