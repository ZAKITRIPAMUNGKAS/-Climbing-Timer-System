// Script untuk menjalankan migration menambahkan field is_disqualified
const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '272800',
            database: process.env.DB_NAME || 'fpti_karanganyar',
            port: process.env.DB_PORT || 3306,
            authPlugin: 'mysql_native_password'
        });

        console.log('[MIGRATION] ✅ Connected to database');

        // Check if column exists
        const [columns] = await connection.execute(
            `SELECT COLUMN_NAME 
             FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_SCHEMA = ? 
             AND TABLE_NAME = 'scores' 
             AND COLUMN_NAME = 'is_disqualified'`,
            [process.env.DB_NAME || 'fpti_karanganyar']
        );

        if (columns.length > 0) {
            console.log('[MIGRATION] ✅ Column is_disqualified already exists');
        } else {
            // Add column
            await connection.execute(
                'ALTER TABLE scores ADD COLUMN is_disqualified BOOLEAN DEFAULT FALSE'
            );
            console.log('[MIGRATION] ✅ Column is_disqualified added successfully');
        }

        console.log('[MIGRATION] ✅ Migration completed successfully');
    } catch (error) {
        console.error('[MIGRATION] ❌ Error:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

runMigration();

