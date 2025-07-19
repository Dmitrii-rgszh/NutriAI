const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const { authenticateToken, checkPhotoLimit } = require('../middleware/auth');
const { foodHelpers, query } = require('../config/database');
const aiService = require('../services/aiService');

const router = express.Router();

// 📁 Configure multer for image uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// 🤖 POST /api/food/recognize - AI food recognition
router.post('/recognize', authenticateToken, checkPhotoLimit, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: 'No image file provided',
                message: 'Please upload an image file'
            });
        }
        
        const startTime = Date.now();
        
        // Optimize image with Sharp
        const optimizedImage = await sharp(req.file.buffer)
            .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 85 })
            .toBuffer();
        
        console.log(`📸 Processing image for user ${req.user.id} (${req.user.first_name})`);
        
        // Process with AI service
        const recognitionResult = await aiService.recognizeFood(optimizedImage);
        
        const processingTime = Date.now() - startTime;
        
        // Save recognition to database
        const savedRecognition = await query(`
            INSERT INTO ai_recognitions (user_id, photo_url, recognized_items, confidence_score, processing_time_ms)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, processed_at
        `, [
            req.user.id,
            `recognition_${Date.now()}.jpg`, // В реальном проекте сохранять в S3/CloudFlare
            JSON.stringify(recognitionResult),
            recognitionResult.total_confidence,
            processingTime
        ]);
        
        console.log(`✅ AI recognition completed in ${processingTime}ms for user ${req.user.id}`);
        
        res.json({
            success: true,
            recognition_id: savedRecognition.rows[0].id,
            items: recognitionResult.items,
            confidence: recognitionResult.total_confidence,
            processing_time_ms: processingTime,
            processed_at: savedRecognition.rows[0].processed_at,
            usage: req.photoUsage // Free user limits info
        });
        
    } catch (error) {
        console.error('Food recognition error:', error);
        
        if (error.message.includes('AI service')) {
            return res.status(503).json({
                error: 'AI service temporarily unavailable',
                message: 'Please try again in a few moments',
                retry_after: 30
            });
        }
        
        res.status(500).json({
            error: 'Food recognition failed',
            message: error.message
        });
    }
});

// 🔍 GET /api/food/search - Search food database
router.get('/search', authenticateToken, async (req, res) => {
    try {
        const { q: query, limit = 10 } = req.query;
        
        if (!query || query.trim().length < 2) {
            return res.status(400).json({
                error: 'Invalid search query',
                message: 'Query must be at least 2 characters long'
            });
        }
        
        const limitNum = Math.min(parseInt(limit) || 10, 50); // Max 50 results
        
        // Search in database
        const foods = await foodHelpers.search(query.trim(), limitNum);
        
        console.log(`🔍 Food search: "${query}" returned ${foods.length} results for user ${req.user.id}`);
        
        res.json({
            success: true,
            query: query.trim(),
            results: foods.map(food => ({
                id: food.id,
                name: food.name_ru || food.name,
                name_en: food.name,
                category: food.category,
                nutrients: food.nutrients,
                serving_sizes: food.serving_sizes,
                calories_per_100g: food.nutrients.calories
            })),
            total: foods.length,
            limit: limitNum
        });
        
    } catch (error) {
        console.error('Food search error:', error);
        res.status(500).json({
            error: 'Search failed',
            message: error.message
        });
    }
});

// 📝 GET /api/food/:id - Get specific food item
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                error: 'Invalid food ID'
            });
        }
        
        const food = await foodHelpers.getById(parseInt(id));
        
        if (!food) {
            return res.status(404).json({
                error: 'Food item not found'
            });
        }
        
        res.json({
            success: true,
            food: {
                id: food.id,
                name: food.name_ru || food.name,
                name_en: food.name,
                brand: food.brand,
                category: food.category,
                nutrients: food.nutrients,
                serving_sizes: food.serving_sizes,
                is_verified: food.is_verified,
                created_at: food.created_at
            }
        });
        
    } catch (error) {
        console.error('Get food error:', error);
        res.status(500).json({
            error: 'Failed to get food item'
        });
    }
});

// 📊 GET /api/food/popular - Get popular food items
router.get('/popular', authenticateToken, async (req, res) => {
    try {
        const { limit = 20 } = req.query;
        const limitNum = Math.min(parseInt(limit) || 20, 50);
        
        const popularFoods = await query(`
            SELECT 
                f.id,
                f.name,
                f.name_ru,
                f.category,
                f.nutrients,
                f.serving_sizes,
                COUNT(mi.id) as usage_count
            FROM food_items f
            LEFT JOIN meal_items mi ON f.id = mi.food_id
            WHERE f.is_verified = true
            GROUP BY f.id
            ORDER BY usage_count DESC, f.name_ru ASC
            LIMIT $1
        `, [limitNum]);
        
        res.json({
            success: true,
            popular_foods: popularFoods.rows.map(food => ({
                id: food.id,
                name: food.name_ru || food.name,
                name_en: food.name,
                category: food.category,
                nutrients: food.nutrients,
                serving_sizes: food.serving_sizes,
                usage_count: parseInt(food.usage_count)
            })),
            total: popularFoods.rows.length
        });
        
    } catch (error) {
        console.error('Popular foods error:', error);
        res.status(500).json({
            error: 'Failed to get popular foods'
        });
    }
});

// 🏷️ GET /api/food/categories - Get food categories
router.get('/categories', authenticateToken, async (req, res) => {
    try {
        const categories = await query(`
            SELECT 
                category,
                COUNT(*) as food_count
            FROM food_items 
            WHERE category IS NOT NULL
            GROUP BY category
            ORDER BY food_count DESC
        `);
        
        res.json({
            success: true,
            categories: categories.rows.map(cat => ({
                name: cat.category,
                count: parseInt(cat.food_count)
            }))
        });
        
    } catch (error) {
        console.error('Categories error:', error);
        res.status(500).json({
            error: 'Failed to get categories'
        });
    }
});

// ➕ POST /api/food/add - Add custom food item (for premium users)
router.post('/add', authenticateToken, async (req, res) => {
    try {
        const { name, name_ru, category, nutrients, serving_sizes } = req.body;
        
        // Validate required fields
        if (!name || !nutrients) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['name', 'nutrients']
            });
        }
        
        // Validate nutrients structure
        const requiredNutrients = ['calories', 'proteins', 'fats', 'carbs'];
        for (const nutrient of requiredNutrients) {
            if (typeof nutrients[nutrient] !== 'number') {
                return res.status(400).json({
                    error: `Invalid nutrient value: ${nutrient}`
                });
            }
        }
        
        // Add food item
        const result = await query(`
            INSERT INTO food_items (name, name_ru, category, nutrients, serving_sizes, created_by)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [name, name_ru || name, category, JSON.stringify(nutrients), JSON.stringify(serving_sizes), req.user.id]);
        
        const newFood = result.rows[0];
        
        console.log(`➕ User ${req.user.id} added custom food: ${name}`);
        
        res.status(201).json({
            success: true,
            message: 'Food item added successfully',
            food: {
                id: newFood.id,
                name: newFood.name_ru || newFood.name,
                name_en: newFood.name,
                category: newFood.category,
                nutrients: newFood.nutrients,
                serving_sizes: newFood.serving_sizes
            }
        });
        
    } catch (error) {
        console.error('Add food error:', error);
        res.status(500).json({
            error: 'Failed to add food item'
        });
    }
});

module.exports = router;