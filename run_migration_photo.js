/**
 * Run Photo Column Migration
 * Adds photo column to climbers and speed_climbers tables
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
    let connection;
    
    try {
        // Connect to database
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '272800',
            database: process.env.DB_NAME || 'fpti_karanganyar',
            port: process.env.DB_PORT || 3306,
            authPlugin: 'mysql_native_password'
        });

        console.log('✅ Connected to database');

        // Read migration file
        const migrationPath = path.join(__dirname, 'database', 'migration_add_photo_to_climbers.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        console.log('📝 Running photo column migration...');

        // Execute SQL statements directly
        const sqlStatements = [
            'ALTER TABLE climbers ADD COLUMN photo VARCHAR(500) DEFAULT NULL AFTER team',
            'ALTER TABLE speed_climbers ADD COLUMN photo VARCHAR(500) DEFAULT NULL AFTER team'
        ];

        console.log(`\n📋 Found ${sqlStatements.length} SQL statements to execute`);

        for (const statement of sqlStatements) {
            try {
                console.log(`\n📝 Executing: ${statement}`);
                await connection.query(statement);
                console.log(`✅ Successfully executed`);
            } catch (error) {
                // Check if column already exists
                if (error.code === 'ER_DUP_FIELDNAME') {
                    console.log(`⚠️  Column already exists, skipping: ${error.message}`);
                } else {
                    console.error(`❌ Error: ${error.message}`);
                    console.error(`   Error code: ${error.code}`);
                    console.error(`   SQL: ${statement}`);
                    throw error;
                }
            }
        }

        console.log('');
        console.log('✅ Photo column migration completed successfully!');
        console.log('📊 Columns added:');
        console.log('  - climbers.photo');
        console.log('  - speed_climbers.photo');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run migration
runMigration()
    .then(() => {
        console.log('✅ Migration script completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Migration script failed:', error);
        process.exit(1);
    });
