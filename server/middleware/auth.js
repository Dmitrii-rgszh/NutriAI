const jwt = require('jsonwebtoken');
const { userHelpers } = require('../config/database');

// 🔐 JWT Authentication middleware
async function authenticateToken(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Access denied',
                message: 'Missing or invalid authorization header'
            });
        }
        
        const token = authHeader.substring(7);
        
        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from database
        const user = await userHelpers.findByTelegramId(decoded.telegramId);
        
        if (!user) {
            return res.status(401).json({
                error: 'Access denied',
                message: 'User not found'
            });
        }
        
        // Add user data to request
        req.user = {
            id: user.id,
            telegram_id: user.telegram_id,
            username: user.username,
            first_name: user.first_name,
            last_name: user.last_name,
            is_premium: user.is_premium,
            premium_until: user.premium_until,
            language_code: user.language_code
        };
        
        // Update last active (async, don't wait)
        userHelpers.updateLastActive(user.id).catch(err => 
            console.error('Failed to update last_active:', err)
        );
        
        next();
        
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Access denied',
                message: 'Invalid token'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Access denied',
                message: 'Token expired'
            });
        }
        
        console.error('Auth middleware error:', error);
        res.status(500).json({
            error: 'Authentication failed',
            message: 'Internal server error'
        });
    }
}

// 💎 Premium user middleware
function requirePremium(req, res, next) {
    if (!req.user) {
        return res.status(401).json({
            error: 'Authentication required'
        });
    }
    
    if (!req.user.is_premium) {
        return res.status(403).json({
            error: 'Premium subscription required',
            message: 'This feature is available only for premium users',
            upgrade_url: '/premium'
        });
    }
    
    // Check if premium is still valid
    if (req.user.premium_until && new Date() > new Date(req.user.premium_until)) {
        return res.status(403).json({
            error: 'Premium subscription expired',
            message: 'Your premium subscription has expired',
            expired_at: req.user.premium_until,
            renew_url: '/premium'
        });
    }
    
    next();
}

// 📱 Daily photo limit middleware for free users
async function checkPhotoLimit(req, res, next) {
    try {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required'
            });
        }
        
        // Premium users have unlimited photos
        if (req.user.is_premium) {
            return next();
        }
        
        // Check daily photo count for free users
        const { query } = require('../config/database');
        const result = await query(`
            SELECT COUNT(*) as photo_count
            FROM ai_recognitions 
            WHERE user_id = $1 
              AND DATE(processed_at) = CURRENT_DATE
        `, [req.user.id]);
        
        const dailyCount = parseInt(result.rows[0].photo_count);
        const FREE_DAILY_LIMIT = 3;
        
        if (dailyCount >= FREE_DAILY_LIMIT) {
            return res.status(429).json({
                error: 'Daily photo limit reached',
                message: `Free users can process ${FREE_DAILY_LIMIT} photos per day`,
                used: dailyCount,
                limit: FREE_DAILY_LIMIT,
                reset_at: new Date(new Date().setHours(24, 0, 0, 0)),
                upgrade_message: 'Upgrade to Premium for unlimited photo recognition',
                upgrade_url: '/premium'
            });
        }
        
        // Add usage info to request
        req.photoUsage = {
            used: dailyCount,
            limit: FREE_DAILY_LIMIT,
            remaining: FREE_DAILY_LIMIT - dailyCount
        };
        
        next();
        
    } catch (error) {
        console.error('Photo limit check error:', error);
        res.status(500).json({
            error: 'Failed to check photo limit'
        });
    }
}

// 🔒 Admin middleware (for future admin features)
function requireAdmin(req, res, next) {
    if (!req.user) {
        return res.status(401).json({
            error: 'Authentication required'
        });
    }
    
    // Проверяем, является ли пользователь админом
    // В будущем можно добавить поле is_admin в таблицу users
    const adminTelegramIds = process.env.ADMIN_TELEGRAM_IDS?.split(',').map(id => parseInt(id)) || [];
    
    if (!adminTelegramIds.includes(req.user.telegram_id)) {
        return res.status(403).json({
            error: 'Admin access required'
        });
    }
    
    next();
}

// 🕒 Optional auth middleware (doesn't fail if no token)
async function optionalAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next(); // Continue without auth
        }
        
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userHelpers.findByTelegramId(decoded.telegramId);
        
        if (user) {
            req.user = {
                id: user.id,
                telegram_id: user.telegram_id,
                username: user.username,
                first_name: user.first_name,
                is_premium: user.is_premium,
                premium_until: user.premium_until,
                language_code: user.language_code
            };
        }
        
        next();
        
    } catch (error) {
        // Ignore auth errors in optional auth
        next();
    }
}

module.exports = {
    authenticateToken,
    requirePremium,
    checkPhotoLimit,
    requireAdmin,
    optionalAuth
};