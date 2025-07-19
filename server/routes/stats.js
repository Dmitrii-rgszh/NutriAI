const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { query } = require('../config/database');

const router = express.Router();

// 📊 GET /api/stats/daily - Get daily nutrition statistics
router.get('/daily', authenticateToken, async (req, res) => {
    try {
        const { date } = req.query;
        const targetDate = date ? new Date(date) : new Date();
        
        // Validate date
        if (isNaN(targetDate.getTime())) {
            return res.status(400).json({
                error: 'Invalid date format',
                format: 'YYYY-MM-DD'
            });
        }
        
        const dateStr = targetDate.toISOString().split('T')[0];
        
        // Get daily consumption
        const dailyStats = await query(`
            SELECT 
                COALESCE(SUM(total_calories), 0) as consumed_calories,
                COALESCE(SUM(total_proteins), 0) as consumed_proteins,
                COALESCE(SUM(total_fats), 0) as consumed_fats,
                COALESCE(SUM(total_carbs), 0) as consumed_carbs,
                COUNT(*) as meal_count
            FROM meals 
            WHERE user_id = $1 
              AND DATE(consumed_at) = $2
        `, [req.user.id, dateStr]);
        
        // Get user's daily targets
        const targets = await query(`
            SELECT daily_calories, daily_proteins, daily_fats, daily_carbs
            FROM nutrition_profiles 
            WHERE user_id = $1
        `, [req.user.id]);
        
        // Get meals breakdown by type
        const mealBreakdown = await query(`
            SELECT 
                meal_type,
                COUNT(*) as count,
                SUM(total_calories) as calories,
                SUM(total_proteins) as proteins,
                SUM(total_fats) as fats,
                SUM(total_carbs) as carbs
            FROM meals 
            WHERE user_id = $1 
              AND DATE(consumed_at) = $2
            GROUP BY meal_type
        `, [req.user.id, dateStr]);
        
        const consumed = dailyStats.rows[0];
        const dailyTargets = targets.rows[0] || {
            daily_calories: 2000,
            daily_proteins: 150,
            daily_fats: 65,
            daily_carbs: 250
        };
        
        // Calculate percentages and remaining
        const stats = {
            calories: {
                consumed: Math.round(consumed.consumed_calories),
                target: dailyTargets.daily_calories,
                remaining: Math.max(0, dailyTargets.daily_calories - consumed.consumed_calories),
                percentage: Math.round((consumed.consumed_calories / dailyTargets.daily_calories) * 100)
            },
            proteins: {
                consumed: Math.round(consumed.consumed_proteins * 10) / 10,
                target: dailyTargets.daily_proteins,
                remaining: Math.max(0, dailyTargets.daily_proteins - consumed.consumed_proteins),
                percentage: Math.round((consumed.consumed_proteins / dailyTargets.daily_proteins) * 100)
            },
            fats: {
                consumed: Math.round(consumed.consumed_fats * 10) / 10,
                target: dailyTargets.daily_fats,
                remaining: Math.max(0, dailyTargets.daily_fats - consumed.consumed_fats),
                percentage: Math.round((consumed.consumed_fats / dailyTargets.daily_fats) * 100)
            },
            carbs: {
                consumed: Math.round(consumed.consumed_carbs * 10) / 10,
                target: dailyTargets.daily_carbs,
                remaining: Math.max(0, dailyTargets.daily_carbs - consumed.consumed_carbs),
                percentage: Math.round((consumed.consumed_carbs / dailyTargets.daily_carbs) * 100)
            }
        };
        
        res.json({
            success: true,
            date: dateStr,
            stats,
            meal_count: parseInt(consumed.meal_count),
            meals_by_type: mealBreakdown.rows.reduce((acc, meal) => {
                acc[meal.meal_type] = {
                    count: parseInt(meal.count),
                    calories: Math.round(meal.calories || 0),
                    proteins: Math.round((meal.proteins || 0) * 10) / 10,
                    fats: Math.round((meal.fats || 0) * 10) / 10,
                    carbs: Math.round((meal.carbs || 0) * 10) / 10
                };
                return acc;
            }, {}),
            summary: {
                total_calories_consumed: Math.round(consumed.consumed_calories),
                calories_remaining: Math.max(0, dailyTargets.daily_calories - consumed.consumed_calories),
                over_target: consumed.consumed_calories > dailyTargets.daily_calories,
                target_progress: Math.min(100, Math.round((consumed.consumed_calories / dailyTargets.daily_calories) * 100))
            }
        });
        
    } catch (error) {
        console.error('Daily stats error:', error);
        res.status(500).json({
            error: 'Failed to get daily statistics'
        });
    }
});

