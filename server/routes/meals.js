const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { mealHelpers, query } = require('../config/database');

const router = express.Router();

// 🥗 POST /api/meals - Add new meal
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { meal_type, items, photo_url, ai_recognized, confidence_score } = req.body;
        
        // Validate required fields
        if (!meal_type || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['meal_type', 'items (array)']
            });
        }
        
        // Validate meal type
        const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
        if (!validMealTypes.includes(meal_type)) {
            return res.status(400).json({
                error: 'Invalid meal_type',
                valid_types: validMealTypes
            });
        }
        
        // Validate items structure
        for (const item of items) {
            if (!item.food_id || !item.quantity || !item.unit) {
                return res.status(400).json({
                    error: 'Invalid item structure',
                    required_fields: ['food_id', 'quantity', 'unit'],
                    example: {
                        food_id: 1,
                        quantity: 100,
                        unit: "г",
                        calories: 165,
                        proteins: 31,
                        fats: 3.6,
                        carbs: 0
                    }
                });
            }
        }
        
        // Create meal with items
        const meal = await mealHelpers.addMeal(req.user.id, {
            meal_type,
            items,
            photo_url,
            ai_recognized: ai_recognized || false,
            confidence_score: confidence_score || null
        });
        
        console.log(`🍽️ User ${req.user.id} added ${meal_type} with ${items.length} items`);
        
        res.status(201).json({
            success: true,
            message: 'Meal added successfully',
            meal: {
                id: meal.id,
                meal_type: meal.meal_type,
                consumed_at: meal.consumed_at,
                total_calories: meal.total_calories,
                total_proteins: meal.total_proteins,
                total_fats: meal.total_fats,
                total_carbs: meal.total_carbs,
                ai_recognized: meal.ai_recognized,
                confidence_score: meal.confidence_score
            }
        });
        
    } catch (error) {
        console.error('Add meal error:', error);
        
        if (error.code === '23503') { // Foreign key violation
            return res.status(400).json({
                error: 'Invalid food_id in items',
                message: 'One or more food items do not exist'
            });
        }
        
        res.status(500).json({
            error: 'Failed to add meal',
            message: error.message
        });
    }
});

// 📅 GET /api/meals/today - Get today's meals
router.get('/today', authenticateToken, async (req, res) => {
    try {
        const meals = await mealHelpers.getTodaysMeals(req.user.id);
        
        // Calculate daily totals
        const dailyTotals = meals.reduce((totals, meal) => ({
            calories: totals.calories + (meal.total_calories || 0),
            proteins: totals.proteins + (meal.total_proteins || 0),
            fats: totals.fats + (meal.total_fats || 0),
            carbs: totals.carbs + (meal.total_carbs || 0)
        }), { calories: 0, proteins: 0, fats: 0, carbs: 0 });
        
        // Group meals by type
        const mealsByType = {
            breakfast: meals.filter(m => m.meal_type === 'breakfast'),
            lunch: meals.filter(m => m.meal_type === 'lunch'),
            dinner: meals.filter(m => m.meal_type === 'dinner'),
            snack: meals.filter(m => m.meal_type === 'snack')
        };
        
        res.json({
            success: true,
            date: new Date().toISOString().split('T')[0],
            meals: meals.map(meal => ({
                id: meal.id,
                meal_type: meal.meal_type,
                consumed_at: meal.consumed_at,
                photo_url: meal.photo_url,
                ai_recognized: meal.ai_recognized,
                confidence_score: meal.confidence_score,
                totals: {
                    calories: meal.total_calories,
                    proteins: meal.total_proteins,
                    fats: meal.total_fats,
                    carbs: meal.total_carbs
                },
                items: meal.items ? JSON.parse(meal.items) : []
            })),
            meals_by_type: mealsByType,
            daily_totals: {
                calories: Math.round(dailyTotals.calories),
                proteins: Math.round(dailyTotals.proteins * 10) / 10,
                fats: Math.round(dailyTotals.fats * 10) / 10,
                carbs: Math.round(dailyTotals.carbs * 10) / 10
            },
            meal_count: meals.length
        });
        
    } catch (error) {
        console.error('Get today meals error:', error);
        res.status(500).json({
            error: 'Failed to get today\'s meals'
        });
    }
});

