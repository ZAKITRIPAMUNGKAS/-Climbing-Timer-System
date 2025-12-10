const mysql = require('mysql2/promise');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

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

        // Check if school column exists
        const [columns] = await connection.execute(
            "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'athletes' AND COLUMN_NAME = 'school'"
        );
        
        if (columns.length > 0) {
            console.log('✅ School column already exists');
            return;
        }

        // Check if age column exists
        const [ageColumns] = await connection.execute(
            "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'athletes' AND COLUMN_NAME = 'age'"
        );

        if (ageColumns.length > 0) {
            console.log('🔄 Renaming age column to school...');
            await connection.execute(
                'ALTER TABLE athletes CHANGE COLUMN age school VARCHAR(255) NOT NULL DEFAULT ""'
            );
            console.log('✅ Successfully renamed age to school');
        } else {
            console.log('🔄 Adding school column...');
            await connection.execute(
                'ALTER TABLE athletes ADD COLUMN school VARCHAR(255) NOT NULL DEFAULT ""'
            );
            console.log('✅ Successfully added school column');
        }

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

