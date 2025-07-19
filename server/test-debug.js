require('dotenv').config();
const { Client } = require('pg');

console.log('Debug: Environment variables:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD exists:', !!process.env.DB_PASSWORD);

async function test() {
    const config = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME || 'nutriai',
        user: process.env.DB_USER || 'nutriai_user',
        password: process.env.DB_PASSWORD || 'nutriai123'
    };
    
    console.log('\nUsing configuration:');
    console.log('Host:', config.host);
    console.log('Port:', config.port);
    console.log('Database:', config.database);
    console.log('User:', config.user);
    
    const client = new Client(config);
    
    try {
        console.log('\nConnecting...');
        await client.connect();
        console.log('Connection successful!');
        
        const result = await client.query('SELECT version(), current_user');
        console.log('PostgreSQL version:', result.rows[0].version.split(' ')[1]);
        console.log('Connected as:', result.rows[0].current_user);
        
        await client.end();
    } catch (error) {
        console.error('Connection failed:', error.message);
        console.error('Error code:', error.code);
    }
}

test();