// 📊 GET /api/meals/history - Get meal history
router.get('/history', authenticateToken, async (req, res) => {
    try {
        const { days = 7, page = 1, limit = 20 } = req.query;
        
        const daysNum = Math.min(parseInt(days) || 7, 30); // Max 30 days
        const pageNum = Math.max(parseInt(page) || 1, 1);
        const limitNum = Math.min(parseInt(limit) || 20, 100); // Max 100 per page
        const offset = (pageNum - 1) * limitNum;
        
        const meals = await query(`
            SELECT 
                m.*,
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
              AND m.consumed_at > NOW() - INTERVAL '${daysNum} days'
            GROUP BY m.id
            ORDER BY m.consumed_at DESC
            LIMIT $2 OFFSET $3
        `, [req.user.id, limitNum, offset]);
        
        // Get total count for pagination
        const countResult = await query(`
            SELECT COUNT(*) as total
            FROM meals 
            WHERE user_id = $1 
              AND consumed_at > NOW() - INTERVAL '${daysNum} days'
        `, [req.user.id]);
        
        const total = parseInt(countResult.rows[0].total);
        const totalPages = Math.ceil(total / limitNum);
        
        res.json({
            success: true,
            meals: meals.rows.map(meal => ({
                id: meal.id,
                meal_type: meal.meal_type,
                consumed_at: meal.consumed_at,
                photo_url: meal.photo_url,
                ai_recognized: meal.ai_recognized,
                confidence_score: meal.confidence_score,
                totals: {
                    calories: meal.total_calories,
                    proteins: meal.total_proteins,
                    fats: meal.total_fats,
                    carbs: meal.total_carbs
                },
                items: meal.items ? JSON.parse(meal.items) : []
            })),
            pagination: {
                current_page: pageNum,
                total_pages: totalPages,
                total_items: total,
                items_per_page: limitNum,
                has_next: pageNum < totalPages,
                has_prev: pageNum > 1
            },
            period: {
                days: daysNum,
                from: new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                to: new Date().toISOString().split('T')[0]
            }
        });
        
    } catch (error) {
        console.error('Get meal history error:', error);
        res.status(500).json({
            error: 'Failed to get meal history'
        });
    }
});

// 🗑️ DELETE /api/meals/:id - Delete meal
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                error: 'Invalid meal ID'
            });
        }
        
        // Check if meal belongs to user
        const mealCheck = await query(
            'SELECT id, user_id FROM meals WHERE id = $1',
            [parseInt(id)]
        );
        
        if (mealCheck.rows.length === 0) {
            return res.status(404).json({
                error: 'Meal not found'
            });
        }
        
        if (mealCheck.rows[0].user_id !== req.user.id) {
            return res.status(403).json({
                error: 'Access denied',
                message: 'You can only delete your own meals'
            });
        }
        
        // Delete meal (cascade will delete meal_items)
        await query('DELETE FROM meals WHERE id = $1', [parseInt(id)]);
        
        console.log(`🗑️ User ${req.user.id} deleted meal ${id}`);
        
        res.json({
            success: true,
            message: 'Meal deleted successfully',
            meal_id: parseInt(id)
        });
        
    } catch (error) {
        console.error('Delete meal error:', error);
        res.status(500).json({
            error: 'Failed to delete meal'
        });
    }
});

