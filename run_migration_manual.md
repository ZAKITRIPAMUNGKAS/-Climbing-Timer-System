# Manual Migration Instructions

## Option 1: Using MySQL Command Line (PowerShell)

```powershell
# Read SQL file and execute
$sql = Get-Content database/migration_add_audit_logs.sql -Raw
mysql -u root -p fpti_karanganyar -e $sql
```

## Option 2: Using MySQL Workbench or phpMyAdmin

1. Open MySQL Workbench or phpMyAdmin
2. Connect to your database
3. Select database: `fpti_karanganyar`
4. Open `database/migration_add_audit_logs.sql`
5. Copy and paste the SQL content
6. Execute

## Option 3: Using Node.js Script

```bash
node -e "const mysql = require('mysql2/promise'); const fs = require('fs'); (async () => { const pool = mysql.createPool({host: '127.0.0.1', user: 'root', password: 'YOUR_PASSWORD', database: 'fpti_karanganyar'}); const sql = fs.readFileSync('database/migration_add_audit_logs.sql', 'utf8'); await pool.query(sql); console.log('Migration complete!'); process.exit(0); })();"
```

## Option 4: Direct SQL Execution

Connect to MySQL and run:

```sql
USE fpti_karanganyar;

CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT,
    details JSON,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE speed_qualification_scores 
ADD COLUMN IF NOT EXISTS is_finalized BOOLEAN DEFAULT FALSE;

ALTER TABLE speed_finals_matches 
ADD COLUMN IF NOT EXISTS is_finalized BOOLEAN DEFAULT FALSE;

ALTER TABLE scores 
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;
```

