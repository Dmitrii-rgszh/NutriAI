const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { query } = require('../config/database');

const router = express.Router();

// 👤 GET /api/user/profile - Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        // Get user profile with nutrition settings
        const profile = await query(`
            SELECT 
                u.*,
                np.age,
                np.gender,
                np.height,
                np.weight,
                np.activity_level,
                np.goal,
                np.daily_calories,
                np.daily_proteins,
                np.daily_fats,
                np.daily_carbs,
                np.updated_at as profile_updated_at
            FROM users u
            LEFT JOIN nutrition_profiles np ON u.id = np.user_id
            WHERE u.id = $1
        `, [req.user.id]);
        
        if (profile.rows.length === 0) {
            return res.status(404).json({
                error: 'User profile not found'
            });
        }
        
        const user = profile.rows[0];
        
        res.json({
            success: true,
            user: {
                id: user.id,
                telegram_id: user.telegram_id,
                username: user.username,
                first_name: user.first_name,
                last_name: user.last_name,
                language_code: user.language_code,
                is_premium: user.is_premium,
                premium_until: user.premium_until,
                created_at: user.created_at,
                last_active: user.last_active
            },
            nutrition_profile: user.age ? {
                age: user.age,
                gender: user.gender,
                height: user.height,
                weight: user.weight,
                activity_level: user.activity_level,
                goal: user.goal,
                daily_targets: {
                    calories: user.daily_calories,
                    proteins: user.daily_proteins,
                    fats: user.daily_fats,
                    carbs: user.daily_carbs
                },
                updated_at: user.profile_updated_at
            } : null
        });
        
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            error: 'Failed to get user profile'
        });
    }
});

// ✏️ PUT /api/user/profile - Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const { age, gender, height, weight, activity_level, goal } = req.body;
        
        // Validate input
        if (age && (age < 13 || age > 120)) {
            return res.status(400).json({
                error: 'Invalid age',
                message: 'Age must be between 13 and 120'
            });
        }
        
        if (gender && !['male', 'female', 'other'].includes(gender)) {
            return res.status(400).json({
                error: 'Invalid gender',
                valid_values: ['male', 'female', 'other']
            });
        }
        
        if (height && (height < 100 || height > 250)) {
            return res.status(400).json({
                error: 'Invalid height',
                message: 'Height must be between 100 and 250 cm'
            });
        }
        
        if (weight && (weight < 30 || weight > 300)) {
            return res.status(400).json({
                error: 'Invalid weight',
                message: 'Weight must be between 30 and 300 kg'
            });
        }
        
        const validActivityLevels = ['sedentary', 'light', 'moderate', 'active', 'very_active'];
        if (activity_level && !validActivityLevels.includes(activity_level)) {
            return res.status(400).json({
                error: 'Invalid activity_level',
                valid_values: validActivityLevels
            });
        }
        
        const validGoals = ['lose', 'maintain', 'gain'];
        if (goal && !validGoals.includes(goal)) {
            return res.status(400).json({
                error: 'Invalid goal',
                valid_values: validGoals
            });
        }
        
        // Calculate daily nutrition targets
        let dailyTargets = null;
        if (age && gender && height && weight && activity_level && goal) {
            dailyTargets = calculateDailyTargets({
                age, gender, height, weight, activity_level, goal
            });
        }
        
        // Update or insert nutrition profile
        const { withTransaction } = require('../config/database');
        
        const updatedProfile = await withTransaction(async (client) => {
            // Check if profile exists
            const existingProfile = await client.query(
                'SELECT id FROM nutrition_profiles WHERE user_id = $1',
                [req.user.id]
            );
            
            if (existingProfile.rows.length > 0) {
                // Update existing profile
                const updateFields = [];
                const updateValues = [];
                let paramIndex = 1;
                
                if (age !== undefined) {
                    updateFields.push(`age = $${paramIndex++}`);
                    updateValues.push(age);
                }
                if (gender !== undefined) {
                    updateFields.push(`gender = $${paramIndex++}`);
                    updateValues.push(gender);
                }
                if (height !== undefined) {
                    updateFields.push(`height = $${paramIndex++}`);
                    updateValues.push(height);
                }
                if (weight !== undefined) {
                    updateFields.push(`weight = $${paramIndex++}`);
                    updateValues.push(weight);
                }
                if (activity_level !== undefined) {
                    updateFields.push(`activity_level = $${paramIndex++}`);
                    updateValues.push(activity_level);
                }
                if (goal !== undefined) {
                    updateFields.push(`goal = $${paramIndex++}`);
                    updateValues.push(goal);
                }
                
                if (dailyTargets) {
                    updateFields.push(`daily_calories = $${paramIndex++}`);
                    updateValues.push(dailyTargets.calories);
                    updateFields.push(`daily_proteins = $${paramIndex++}`);
                    updateValues.push(dailyTargets.proteins);
                    updateFields.push(`daily_fats = $${paramIndex++}`);
                    updateValues.push(dailyTargets.fats);
                    updateFields.push(`daily_carbs = $${paramIndex++}`);
                    updateValues.push(dailyTargets.carbs);
                }
                
                updateValues.push(req.user.id);
                
                const result = await client.query(`
                    UPDATE nutrition_profiles 
                    SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = $${paramIndex}
                    RETURNING *
                `, updateValues);
                
                return result.rows[0];
            } else {
                // Create new profile
                const result = await client.query(`
                    INSERT INTO nutrition_profiles 
                    (user_id, age, gender, height, weight, activity_level, goal, daily_calories, daily_proteins, daily_fats, daily_carbs)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                    RETURNING *
                `, [
                    req.user.id, age, gender, height, weight, activity_level, goal,
                    dailyTargets?.calories, dailyTargets?.proteins, dailyTargets?.fats, dailyTargets?.carbs
                ]);
                
                return result.rows[0];
            }
        });
        
        console.log(`👤 User ${req.user.id} updated profile`);
        
        res.json({
            success: true,
            message: 'Profile updated successfully',
            nutrition_profile: {
                age: updatedProfile.age,
                gender: updatedProfile.gender,
                height: updatedProfile.height,
                weight: updatedProfile.weight,
                activity_level: updatedProfile.activity_level,
                goal: updatedProfile.goal,
                daily_targets: {
                    calories: updatedProfile.daily_calories,
                    proteins: updatedProfile.daily_proteins,
                    fats: updatedProfile.daily_fats,
                    carbs: updatedProfile.daily_carbs
                },
                updated_at: updatedProfile.updated_at
            }
        });
        
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            error: 'Failed to update profile',
            message: error.message
        });
    }
});

