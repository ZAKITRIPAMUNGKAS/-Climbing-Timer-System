// Script untuk update password admin
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function updateAdminPassword() {
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '272800',
            database: process.env.DB_NAME || 'fpti_karanganyar',
            port: process.env.DB_PORT || 3306
        });

        console.log('Updating admin password...');
        
        // Hash password baru
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        // Update password admin
        const [result] = await connection.query(
            'UPDATE users SET password = ? WHERE username = ?',
            [hashedPassword, 'admin']
        );

        if (result.affectedRows > 0) {
            console.log('✅ Admin password updated successfully!');
            console.log('   Username: admin');
            console.log('   Password: admin123');
        } else {
            console.log('⚠️  Admin user not found. Creating new admin user...');
            await connection.query(
                'INSERT INTO users (username, password) VALUES (?, ?)',
                ['admin', hashedPassword]
            );
            console.log('✅ Admin user created!');
        }
        
    } catch (error) {
        console.error('❌ Error updating password:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

updateAdminPassword();

