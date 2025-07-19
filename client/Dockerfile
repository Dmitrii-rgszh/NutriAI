FROM node:18-alpine

# Установка зависимостей
WORKDIR /app

# Копирование package.json
COPY package*.json ./

# Установка зависимостей
RUN npm ci

# Копирование исходного кода
COPY . .

# Создание пользователя
RUN addgroup -g 1001 -S nodejs
RUN adduser -S reactuser -u 1001

# Изменение владельца
RUN chown -R reactuser:nodejs /app
USER reactuser

# Открытие порта
EXPOSE 3000

# Команда для разработки
CMD ["npm", "start"]