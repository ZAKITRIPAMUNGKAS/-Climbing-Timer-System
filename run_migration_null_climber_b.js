/**
 * Migration: Allow NULL for climber_b_id to support BYE (Walkover)
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
    let connection;
    
    try {
        const dbConfig = {
            host: process.env.DB_HOST || '127.0.0.1',
            user: process.env.DB_USER || 'emsimemy_db',
            password: process.env.DB_PASSWORD || 'c290^&uz%Fm@i.oy', // Same default as server.js
            database: process.env.DB_NAME || 'emsimemy_db',
            port: process.env.DB_PORT || 3306,
            // Fix authentication plugin issue
            authPlugin: 'mysql_native_password',
            ssl: false
        };

        console.log(`[MIGRATION] 🔌 Connecting to database: ${dbConfig.user}@${dbConfig.host}/${dbConfig.database}`);
        connection = await mysql.createConnection(dbConfig);
        console.log('[MIGRATION] ✅ Connected to database');

        console.log('[MIGRATION] 📝 Modifying climber_b_id to allow NULL...');
        await connection.execute(
            'ALTER TABLE speed_finals_matches MODIFY COLUMN climber_b_id INT NULL'
        );
        console.log('[MIGRATION] ✅ Migration completed successfully!');
        console.log('[MIGRATION] 📊 Column updated:');
        console.log('   - speed_finals_matches.climber_b_id (now allows NULL for BYE)');

    } catch (error) {
        console.error('[MIGRATION] ❌ Error running migration:', error.message);
        if (error.code === 'ER_DUP_FIELDNAME' || error.message.includes('already exists')) {
            console.log('[MIGRATION] ⏭️  Column already allows NULL, skipping');
        } else {
            console.error('[MIGRATION] Error details:', error);
            process.exit(1);
        }
    } finally {
        if (connection) {
            await connection.end();
            console.log('[MIGRATION] 🔌 Database connection closed');
        }
    }
}

runMigration();

