// Script untuk initialize database dan create default admin user
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function initDatabase() {
    let connection;
    
    try {
        // Connect tanpa database dulu untuk create database
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '272800',
            port: process.env.DB_PORT || 3306
        });

        console.log('Creating database...');
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'fpti_karanganyar'} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        await connection.query(`USE ${process.env.DB_NAME || 'fpti_karanganyar'}`);

        console.log('Creating tables...');
        
        // Users table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(100) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Athletes table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS athletes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                category VARCHAR(100) NOT NULL,
                age INT NOT NULL,
                achievement TEXT,
                image VARCHAR(500),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Schedules table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS schedules (
                id INT AUTO_INCREMENT PRIMARY KEY,
                date VARCHAR(100) NOT NULL,
                title VARCHAR(255) NOT NULL,
                location VARCHAR(255) NOT NULL,
                time VARCHAR(100) NOT NULL,
                status ENUM('upcoming', 'past') DEFAULT 'upcoming',
                category VARCHAR(100) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // News table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS news (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                category VARCHAR(100) NOT NULL,
                color VARCHAR(50) DEFAULT 'crimson',
                date VARCHAR(100) NOT NULL,
                description TEXT,
                image VARCHAR(500),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Competitions table (Live Score Boulder)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS competitions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                status ENUM('active', 'finished') DEFAULT 'active',
                total_boulders INT DEFAULT 4,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Climbers table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS climbers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                competition_id INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                bib_number INT NOT NULL,
                team VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE,
                UNIQUE KEY unique_competition_bib (competition_id, bib_number)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Scores table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS scores (
                id INT AUTO_INCREMENT PRIMARY KEY,
                competition_id INT NOT NULL,
                climber_id INT NOT NULL,
                boulder_number INT NOT NULL,
                attempts INT DEFAULT 0,
                reached_zone BOOLEAN DEFAULT FALSE,
                reached_top BOOLEAN DEFAULT FALSE,
                zone_attempt INT DEFAULT NULL,
                top_attempt INT DEFAULT NULL,
                is_finalized BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE,
                FOREIGN KEY (climber_id) REFERENCES climbers(id) ON DELETE CASCADE,
                UNIQUE KEY unique_climber_boulder (competition_id, climber_id, boulder_number)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Judges table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS judges (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(100) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                competition_id INT,
                boulder_number INT,
                role ENUM('judge', 'admin') DEFAULT 'judge',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

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

        // Check if admin user exists
        const [users] = await connection.query('SELECT * FROM users WHERE username = ?', ['admin']);
        
        if (users.length === 0) {
            console.log('Creating default admin user...');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await connection.query(
                'INSERT INTO users (username, password) VALUES (?, ?)',
                ['admin', hashedPassword]
            );
            console.log('✅ Default admin user created!');
            console.log('   Username: admin');
            console.log('   Password: admin123');
            console.log('   ⚠️  Please change password after first login!');
        } else {
            console.log('Admin user already exists.');
        }

        console.log('✅ Database initialized successfully!');
        
    } catch (error) {
        console.error('❌ Error initializing database:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

initDatabase();

