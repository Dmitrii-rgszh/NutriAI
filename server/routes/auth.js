const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { userHelpers } = require('../config/database');

const router = express.Router();

// 🔐 Validate Telegram WebApp data
function validateTelegramWebAppData(telegramInitData) {
    try {
        const urlParams = new URLSearchParams(telegramInitData);
        const hash = urlParams.get('hash');
        urlParams.delete('hash');
        
        // Sort parameters
        const dataCheckArray = [];
        for (const [key, value] of urlParams.entries()) {
            dataCheckArray.push(`${key}=${value}`);
        }
        dataCheckArray.sort();
        
        const dataCheckString = dataCheckArray.join('\n');
        const secretKey = crypto.createHmac('sha256', 'WebAppData').update(process.env.TELEGRAM_BOT_TOKEN).digest();
        const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
        
        return calculatedHash === hash;
    } catch (error) {
        console.error('Telegram validation error:', error);
        return false;
    }
}

// 📱 POST /api/auth/telegram - Telegram WebApp authentication
router.post('/telegram', async (req, res) => {
    try {
        const { initData, user } = req.body;
        
        // Validate required fields
        if (!initData || !user) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['initData', 'user']
            });
        }
        
        // Validate Telegram data signature
        if (!validateTelegramWebAppData(initData)) {
            return res.status(401).json({
                error: 'Invalid Telegram authentication data'
            });
        }
        
        // Extract user data
        const { id: telegram_id, username, first_name, last_name, language_code } = user;
        
        if (!telegram_id) {
            return res.status(400).json({
                error: 'Invalid user data - missing telegram_id'
            });
        }
        
        // Find or create user
        let dbUser = await userHelpers.findByTelegramId(telegram_id);
        
        if (!dbUser) {
            // Create new user
            dbUser = await userHelpers.create({
                telegram_id,
                username,
                first_name,
                last_name,
                language_code
            });
            
            console.log(`✅ New user registered: ${first_name} (${telegram_id})`);
        } else {
            // Update last active
            await userHelpers.updateLastActive(dbUser.id);
            console.log(`👋 User login: ${dbUser.first_name} (${telegram_id})`);
        }
        
        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: dbUser.id,
                telegramId: telegram_id,
                username: dbUser.username,
                isPremium: dbUser.is_premium
            },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );
        
        // Return user data and token
        res.json({
            success: true,
            user: {
                id: dbUser.id,
                telegram_id: dbUser.telegram_id,
                username: dbUser.username,
                first_name: dbUser.first_name,
                last_name: dbUser.last_name,
                language_code: dbUser.language_code,
                is_premium: dbUser.is_premium,
                premium_until: dbUser.premium_until,
                created_at: dbUser.created_at
            },
            token,
            expires_in: '30d'
        });
        
    } catch (error) {
        console.error('Auth error:', error);
        res.status(500).json({
            error: 'Authentication failed',
            message: error.message
        });
    }
});

// 🔍 GET /api/auth/verify - Verify JWT token
router.get('/verify', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Missing or invalid authorization header'
            });
        }
        
        const token = authHeader.substring(7);
        
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Get fresh user data
            const user = await userHelpers.findByTelegramId(decoded.telegramId);
            
            if (!user) {
                return res.status(401).json({
                    error: 'User not found'
                });
            }
            
            res.json({
                valid: true,
                user: {
                    id: user.id,
                    telegram_id: user.telegram_id,
                    username: user.username,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    is_premium: user.is_premium,
                    premium_until: user.premium_until
                },
                token_data: {
                    issued_at: new Date(decoded.iat * 1000),
                    expires_at: new Date(decoded.exp * 1000)
                }
            });
            
        } catch (jwtError) {
            return res.status(401).json({
                error: 'Invalid or expired token',
                details: jwtError.message
            });
        }
        
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(500).json({
            error: 'Token verification failed'
        });
    }
});

// 🚪 POST /api/auth/logout - Logout (client should delete token)
router.post('/logout', (req, res) => {
    // В реальном приложении можно добавить токен в blacklist
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

// 📊 GET /api/auth/stats - Authentication statistics (for admin)
router.get('/stats', async (req, res) => {
    try {
        const { query } = require('../config/database');
        
        const stats = await query(`
            SELECT 
                COUNT(*) as total_users,
                COUNT(CASE WHEN is_premium THEN 1 END) as premium_users,
                COUNT(CASE WHEN last_active > NOW() - INTERVAL '7 days' THEN 1 END) as active_week,
                COUNT(CASE WHEN last_active > NOW() - INTERVAL '1 day' THEN 1 END) as active_today,
                COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as new_week
            FROM users
        `);
        
        res.json({
            success: true,
            stats: stats.rows[0]
        });
        
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({
            error: 'Failed to get authentication stats'
        });
    }
});

module.exports = router;