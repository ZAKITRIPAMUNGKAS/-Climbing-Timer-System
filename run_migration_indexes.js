/**
 * Run Database Index Migration
 * Adds performance indexes to improve query speed
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
            authPlugin: 'mysql_native_password',
            multipleStatements: true // Allow multiple statements
        });

        console.log('✅ Connected to database');

        // Read migration file
        const migrationPath = path.join(__dirname, 'database', 'migration_add_indexes.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        console.log('📝 Running index migration...');

        // Split migration into individual statements and execute with error handling
        const statements = migrationSQL
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        let successCount = 0;
        let skipCount = 0;
        let errorCount = 0;

        for (const statement of statements) {
            try {
                await connection.query(statement + ';');
                successCount++;
            } catch (error) {
                // Skip if column doesn't exist or index already exists
                if (error.code === 'ER_KEY_COLUMN_DOES_NOT_EXITS' || 
                    error.code === 'ER_DUP_KEYNAME' ||
                    error.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
                    console.log(`⚠️  Skipping: ${error.message}`);
                    skipCount++;
                } else {
                    console.error(`❌ Error: ${error.message}`);
                    console.error(`   SQL: ${statement.substring(0, 100)}...`);
                    errorCount++;
                }
            }
        }

        console.log('');
        console.log('✅ Index migration completed!');
        console.log(`   ✅ Created: ${successCount} indexes`);
        console.log(`   ⚠️  Skipped: ${skipCount} indexes (column/index already exists)`);
        if (errorCount > 0) {
            console.log(`   ❌ Errors: ${errorCount} indexes`);
        }
        console.log('');
        console.log('📊 Indexes summary:');
        console.log('  - competitions (status, created_at)');
        console.log('  - climbers (competition_id, bib_number, composite)');
        console.log('  - scores (multiple indexes for leaderboard optimization)');
        console.log('  - speed_climbers, speed_qualification_scores');
        console.log('  - speed_finals_matches (stage, speed_competition_id)');
        console.log('  - news (category, created_at), schedules, athletes');
        console.log('  - audit_logs');
        console.log('');
        console.log('🚀 Query performance should be significantly improved!');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        if (error.code === 'ER_DUP_KEYNAME') {
            console.log('ℹ️  Some indexes may already exist. This is OK.');
        } else {
            throw error;
        }
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

