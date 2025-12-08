// Script khusus untuk membuat tabel-tabel Speed Climbing
const mysql = require('mysql2/promise');
require('dotenv').config();

async function createSpeedTables() {
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            user: process.env.DB_USER || 'emsimemy_db',
            password: process.env.DB_PASSWORD || 'c290^&uz%Fm@i.oy',
            port: process.env.DB_PORT || 3306,
            database: process.env.DB_NAME || 'emsimemy_db',
            // Fix authentication plugin issue
            authPlugin: 'mysql_native_password',
            ssl: false
        });

        console.log('Creating Speed Climbing tables...');
        
        // Speed Competitions table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS speed_competitions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                status ENUM('qualification', 'finals', 'finished') DEFAULT 'qualification',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ speed_competitions table created');

        // Speed Climbers table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS speed_climbers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                speed_competition_id INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                bib_number INT NOT NULL,
                team VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (speed_competition_id) REFERENCES speed_competitions(id) ON DELETE CASCADE,
                UNIQUE KEY unique_speed_competition_bib (speed_competition_id, bib_number)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ speed_climbers table created');

        // Speed Qualification Scores table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS speed_qualification_scores (
                id INT AUTO_INCREMENT PRIMARY KEY,
                speed_competition_id INT NOT NULL,
                climber_id INT NOT NULL,
                lane_a_time DECIMAL(5,2) DEFAULT NULL,
                lane_b_time DECIMAL(5,2) DEFAULT NULL,
                lane_a_status ENUM('VALID', 'FALL', 'FALSE_START', 'DNS') DEFAULT 'VALID',
                lane_b_status ENUM('VALID', 'FALL', 'FALSE_START', 'DNS') DEFAULT 'VALID',
                total_time DECIMAL(6,2) DEFAULT NULL,
                status ENUM('VALID', 'INVALID') DEFAULT 'VALID',
                rank INT DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (speed_competition_id) REFERENCES speed_competitions(id) ON DELETE CASCADE,
                FOREIGN KEY (climber_id) REFERENCES speed_climbers(id) ON DELETE CASCADE,
                UNIQUE KEY unique_speed_qualification (speed_competition_id, climber_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ speed_qualification_scores table created');

        // Speed Finals Matches table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS speed_finals_matches (
                id INT AUTO_INCREMENT PRIMARY KEY,
                speed_competition_id INT NOT NULL,
                stage ENUM('Round of 16', 'Quarter Final', 'Semi Final', 'Small Final', 'Big Final') NOT NULL,
                climber_a_id INT NOT NULL,
                climber_b_id INT NOT NULL,
                time_a DECIMAL(5,2) DEFAULT NULL,
                time_b DECIMAL(5,2) DEFAULT NULL,
                status_a ENUM('VALID', 'FALL', 'FALSE_START', 'DNS') DEFAULT 'VALID',
                status_b ENUM('VALID', 'FALL', 'FALSE_START', 'DNS') DEFAULT 'VALID',
                winner_id INT DEFAULT NULL,
                match_order INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (speed_competition_id) REFERENCES speed_competitions(id) ON DELETE CASCADE,
                FOREIGN KEY (climber_a_id) REFERENCES speed_climbers(id) ON DELETE CASCADE,
                FOREIGN KEY (climber_b_id) REFERENCES speed_climbers(id) ON DELETE CASCADE,
                FOREIGN KEY (winner_id) REFERENCES speed_climbers(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ speed_finals_matches table created');

        console.log('✅ All Speed Climbing tables created successfully!');
        
    } catch (error) {
        console.error('❌ Error creating Speed Climbing tables:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

createSpeedTables();

