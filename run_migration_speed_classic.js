const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
    let connection;
    
    try {
        // Create connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'timer_panjat',
            multipleStatements: true
        });

        console.log('✅ Connected to database');
        
        // Read migration SQL file
        const migrationPath = path.join(__dirname, 'database', 'migration_speed_classic_two_runs.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        console.log('🔄 Running migration: Speed Classic Two Runs...');
        
        // Execute migration
        await connection.query(migrationSQL);
        
        console.log('✅ Migration completed successfully!');
        console.log('   - Added columns for two-run support:');
        console.log('     * climber_a_run1_time, climber_a_run2_time, climber_a_total_time');
        console.log('     * climber_b_run1_time, climber_b_run2_time, climber_b_total_time');
        console.log('     * Status columns for each run');
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        
        // Check if columns already exist (safe to ignore)
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('⚠️  Some columns already exist. Migration may have been run before.');
            console.log('   This is safe to ignore if you are re-running the migration.');
        } else {
            process.exit(1);
        }
    } finally {
        if (connection) {
            await connection.end();
            console.log('✅ Database connection closed');
        }
    }
}

// Run migration
runMigration();

