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
        const dbPassword = process.env.DB_PASSWORD || 'c290^&uz%Fm@i.oy'; // Default from server.js
        const dbHost = process.env.DB_HOST || '127.0.0.1';
        const dbUser = process.env.DB_USER || 'emsimemy_db';
        const dbName = process.env.DB_NAME || 'emsimemy_db';
        
        console.log(`[MIGRATION] 🔌 Connecting to database: ${dbUser}@${dbHost}/${dbName}`);
        
        // Create connection
        connection = await mysql.createConnection({
            host: dbHost,
            user: dbUser,
            password: dbPassword,
            database: dbName,
            multipleStatements: true, // Allow multiple SQL statements
            // Fix authentication plugin issue
            authPlugin: 'mysql_native_password',
            ssl: false
        });
        
        console.log('[MIGRATION] ✅ Connected to database');
        
        // Get migration file from command line argument or use default
        const migrationFileName = process.argv[2] || 'migration_add_audit_logs.sql';
        const migrationFile = path.join(__dirname, 'database', migrationFileName);
        
        if (!fs.existsSync(migrationFile)) {
            // List available migration files
            const databaseDir = path.join(__dirname, 'database');
            const availableMigrations = fs.readdirSync(databaseDir)
                .filter(f => f.endsWith('.sql') && f.startsWith('migration_'))
                .sort();
            
            console.error(`[MIGRATION] ❌ Migration file not found: ${migrationFileName}`);
            console.error(`[MIGRATION] 📁 Available migration files:`);
            availableMigrations.forEach(file => {
                console.error(`   - ${file}`);
            });
            console.error(`\n[MIGRATION] 💡 Usage: node run_migration.js <migration_file_name>`);
            console.error(`[MIGRATION] 💡 Example: node run_migration.js migration_add_competition_metadata.sql`);
            throw new Error(`Migration file not found: ${migrationFileName}`);
        }
        
        console.log(`[MIGRATION] 📄 Reading migration file: ${migrationFileName}`);
        
        // Read migration file
        const sql = fs.readFileSync(migrationFile, 'utf8');
        
        // Remove USE statement (we're already connected to the database)
        let sqlContent = sql.replace(/USE\s+\w+;/gi, '');
        
        // Handle migration_add_competition_metadata.sql specially
        // (It uses PREPARE/EXECUTE which needs query() instead of execute())
        if (migrationFileName === 'migration_add_competition_metadata.sql') {
            console.log('[MIGRATION] 📝 Handling dynamic SQL statements...');
            
            // Add location column
            const [locationColumns] = await connection.execute(
                `SELECT COLUMN_NAME 
                 FROM INFORMATION_SCHEMA.COLUMNS 
                 WHERE TABLE_SCHEMA = ? 
                 AND TABLE_NAME = 'competitions' 
                 AND COLUMN_NAME = 'location'`,
                [dbName]
            );
            if (locationColumns.length === 0) {
                await connection.query(`ALTER TABLE competitions ADD COLUMN location VARCHAR(255) NULL`);
                console.log('[MIGRATION] ✅ Added column location to competitions');
            } else {
                console.log('[MIGRATION] ⏭️  Column location already exists, skipping');
            }
            
            // Add event_date column
            const [dateColumns] = await connection.execute(
                `SELECT COLUMN_NAME 
                 FROM INFORMATION_SCHEMA.COLUMNS 
                 WHERE TABLE_SCHEMA = ? 
                 AND TABLE_NAME = 'competitions' 
                 AND COLUMN_NAME = 'event_date'`,
                [dbName]
            );
            if (dateColumns.length === 0) {
                await connection.query(`ALTER TABLE competitions ADD COLUMN event_date DATE NULL`);
                console.log('[MIGRATION] ✅ Added column event_date to competitions');
            } else {
                console.log('[MIGRATION] ⏭️  Column event_date already exists, skipping');
            }
            
            // Add round column
            const [roundColumns] = await connection.execute(
                `SELECT COLUMN_NAME 
                 FROM INFORMATION_SCHEMA.COLUMNS 
                 WHERE TABLE_SCHEMA = ? 
                 AND TABLE_NAME = 'competitions' 
                 AND COLUMN_NAME = 'round'`,
                [dbName]
            );
            if (roundColumns.length === 0) {
                await connection.query(`ALTER TABLE competitions ADD COLUMN round ENUM('qualification', 'semifinal', 'final') DEFAULT 'qualification' AFTER status`);
                console.log('[MIGRATION] ✅ Added column round to competitions');
            } else {
                console.log('[MIGRATION] ⏭️  Column round already exists, skipping');
            }
        } else {
            // Standard migration processing
            const sqlStatements = sqlContent
                .split(';')
                .map(s => s.trim())
                .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('SET @'));
            
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
        }
        
        console.log('[MIGRATION] ✅ Migration completed successfully!');
        if (migrationFileName === 'migration_add_competition_metadata.sql') {
            console.log('[MIGRATION] 📊 Tables created/updated:');
            console.log('   - competitions (added location, event_date, round columns)');
        } else {
            console.log('[MIGRATION] 📊 Tables created/updated:');
            console.log('   - audit_logs (new)');
            console.log('   - speed_qualification_scores (added is_finalized column)');
            console.log('   - speed_finals_matches (added is_finalized column)');
            console.log('   - scores (added is_locked column)');
        }
        
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

