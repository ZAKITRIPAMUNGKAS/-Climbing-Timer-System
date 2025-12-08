// Script untuk cleanup data dengan image yang tidak ada
// Menghapus reference ke file image yang tidak ditemukan di filesystem

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function cleanupMissingImages() {
    let connection = null;
    
    try {
        // Connect to database
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            user: process.env.DB_USER || 'emsimemy_db',
            password: process.env.DB_PASSWORD || 'c290^&uz%Fm@i.oy',
            database: process.env.DB_NAME || 'emsimemy_db',
            port: process.env.DB_PORT || 3306,
            // Fix authentication plugin issue
            authPlugin: 'mysql_native_password',
            ssl: false
        });

        console.log('[CLEANUP] ✅ Connected to database');
        
        const publicDir = path.join(__dirname, '..', 'public');
        
        // Cleanup athletes with missing images
        console.log('[CLEANUP] Checking athletes...');
        const [athletes] = await connection.execute('SELECT id, name, image FROM athletes WHERE image IS NOT NULL');
        
        let athletesUpdated = 0;
        for (const athlete of athletes) {
            if (athlete.image) {
                const imagePath = path.join(publicDir, athlete.image);
                if (!fs.existsSync(imagePath)) {
                    console.log(`[CLEANUP] ❌ Missing image for athlete ${athlete.id} (${athlete.name}): ${athlete.image}`);
                    await connection.execute('UPDATE athletes SET image = NULL WHERE id = ?', [athlete.id]);
                    athletesUpdated++;
                }
            }
        }
        
        // Cleanup news with missing images
        console.log('[CLEANUP] Checking news...');
        const [news] = await connection.execute('SELECT id, title, image FROM news WHERE image IS NOT NULL');
        
        let newsUpdated = 0;
        for (const item of news) {
            if (item.image) {
                const imagePath = path.join(publicDir, item.image);
                if (!fs.existsSync(imagePath)) {
                    console.log(`[CLEANUP] ❌ Missing image for news ${item.id} (${item.title}): ${item.image}`);
                    await connection.execute('UPDATE news SET image = NULL WHERE id = ?', [item.id]);
                    newsUpdated++;
                }
            }
        }
        
        console.log(`[CLEANUP] ✅ Cleanup complete!`);
        console.log(`[CLEANUP] - Athletes updated: ${athletesUpdated}`);
        console.log(`[CLEANUP] - News updated: ${newsUpdated}`);
        
    } catch (error) {
        console.error('[CLEANUP] ❌ Error:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('[CLEANUP] 🔌 Database connection closed');
        }
    }
}

cleanupMissingImages();

