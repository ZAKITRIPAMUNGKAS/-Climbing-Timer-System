const mysql = require('mysql2/promise');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '272800',
    database: process.env.DB_NAME || 'fpti_karanganyar',
    port: process.env.DB_PORT || 3306,
    authPlugin: 'mysql_native_password'
};

async function runMigration() {
    let connection;
    try {
        console.log('🔄 Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database');

        // Read migration file
        const migrationPath = path.join(__dirname, 'database', 'migration_add_photo_to_climbers.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        // Split by semicolon and execute each statement
        const statements = migrationSQL
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        console.log('🔄 Running migration...');
        for (const statement of statements) {
            if (statement.trim()) {
                try {
                    await connection.execute(statement);
                    console.log('✅ Executed:', statement.substring(0, 50) + '...');
                } catch (error) {
                    // Ignore "Duplicate column" errors (column already exists)
                    if (error.code === 'ER_DUP_FIELDNAME') {
                        console.log('⚠️  Column already exists, skipping:', statement.substring(0, 50) + '...');
                    } else {
                        throw error;
                    }
                }
            }
        }

        console.log('✅ Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

runMigration();

