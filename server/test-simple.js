require('dotenv').config();
const { Client } = require('pg');

async function test() {
    console.log('🔍 Testing hardcoded connection...');
    
    const client = new Client({
        host: '127.0.0.1',
        port: 5432,
        database: 'nutriai',
        user: 'nutriai_user',
        password: 'nutriai123'
    });
    
    try {
        console.log('Connecting...');
        await client.connect();
        console.log('✅ Connection successful!');
        
        const result = await client.query('SELECT current_user, current_database()');
        console.log('Result:', result.rows[0]);
        
        await client.end();
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        console.error('Error code:', error.code);
    }
}

test();