const { Pool } = require('pg');

// 🗄️ PostgreSQL connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20, // максимум подключений
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// 🔌 Test database connection
async function connectDB() {
    try {
        const client = await pool.connect();
        console.log('✅ Connected to PostgreSQL');
        
        // Test query
        const res = await client.query('SELECT NOW() as current_time, version() as db_version');
        console.log('📅 Database time:', res.rows[0].current_time);
        console.log('🔢 PostgreSQL version:', res.rows[0].db_version.split(' ')[0]);
        
        client.release();
    } catch (err) {
        console.error('❌ Database connection error:', err);
        throw err;
    }
}

// 🔄 Helper function for transactions
async function withTransaction(callback) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

// 📊 Helper function to get database stats
async function getDBStats() {
    try {
        const result = await pool.query(`
            SELECT 
                schemaname,
                tablename,
                n_tup_ins as inserts,
                n_tup_upd as updates,
                n_tup_del as deletes
            FROM pg_stat_user_tables 
            ORDER BY n_tup_ins DESC;
        `);
        return result.rows;
    } catch (error) {
        console.error('Error getting DB stats:', error);
        return [];
    }
}

// 🔍 Helper function for safe queries with error handling
async function safeQuery(text, params = []) {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        
        // Log slow queries (>1000ms)
        if (duration > 1000) {
            console.warn(`⚠️ Slow query (${duration}ms):`, text.substring(0, 100));
        }
        
        return result;
    } catch (error) {
        console.error('Database query error:', error);
        console.error('Query:', text);
        console.error('Params:', params);
        throw error;
    }
}

// 👤 User-related database helpers
const userHelpers = {
    // Find user by Telegram ID
    async findByTelegramId(telegramId) {
        const result = await safeQuery(
            'SELECT * FROM users WHERE telegram_id = $1',
            [telegramId]
        );
        return result.rows[0];
    },
    
    // Create new user
    async create(userData) {
        const { telegram_id, username, first_name, last_name, language_code } = userData;
        const result = await safeQuery(`
            INSERT INTO users (telegram_id, username, first_name, last_name, language_code)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, [telegram_id, username, first_name, last_name, language_code || 'ru']);
        return result.rows[0];
    },
    
    // Update last active timestamp
    async updateLastActive(userId) {
        await safeQuery(
            'UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = $1',
            [userId]
        );
    }
};

// 🍽️ Food-related database helpers
const foodHelpers = {
    // Search food items
    async search(query, limit = 10) {
        const result = await safeQuery(`
            SELECT id, name, name_ru, category, nutrients, serving_sizes
            FROM food_items 
            WHERE to_tsvector('russian', name_ru) @@ plainto_tsquery('russian', $1)
               OR name_ru ILIKE $2
               OR name ILIKE $2
            ORDER BY 
                CASE WHEN name_ru ILIKE $3 THEN 1 ELSE 2 END,
                name_ru
            LIMIT $4
        `, [query, `%${query}%`, `${query}%`, limit]);
        return result.rows;
    },
    
    // Get food by ID
    async getById(id) {
        const result = await safeQuery(
            'SELECT * FROM food_items WHERE id = $1',
            [id]
        );
        return result.rows[0];
    }
};

// 🥗 Meal-related database helpers  
const mealHelpers = {
    // Get today's meals for user
    async getTodaysMeals(userId) {
        const result = await safeQuery(`
            SELECT m.*, 
                   json_agg(
                       json_build_object(
                           'id', mi.id,
                           'food_name', f.name_ru,
                           'quantity', mi.quantity,
                           'unit', mi.unit,
                           'calories', mi.calories,
                           'proteins', mi.proteins,
                           'fats', mi.fats,
                           'carbs', mi.carbs
                       )
                   ) as items
            FROM meals m
            LEFT JOIN meal_items mi ON m.id = mi.meal_id
            LEFT JOIN food_items f ON mi.food_id = f.id
            WHERE m.user_id = $1 
              AND DATE(m.consumed_at) = CURRENT_DATE
            GROUP BY m.id
            ORDER BY m.consumed_at DESC
        `, [userId]);
        return result.rows;
    },
    
    // Add new meal with items
    async addMeal(userId, mealData) {
        return await withTransaction(async (client) => {
            // Create meal
            const mealResult = await client.query(`
                INSERT INTO meals (user_id, meal_type, photo_url, ai_recognized, confidence_score)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `, [userId, mealData.meal_type, mealData.photo_url, mealData.ai_recognized, mealData.confidence_score]);
            
            const meal = mealResult.rows[0];
            
            // Add meal items
            let totalCalories = 0, totalProteins = 0, totalFats = 0, totalCarbs = 0;
            
            for (const item of mealData.items) {
                await client.query(`
                    INSERT INTO meal_items (meal_id, food_id, quantity, unit, calories, proteins, fats, carbs)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                `, [meal.id, item.food_id, item.quantity, item.unit, item.calories, item.proteins, item.fats, item.carbs]);
                
                totalCalories += item.calories;
                totalProteins += item.proteins;
                totalFats += item.fats;
                totalCarbs += item.carbs;
            }
            
            // Update meal totals
            await client.query(`
                UPDATE meals 
                SET total_calories = $1, total_proteins = $2, total_fats = $3, total_carbs = $4
                WHERE id = $5
            `, [totalCalories, totalProteins, totalFats, totalCarbs, meal.id]);
            
            return { ...meal, total_calories: totalCalories, total_proteins: totalProteins, total_fats: totalFats, total_carbs: totalCarbs };
        });
    }
};

module.exports = {
    pool,
    connectDB,
    withTransaction,
    getDBStats,
    query: safeQuery,
    userHelpers,
    foodHelpers,
    mealHelpers
};