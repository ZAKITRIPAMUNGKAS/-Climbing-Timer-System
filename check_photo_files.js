/**
 * Check photo files in database and filesystem
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function checkPhotos() {
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '272800',
            database: process.env.DB_NAME || 'fpti_karanganyar',
            port: process.env.DB_PORT || 3306
        });

        console.log('✅ Connected to database\n');

        // Get climbers with photos
        const [climbers] = await connection.execute(`
            SELECT id, name, bib_number, photo 
            FROM climbers 
            WHERE photo IS NOT NULL AND photo != ''
            ORDER BY id
            LIMIT 10
        `);

        console.log(`📊 Found ${climbers.length} climbers with photos:\n`);

        const publicDir = path.join(__dirname, 'public');
        const uploadsDir = path.join(publicDir, 'uploads');

        for (const climber of climbers) {
            console.log(`Climber ID: ${climber.id} - ${climber.name}`);
            console.log(`  Photo path in DB: ${climber.photo}`);
            
            // Check if file exists
            const photoPath = path.join(publicDir, climber.photo);
            const exists = fs.existsSync(photoPath);
            
            console.log(`  Full path: ${photoPath}`);
            console.log(`  File exists: ${exists ? '✅ YES' : '❌ NO'}`);
            
            if (exists) {
                const stats = fs.statSync(photoPath);
                console.log(`  File size: ${(stats.size / 1024).toFixed(2)} KB`);
                console.log(`  Modified: ${stats.mtime}`);
            }
            
            // Check uploads directory
            if (climber.photo.startsWith('/uploads/')) {
                const filename = climber.photo.replace('/uploads/', '');
                const uploadPath = path.join(uploadsDir, filename);
                const uploadExists = fs.existsSync(uploadPath);
                console.log(`  In uploads dir: ${uploadExists ? '✅ YES' : '❌ NO'}`);
                if (uploadExists) {
                    console.log(`  Upload path: ${uploadPath}`);
                }
            }
            
            console.log('');
        }

        // List files in uploads directory
        console.log('\n📁 Files in uploads directory:');
        if (fs.existsSync(uploadsDir)) {
            const files = fs.readdirSync(uploadsDir);
            console.log(`  Found ${files.length} files:`);
            files.slice(0, 10).forEach(file => {
                const filePath = path.join(uploadsDir, file);
                const stats = fs.statSync(filePath);
                console.log(`    - ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
            });
            if (files.length > 10) {
                console.log(`    ... and ${files.length - 10} more files`);
            }
        } else {
            console.log('  ❌ Uploads directory does not exist!');
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

checkPhotos()
    .then(() => {
        console.log('\n✅ Check completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Check failed:', error);
        process.exit(1);
    });

