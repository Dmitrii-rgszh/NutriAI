require('dotenv').config();
const { Client } = require('pg');

async function checkTables() {
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5433,
        database: process.env.DB_NAME || 'nutriai',
        user: process.env.DB_USER || 'nutriai_user',
        password: process.env.DB_PASSWORD || 'nutriai123'
    });
    
    try {
        await client.connect();
        
        const result = await client.query(`
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public'
            ORDER BY tablename
        `);
        
        console.log('Found tables:');
        result.rows.forEach((row, index) => {
            console.log(`   ${index + 1}. ${row.tablename}`);
        });
        
        if (result.rows.length === 0) {
            console.log('No tables found!');
            console.log('Run: docker exec -i nutriai-db psql -U nutriai_user -d nutriai < ../database/init.sql');
        }
        
        await client.end();
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkTables();
