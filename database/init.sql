-- NutriAI Database Schema
-- Создание базы данных
CREATE DATABASE nutriai;

-- Подключение к базе данных nutriai
\c nutriai;

-- Создание расширений
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Пользователи Telegram
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(100),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    language_code VARCHAR(10) DEFAULT 'ru',
    is_premium BOOLEAN DEFAULT FALSE,
    premium_until TIMESTAMP,
    daily_photo_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Профили питания
CREATE TABLE nutrition_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    age INTEGER,
    gender VARCHAR(10), -- male, female, other
    height INTEGER, -- в см
    weight DECIMAL(5,2), -- в кг
    activity_level VARCHAR(20), -- sedentary, light, moderate, active, very_active
    goal VARCHAR(20), -- lose, maintain, gain
    daily_calories INTEGER,
    daily_proteins INTEGER,
    daily_fats INTEGER,
    daily_carbs INTEGER,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- База продуктов
CREATE TABLE food_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    name_ru VARCHAR(200),
    brand VARCHAR(100),
    barcode VARCHAR(50),
    category VARCHAR(50),
    nutrients JSONB NOT NULL, -- {calories, proteins, fats, carbs, fiber, sugar, sodium}
    serving_sizes JSONB, -- [{"amount": 100, "unit": "g"}, {"amount": 1, "unit": "cup"}]
    is_verified BOOLEAN DEFAULT FALSE,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для быстрого поиска
CREATE INDEX idx_food_name ON food_items USING GIN (to_tsvector('russian', name_ru));
CREATE INDEX idx_food_barcode ON food_items(barcode);
CREATE INDEX idx_food_category ON food_items(category);

-- Приемы пищи
CREATE TABLE meals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    meal_type VARCHAR(20) NOT NULL, -- breakfast, lunch, dinner, snack
    consumed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    photo_url TEXT,
    ai_recognized BOOLEAN DEFAULT FALSE,
    confidence_score DECIMAL(3,2),
    total_calories INTEGER DEFAULT 0,
    total_proteins DECIMAL(5,2) DEFAULT 0,
    total_fats DECIMAL(5,2) DEFAULT 0,
    total_carbs DECIMAL(5,2) DEFAULT 0
);

-- Состав приемов пищи
CREATE TABLE meal_items (
    id SERIAL PRIMARY KEY,
    meal_id INTEGER REFERENCES meals(id) ON DELETE CASCADE,
    food_id INTEGER REFERENCES food_items(id),
    quantity DECIMAL(6,2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    calories INTEGER,
    proteins DECIMAL(5,2),
    fats DECIMAL(5,2),
    carbs DECIMAL(5,2)
);

-- AI распознавания
CREATE TABLE ai_recognitions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    photo_url TEXT NOT NULL,
    recognized_items JSONB,
    confidence_score DECIMAL(3,2),
    processing_time_ms INTEGER,
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Рекомендации AI
CREATE TABLE ai_recommendations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50), -- daily_summary, meal_suggestion, nutrient_alert
    content TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Подписки
CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, -- monthly, yearly, lifetime
    status VARCHAR(20) NOT NULL, -- active, cancelled, expired
    started_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP,
    payment_method VARCHAR(50),
    amount DECIMAL(10,2),
    telegram_payment_charge_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Использование премиум функций
CREATE TABLE premium_usage (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    feature VARCHAR(50), -- photo_recognition, ai_advisor, family_profiles
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    daily_count INTEGER DEFAULT 1
);

-- Таблица для отслеживания дневной статистики
CREATE TABLE daily_stats (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_calories INTEGER DEFAULT 0,
    total_proteins DECIMAL(5,2) DEFAULT 0,
    total_fats DECIMAL(5,2) DEFAULT 0,
    total_carbs DECIMAL(5,2) DEFAULT 0,
    meals_count INTEGER DEFAULT 0,
    photos_taken INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
);

-- Функция обновления времени
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггеры для автоматического обновления updated_at
CREATE TRIGGER update_nutrition_profiles_updated_at
    BEFORE UPDATE ON nutrition_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Функция для обновления last_active пользователя
CREATE OR REPLACE FUNCTION update_user_last_active()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер для обновления last_active при активности
CREATE TRIGGER update_user_activity_on_meal
    AFTER INSERT ON meals
    FOR EACH ROW
    EXECUTE FUNCTION update_user_last_active();

-- Начальные данные: популярные продукты
INSERT INTO food_items (name, name_ru, category, nutrients, serving_sizes, is_verified) VALUES 
('Chicken Breast', 'Куриная грудка', 'meat', '{"calories": 165, "proteins": 31, "fats": 3.6, "carbs": 0, "fiber": 0, "sugar": 0}', '[{"amount": 100, "unit": "г"}]', true),
('White Rice', 'Рис белый', 'grains', '{"calories": 130, "proteins": 2.7, "fats": 0.3, "carbs": 28, "fiber": 0.4, "sugar": 0.1}', '[{"amount": 100, "unit": "г"}, {"amount": 150, "unit": "порция"}]', true),
('Apple', 'Яблоко', 'fruits', '{"calories": 52, "proteins": 0.3, "fats": 0.2, "carbs": 14, "fiber": 2.4, "sugar": 10}', '[{"amount": 100, "unit": "г"}, {"amount": 1, "unit": "шт"}]', true),
('Banana', 'Банан', 'fruits', '{"calories": 89, "proteins": 1.1, "fats": 0.3, "carbs": 23, "fiber": 2.6, "sugar": 12}', '[{"amount": 100, "unit": "г"}, {"amount": 1, "unit": "шт"}]', true),
('Eggs', 'Яйца куриные', 'protein', '{"calories": 155, "proteins": 13, "fats": 11, "carbs": 1.1, "fiber": 0, "sugar": 1.1}', '[{"amount": 100, "unit": "г"}, {"amount": 1, "unit": "шт"}]', true);

-- Представление для статистики пользователей
CREATE VIEW user_stats AS
SELECT 
    u.id,
    u.telegram_id,
    u.username,
    u.is_premium,
    COUNT(m.id) as total_meals,
    AVG(m.total_calories) as avg_daily_calories,
    MAX(m.consumed_at) as last_meal_date
FROM users u
LEFT JOIN meals m ON u.id = m.user_id
GROUP BY u.id, u.telegram_id, u.username, u.is_premium;