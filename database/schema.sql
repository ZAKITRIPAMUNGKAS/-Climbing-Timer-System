-- Database Schema untuk FPTI Karanganyar Admin Dashboard
-- Jalankan script ini untuk membuat database dan tables
-- Note: Ganti 'emsimemy_db' dengan nama database Anda jika berbeda

CREATE DATABASE IF NOT EXISTS emsimemy_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE emsimemy_db;

-- Table Users untuk authentication
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'judge', 'timer') DEFAULT 'judge',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table Athletes
CREATE TABLE IF NOT EXISTS athletes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    school VARCHAR(255) NOT NULL,
    achievement TEXT,
    image VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table Schedules
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table News
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default admin user (password: admin123)
-- Password akan di-hash dengan bcrypt
INSERT INTO users (username, password, role) VALUES 
('admin', '$2a$10$rOzJ8KqJqJqJqJqJqJqJqOqJ8KqJqJqJqJqJqJqJqJqJqJqJqJqJq', 'admin');

-- Note: Default password adalah 'admin123'
-- Silakan ubah password setelah login pertama kali

-- ============================================
-- LIVE SCORE BOULDER SYSTEM TABLES
-- ============================================

-- Table Competitions (Event/Kompetisi)
CREATE TABLE IF NOT EXISTS competitions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    status ENUM('active', 'finished') DEFAULT 'active',
    total_boulders INT DEFAULT 4,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table Climbers (Atlet yang ikut kompetisi)
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table Scores (Tabel transaksi utama untuk skor)
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table Judges (Juri untuk authentication)
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SPEED CLIMBING (CLASSIC) SYSTEM TABLES
-- ============================================

-- Table Speed Competitions (Kompetisi Speed Climbing)
CREATE TABLE IF NOT EXISTS speed_competitions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    status ENUM('qualification', 'finals', 'finished') DEFAULT 'qualification',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table Speed Climbers (Atlet Speed Climbing)
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table Speed Qualification Scores (Kualifikasi: 2 lanes)
CREATE TABLE IF NOT EXISTS speed_qualification_scores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    speed_competition_id INT NOT NULL,
    climber_id INT NOT NULL,
    lane_a_time DECIMAL(6,3) DEFAULT NULL, -- e.g., 6.500 (3 decimal precision)
    lane_b_time DECIMAL(6,3) DEFAULT NULL, -- e.g., 6.300 (3 decimal precision)
    lane_a_status ENUM('VALID', 'FALL', 'FALSE_START', 'DNS') DEFAULT 'VALID',
    lane_b_status ENUM('VALID', 'FALL', 'FALSE_START', 'DNS') DEFAULT 'VALID',
    total_time DECIMAL(7,3) DEFAULT NULL, -- Calculated: lane_a_time + lane_b_time (3 decimal precision)
    status ENUM('VALID', 'INVALID') DEFAULT 'VALID', -- INVALID if any lane has FALL/FS/DNS
    rank INT DEFAULT NULL, -- Calculated rank
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (speed_competition_id) REFERENCES speed_competitions(id) ON DELETE CASCADE,
    FOREIGN KEY (climber_id) REFERENCES speed_climbers(id) ON DELETE CASCADE,
    UNIQUE KEY unique_speed_qualification (speed_competition_id, climber_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table Speed Finals Matches (Head-to-Head Matches)
CREATE TABLE IF NOT EXISTS speed_finals_matches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    speed_competition_id INT NOT NULL,
    stage ENUM('Round of 16', 'Quarter Final', 'Semi Final', 'Small Final', 'Big Final') NOT NULL,
    climber_a_id INT NOT NULL,
    climber_b_id INT NULL, -- NULL for BYE (Walkover) cases
    time_a DECIMAL(6,3) DEFAULT NULL, -- 3 decimal precision
    time_b DECIMAL(6,3) DEFAULT NULL, -- 3 decimal precision
    status_a ENUM('VALID', 'FALL', 'FALSE_START', 'DNS') DEFAULT 'VALID',
    status_b ENUM('VALID', 'FALL', 'FALSE_START', 'DNS') DEFAULT 'VALID',
    winner_id INT DEFAULT NULL, -- Auto-calculated: climber with lower time
    match_order INT DEFAULT 0, -- Order within the stage
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (speed_competition_id) REFERENCES speed_competitions(id) ON DELETE CASCADE,
    FOREIGN KEY (climber_a_id) REFERENCES speed_climbers(id) ON DELETE CASCADE,
    FOREIGN KEY (climber_b_id) REFERENCES speed_climbers(id) ON DELETE CASCADE,
    FOREIGN KEY (winner_id) REFERENCES speed_climbers(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

