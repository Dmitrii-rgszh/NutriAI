require('dotenv').config();

console.log('🔍 Debugging environment and database connection...\n');

// Check .env file
const fs = require('fs');
const path = require('path');

console.log('📁 Current directory:', process.cwd());
console.log('📄 .env file exists:', fs.existsSync('.env'));

if (fs.existsSync('.env')) {
    console.log('📄 .env file location:', path.resolve('.env'));
}

console.log('\n🔐 Environment variables:');
console.log('DB_HOST:', process.env.DB_HOST || '[NOT SET - using localhost]');
console.log('DB_PORT:', process.env.DB_PORT || '[NOT SET - using 5433]');
console.log('DB_NAME:', process.env.DB_NAME || '[NOT SET - using nutriai]');
console.log('DB_USER:', process.env.DB_USER || '[NOT SET - using nutriai_user]');
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '[SET]' : '[NOT SET - using nutriai123]');

console.log('\n📊 Actual connection parameters:');
const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5433,
    database: process.env.DB_NAME || 'nutriai',
    user: process.env.DB_USER || 'nutriai_user',
    password: process.env.DB_PASSWORD || 'nutriai123'
};

console.log('host:', config.host);
console.log('port:', config.port);
console.log('database:', config.database);
console.log('user:', config.user);
console.log('password:', config.password);

// Now test connection
console.log('\n🔌 Testing connection...');
const { Client } = require('pg');

async function testConnection() {
    const client = new Client(config);
    
    try {
        await client.connect();
        console.log('✅ Connection successful!');
        
        const result = await client.query('SELECT current_user, current_database()');
        console.log('Connected as:', result.rows[0].current_user);
        console.log('Database:', result.rows[0].current_database);
        
        await client.end();
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        console.error('Error code:', error.code);
    }
}

testConnection();