// 📈 GET /api/stats/weekly - Get weekly nutrition trends
router.get('/weekly', authenticateToken, async (req, res) => {
    try {
        const { weeks = 4 } = req.query;
        const weeksNum = Math.min(parseInt(weeks) || 4, 12); // Max 12 weeks
        
        const weeklyStats = await query(`
            SELECT 
                DATE_TRUNC('week', consumed_at) as week_start,
                COUNT(DISTINCT DATE(consumed_at)) as days_tracked,
                COUNT(*) as total_meals,
                AVG(total_calories) as avg_daily_calories,
                AVG(total_proteins) as avg_daily_proteins,
                AVG(total_fats) as avg_daily_fats,
                AVG(total_carbs) as avg_daily_carbs,
                SUM(total_calories) as total_calories,
                COUNT(CASE WHEN ai_recognized THEN 1 END) as ai_meals
            FROM meals 
            WHERE user_id = $1 
              AND consumed_at > NOW() - INTERVAL '${weeksNum} weeks'
            GROUP BY DATE_TRUNC('week', consumed_at)
            ORDER BY week_start DESC
        `, [req.user.id]);
        
        res.json({
            success: true,
            period: `${weeksNum} weeks`,
            weekly_data: weeklyStats.rows.map(week => ({
                week_start: week.week_start,
                week_end: new Date(new Date(week.week_start).getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                days_tracked: parseInt(week.days_tracked),
                total_meals: parseInt(week.total_meals),
                avg_daily: {
                    calories: Math.round(week.avg_daily_calories || 0),
                    proteins: Math.round((week.avg_daily_proteins || 0) * 10) / 10,
                    fats: Math.round((week.avg_daily_fats || 0) * 10) / 10,
                    carbs: Math.round((week.avg_daily_carbs || 0) * 10) / 10
                },
                total_calories: Math.round(week.total_calories || 0),
                ai_meals_percentage: week.total_meals > 0 ? Math.round((week.ai_meals / week.total_meals) * 100) : 0
            }))
        });
        
    } catch (error) {
        console.error('Weekly stats error:', error);
        res.status(500).json({
            error: 'Failed to get weekly statistics'
        });
    }
});

// 🏆 GET /api/stats/achievements - Get user achievements and streaks
router.get('/achievements', authenticateToken, async (req, res) => {
    try {
        // Get streak data
        const streakData = await query(`
            WITH daily_activity AS (
                SELECT DISTINCT DATE(consumed_at) as activity_date
                FROM meals 
                WHERE user_id = $1 
                ORDER BY activity_date DESC
            ),
            streak_groups AS (
                SELECT 
                    activity_date,
                    activity_date - INTERVAL '1 day' * ROW_NUMBER() OVER (ORDER BY activity_date DESC) as group_date
                FROM daily_activity
            ),
            current_streak AS (
                SELECT COUNT(*) as streak_length
                FROM streak_groups
                WHERE group_date = (
                    SELECT group_date 
                    FROM streak_groups 
                    WHERE activity_date = CURRENT_DATE OR activity_date = CURRENT_DATE - INTERVAL '1 day'
                    LIMIT 1
                )
            )
            SELECT 
                COALESCE((SELECT streak_length FROM current_streak), 0) as current_streak,
                COUNT(DISTINCT activity_date) as total_active_days,
                MAX(activity_date) as last_active_date,
                MIN(activity_date) as first_active_date
            FROM daily_activity
        `, [req.user.id]);
        
        // Get milestone data
        const milestones = await query(`
            SELECT 
                COUNT(*) as total_meals,
                COUNT(CASE WHEN ai_recognized THEN 1 END) as ai_meals,
                COUNT(DISTINCT DATE(consumed_at)) as total_days,
                AVG(total_calories) as avg_calories_per_meal,
                MAX(total_calories) as highest_calorie_meal,
                MIN(CASE WHEN total_calories > 0 THEN total_calories END) as lowest_calorie_meal
            FROM meals 
            WHERE user_id = $1
        `, [req.user.id]);
        
        const streak = streakData.rows[0];
        const stats = milestones.rows[0];
        
        // Calculate achievements
        const achievements = [];
        
        if (parseInt(stats.total_meals) >= 1) {
            achievements.push({
                id: 'first_meal',
                title: 'Первый прием пищи',
                description: 'Записали свой первый прием пищи',
                icon: '🍽️',
                unlocked: true,
                date: streak.first_active_date
            });
        }
        
        if (parseInt(stats.ai_meals) >= 1) {
            achievements.push({
                id: 'first_ai_recognition',
                title: 'AI помощник',
                description: 'Использовали AI распознавание еды',
                icon: '🤖',
                unlocked: true
            });
        }
        
        if (parseInt(streak.current_streak) >= 3) {
            achievements.push({
                id: 'streak_3',
                title: 'Начинающий',
                description: 'Ведите дневник питания 3 дня подряд',
                icon: '🔥',
                unlocked: true
            });
        }
        
        if (parseInt(streak.current_streak) >= 7) {
            achievements.push({
                id: 'streak_7',
                title: 'Мотивированный',
                description: 'Ведите дневник питания неделю подряд',
                icon: '⭐',
                unlocked: true
            });
        }
        
        if (parseInt(streak.current_streak) >= 30) {
            achievements.push({
                id: 'streak_30',
                title: 'Преданный',
                description: 'Ведите дневник питания месяц подряд',
                icon: '💎',
                unlocked: true
            });
        }
        
        if (parseInt(stats.total_meals) >= 100) {
            achievements.push({
                id: 'meals_100',
                title: 'Опытный',
                description: 'Записали 100 приемов пищи',
                icon: '📊',
                unlocked: true
            });
        }
        
        // Add locked achievements
        if (parseInt(streak.current_streak) < 7) {
            achievements.push({
                id: 'streak_7',
                title: 'Мотивированный',
                description: 'Ведите дневник питания неделю подряд',
                icon: '⭐',
                unlocked: false,
                progress: parseInt(streak.current_streak),
                target: 7
            });
        }
        
        res.json({
            success: true,
            streak: {
                current: parseInt(streak.current_streak),
                total_active_days: parseInt(streak.total_active_days),
                last_active: streak.last_active_date,
                first_active: streak.first_active_date
            },
            milestones: {
                total_meals: parseInt(stats.total_meals),
                ai_meals: parseInt(stats.ai_meals),
                total_days: parseInt(streak.total_active_days),
                avg_calories_per_meal: Math.round(stats.avg_calories_per_meal || 0),
                highest_calorie_meal: Math.round(stats.highest_calorie_meal || 0),
                lowest_calorie_meal: Math.round(stats.lowest_calorie_meal || 0)
            },
            achievements
        });
        
    } catch (error) {
        console.error('Achievements error:', error);
        res.status(500).json({
            error: 'Failed to get achievements'
        });
    }
});

// 📊 GET /api/stats/nutrition-breakdown - Get detailed nutrition breakdown
router.get('/nutrition-breakdown', authenticateToken, async (req, res) => {
    try {
        const { period = '7d' } = req.query;
        
        let dateFilter;
        switch (period) {
            case '1d':
                dateFilter = "consumed_at > NOW() - INTERVAL '1 day'";
                break;
            case '7d':
                dateFilter = "consumed_at > NOW() - INTERVAL '7 days'";
                break;
            case '30d':
                dateFilter = "consumed_at > NOW() - INTERVAL '30 days'";
                break;
            default:
                return res.status(400).json({
                    error: 'Invalid period',
                    valid_periods: ['1d', '7d', '30d']
                });
        }
        
        // Get nutrition breakdown by food categories
        const categoryBreakdown = await query(`
            SELECT 
                f.category,
                COUNT(*) as times_consumed,
                SUM(mi.calories) as total_calories,
                SUM(mi.proteins) as total_proteins,
                SUM(mi.fats) as total_fats,
                SUM(mi.carbs) as total_carbs,
                AVG(mi.quantity) as avg_portion_size
            FROM meals m
            JOIN meal_items mi ON m.id = mi.meal_id
            JOIN food_items f ON mi.food_id = f.id
            WHERE m.user_id = $1 AND ${dateFilter}
            GROUP BY f.category
            ORDER BY total_calories DESC
        `, [req.user.id]);
        
        // Get top foods by consumption
        const topFoods = await query(`
            SELECT 
                f.name_ru,
                f.category,
                COUNT(*) as times_consumed,
                SUM(mi.calories) as total_calories,
                AVG(mi.quantity) as avg_portion_size,
                f.nutrients
            FROM meals m
            JOIN meal_items mi ON m.id = mi.meal_id
            JOIN food_items f ON mi.food_id = f.id
            WHERE m.user_id = $1 AND ${dateFilter}
            GROUP BY f.id, f.name_ru, f.category, f.nutrients
            ORDER BY times_consumed DESC
            LIMIT 10
        `, [req.user.id]);
        
        // Get meal timing patterns
        const mealTiming = await query(`
            SELECT 
                EXTRACT(HOUR FROM consumed_at) as hour,
                meal_type,
                COUNT(*) as meal_count,
                AVG(total_calories) as avg_calories
            FROM meals 
            WHERE user_id = $1 AND ${dateFilter}
            GROUP BY EXTRACT(HOUR FROM consumed_at), meal_type
            ORDER BY hour, meal_type
        `, [req.user.id]);
        
        res.json({
            success: true,
            period,
            nutrition_breakdown: {
                by_category: categoryBreakdown.rows.map(cat => ({
                    category: cat.category || 'Unknown',
                    times_consumed: parseInt(cat.times_consumed),
                    total_calories: Math.round(cat.total_calories || 0),
                    total_proteins: Math.round((cat.total_proteins || 0) * 10) / 10,
                    total_fats: Math.round((cat.total_fats || 0) * 10) / 10,
                    total_carbs: Math.round((cat.total_carbs || 0) * 10) / 10,
                    avg_portion_size: Math.round((cat.avg_portion_size || 0) * 10) / 10
                })),
                top_foods: topFoods.rows.map(food => ({
                    name: food.name_ru,
                    category: food.category,
                    times_consumed: parseInt(food.times_consumed),
                    total_calories: Math.round(food.total_calories || 0),
                    avg_portion_size: Math.round((food.avg_portion_size || 0) * 10) / 10,
                    calories_per_100g: food.nutrients?.calories || 0
                })),
                meal_timing: mealTiming.rows.map(timing => ({
                    hour: parseInt(timing.hour),
                    meal_type: timing.meal_type,
                    meal_count: parseInt(timing.meal_count),
                    avg_calories: Math.round(timing.avg_calories || 0)
                }))
            }
        });
        
    } catch (error) {
        console.error('Nutrition breakdown error:', error);
        res.status(500).json({
            error: 'Failed to get nutrition breakdown'
        });
    }
});

module.exports = router;