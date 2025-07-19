FROM node:18-alpine

# Установка зависимостей для sharp и других нативных модулей
RUN apk add --no-cache \
    vips-dev \
    python3 \
    make \
    g++

# Создание директории приложения
WORKDIR /app

# Копирование package.json и package-lock.json
COPY package*.json ./

# Установка зависимостей
RUN npm ci --only=production

# Копирование исходного кода
COPY . .

# Создание пользователя для безопасности
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodeuser -u 1001

# Изменение владельца файлов
RUN chown -R nodeuser:nodejs /app
USER nodeuser

# Открытие порта
EXPOSE 3001

# Команда для запуска
CMD ["npm", "start"]