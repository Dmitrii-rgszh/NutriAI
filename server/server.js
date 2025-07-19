require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { connectDB } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3001;

// 🛡️ Security & Performance Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 🚦 Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 100, // максимум запросов
    message: { error: 'Too many requests, please try again later' }
});
app.use('/api/', limiter);

// 🤖 Специальный лимит для AI endpoints
const aiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 минута
    max: 5, // 5 запросов в минуту
    message: { error: 'AI rate limit exceeded, please wait' }
});
app.use('/api/food/recognize', aiLimiter);

// 📝 Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// 🛣️ Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/food', require('./routes/food'));
app.use('/api/meals', require('./routes/meals'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/user', require('./routes/user'));

// 🏥 Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage()
    });
});

// 🏠 Base route
app.get('/', (req, res) => {
    res.json({
        name: 'NutriAI API',
        version: '1.0.0',
        description: 'AI-powered nutrition tracking for Telegram',
        endpoints: [
            'POST /api/auth/telegram - Telegram authentication',
            'GET /api/user/profile - Get user profile',
            'POST /api/food/recognize - AI food recognition',
            'GET /api/food/search - Search food database',
            'POST /api/meals - Add meal',
            'GET /api/meals/today - Today\'s meals',
            'GET /api/stats/daily - Daily statistics'
        ]
    });
});

// 🚫 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        path: req.originalUrl,
        method: req.method
    });
});

// 💥 Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    // Telegram API errors
    if (err.name === 'TelegramError') {
        return res.status(400).json({
            error: 'Invalid Telegram data',
            message: err.message
        });
    }
    
    // Validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation failed',
            details: err.details
        });
    }
    
    // Database errors
    if (err.code === '23505') { // PostgreSQL unique constraint
        return res.status(409).json({
            error: 'Resource already exists'
        });
    }
    
    // Default error
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// 🚀 Start server
async function startServer() {
    try {
        // Connect to database
        await connectDB();
        console.log('✅ Database connected successfully');
        
        // Start listening
        app.listen(PORT, () => {
            console.log(`🚀 NutriAI Server running on port ${PORT}`);
            console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔗 Health check: http://localhost:${PORT}/health`);
            console.log(`📚 API docs: http://localhost:${PORT}/`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// 🛑 Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully');
    process.exit(0);
});

startServer();