// ✏️ PUT /api/meals/:id - Update meal
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { meal_type, items } = req.body;
        
        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                error: 'Invalid meal ID'
            });
        }
        
        // Check if meal belongs to user
        const mealCheck = await query(
            'SELECT id, user_id FROM meals WHERE id = $1',
            [parseInt(id)]
        );
        
        if (mealCheck.rows.length === 0) {
            return res.status(404).json({
                error: 'Meal not found'
            });
        }
        
        if (mealCheck.rows[0].user_id !== req.user.id) {
            return res.status(403).json({
                error: 'Access denied',
                message: 'You can only update your own meals'
            });
        }
        
        // Update meal in transaction
        const { withTransaction } = require('../config/database');
        
        const updatedMeal = await withTransaction(async (client) => {
            // Update meal type if provided
            if (meal_type) {
                const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
                if (!validMealTypes.includes(meal_type)) {
                    throw new Error('Invalid meal_type');
                }
                
                await client.query(
                    'UPDATE meals SET meal_type = $1 WHERE id = $2',
                    [meal_type, parseInt(id)]
                );
            }
            
            // Update items if provided
            if (items && Array.isArray(items)) {
                // Delete existing items
                await client.query('DELETE FROM meal_items WHERE meal_id = $1', [parseInt(id)]);
                
                // Add new items and calculate totals
                let totalCalories = 0, totalProteins = 0, totalFats = 0, totalCarbs = 0;
                
                for (const item of items) {
                    if (!item.food_id || !item.quantity || !item.unit) {
                        throw new Error('Invalid item structure');
                    }
                    
                    await client.query(`
                        INSERT INTO meal_items (meal_id, food_id, quantity, unit, calories, proteins, fats, carbs)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    `, [parseInt(id), item.food_id, item.quantity, item.unit, 
                        item.calories, item.proteins, item.fats, item.carbs]);
                    
                    totalCalories += item.calories || 0;
                    totalProteins += item.proteins || 0;
                    totalFats += item.fats || 0;
                    totalCarbs += item.carbs || 0;
                }
                
                // Update meal totals
                await client.query(`
                    UPDATE meals 
                    SET total_calories = $1, total_proteins = $2, total_fats = $3, total_carbs = $4
                    WHERE id = $5
                `, [totalCalories, totalProteins, totalFats, totalCarbs, parseInt(id)]);
            }
            
            // Return updated meal
            const result = await client.query('SELECT * FROM meals WHERE id = $1', [parseInt(id)]);
            return result.rows[0];
        });
        
        console.log(`✏️ User ${req.user.id} updated meal ${id}`);
        
        res.json({
            success: true,
            message: 'Meal updated successfully',
            meal: {
                id: updatedMeal.id,
                meal_type: updatedMeal.meal_type,
                consumed_at: updatedMeal.consumed_at,
                total_calories: updatedMeal.total_calories,
                total_proteins: updatedMeal.total_proteins,
                total_fats: updatedMeal.total_fats,
                total_carbs: updatedMeal.total_carbs
            }
        });
        
    } catch (error) {
        console.error('Update meal error:', error);
        res.status(500).json({
            error: 'Failed to update meal',
            message: error.message
        });
    }
});

// 📈 GET /api/meals/summary - Get meals summary for date range
router.get('/summary', authenticateToken, async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        
        // Default to last 7 days if no dates provided
        const endDate = end_date ? new Date(end_date) : new Date();
        const startDate = start_date ? new Date(start_date) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        
        // Validate dates
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return res.status(400).json({
                error: 'Invalid date format',
                format: 'YYYY-MM-DD'
            });
        }
        
        const summary = await query(`
            SELECT 
                DATE(consumed_at) as date,
                COUNT(*) as meal_count,
                SUM(total_calories) as total_calories,
                SUM(total_proteins) as total_proteins,
                SUM(total_fats) as total_fats,
                SUM(total_carbs) as total_carbs,
                json_object_agg(meal_type, meal_type_count) as meals_by_type
            FROM (
                SELECT 
                    consumed_at,
                    total_calories,
                    total_proteins,
                    total_fats,
                    total_carbs,
                    meal_type,
                    COUNT(*) OVER (PARTITION BY DATE(consumed_at), meal_type) as meal_type_count
                FROM meals 
                WHERE user_id = $1 
                  AND DATE(consumed_at) BETWEEN $2 AND $3
            ) sub
            GROUP BY DATE(consumed_at)
            ORDER BY date DESC
        `, [req.user.id, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]);
        
        res.json({
            success: true,
            period: {
                start_date: startDate.toISOString().split('T')[0],
                end_date: endDate.toISOString().split('T')[0],
                days: Math.ceil((endDate - startDate) / (24 * 60 * 60 * 1000)) + 1
            },
            daily_summary: summary.rows.map(day => ({
                date: day.date,
                meal_count: parseInt(day.meal_count),
                totals: {
                    calories: Math.round(day.total_calories || 0),
                    proteins: Math.round((day.total_proteins || 0) * 10) / 10,
                    fats: Math.round((day.total_fats || 0) * 10) / 10,
                    carbs: Math.round((day.total_carbs || 0) * 10) / 10
                },
                meals_by_type: day.meals_by_type || {}
            })),
            total_days: summary.rows.length
        });
        
    } catch (error) {
        console.error('Get meals summary error:', error);
        res.status(500).json({
            error: 'Failed to get meals summary'
        });
    }
});

module.exports = router;