NutriAI - Инструкция для Claude (AI Assistant)
🤖 О чем этот документ
Это специальная инструкция для тебя, Claude, чтобы ты мог эффективно помогать в разработке NutriAI. Здесь собрана вся необходимая информация о проекте, архитектуре, технологиях и принятых решениях.
📋 Контекст проекта
Что такое NutriAI

Telegram Mini App для автоматического подсчета калорий через распознавание еды по фото
Основная ценность: экономия 5-10 минут времени пользователя на каждый прием пищи
Целевая аудитория: русскоязычные пользователи 25-45 лет, следящие за питанием
Монетизация: Freemium модель ($3.99/месяц за премиум)

Ключевые особенности

AI распознавание - главная фича, использует Claude Vision API
300k+ продуктов в базе через USDA API + локальная база
Персонализация - индивидуальные рекомендации и цели
Красивый UI - темная тема, glassmorphism, плавные анимации

🛠 Технический стек
Backend

Runtime: Node.js 18+ с Express.js
База данных: PostgreSQL 14+ (основная), Redis (кеширование)
AI: Claude Vision API для распознавания, Claude Haiku для рекомендаций
APIs: USDA FoodData Central, API Ninjas Nutrition, FatSecret Platform
Файлы: Sharp для обработки изображений, Multer для загрузки

Frontend

Framework: React 18 с TypeScript (опционально)
State: Zustand для глобального состояния, React Query для API
UI: Tailwind CSS + custom CSS с анимациями
Анимации: Framer Motion, particles.js для фона
Telegram: @telegram-apps/sdk-react

Инфраструктура

