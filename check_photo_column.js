/**
 * Check if photo column exists in climbers table
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkPhotoColumn() {
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '272800',
            database: process.env.DB_NAME || 'fpti_karanganyar',
            port: process.env.DB_PORT || 3306
        });

        console.log('✅ Connected to database');
        console.log(`📊 Database: ${process.env.DB_NAME || 'fpti_karanganyar'}`);

        // Check climbers table structure
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = ?
            AND TABLE_NAME = 'climbers'
            ORDER BY ORDINAL_POSITION
        `, [process.env.DB_NAME || 'fpti_karanganyar']);

        console.log('\n📋 Columns in climbers table:');
        columns.forEach(col => {
            const hasPhoto = col.COLUMN_NAME === 'photo' ? ' ⭐' : '';
            console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE})${hasPhoto}`);
        });

        const hasPhoto = columns.some(col => col.COLUMN_NAME === 'photo');
        
        console.log('');
        if (hasPhoto) {
            console.log('✅ Photo column EXISTS in climbers table');
        } else {
            console.log('❌ Photo column DOES NOT EXIST in climbers table');
            console.log('⚠️  Please run: node run_migration_photo.js');
        }

        // Check speed_climbers table
        const [speedColumns] = await connection.execute(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = ?
            AND TABLE_NAME = 'speed_climbers'
            ORDER BY ORDINAL_POSITION
        `, [process.env.DB_NAME || 'fpti_karanganyar']);

        console.log('\n📋 Columns in speed_climbers table:');
        speedColumns.forEach(col => {
            const hasPhoto = col.COLUMN_NAME === 'photo' ? ' ⭐' : '';
            console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE})${hasPhoto}`);
        });

        const speedHasPhoto = speedColumns.some(col => col.COLUMN_NAME === 'photo');
        
        console.log('');
        if (speedHasPhoto) {
            console.log('✅ Photo column EXISTS in speed_climbers table');
        } else {
            console.log('❌ Photo column DOES NOT EXIST in speed_climbers table');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Database connection closed');
        }
    }
}

checkPhotoColumn()
    .then(() => {
        console.log('\n✅ Check completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Check failed:', error);
        process.exit(1);
    });

