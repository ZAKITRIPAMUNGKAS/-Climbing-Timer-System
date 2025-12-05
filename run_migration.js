/**
 * Node.js script to run database migration
 * Usage: node run_migration.js
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
    let connection;
    
    try {
        // Get database credentials
        const dbPassword = process.env.DB_PASSWORD || '272800'; // Default from server.js
        const dbHost = process.env.DB_HOST || '127.0.0.1';
        const dbUser = process.env.DB_USER || 'root';
        const dbName = process.env.DB_NAME || 'fpti_karanganyar';
        
        console.log(`[MIGRATION] 🔌 Connecting to database: ${dbUser}@${dbHost}/${dbName}`);
        
        // Create connection
        connection = await mysql.createConnection({
            host: dbHost,
            user: dbUser,
            password: dbPassword,
            database: dbName,
            multipleStatements: true // Allow multiple SQL statements
        });
        
        console.log('[MIGRATION] ✅ Connected to database');
        
        // Read migration file
        const migrationFile = path.join(__dirname, 'database', 'migration_add_audit_logs.sql');
        const sql = fs.readFileSync(migrationFile, 'utf8');
        
        // Remove USE statement (we're already connected to the database)
        const sqlStatements = sql
            .replace(/USE\s+\w+;/gi, '')
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));
        
        console.log('[MIGRATION] 📝 Executing migration statements...');
        
        // Execute each statement
        for (let i = 0; i < sqlStatements.length; i++) {
            const statement = sqlStatements[i];
            if (statement.length > 0) {
                try {
                    // Handle ALTER TABLE with IF NOT EXISTS (MySQL 8.0+)
                    if (statement.includes('ADD COLUMN IF NOT EXISTS')) {
                        // Check if column exists first
                        const tableMatch = statement.match(/ALTER TABLE\s+(\w+)/i);
                        const columnMatch = statement.match(/ADD COLUMN\s+IF NOT EXISTS\s+(\w+)/i);
                        
                        if (tableMatch && columnMatch) {
                            const tableName = tableMatch[1];
                            const columnName = columnMatch[1];
                            
                            // Check if column exists
                            const [columns] = await connection.execute(
                                `SELECT COLUMN_NAME 
                                 FROM INFORMATION_SCHEMA.COLUMNS 
                                 WHERE TABLE_SCHEMA = ? 
                                 AND TABLE_NAME = ? 
                                 AND COLUMN_NAME = ?`,
                                [dbName, tableName, columnName]
                            );
                            
                            if (columns.length === 0) {
                                // Column doesn't exist, add it
                                const alterStatement = statement.replace('IF NOT EXISTS', '');
                                await connection.execute(alterStatement);
                                console.log(`[MIGRATION] ✅ Added column ${columnName} to ${tableName}`);
                            } else {
                                console.log(`[MIGRATION] ⏭️  Column ${columnName} already exists in ${tableName}, skipping`);
                            }
                        } else {
                            await connection.execute(statement);
                            console.log(`[MIGRATION] ✅ Executed statement ${i + 1}`);
                        }
                    } else {
                        await connection.execute(statement);
                        console.log(`[MIGRATION] ✅ Executed statement ${i + 1}`);
                    }
                } catch (error) {
                    // Ignore "already exists" errors
                    if (error.code === 'ER_DUP_TABLE' || 
                        error.code === 'ER_DUP_FIELDNAME' ||
                        error.message.includes('already exists')) {
                        console.log(`[MIGRATION] ⏭️  Statement ${i + 1} skipped (already exists)`);
                    } else {
                        throw error;
                    }
                }
            }
        }
        
        console.log('[MIGRATION] ✅ Migration completed successfully!');
        console.log('[MIGRATION] 📊 Tables created/updated:');
        console.log('   - audit_logs (new)');
        console.log('   - speed_qualification_scores (added is_finalized column)');
        console.log('   - speed_finals_matches (added is_finalized column)');
        console.log('   - scores (added is_locked column)');
        
    } catch (error) {
        console.error('[MIGRATION] ❌ Error running migration:', error.message);
        console.error('[MIGRATION] Error details:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('[MIGRATION] 🔌 Database connection closed');
        }
    }
}

// Run migration
runMigration();

