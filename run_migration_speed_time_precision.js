const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '272800',
    database: process.env.DB_NAME || 'fpti_karanganyar',
    port: process.env.DB_PORT || 3306
};

async function runMigration() {
    let connection;
    try {
        console.log('🔄 Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database');

        console.log('🔄 Updating speed_qualification_scores table...');
        await connection.execute(
            'ALTER TABLE speed_qualification_scores MODIFY COLUMN lane_a_time DECIMAL(6,3) DEFAULT NULL'
        );
        console.log('✅ Updated lane_a_time to DECIMAL(6,3)');

        await connection.execute(
            'ALTER TABLE speed_qualification_scores MODIFY COLUMN lane_b_time DECIMAL(6,3) DEFAULT NULL'
        );
        console.log('✅ Updated lane_b_time to DECIMAL(6,3)');

        await connection.execute(
            'ALTER TABLE speed_qualification_scores MODIFY COLUMN total_time DECIMAL(7,3) DEFAULT NULL'
        );
        console.log('✅ Updated total_time to DECIMAL(7,3)');

        console.log('🔄 Updating speed_finals_matches table...');
        await connection.execute(
            'ALTER TABLE speed_finals_matches MODIFY COLUMN time_a DECIMAL(6,3) DEFAULT NULL'
        );
        console.log('✅ Updated time_a to DECIMAL(6,3)');

        await connection.execute(
            'ALTER TABLE speed_finals_matches MODIFY COLUMN time_b DECIMAL(6,3) DEFAULT NULL'
        );
        console.log('✅ Updated time_b to DECIMAL(6,3)');

        console.log('✅ Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('Error details:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

runMigration();

