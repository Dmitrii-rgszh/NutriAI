require('dotenv').config();

console.log('🔍 Debugging database connection...');
console.log('Environment variables:');
console.log('DB_PASSWORD:', JSON.stringify(process.env.DB_PASSWORD));
console.log('DATABASE_URL:', JSON.stringify(process.env.DATABASE_URL));

// Test direct connection
const { Client } = require('pg');

async function testConnection() {
    // Test 1: Using DATABASE_URL
    console.log('\n📝 Test 1: Using DATABASE_URL');
    try {
        const client1 = new Client({
            connectionString: process.env.DATABASE_URL
        });
        await client1.connect();
        console.log('✅ DATABASE_URL connection works');
        await client1.end();
    } catch (error) {
        console.log('❌ DATABASE_URL failed:', error.message);
    }

    // Test 2: Using individual parameters
    console.log('\n📝 Test 2: Using individual parameters');
    try {
        const client2 = new Client({
            host: 'localhost',
            port: 5432,
            database: 'nutriai',
            user: 'nutriai_user',
            password: process.env.DB_PASSWORD
        });
        await client2.connect();
        console.log('✅ Individual parameters connection works');
        await client2.end();
    } catch (error) {
        console.log('❌ Individual parameters failed:', error.message);
    }

    // Test 3: Simple password
    console.log('\n📝 Test 3: Using simple password');
    try {
        const client3 = new Client({
            host: 'localhost',
            port: 5432,
            database: 'nutriai',
            user: 'nutriai_user',
            password: 'nutriai123'
        });
        await client3.connect();
        console.log('✅ Simple password works');
        await client3.end();
    } catch (error) {
        console.log('❌ Simple password failed:', error.message);
    }
}

testConnection().then(() => {
    console.log('\n🏁 Testing complete');
    process.exit(0);
}).catch(error => {
    console.error('💥 Test failed:', error);
    process.exit(1);
});