Контейнеризация: Docker + Docker Compose
Хостинг: cloud.ru (Ubuntu 22.04)
Reverse Proxy: Nginx с SSL (Let's Encrypt)
CI/CD: GitHub Actions (планируется)

📁 Структура проекта
nutriai/
├── client/                 # React приложение
│   ├── src/
│   │   ├── components/    # UI компоненты
│   │   ├── hooks/         # Кастомные хуки
│   │   ├── services/      # API клиенты
│   │   ├── stores/        # Zustand сторы
│   │   ├── styles/        # CSS файлы
│   │   └── utils/         # Вспомогательные функции
│   └── public/
├── server/                # Node.js API
│   ├── config/           # Конфигурация БД, Telegram
│   ├── controllers/      # Бизнес-логика endpoints
│   ├── middleware/       # Auth, rate limiting, etc
│   ├── models/          # Модели данных
│   ├── routes/          # API маршруты
│   └── services/        # AI, внешние API
├── database/            # PostgreSQL
│   ├── init.sql        # Начальная схема
│   └── migrations/     # Миграции
└── docker-compose.yml  # Оркестрация контейнеров
🔑 Важные архитектурные решения
1. AI распознавание еды

Фото оптимизируется до 1024x1024 через Sharp
Отправляется в Claude Vision API с промптом для JSON ответа
Результат обогащается данными о нутриентах из USDA
Fallback на локальную базу если USDA недоступен

2. База данных

JSONB для гибкого хранения nutrients и metadata
Индексы на поиск продуктов (GIN для полнотекстового поиска)
Materialized Views для статистики (обновляются раз в час)
Транзакции для критичных операций (начисление премиума)

3. Безопасность

JWT токены с Telegram user data
Rate limiting на AI endpoints (5 req/min)
Валидация всех входных данных
HTTPS only в продакшене

4. Оптимизация

Кеширование результатов распознавания на 24 часа
Lazy loading изображений в дневнике
Batch запросы для множественных продуктов
Service Worker для офлайн режима (планируется)

💻 Рабочий процесс разработки
Локальная разработка
bash# 1. Запуск БД
docker-compose up postgres

# 2. Запуск сервера (в отдельном терминале)
cd server && npm run dev

# 3. Запуск клиента (в отдельном терминале)  
cd client && npm start

# 4. Открыть http://localhost:3000
Добавление новой функции

Создать feature branch: git checkout -b feature/название
Обновить схему БД если нужно (создать миграцию)
Добавить API endpoint в server/routes
Реализовать UI компонент в client/src/components
Написать тесты (Jest для сервера, RTL для клиента)
Обновить документацию
Создать Pull Request

Debugging подсказки

Логи Docker: docker-compose logs -f [service]
БД запросы: включить DEBUG=pg:* в .env
Network: использовать вкладку Network в DevTools
React: установить React DevTools extension

🎨 UI/UX принципы
Дизайн система

Цветовая схема
Primary:
#10B981
(зеленый, здоровье)
Secondary:
#6366F1
(фиолетовый, AI)
Background:
#0F172A
(темный режим)
Surface:
#1E293B
Text:
#F8FAFC
Шрифты: Inter для UI, моноширинный для цифр
Отступы: 8px сетка (8, 16, 24, 32, etc)
Радиусы: 12px для карточек, 8px для кнопок
Тени: Многослойные для глубины

Анимации

Микроанимации: Все интерактивные элементы
Переходы: 300ms ease для большинства
Skeleton screens: При загрузке данных
Framer Motion для плавных переходов
Lottie для микроанимаций
CSS animations для фоновых эффектов
Haptic feedback: На мобильных при важных действиях

Паттерны

Empty states: Дружелюбные иллюстрации
Error handling: Inline сообщения, не модалки
Loading: Прогресс индикаторы для долгих операций
Success: Зеленые тосты сверху

Архитектурные решения
Frontend
React Query для кеширования
Zustand для состояния
React Hook Form для форм
Telegram WebApp SDK
Backend
Express.js с async/await
JWT для сессий
Multer для загрузки фото
Queue для обработки AI
База данных
PostgreSQL с JSONB для гибкости
Индексы на частые запросы
Materialized views для статистики
Разработка новых фич
При добавлении функционала следуйте:
1.
Создайте feature branch
2.
Обновите API документацию
3.
Напишите тесты
4.
Обновите README
5.
Создайте Pull Request

🚀 Состояние разработки
✅ Готово

Структура проекта
Схема БД
Базовая архитектура
Дизайн система

🚧 В процессе

Интеграция OpenAI API
UI компоненты (Camera, Dashboard)
Telegram авторизация

📋 TODO

 Платежи через Telegram Stars либо через электронную кассовую платформу robokassa
 Push уведомления
 Семейные профили
 Экспорт данных
 A/B тестирование
 Реферальная программа

📊 API Endpoints
Готовые
POST   /api/auth/telegram      - Авторизация
GET    /api/user/profile       - Профиль пользователя
POST   /api/food/recognize     - Распознать еду по фото
GET    /api/food/search        - Поиск продуктов
POST   /api/meals              - Добавить прием пищи
GET    /api/meals/today        - Дневник за сегодня
GET    /api/stats/daily        - Статистика дня
Планируемые
GET    /api/recommendations    - AI рекомендации
POST   /api/subscription/buy   - Покупка премиума
GET    /api/family/members     - Семейные профили
POST   /api/export/pdf         - Экспорт в PDF
🐛 Известные проблемы

CORS в Telegram WebApp - использовать proxy в development
Размер фото - ограничить до 5MB на клиенте
Таймзоны - всегда использовать UTC в БД
Память - очищать blob URLs после использования

💡 Полезные сниппеты
Обработка ошибок API
javascripttry {
  const result = await apiCall();
  return { data: result, error: null };
} catch (error) {
  console.error('API Error:', error);
  toast.error('Что-то пошло не так');
  return { data: null, error: error.message };
}
Оптимизация изображений
javascriptconst optimizeImage = async (file) => {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1024,
    useWebWorker: true
  };
  return await imageCompression(file, options);
};
Дебаунс для поиска
javascriptconst debouncedSearch = useMemo(
  () => debounce((query) => searchProducts(query), 300),
  []
);
📚 Ресурсы
Документация

Telegram Mini Apps
Claude API
USDA API

Дизайн референсы

MyFitnessPal - UX
Yuka - Сканирование
Lifesum - Визуализация

❓ Частые вопросы при разработке
Q: Как тестировать Telegram авторизацию локально?
A: Использовать ngrok для HTTPS туннеля: ngrok http 3000
Q: Почему выбран Claude API а не GPT-4 Vision?
A: Лучшее качество распознавания еды, особенно блюд СНГ кухни
Q: Как обрабатывать оффлайн режим?
A: Service Worker + IndexedDB для кеширования последних приемов пищи
Q: Оптимальный размер батча для импорта продуктов?
A: 100 записей за раз чтобы не блокировать БД
🎯 Метрики успеха MVP

Технические

Время распознавания < 3 сек
Точность распознавания > 85%
Uptime > 99.5%


Продуктовые

Conversion to trial > 30%
Trial to paid > 25%
DAU/MAU > 40%


Бизнес

CAC < $2
LTV > $15
Payback < 3 месяца



🤝 Как помогать эффективно
Когда разработчик просит помощи:

Уточни контекст - в каком файле работаем, что уже готово
Предложи решение - с учетом существующей архитектуры
Дай готовый код - который можно скопировать и использовать
Объясни почему - какие есть альтернативы и трейдоффы
Проверь edge cases - что может пойти не так

Помни: цель - запустить рабочий MVP за 8 недель, поэтому приоритет на простых и проверенных решениях, а не на идеальной архитектуре.

Последнее обновление: создание проекта
Версия: 1.0.0