// 📊 GET /api/user/stats - Get user statistics
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const stats = await query(`
            SELECT 
                COUNT(DISTINCT DATE(m.consumed_at)) as days_tracked,
                COUNT(m.id) as total_meals,
                COUNT(CASE WHEN m.ai_recognized THEN 1 END) as ai_recognized_meals,
                AVG(m.total_calories) as avg_calories_per_meal,
                MAX(DATE(m.consumed_at)) as last_meal_date,
                MIN(DATE(m.consumed_at)) as first_meal_date
            FROM meals m
            WHERE m.user_id = $1
        `, [req.user.id]);
        
        const premiumUsage = await query(`
            SELECT 
                feature,
                COUNT(*) as usage_count,
                MAX(used_at) as last_used
            FROM premium_usage
            WHERE user_id = $1
            GROUP BY feature
        `, [req.user.id]);
        
        const weeklyProgress = await query(`
            SELECT 
                DATE(consumed_at) as date,
                SUM(total_calories) as daily_calories,
                COUNT(*) as daily_meals
            FROM meals
            WHERE user_id = $1 
              AND consumed_at > NOW() - INTERVAL '7 days'
            GROUP BY DATE(consumed_at)
            ORDER BY date DESC
        `, [req.user.id]);
        
        res.json({
            success: true,
            stats: {
                overview: {
                    days_tracked: parseInt(stats.rows[0].days_tracked),
                    total_meals: parseInt(stats.rows[0].total_meals),
                    ai_recognized_meals: parseInt(stats.rows[0].ai_recognized_meals),
                    avg_calories_per_meal: Math.round(stats.rows[0].avg_calories_per_meal || 0),
                    first_meal_date: stats.rows[0].first_meal_date,
                    last_meal_date: stats.rows[0].last_meal_date
                },
                premium_usage: premiumUsage.rows.map(usage => ({
                    feature: usage.feature,
                    usage_count: parseInt(usage.usage_count),
                    last_used: usage.last_used
                })),
                weekly_progress: weeklyProgress.rows.map(day => ({
                    date: day.date,
                    calories: Math.round(day.daily_calories || 0),
                    meals: parseInt(day.daily_meals)
                }))
            }
        });
        
    } catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({
            error: 'Failed to get user statistics'
        });
    }
});

// 🗑️ DELETE /api/user/account - Delete user account
router.delete('/account', authenticateToken, async (req, res) => {
    try {
        const { confirm } = req.body;
        
        if (confirm !== 'DELETE_MY_ACCOUNT') {
            return res.status(400).json({
                error: 'Account deletion not confirmed',
                message: 'Send {"confirm": "DELETE_MY_ACCOUNT"} to confirm deletion'
            });
        }
        
        // Delete user (cascade will delete all related data)
        await query('DELETE FROM users WHERE id = $1', [req.user.id]);
        
        console.log(`🗑️ User ${req.user.id} (${req.user.first_name}) deleted their account`);
        
        res.json({
            success: true,
            message: 'Account deleted successfully',
            deleted_at: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({
            error: 'Failed to delete account'
        });
    }
});

// 🧮 Helper function to calculate daily nutrition targets
function calculateDailyTargets({ age, gender, height, weight, activity_level, goal }) {
    // Harris-Benedict equation for BMR
    let bmr;
    if (gender === 'male') {
        bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    } else {
        bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    }
    
    // Activity multipliers
    const activityMultipliers = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        very_active: 1.9
    };
    
    // Calculate TDEE (Total Daily Energy Expenditure)
    const tdee = bmr * activityMultipliers[activity_level];
    
    // Adjust for goal
    let targetCalories;
    switch (goal) {
        case 'lose':
            targetCalories = tdee - 500; // 500 calorie deficit
            break;
        case 'gain':
            targetCalories = tdee + 300; // 300 calorie surplus
            break;
        default: // maintain
            targetCalories = tdee;
    }
    
    // Calculate macros (balanced approach)
    const proteins = Math.round(weight * 2.2); // 2.2g per kg body weight
    const fats = Math.round(targetCalories * 0.25 / 9); // 25% of calories from fat
    const carbs = Math.round((targetCalories - (proteins * 4) - (fats * 9)) / 4); // Remaining calories from carbs
    
    return {
        calories: Math.round(targetCalories),
        proteins,
        fats,
        carbs
    };
}

module.exports = router;