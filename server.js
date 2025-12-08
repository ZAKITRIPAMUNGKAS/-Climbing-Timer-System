const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const os = require('os');
const { SitemapStream, streamToPromise } = require('sitemap');
const mysql = require('mysql2/promise');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
require('dotenv').config();
// const { SerialPort } = require('serialport'); // Uncomment ketika hardware ready

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const fs = require('fs');

// ============================================
// MYSQL DATABASE CONNECTION
// ============================================
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '272800',
    database: process.env.DB_NAME || 'fpti_karanganyar',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // Fix authentication plugin issue
    authPlugin: 'mysql_native_password',
    // Additional connection options
    ssl: false,
    reconnect: true
};

const pool = mysql.createPool(dbConfig);

// MySQL Session Store configuration for production
const sessionStore = new MySQLStore({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '272800',
    database: process.env.DB_NAME || 'fpti_karanganyar',
    port: process.env.DB_PORT || 3306,
    createDatabaseTable: true, // Auto-create sessions table if not exists
    schema: {
        tableName: 'sessions',
        columnNames: {
            session_id: 'session_id',
            expires: 'expires',
            data: 'data'
        }
    },
    clearExpired: true,
    checkExpirationInterval: 900000, // Check every 15 minutes
    expiration: 86400000, // 24 hours
    // Fix authentication plugin issue
    connectionLimit: 10,
    reconnect: true
}, pool);

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'fpti-karanganyar-secret-key-change-in-production',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production' && process.env.HTTPS === 'true', // Set true jika menggunakan HTTPS
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true,
        sameSite: 'lax'
    },
    name: 'fpti.session' // Custom session name
}));

// Test database connection
pool.getConnection()
    .then(connection => {
        console.log('[DB] ✅ MySQL connected successfully');
        connection.release();
    })
    .catch(err => {
        console.error('[DB] ❌ MySQL connection error:', err.message);
        console.error('[DB] Please make sure MySQL is running and database exists.');
        console.error('[DB] Run: node database/init.js to initialize database');
    });

// ============================================
// MULTER CONFIGURATION (File Upload)
// ============================================
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: fileFilter
});

// Multer for CSV/Excel files (for bulk upload)
const csvFileFilter = (req, file, cb) => {
    const allowedTypes = /csv|xls|xlsx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = /text\/csv|application\/vnd\.ms-excel|application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet/;
    
    if (mimetype.test(file.mimetype) || extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only CSV, XLS, or XLSX files are allowed!'));
    }
};

const uploadCSV = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            const tempDir = path.join(__dirname, 'temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            cb(null, tempDir);
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, 'climbers-' + uniqueSuffix + path.extname(file.originalname));
        }
    }),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: csvFileFilter
});

// Serve uploaded files
app.use('/uploads', (req, res, next) => {
    const filePath = path.join(uploadsDir, req.path);
    
    // Check if file exists
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        // File exists, serve it
        return express.static(uploadsDir)(req, res, next);
    }
    
    // File doesn't exist - log warning but don't break the app
    console.warn(`[STATIC] Image not found: /uploads${req.path}`);
    res.status(404).send('Image not found');
});

// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================
function requireAuth(req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    } else {
        return res.status(401).json({ error: 'Unauthorized. Please login first.' });
    }
}

// ============================================
// AUTHENTICATION ROUTES
// ============================================
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        console.log('[AUTH] Login attempt:', { username, hasPassword: !!password });
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const [users] = await pool.execute(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );

        console.log('[AUTH] User found:', users.length > 0);

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const user = users[0];
        const isValidPassword = await bcrypt.compare(password, user.password);

        console.log('[AUTH] Password valid:', isValidPassword);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        req.session.userId = user.id;
        req.session.username = user.username;
        
        console.log('[AUTH] Session created:', { userId: req.session.userId, username: req.session.username });
        
        res.json({ 
            success: true, 
            message: 'Login successful',
            user: { id: user.id, username: user.username }
        });
    } catch (error) {
        console.error('[AUTH] Login error:', error);
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to logout' });
        }
        res.json({ success: true, message: 'Logout successful' });
    });
});

app.get('/api/check-auth', (req, res) => {
    console.log('[AUTH] Check auth - Session:', req.session ? { userId: req.session.userId, username: req.session.username } : 'No session');
    if (req.session && req.session.userId) {
        res.json({ authenticated: true, user: { id: req.session.userId, username: req.session.username } });
    } else {
        res.json({ authenticated: false });
    }
});

// ============================================
// API ENDPOINTS - USER MANAGEMENT
// ============================================
// Get all users (Admin only)
app.get('/api/users', requireAuth, async (req, res) => {
    try {
        const [users] = await pool.execute(
            'SELECT id, username, role, created_at FROM users ORDER BY created_at DESC'
        );
        res.json(users);
    } catch (error) {
        console.error('[API] Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Get user by ID (Admin only)
app.get('/api/users/:id', requireAuth, async (req, res) => {
    try {
        const [users] = await pool.execute(
            'SELECT id, username, role, created_at FROM users WHERE id = ?',
            [req.params.id]
        );
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(users[0]);
    } catch (error) {
        console.error('[API] Error fetching user:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// Create new user (Admin only)
app.post('/api/users', requireAuth, async (req, res) => {
    try {
        const { username, password, role } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        if (!role || !['admin', 'judge', 'timer'].includes(role)) {
            return res.status(400).json({ error: 'Valid role is required (admin, judge, or timer)' });
        }

        // Check if username already exists
        const [existingUsers] = await pool.execute(
            'SELECT id FROM users WHERE username = ?',
            [username]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const [result] = await pool.execute(
            'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
            [username, hashedPassword, role]
        );

        // Return user without password
        const [users] = await pool.execute(
            'SELECT id, username, role, created_at FROM users WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json(users[0]);
    } catch (error) {
        console.error('[API] Error creating user:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Username already exists' });
        }
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// Update user (Admin only)
app.put('/api/users/:id', requireAuth, async (req, res) => {
    try {
        const { username, password, role } = req.body;
        const userId = req.params.id;

        // Check if user exists
        const [existingUsers] = await pool.execute(
            'SELECT id, username FROM users WHERE id = ?',
            [userId]
        );

        if (existingUsers.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Build update query dynamically
        const updates = [];
        const values = [];

        if (username !== undefined) {
            // Check if new username already exists (excluding current user)
            const [duplicateUsers] = await pool.execute(
                'SELECT id FROM users WHERE username = ? AND id != ?',
                [username, userId]
            );

            if (duplicateUsers.length > 0) {
                return res.status(400).json({ error: 'Username already exists' });
            }

            updates.push('username = ?');
            values.push(username);
        }

        if (password !== undefined && password !== '') {
            const hashedPassword = await bcrypt.hash(password, 10);
            updates.push('password = ?');
            values.push(hashedPassword);
        }

        if (role !== undefined) {
            if (!['admin', 'judge', 'timer'].includes(role)) {
                return res.status(400).json({ error: 'Valid role is required (admin, judge, or timer)' });
            }
            updates.push('role = ?');
            values.push(role);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(userId);

        const [result] = await pool.execute(
            `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Return updated user without password
        const [users] = await pool.execute(
            'SELECT id, username, role, created_at FROM users WHERE id = ?',
            [userId]
        );

        res.json(users[0]);
    } catch (error) {
        console.error('[API] Error updating user:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Username already exists' });
        }
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// Delete user (Admin only)
app.delete('/api/users/:id', requireAuth, async (req, res) => {
    try {
        const userId = req.params.id;

        // Prevent deleting yourself
        if (req.session.userId === parseInt(userId)) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('[API] Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// ============================================
// API ENDPOINTS - ATHLETES CRUD (MySQL)
// ============================================
app.get('/api/athletes', async (req, res) => {
    try {
        const [athletes] = await pool.execute('SELECT * FROM athletes ORDER BY id DESC');
        
        // Check if image files exist, set to null if not found
        const athletesWithValidImages = athletes.map(athlete => {
            if (athlete.image) {
                const imagePath = path.join(__dirname, 'public', athlete.image);
                if (!fs.existsSync(imagePath)) {
                    console.warn(`[API] Image not found: ${athlete.image} for athlete ${athlete.id}`);
                    return { ...athlete, image: null };
                }
            }
            return athlete;
        });
        
        res.json(athletesWithValidImages);
    } catch (error) {
        console.error('[API] Error fetching athletes:', error);
        res.status(500).json({ error: 'Failed to fetch athletes' });
    }
});

app.get('/api/athletes/:id', async (req, res) => {
    try {
        const [athletes] = await pool.execute('SELECT * FROM athletes WHERE id = ?', [req.params.id]);
        if (athletes.length === 0) {
            return res.status(404).json({ error: 'Athlete not found' });
        }
        res.json(athletes[0]);
    } catch (error) {
        console.error('[API] Error fetching athlete:', error);
        res.status(500).json({ error: 'Failed to fetch athlete' });
    }
});

app.post('/api/athletes', requireAuth, upload.single('image'), async (req, res) => {
    try {
        const { name, category, age, achievement } = req.body;
        
        if (!name || !category || !age) {
            return res.status(400).json({ error: 'Name, category, and age are required' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'Image is required' });
        }

        const image = `/uploads/${req.file.filename}`;

        const [result] = await pool.execute(
            'INSERT INTO athletes (name, category, age, achievement, image) VALUES (?, ?, ?, ?, ?)',
            [name, category, parseInt(age), achievement || '', image]
        );

        const [athletes] = await pool.execute('SELECT * FROM athletes WHERE id = ?', [result.insertId]);
        res.status(201).json(athletes[0]);
    } catch (error) {
        console.error('[API] Error creating athlete:', error);
        res.status(500).json({ error: 'Failed to create athlete' });
    }
});

app.put('/api/athletes/:id', requireAuth, upload.single('image'), async (req, res) => {
    try {
        const { name, category, age, achievement, existingImage } = req.body;
        let image = existingImage || null;

        if (req.file) {
            // Delete old image if exists
            if (existingImage) {
                const oldImagePath = path.join(__dirname, 'public', existingImage);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            image = `/uploads/${req.file.filename}`;
        }

        const [result] = await pool.execute(
            'UPDATE athletes SET name = ?, category = ?, age = ?, achievement = ?, image = ? WHERE id = ?',
            [name, category, parseInt(age), achievement || '', image, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Athlete not found' });
        }

        const [athletes] = await pool.execute('SELECT * FROM athletes WHERE id = ?', [req.params.id]);
        res.json(athletes[0]);
    } catch (error) {
        console.error('[API] Error updating athlete:', error);
        res.status(500).json({ error: 'Failed to update athlete' });
    }
});

app.delete('/api/athletes/:id', requireAuth, async (req, res) => {
    try {
        // Get athlete to delete image
        const [athletes] = await pool.execute('SELECT * FROM athletes WHERE id = ?', [req.params.id]);
        if (athletes.length === 0) {
            return res.status(404).json({ error: 'Athlete not found' });
        }

        // Delete image file
        if (athletes[0].image) {
            const imagePath = path.join(__dirname, 'public', athletes[0].image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        const [result] = await pool.execute('DELETE FROM athletes WHERE id = ?', [req.params.id]);
        res.json({ message: 'Athlete deleted successfully' });
    } catch (error) {
        console.error('[API] Error deleting athlete:', error);
        res.status(500).json({ error: 'Failed to delete athlete' });
    }
});

// Bulk upload athletes from CSV/Excel
app.post('/api/athletes/bulk-upload', requireAuth, upload.single('file'), async (req, res) => {
    let filePath = null;
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'File is required' });
        }

        filePath = req.file.path;
        const fileExt = path.extname(req.file.originalname).toLowerCase();
        
        let rows = [];
        
        // Parse CSV
        if (fileExt === '.csv') {
            try {
                const csv = require('csv-parser');
                const results = [];
                
                await new Promise((resolve, reject) => {
                    fs.createReadStream(filePath)
                        .pipe(csv())
                        .on('data', (data) => results.push(data))
                        .on('end', resolve)
                        .on('error', reject);
                });
                
                rows = results;
            } catch (csvError) {
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                return res.status(400).json({ error: 'Error parsing CSV file: ' + csvError.message });
            }
        } 
        // Parse Excel (XLS/XLSX)
        else if (fileExt === '.xls' || fileExt === '.xlsx') {
            try {
                const ExcelJS = require('exceljs');
                const workbook = new ExcelJS.Workbook();
                await workbook.xlsx.readFile(filePath);
                
                // Get first worksheet
                const worksheet = workbook.worksheets[0];
                
                // Convert to JSON array
                rows = [];
                worksheet.eachRow((row, rowNumber) => {
                    if (rowNumber === 1) {
                        // Skip header row, but we'll use it to map column names
                        return;
                    }
                    
                    const rowData = {};
                    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                        const headerCell = worksheet.getRow(1).getCell(colNumber);
                        const headerName = headerCell ? headerCell.value?.toString().trim() : `col${colNumber}`;
                        rowData[headerName] = cell.value !== null && cell.value !== undefined ? cell.value.toString() : '';
                    });
                    
                    // Only add row if it has at least one non-empty value
                    if (Object.values(rowData).some(val => val && val.trim() !== '')) {
                        rows.push(rowData);
                    }
                });
            } catch (excelError) {
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                return res.status(400).json({ error: 'Error parsing Excel file: ' + excelError.message });
            }
        } 
        else {
            // Clean up file
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            return res.status(400).json({ error: 'Unsupported file format. Please use CSV, XLS, or XLSX.' });
        }

        if (rows.length === 0) {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            return res.status(400).json({ error: 'File is empty or has no data rows' });
        }

        // Validate and insert data
        const errors = [];
        const success = [];
        
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNum = i + 2; // +2 because header is row 1, and array is 0-indexed
            
            // Normalize column names (case-insensitive, handle spaces)
            const name = row.name || row.Name || row.NAME || row['Nama'] || row['NAMA'] || row['nama'];
            const team = row.team || row.Team || row.TEAM || row['Tim'] || row['TIM'] || row['tim'] || null;
            const bibNumber = row.bib_number || row['Bib Number'] || row['BIB_NUMBER'] || row['bib number'] || row['Nomor Bib'] || row['nomor bib'] || row.bib || row.Bib || null;
            
            if (!name || name.toString().trim() === '') {
                errors.push(`Row ${rowNum}: Name is required`);
                continue;
            }

            try {
                // Check if athlete already exists (by name or bib_number if provided)
                let existingQuery = 'SELECT * FROM athletes WHERE name = ?';
                let existingParams = [name.toString().trim()];
                
                if (bibNumber && bibNumber.toString().trim() !== '') {
                    existingQuery += ' OR bib_number = ?';
                    existingParams.push(bibNumber.toString().trim());
                }
                
                const [existing] = await pool.execute(existingQuery, existingParams);
                
                if (existing.length > 0) {
                    // Update existing athlete
                    await pool.execute(
                        'UPDATE athletes SET name = ?, team = ?, bib_number = ? WHERE id = ?',
                        [name.toString().trim(), team ? team.toString().trim() : null, bibNumber ? bibNumber.toString().trim() : null, existing[0].id]
                    );
                    success.push(`Row ${rowNum}: Updated ${name}`);
                } else {
                    // Insert new athlete
                    const [result] = await pool.execute(
                        'INSERT INTO athletes (name, team, bib_number) VALUES (?, ?, ?)',
                        [name.toString().trim(), team ? team.toString().trim() : null, bibNumber ? bibNumber.toString().trim() : null]
                    );
                    success.push(`Row ${rowNum}: Added ${name}`);
                }
            } catch (dbError) {
                errors.push(`Row ${rowNum}: Database error - ${dbError.message}`);
            }
        }

        // Clean up uploaded file
        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
            } catch (cleanupError) {
                console.error('[API] Error cleaning up file:', cleanupError);
            }
        }

        res.json({
            success: true,
            message: `Processed ${rows.length} rows`,
            added: success.length,
            errors: errors.length,
            details: {
                success: success.slice(0, 10), // Show first 10 successes
                errors: errors.slice(0, 10)    // Show first 10 errors
            }
        });
    } catch (error) {
        console.error('[API] Error bulk uploading athletes:', error);
        
        // Clean up file if it exists
        if (filePath && fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
            } catch (cleanupError) {
                console.error('[API] Error cleaning up file:', cleanupError);
            }
        }
        
        res.status(500).json({ error: 'Failed to process file: ' + error.message });
    }
});

// ============================================
// API ENDPOINTS - SCHEDULES CRUD (MySQL)
// ============================================
app.get('/api/schedules', async (req, res) => {
    try {
        const [schedules] = await pool.execute('SELECT * FROM schedules ORDER BY id DESC');
        res.json(schedules);
    } catch (error) {
        console.error('[API] Error fetching schedules:', error);
        res.status(500).json({ error: 'Failed to fetch schedules' });
    }
});

app.get('/api/schedules/:id', async (req, res) => {
    try {
        const [schedules] = await pool.execute('SELECT * FROM schedules WHERE id = ?', [req.params.id]);
        if (schedules.length === 0) {
            return res.status(404).json({ error: 'Schedule not found' });
        }
        res.json(schedules[0]);
    } catch (error) {
        console.error('[API] Error fetching schedule:', error);
        res.status(500).json({ error: 'Failed to fetch schedule' });
    }
});

app.post('/api/schedules', requireAuth, async (req, res) => {
    try {
        const { date, title, location, time, status, category, description } = req.body;

        if (!date || !title || !location || !time || !category) {
            return res.status(400).json({ error: 'Date, title, location, time, and category are required' });
        }

        const [result] = await pool.execute(
            'INSERT INTO schedules (date, title, location, time, status, category, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [date, title, location, time, status || 'upcoming', category, description || '']
        );

        const [schedules] = await pool.execute('SELECT * FROM schedules WHERE id = ?', [result.insertId]);
        res.status(201).json(schedules[0]);
    } catch (error) {
        console.error('[API] Error creating schedule:', error);
        res.status(500).json({ error: 'Failed to create schedule' });
    }
});

app.put('/api/schedules/:id', requireAuth, async (req, res) => {
    try {
        const { date, title, location, time, status, category, description } = req.body;

        const [result] = await pool.execute(
            'UPDATE schedules SET date = ?, title = ?, location = ?, time = ?, status = ?, category = ?, description = ? WHERE id = ?',
            [date, title, location, time, status, category, description || '', req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Schedule not found' });
        }

        const [schedules] = await pool.execute('SELECT * FROM schedules WHERE id = ?', [req.params.id]);
        res.json(schedules[0]);
    } catch (error) {
        console.error('[API] Error updating schedule:', error);
        res.status(500).json({ error: 'Failed to update schedule' });
    }
});

app.delete('/api/schedules/:id', requireAuth, async (req, res) => {
    try {
        const [result] = await pool.execute('DELETE FROM schedules WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Schedule not found' });
        }
        res.json({ message: 'Schedule deleted successfully' });
    } catch (error) {
        console.error('[API] Error deleting schedule:', error);
        res.status(500).json({ error: 'Failed to delete schedule' });
    }
});

// ============================================
// API ENDPOINTS - NEWS CRUD (MySQL)
// ============================================
app.get('/api/news', async (req, res) => {
    try {
        const [news] = await pool.execute('SELECT * FROM news ORDER BY id DESC');
        
        // Check if image files exist, set to null if not found
        const newsWithValidImages = news.map(item => {
            if (item.image) {
                const imagePath = path.join(__dirname, 'public', item.image);
                if (!fs.existsSync(imagePath)) {
                    console.warn(`[API] Image not found: ${item.image} for news ${item.id}`);
                    return { ...item, image: null };
                }
            }
            return item;
        });
        
        res.json(newsWithValidImages);
    } catch (error) {
        console.error('[API] Error fetching news:', error);
        res.status(500).json({ error: 'Failed to fetch news' });
    }
});

app.get('/api/news/:id', async (req, res) => {
    try {
        const [news] = await pool.execute('SELECT * FROM news WHERE id = ?', [req.params.id]);
        if (news.length === 0) {
            return res.status(404).json({ error: 'News article not found' });
        }
        res.json(news[0]);
    } catch (error) {
        console.error('[API] Error fetching news article:', error);
        res.status(500).json({ error: 'Failed to fetch news article' });
    }
});

app.post('/api/news', requireAuth, upload.single('image'), async (req, res) => {
    try {
        const { title, category, color, date, description } = req.body;
        
        if (!title || !category || !date) {
            return res.status(400).json({ error: 'Title, category, and date are required' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'Image is required' });
        }

        const image = `/uploads/${req.file.filename}`;

        const [result] = await pool.execute(
            'INSERT INTO news (title, category, color, date, description, image) VALUES (?, ?, ?, ?, ?, ?)',
            [title, category, color || 'crimson', date, description || '', image]
        );

        const [news] = await pool.execute('SELECT * FROM news WHERE id = ?', [result.insertId]);
        res.status(201).json(news[0]);
    } catch (error) {
        console.error('[API] Error creating news:', error);
        res.status(500).json({ error: 'Failed to create news article' });
    }
});

app.put('/api/news/:id', requireAuth, upload.single('image'), async (req, res) => {
    try {
        const { title, category, color, date, description, existingImage } = req.body;
        let image = existingImage || null;

        if (req.file) {
            // Delete old image if exists
            if (existingImage) {
                const oldImagePath = path.join(__dirname, 'public', existingImage);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            image = `/uploads/${req.file.filename}`;
        }

        const [result] = await pool.execute(
            'UPDATE news SET title = ?, category = ?, color = ?, date = ?, description = ?, image = ? WHERE id = ?',
            [title, category, color, date, description || '', image, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'News article not found' });
        }

        const [news] = await pool.execute('SELECT * FROM news WHERE id = ?', [req.params.id]);
        res.json(news[0]);
    } catch (error) {
        console.error('[API] Error updating news:', error);
        res.status(500).json({ error: 'Failed to update news article' });
    }
});

app.delete('/api/news/:id', requireAuth, async (req, res) => {
    try {
        // Get news to delete image
        const [news] = await pool.execute('SELECT * FROM news WHERE id = ?', [req.params.id]);
        if (news.length === 0) {
            return res.status(404).json({ error: 'News article not found' });
        }

        // Delete image file
        if (news[0].image) {
            const imagePath = path.join(__dirname, 'public', news[0].image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        const [result] = await pool.execute('DELETE FROM news WHERE id = ?', [req.params.id]);
        res.json({ message: 'News article deleted successfully' });
    } catch (error) {
        console.error('[API] Error deleting news:', error);
        res.status(500).json({ error: 'Failed to delete news article' });
    }
});

// Upload image for rich text editor
app.post('/api/upload-image', requireAuth, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        res.json({ url: `/uploads/${req.file.filename}` });
    } catch (error) {
        console.error('[API] Error uploading image:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
});

// ============================================
// API ENDPOINTS - LIVE SCORE BOULDER SYSTEM
// ============================================

// Get all competitions
app.get('/api/competitions', async (req, res) => {
    try {
        const [competitions] = await pool.execute('SELECT * FROM competitions ORDER BY created_at DESC');
        res.json(competitions);
    } catch (error) {
        console.error('[API] Error fetching competitions:', error);
        res.status(500).json({ error: 'Failed to fetch competitions' });
    }
});

// Get active competition (MUST be before /api/competitions/:id to avoid route conflict)
app.get('/api/competitions/active', async (req, res) => {
    console.log('[API] GET /api/competitions/active requested');
    try {
        const [competitions] = await pool.execute('SELECT * FROM competitions WHERE status = ? ORDER BY created_at DESC LIMIT 1', ['active']);
        console.log('[API] Active competitions found:', competitions.length);
        if (competitions.length === 0) {
            console.log('[API] No active competition found');
            return res.status(404).json({ error: 'No active competition found' });
        }
        console.log('[API] Returning active competition:', competitions[0].id, competitions[0].name);
        res.json(competitions[0]);
    } catch (error) {
        console.error('[API] Error fetching active competition:', error);
        res.status(500).json({ error: 'Failed to fetch active competition' });
    }
});

// Get competition by ID (MUST be after /api/competitions/active)
app.get('/api/competitions/:id', async (req, res) => {
    try {
        const [competitions] = await pool.execute('SELECT * FROM competitions WHERE id = ?', [req.params.id]);
        if (competitions.length === 0) {
            return res.status(404).json({ error: 'Competition not found' });
        }
        res.json(competitions[0]);
    } catch (error) {
        console.error('[API] Error fetching competition:', error);
        res.status(500).json({ error: 'Failed to fetch competition' });
    }
});

// Create competition (Admin only)
app.post('/api/competitions', requireAuth, async (req, res) => {
    try {
        const { name, total_boulders, status } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: 'Competition name is required' });
        }

        const [result] = await pool.execute(
            'INSERT INTO competitions (name, total_boulders, status) VALUES (?, ?, ?)',
            [name, total_boulders || 4, status || 'active']
        );

        const [competitions] = await pool.execute('SELECT * FROM competitions WHERE id = ?', [result.insertId]);
        res.status(201).json(competitions[0]);
    } catch (error) {
        console.error('[API] Error creating competition:', error);
        res.status(500).json({ error: 'Failed to create competition' });
    }
});

// Update competition (Admin only)
app.put('/api/competitions/:id', requireAuth, async (req, res) => {
    try {
        const { name, status, total_boulders } = req.body;

        const [result] = await pool.execute(
            'UPDATE competitions SET name = ?, status = ?, total_boulders = ? WHERE id = ?',
            [name, status, total_boulders, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Competition not found' });
        }

        const [competitions] = await pool.execute('SELECT * FROM competitions WHERE id = ?', [req.params.id]);
        res.json(competitions[0]);
    } catch (error) {
        console.error('[API] Error updating competition:', error);
        res.status(500).json({ error: 'Failed to update competition' });
    }
});

// Delete competition (Admin only)
app.delete('/api/competitions/:id', requireAuth, async (req, res) => {
    try {
        const [result] = await pool.execute('DELETE FROM competitions WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Competition not found' });
        }
        res.json({ message: 'Competition deleted successfully' });
    } catch (error) {
        console.error('[API] Error deleting competition:', error);
        res.status(500).json({ error: 'Failed to delete competition' });
    }
});

// Get climbers for a competition
app.get('/api/competitions/:id/climbers', async (req, res) => {
    try {
        const [climbers] = await pool.execute(
            'SELECT * FROM climbers WHERE competition_id = ? ORDER BY bib_number ASC',
            [req.params.id]
        );
        res.json(climbers);
    } catch (error) {
        console.error('[API] Error fetching climbers:', error);
        res.status(500).json({ error: 'Failed to fetch climbers' });
    }
});

// Add climber to competition (Admin only)
app.post('/api/competitions/:id/climbers', requireAuth, async (req, res) => {
    try {
        const { name, bib_number, team } = req.body;
        
        if (!name || !bib_number) {
            return res.status(400).json({ error: 'Name and bib number are required' });
        }

        const [result] = await pool.execute(
            'INSERT INTO climbers (competition_id, name, bib_number, team) VALUES (?, ?, ?, ?)',
            [req.params.id, name, parseInt(bib_number), team || '']
        );

        const [climbers] = await pool.execute('SELECT * FROM climbers WHERE id = ?', [result.insertId]);
        res.status(201).json(climbers[0]);
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Bib number already exists in this competition' });
        }
        console.error('[API] Error creating climber:', error);
        res.status(500).json({ error: 'Failed to create climber' });
    }
});

// Bulk upload climbers for boulder competition (CSV/Excel)
app.post('/api/competitions/:id/climbers/bulk-upload', requireAuth, (req, res, next) => {
    console.log('[API] Bulk upload request received:', req.path, 'Competition ID:', req.params.id);
    uploadCSV.single('file')(req, res, (err) => {
        if (err) {
            console.error('[API] Multer error:', err);
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: 'File size too large. Maximum size is 10MB.' });
            }
            if (err.message && err.message.includes('allowed')) {
                return res.status(400).json({ error: err.message });
            }
            return res.status(400).json({ error: 'File upload error: ' + err.message });
        }
        next();
    });
}, async (req, res) => {
    let filePath = null;
    try {
        console.log('[API] Processing bulk upload, file:', req.file ? req.file.originalname : 'NO FILE');
        if (!req.file) {
            return res.status(400).json({ error: 'File is required' });
        }

        filePath = req.file.path;
        const fileExt = path.extname(req.file.originalname).toLowerCase();
        let rows = [];

        // Parse CSV
        if (fileExt === '.csv') {
            try {
                const csv = require('csv-parser');
                const results = [];
                await new Promise((resolve, reject) => {
                    fs.createReadStream(filePath)
                        .pipe(csv())
                        .on('data', (data) => {
                            const normalized = {};
                            Object.keys(data).forEach(key => {
                                const normalizedKey = key.trim().toLowerCase();
                                normalized[normalizedKey] = data[key] ? data[key].trim() : '';
                            });
                            results.push(normalized);
                        })
                        .on('end', resolve)
                        .on('error', reject);
                });
                rows = results;
            } catch (csvError) {
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                return res.status(400).json({ error: 'Error parsing CSV file: ' + csvError.message });
            }
        } 
        // Parse Excel (XLS/XLSX)
        else if (fileExt === '.xls' || fileExt === '.xlsx') {
            try {
                const ExcelJS = require('exceljs');
                const workbook = new ExcelJS.Workbook();
                await workbook.xlsx.readFile(filePath);
                
                const worksheet = workbook.worksheets[0];
                rows = [];
                worksheet.eachRow((row, rowNumber) => {
                    if (rowNumber === 1) return; // Skip header
                    
                    const rowData = {};
                    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                        const headerCell = worksheet.getRow(1).getCell(colNumber);
                        const headerName = headerCell ? headerCell.value?.toString().trim().toLowerCase() : `col${colNumber}`;
                        rowData[headerName] = cell.value !== null && cell.value !== undefined ? cell.value.toString().trim() : '';
                    });
                    
                    if (Object.values(rowData).some(val => val && val.trim() !== '')) {
                        rows.push(rowData);
                    }
                });
            } catch (excelError) {
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                return res.status(400).json({ error: 'Error parsing Excel file: ' + excelError.message });
            }
        } else {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            return res.status(400).json({ error: 'Unsupported file format. Please use CSV, XLS, or XLSX' });
        }

        // Clean up file
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        if (rows.length === 0) {
            return res.status(400).json({ error: 'No data found in file' });
        }

        // Validate and insert data
        const competitionId = parseInt(req.params.id);
        const inserted = [];
        const errors = [];
        const skipped = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNum = i + 2;

            // Normalize column names
            const name = row.name || row.nama || row['athlete name'] || row['nama atlet'] || '';
            const bibNumber = row.bib_number || row.bib || row['bib number'] || row.nomor || row['nomor bib'] || '';
            const team = row.team || row.tim || row['team name'] || row['nama tim'] || '';

            if (!name || !bibNumber) {
                errors.push(`Row ${rowNum}: Missing required fields (name: ${name ? 'OK' : 'MISSING'}, bib_number: ${bibNumber ? 'OK' : 'MISSING'})`);
                continue;
            }

            const bibNum = parseInt(bibNumber);
            if (isNaN(bibNum) || bibNum <= 0) {
                errors.push(`Row ${rowNum}: Invalid bib number "${bibNumber}"`);
                continue;
            }

            try {
                const [result] = await pool.execute(
                    'INSERT INTO climbers (competition_id, name, bib_number, team) VALUES (?, ?, ?, ?)',
                    [competitionId, name, bibNum, team || '']
                );
                inserted.push({ id: result.insertId, name, bib_number: bibNum, team });
            } catch (error) {
                if (error.code === 'ER_DUP_ENTRY') {
                    skipped.push(`Row ${rowNum}: Bib number ${bibNum} already exists`);
                } else {
                    errors.push(`Row ${rowNum}: ${error.message}`);
                }
            }
        }

        res.json({
            success: true,
            message: `Upload completed: ${inserted.length} inserted, ${skipped.length} skipped, ${errors.length} errors`,
            inserted: inserted.length,
            skipped: skipped.length,
            errors: errors.length,
            details: {
                inserted,
                skipped: skipped.slice(0, 10),
                errors: errors.slice(0, 10)
            }
        });
    } catch (error) {
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        console.error('[API] Error bulk uploading climbers:', error);
        res.status(500).json({ error: 'Failed to upload climbers: ' + error.message });
    }
});

// Update climber (Admin only)
app.put('/api/climbers/:id', requireAuth, async (req, res) => {
    try {
        const { name, bib_number, team } = req.body;

        const [result] = await pool.execute(
            'UPDATE climbers SET name = ?, bib_number = ?, team = ? WHERE id = ?',
            [name, parseInt(bib_number), team || '', req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Climber not found' });
        }

        const [climbers] = await pool.execute('SELECT * FROM climbers WHERE id = ?', [req.params.id]);
        res.json(climbers[0]);
    } catch (error) {
        console.error('[API] Error updating climber:', error);
        res.status(500).json({ error: 'Failed to update climber' });
    }
});

// Delete climber (Admin only)
app.delete('/api/climbers/:id', requireAuth, async (req, res) => {
    try {
        const [result] = await pool.execute('DELETE FROM climbers WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Climber not found' });
        }
        res.json({ message: 'Climber deleted successfully' });
    } catch (error) {
        console.error('[API] Error deleting climber:', error);
        res.status(500).json({ error: 'Failed to delete climber' });
    }
});

// Import score calculator utilities
const { calculateBoulderScore } = require('./server/utils/scoreCalculator');
const { 
    calculateQualificationScore, 
    calculateFinalsWinner, 
    rankQualificationScores 
} = require('./server/utils/speedCalculator');

// Import validation and transaction utilities
const { 
    validate, 
    speedQualificationScoreSchema, 
    speedFinalsScoreSchema, 
    boulderScoreActionSchema,
    generateBracketSchema,
    unlockScoreSchema,
    sanitizeString
} = require('./server/utils/validation');
const { withTransaction, executeQuery } = require('./server/utils/transaction');
const { logAuditEvent, hasAppealPermission } = require('./server/utils/auditLogger');

// Get leaderboard with Kejurnas FPTI Points System
app.get('/api/competitions/:id/leaderboard', async (req, res) => {
    try {
        // Get all climbers for this competition
        const [climbers] = await pool.execute(
            'SELECT * FROM climbers WHERE competition_id = ? ORDER BY bib_number ASC',
            [req.params.id]
        );
        
        // Get competition to know total boulders
        const [competitions] = await pool.execute(
            'SELECT * FROM competitions WHERE id = ?',
            [req.params.id]
        );
        
        if (competitions.length === 0) {
            return res.status(404).json({ error: 'Competition not found' });
        }
        
        const totalBoulders = competitions[0].total_boulders || 4;
        
        // Get all scores for this competition
        const [scores] = await pool.execute(
            'SELECT * FROM scores WHERE competition_id = ? ORDER BY climber_id, boulder_number ASC',
            [req.params.id]
        );
        
        // Build leaderboard with calculated points
        const leaderboard = climbers.map(climber => {
            // Get scores for this climber
            const climberScores = scores.filter(s => s.climber_id === climber.id);
            
            // Build scores array for all boulders (1 to totalBoulders)
            const boulderScores = [];
            let totalScore = 0;
            
            for (let i = 1; i <= totalBoulders; i++) {
                const score = climberScores.find(s => s.boulder_number === i);
                
                const isTop = score ? (score.reached_top === 1 || score.reached_top === true) : false;
                const topAttempts = score && score.top_attempt ? score.top_attempt : 0;
                const isZone = score ? (score.reached_zone === 1 || score.reached_zone === true) : false;
                const zoneAttempts = score && score.zone_attempt ? score.zone_attempt : 0;
                
                // Calculate points for this boulder
                const calculatedPoints = calculateBoulderScore(isTop, topAttempts, isZone, zoneAttempts);
                totalScore += calculatedPoints;
                
                boulderScores.push({
                    boulderIndex: i,
                    topAttempts: topAttempts,
                    zoneAttempts: zoneAttempts,
                    isTop: isTop,
                    isZone: isZone,
                    calculatedPoints: calculatedPoints
                });
            }
            
            return {
                id: climber.id,
                rank: 0, // Will be calculated after sorting
                name: climber.name,
                bib_number: climber.bib_number,
                team: climber.team || '',
                scores: boulderScores,
                totalScore: parseFloat(totalScore.toFixed(1))
            };
        });
        
        // Sort by totalScore DESC (highest first)
        leaderboard.sort((a, b) => b.totalScore - a.totalScore);
        
        // Assign ranks
        leaderboard.forEach((climber, index) => {
            climber.rank = index + 1;
        });
        
        res.json(leaderboard);
    } catch (error) {
        console.error('[API] Error fetching leaderboard:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

// Get scores for a climber
app.get('/api/climbers/:id/scores', async (req, res) => {
    try {
        const [scores] = await pool.execute(
            'SELECT * FROM scores WHERE climber_id = ? ORDER BY boulder_number ASC',
            [req.params.id]
        );
        res.json(scores);
    } catch (error) {
        console.error('[API] Error fetching scores:', error);
        res.status(500).json({ error: 'Failed to fetch scores' });
    }
});

// Get score for a specific climber and boulder
app.get('/api/competitions/:competitionId/climbers/:climberId/boulders/:boulderNumber', async (req, res) => {
    try {
        const { competitionId, climberId, boulderNumber } = req.params;
        const [scores] = await pool.execute(
            'SELECT * FROM scores WHERE competition_id = ? AND climber_id = ? AND boulder_number = ?',
            [competitionId, climberId, boulderNumber]
        );
        
        if (scores.length === 0) {
            // Return default score if not exists
            return res.json({
                id: null,
                competition_id: parseInt(competitionId),
                climber_id: parseInt(climberId),
                boulder_number: parseInt(boulderNumber),
                attempts: 0,
                reached_zone: false,
                reached_top: false,
                zone_attempt: null,
                top_attempt: null,
                is_finalized: false
            });
        }
        
        res.json(scores[0]);
    } catch (error) {
        console.error('[API] Error fetching score:', error);
        res.status(500).json({ error: 'Failed to fetch score' });
    }
});

// Update score (Judge only - requires authentication)
// REFACTORED: Added validation and is_locked check
app.put('/api/competitions/:competitionId/climbers/:climberId/boulders/:boulderNumber', requireAuth, validate(boulderScoreActionSchema), async (req, res) => {
    try {
        const { competitionId, climberId, boulderNumber } = req.params;
        const { action } = req.body; // Validated by schema: 'attempt', 'zone', 'top', 'finalize'

        // Get or create score record
        let [scores] = await pool.execute(
            'SELECT * FROM scores WHERE competition_id = ? AND climber_id = ? AND boulder_number = ?',
            [competitionId, climberId, boulderNumber]
        );

        let score = scores.length > 0 ? scores[0] : null;
        let attempts = score ? score.attempts : 0;
        let reached_zone = score ? score.reached_zone : false;
        let reached_top = score ? score.reached_top : false;
        let zone_attempt = score ? score.zone_attempt : null;
        let top_attempt = score ? score.top_attempt : null;
        let is_finalized = score ? (score.is_finalized === 1 || score.is_finalized === true) : false;
        let is_locked = score ? (score.is_locked === 1 || score.is_locked === true) : false;

        // Check if score is locked (requires unlock via appeals endpoint)
        if (is_locked || is_finalized) {
            return res.status(403).json({ 
                error: 'Score is locked or finalized. Use appeals endpoint to unlock first.' 
            });
        }

        // Handle actions
        if (action === 'attempt') {
            attempts += 1;
        } else if (action === 'zone') {
            if (reached_zone) {
                return res.status(400).json({ error: 'Zone already reached' });
            }
            reached_zone = true;
            zone_attempt = attempts;
        } else if (action === 'top') {
            if (reached_top) {
                return res.status(400).json({ error: 'Top already reached' });
            }
            reached_top = true;
            top_attempt = attempts;
            // Auto-set zone if not already set
            if (!reached_zone) {
                reached_zone = true;
                zone_attempt = attempts;
            }
            is_finalized = true; // Auto-finalize when top is reached
        } else if (action === 'finalize') {
            is_finalized = true;
        }

        // Insert or update score (use transaction for data integrity)
        await withTransaction(pool, async (connection) => {
            if (score) {
                await connection.execute(
                    'UPDATE scores SET attempts = ?, reached_zone = ?, reached_top = ?, zone_attempt = ?, top_attempt = ?, is_finalized = ? WHERE id = ?',
                    [attempts, reached_zone, reached_top, zone_attempt, top_attempt, is_finalized, score.id]
                );
            } else {
                const [result] = await connection.execute(
                    'INSERT INTO scores (competition_id, climber_id, boulder_number, attempts, reached_zone, reached_top, zone_attempt, top_attempt, is_finalized) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [competitionId, climberId, boulderNumber, attempts, reached_zone, reached_top, zone_attempt, top_attempt, is_finalized]
                );
                const [newScores] = await connection.execute('SELECT * FROM scores WHERE id = ?', [result.insertId]);
                score = newScores[0];
            }
        });

        // Emit WebSocket event for real-time update
        const socketData = {
            competition_id: parseInt(competitionId),
            climber_id: parseInt(climberId),
            boulder_number: parseInt(boulderNumber),
            score: score
        };
        console.log('[SOCKET] Emitting score-updated event:', socketData);
        io.emit('score-updated', socketData);

        // Get updated score
        const [updatedScores] = await pool.execute(
            'SELECT * FROM scores WHERE competition_id = ? AND climber_id = ? AND boulder_number = ?',
            [competitionId, climberId, boulderNumber]
        );

        res.json(updatedScores[0]);
    } catch (error) {
        console.error('[API] Error updating score:', error);
        res.status(500).json({ error: 'Failed to update score' });
    }
});

// ============================================
// API ENDPOINTS - SPEED CLIMBING (CLASSIC) SYSTEM
// ============================================

// Get all speed competitions
app.get('/api/speed-competitions', async (req, res) => {
    try {
        const [competitions] = await pool.execute('SELECT * FROM speed_competitions ORDER BY created_at DESC');
        res.json(competitions);
    } catch (error) {
        console.error('[API] Error fetching speed competitions:', error);
        res.status(500).json({ error: 'Failed to fetch speed competitions' });
    }
});

// Get active speed competition
app.get('/api/speed-competitions/active', async (req, res) => {
    try {
        const [competitions] = await pool.execute(
            'SELECT * FROM speed_competitions WHERE status != ? ORDER BY created_at DESC LIMIT 1',
            ['finished']
        );
        if (competitions.length === 0) {
            return res.status(404).json({ error: 'No active speed competition found' });
        }
        res.json(competitions[0]);
    } catch (error) {
        console.error('[API] Error fetching active speed competition:', error);
        res.status(500).json({ error: 'Failed to fetch active speed competition' });
    }
});

// Get speed competition by ID
app.get('/api/speed-competitions/:id', async (req, res) => {
    try {
        const [competitions] = await pool.execute('SELECT * FROM speed_competitions WHERE id = ?', [req.params.id]);
        if (competitions.length === 0) {
            return res.status(404).json({ error: 'Speed competition not found' });
        }
        res.json(competitions[0]);
    } catch (error) {
        console.error('[API] Error fetching speed competition:', error);
        res.status(500).json({ error: 'Failed to fetch speed competition' });
    }
});

// Create speed competition (Admin only)
app.post('/api/speed-competitions', requireAuth, async (req, res) => {
    try {
        const { name, status } = req.body;
        
        console.log('[API] Creating speed competition:', { name, status });
        
        if (!name) {
            return res.status(400).json({ error: 'Competition name is required' });
        }

        // Validate status
        const validStatuses = ['qualification', 'finals', 'finished'];
        const competitionStatus = status && validStatuses.includes(status) ? status : 'qualification';

        const [result] = await pool.execute(
            'INSERT INTO speed_competitions (name, status) VALUES (?, ?)',
            [name, competitionStatus]
        );

        const [competitions] = await pool.execute('SELECT * FROM speed_competitions WHERE id = ?', [result.insertId]);
        
        if (competitions.length === 0) {
            console.error('[API] Speed competition created but not found after insert');
            return res.status(500).json({ error: 'Failed to retrieve created competition' });
        }
        
        console.log('[API] Speed competition created successfully:', competitions[0].id);
        res.status(201).json(competitions[0]);
    } catch (error) {
        console.error('[API] Error creating speed competition:', error);
        console.error('[API] Error details:', {
            message: error.message,
            code: error.code,
            sqlMessage: error.sqlMessage,
            sqlState: error.sqlState,
            stack: error.stack
        });
        
        // Return more detailed error message
        const errorMessage = error.sqlMessage || error.message || 'Failed to create speed competition';
        res.status(500).json({ 
            error: errorMessage,
            code: error.code,
            details: process.env.NODE_ENV === 'development' ? {
                message: error.message,
                sqlMessage: error.sqlMessage,
                sqlState: error.sqlState
            } : undefined
        });
    }
});

// Update speed competition (Admin only)
app.put('/api/speed-competitions/:id', requireAuth, async (req, res) => {
    try {
        const { name, status } = req.body;

        const [result] = await pool.execute(
            'UPDATE speed_competitions SET name = ?, status = ? WHERE id = ?',
            [name, status, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Speed competition not found' });
        }

        const [competitions] = await pool.execute('SELECT * FROM speed_competitions WHERE id = ?', [req.params.id]);
        res.json(competitions[0]);
    } catch (error) {
        console.error('[API] Error updating speed competition:', error);
        res.status(500).json({ error: 'Failed to update speed competition' });
    }
});

// Get speed climbers for a competition
app.get('/api/speed-competitions/:id/climbers', async (req, res) => {
    try {
        const [climbers] = await pool.execute(
            'SELECT * FROM speed_climbers WHERE speed_competition_id = ? ORDER BY bib_number ASC',
            [req.params.id]
        );
        res.json(climbers);
    } catch (error) {
        console.error('[API] Error fetching speed climbers:', error);
        res.status(500).json({ error: 'Failed to fetch speed climbers' });
    }
});

// Add speed climber to competition (Admin only)
app.post('/api/speed-competitions/:id/climbers', requireAuth, async (req, res) => {
    try {
        const { name, bib_number, team } = req.body;
        
        if (!name || !bib_number) {
            return res.status(400).json({ error: 'Name and bib number are required' });
        }

        const [result] = await pool.execute(
            'INSERT INTO speed_climbers (speed_competition_id, name, bib_number, team) VALUES (?, ?, ?, ?)',
            [req.params.id, name, parseInt(bib_number), team || '']
        );

        const [climbers] = await pool.execute('SELECT * FROM speed_climbers WHERE id = ?', [result.insertId]);
        res.status(201).json(climbers[0]);
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Bib number already exists in this competition' });
        }
        console.error('[API] Error creating speed climber:', error);
        res.status(500).json({ error: 'Failed to create speed climber' });
    }
});

// Bulk upload climbers for speed competition (CSV/Excel)
app.post('/api/speed-competitions/:id/climbers/bulk-upload', requireAuth, (req, res, next) => {
    uploadCSV.single('file')(req, res, (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: 'File size too large. Maximum size is 10MB.' });
            }
            if (err.message && err.message.includes('allowed')) {
                return res.status(400).json({ error: err.message });
            }
            return res.status(400).json({ error: 'File upload error: ' + err.message });
        }
        next();
    });
}, async (req, res) => {
    let filePath = null;
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'File is required' });
        }

        filePath = req.file.path;
        const fileExt = path.extname(req.file.originalname).toLowerCase();
        let rows = [];

        // Parse CSV
        if (fileExt === '.csv') {
            try {
                const csv = require('csv-parser');
                const results = [];
                await new Promise((resolve, reject) => {
                    fs.createReadStream(filePath)
                        .pipe(csv())
                        .on('data', (data) => {
                            const normalized = {};
                            Object.keys(data).forEach(key => {
                                const normalizedKey = key.trim().toLowerCase();
                                normalized[normalizedKey] = data[key] ? data[key].trim() : '';
                            });
                            results.push(normalized);
                        })
                        .on('end', resolve)
                        .on('error', reject);
                });
                rows = results;
            } catch (csvError) {
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                return res.status(400).json({ error: 'Error parsing CSV file: ' + csvError.message });
            }
        } 
        // Parse Excel (XLS/XLSX)
        else if (fileExt === '.xls' || fileExt === '.xlsx') {
            try {
                const ExcelJS = require('exceljs');
                const workbook = new ExcelJS.Workbook();
                await workbook.xlsx.readFile(filePath);
                
                const worksheet = workbook.worksheets[0];
                rows = [];
                worksheet.eachRow((row, rowNumber) => {
                    if (rowNumber === 1) return; // Skip header
                    
                    const rowData = {};
                    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                        const headerCell = worksheet.getRow(1).getCell(colNumber);
                        const headerName = headerCell ? headerCell.value?.toString().trim().toLowerCase() : `col${colNumber}`;
                        rowData[headerName] = cell.value !== null && cell.value !== undefined ? cell.value.toString().trim() : '';
                    });
                    
                    if (Object.values(rowData).some(val => val && val.trim() !== '')) {
                        rows.push(rowData);
                    }
                });
            } catch (excelError) {
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                return res.status(400).json({ error: 'Error parsing Excel file: ' + excelError.message });
            }
        } else {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            return res.status(400).json({ error: 'Unsupported file format. Please use CSV, XLS, or XLSX' });
        }

        // Clean up file
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        if (rows.length === 0) {
            return res.status(400).json({ error: 'No data found in file' });
        }

        // Validate and insert data
        const competitionId = parseInt(req.params.id);
        const inserted = [];
        const errors = [];
        const skipped = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNum = i + 2;

            // Normalize column names
            const name = row.name || row.nama || row['athlete name'] || row['nama atlet'] || '';
            const bibNumber = row.bib_number || row.bib || row['bib number'] || row.nomor || row['nomor bib'] || '';
            const team = row.team || row.tim || row['team name'] || row['nama tim'] || '';

            if (!name || !bibNumber) {
                errors.push(`Row ${rowNum}: Missing required fields (name: ${name ? 'OK' : 'MISSING'}, bib_number: ${bibNumber ? 'OK' : 'MISSING'})`);
                continue;
            }

            const bibNum = parseInt(bibNumber);
            if (isNaN(bibNum) || bibNum <= 0) {
                errors.push(`Row ${rowNum}: Invalid bib number "${bibNumber}"`);
                continue;
            }

            try {
                const [result] = await pool.execute(
                    'INSERT INTO speed_climbers (speed_competition_id, name, bib_number, team) VALUES (?, ?, ?, ?)',
                    [competitionId, name, bibNum, team || '']
                );
                inserted.push({ id: result.insertId, name, bib_number: bibNum, team });
            } catch (error) {
                if (error.code === 'ER_DUP_ENTRY') {
                    skipped.push(`Row ${rowNum}: Bib number ${bibNum} already exists`);
                } else {
                    errors.push(`Row ${rowNum}: ${error.message}`);
                }
            }
        }

        res.json({
            success: true,
            message: `Upload completed: ${inserted.length} inserted, ${skipped.length} skipped, ${errors.length} errors`,
            inserted: inserted.length,
            skipped: skipped.length,
            errors: errors.length,
            details: {
                inserted,
                skipped: skipped.slice(0, 10),
                errors: errors.slice(0, 10)
            }
        });
    } catch (error) {
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        console.error('[API] Error bulk uploading speed climbers:', error);
        res.status(500).json({ error: 'Failed to upload climbers: ' + error.message });
    }
});

// Get qualification leaderboard
app.get('/api/speed-competitions/:id/qualification', async (req, res) => {
    try {
        // Get all climbers
        const [climbers] = await pool.execute(
            'SELECT * FROM speed_climbers WHERE speed_competition_id = ? ORDER BY bib_number ASC',
            [req.params.id]
        );
        
        // Get all qualification scores
        const [scores] = await pool.execute(
            `SELECT sqs.*, sc.name, sc.bib_number, sc.team 
             FROM speed_qualification_scores sqs
             JOIN speed_climbers sc ON sqs.climber_id = sc.id
             WHERE sqs.speed_competition_id = ?`,
            [req.params.id]
        );
        
        // Build leaderboard
        const leaderboard = climbers.map(climber => {
            const score = scores.find(s => s.climber_id === climber.id);
            
            if (!score) {
                return {
                    id: climber.id,
                    climber_id: climber.id,
                    name: climber.name,
                    bib_number: climber.bib_number,
                    team: climber.team || '',
                    lane_a_time: null,
                    lane_b_time: null,
                    lane_a_status: 'VALID',
                    lane_b_status: 'VALID',
                    total_time: null,
                    status: 'INVALID',
                    rank: null
                };
            }
            
            return {
                id: score.id,
                climber_id: climber.id,
                name: climber.name,
                bib_number: climber.bib_number,
                team: climber.team || '',
                lane_a_time: score.lane_a_time ? parseFloat(score.lane_a_time) : null,
                lane_b_time: score.lane_b_time ? parseFloat(score.lane_b_time) : null,
                lane_a_status: score.lane_a_status,
                lane_b_status: score.lane_b_status,
                total_time: score.total_time ? parseFloat(score.total_time) : null,
                status: score.status,
                rank: score.rank
            };
        });
        
        // Rank the scores
        const rankedLeaderboard = rankQualificationScores(leaderboard);
        
        res.json(rankedLeaderboard);
    } catch (error) {
        console.error('[API] Error fetching qualification leaderboard:', error);
        res.status(500).json({ error: 'Failed to fetch qualification leaderboard' });
    }
});

// Update qualification score (Admin only)
app.put('/api/speed-competitions/:id/qualification/:climberId', requireAuth, validate(speedQualificationScoreSchema), async (req, res) => {
    try {
        const { lane_a_time, lane_b_time, lane_a_status, lane_b_status } = req.body; // Validated by schema
        
        // Calculate total time and status
        const calculated = calculateQualificationScore(
            lane_a_time, 
            lane_b_time, 
            lane_a_status || 'VALID', 
            lane_b_status || 'VALID'
        );
        
        // Check if score exists and is locked
        const [existing] = await pool.execute(
            'SELECT * FROM speed_qualification_scores WHERE speed_competition_id = ? AND climber_id = ?',
            [req.params.id, req.params.climberId]
        );
        
        // Check if score is finalized/locked (requires unlock via appeals endpoint)
        if (existing.length > 0 && (existing[0].is_finalized === 1 || existing[0].is_finalized === true)) {
            return res.status(403).json({ 
                error: 'Score is finalized. Use appeals endpoint to unlock first.' 
            });
        }
        
        if (existing.length > 0) {
            // Update existing
            await pool.execute(
                `UPDATE speed_qualification_scores 
                 SET lane_a_time = ?, lane_b_time = ?, lane_a_status = ?, lane_b_status = ?, 
                     total_time = ?, status = ?, rank = NULL
                 WHERE id = ?`,
                [
                    lane_a_time || null,
                    lane_b_time || null,
                    lane_a_status || 'VALID',
                    lane_b_status || 'VALID',
                    calculated.totalTime,
                    calculated.status,
                    existing[0].id
                ]
            );
        } else {
            // Insert new
            await pool.execute(
                `INSERT INTO speed_qualification_scores 
                 (speed_competition_id, climber_id, lane_a_time, lane_b_time, lane_a_status, lane_b_status, total_time, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    req.params.id,
                    req.params.climberId,
                    lane_a_time || null,
                    lane_b_time || null,
                    lane_a_status || 'VALID',
                    lane_b_status || 'VALID',
                    calculated.totalTime,
                    calculated.status
                ]
            );
        }
        
        // Recalculate all ranks
        const [allScores] = await pool.execute(
            'SELECT * FROM speed_qualification_scores WHERE speed_competition_id = ?',
            [req.params.id]
        );
        
        const scoresForRanking = allScores.map(s => ({
            id: s.id,
            climber_id: s.climber_id,
            total_time: s.total_time ? parseFloat(s.total_time) : null,
            status: s.status
        }));
        
        const ranked = rankQualificationScores(scoresForRanking);
        
        // Update ranks in database
        for (const score of ranked) {
            await pool.execute(
                'UPDATE speed_qualification_scores SET rank = ? WHERE id = ?',
                [score.rank, score.id]
            );
        }
        
        // Emit WebSocket event
        io.emit('speed-qualification-updated', {
            speed_competition_id: parseInt(req.params.id),
            climber_id: parseInt(req.params.climberId)
        });
        
        // Get updated score
        const [updated] = await pool.execute(
            `SELECT sqs.*, sc.name, sc.bib_number, sc.team 
             FROM speed_qualification_scores sqs
             JOIN speed_climbers sc ON sqs.climber_id = sc.id
             WHERE sqs.speed_competition_id = ? AND sqs.climber_id = ?`,
            [req.params.id, req.params.climberId]
        );
        
        res.json(updated[0]);
    } catch (error) {
        console.error('[API] Error updating qualification score:', error);
        res.status(500).json({ error: 'Failed to update qualification score' });
    }
});

// Get finals matches
app.get('/api/speed-competitions/:id/finals', async (req, res) => {
    try {
        // Get qualification ranks for seeding display
        const [qualificationRanks] = await pool.execute(
            `SELECT climber_id, rank 
             FROM speed_qualification_scores 
             WHERE speed_competition_id = ? AND rank IS NOT NULL`,
            [req.params.id]
        );
        
        const rankMap = {};
        qualificationRanks.forEach(q => {
            rankMap[q.climber_id] = q.rank;
        });
        
        const [matches] = await pool.execute(
            `SELECT 
                m.*,
                ca.name as climber_a_name,
                ca.bib_number as climber_a_bib,
                ca.team as climber_a_team,
                ca.id as climber_a_id,
                cb.name as climber_b_name,
                cb.bib_number as climber_b_bib,
                cb.team as climber_b_team,
                cb.id as climber_b_id
             FROM speed_finals_matches m
             LEFT JOIN speed_climbers ca ON m.climber_a_id = ca.id
             LEFT JOIN speed_climbers cb ON m.climber_b_id = cb.id
             WHERE m.speed_competition_id = ?
             ORDER BY 
                 CASE m.stage
                     WHEN 'Round of 16' THEN 1
                     WHEN 'Quarter Final' THEN 2
                     WHEN 'Semi Final' THEN 3
                     WHEN 'Small Final' THEN 4
                     WHEN 'Big Final' THEN 5
                 END,
                 m.match_order ASC`,
            [req.params.id]
        );
        
        // Add qualification rank to each match
        const matchesWithRanks = matches.map(match => ({
            ...match,
            climber_a_rank: rankMap[match.climber_a_id] || null,
            climber_b_rank: rankMap[match.climber_b_id] || null
        }));
        
        // Sort: Small Final before Big Final (for display order)
        matchesWithRanks.sort((a, b) => {
            // First sort by stage priority
            const stageOrder = {
                'Round of 16': 1,
                'Quarter Final': 2,
                'Semi Final': 3,
                'Small Final': 4, // Small Final comes before Big Final
                'Big Final': 5
            };
            const orderA = stageOrder[a.stage] || 99;
            const orderB = stageOrder[b.stage] || 99;
            
            if (orderA !== orderB) {
                return orderA - orderB;
            }
            
            // Then by match_order
            return (a.match_order || 0) - (b.match_order || 0);
        });
        
        res.json(matchesWithRanks);
    } catch (error) {
        console.error('[API] Error fetching finals matches:', error);
        res.status(500).json({ error: 'Failed to fetch finals matches' });
    }
});

// Update finals match (Admin only)
app.put('/api/speed-competitions/:id/finals/:matchId', requireAuth, validate(speedFinalsScoreSchema), async (req, res) => {
    try {
        const { time_a, time_b, status_a, status_b } = req.body; // Validated by schema
        
        // Get match data
        const [matches] = await pool.execute(
            'SELECT * FROM speed_finals_matches WHERE id = ?',
            [req.params.matchId]
        );
        
        if (matches.length === 0) {
            return res.status(404).json({ error: 'Match not found' });
        }
        
        const match = matches[0];
        
        // Check if match is finalized/locked (requires unlock via appeals endpoint)
        if (match.is_finalized === 1 || match.is_finalized === true) {
            return res.status(403).json({ 
                error: 'Match is finalized. Use appeals endpoint to unlock first.' 
            });
        }
        
        // Get qualification ranks for tiebreaker
        const [ranks] = await pool.execute(
            `SELECT climber_id, rank 
             FROM speed_qualification_scores 
             WHERE speed_competition_id = ? AND climber_id IN (?, ?)`,
            [req.params.id, match.climber_a_id, match.climber_b_id]
        );
        
        const rankMap = {};
        ranks.forEach(r => {
            rankMap[r.climber_id] = r.rank;
        });
        
        // Calculate winner with ranking tiebreaker
        const winnerId = calculateFinalsWinner(
            time_a,
            time_b,
            status_a || 'VALID',
            status_b || 'VALID',
            match.climber_a_id,
            match.climber_b_id,
            rankMap[match.climber_a_id] || null,
            rankMap[match.climber_b_id] || null
        );
        
        // Update match
        await pool.execute(
            `UPDATE speed_finals_matches 
             SET time_a = ?, time_b = ?, status_a = ?, status_b = ?, winner_id = ?
             WHERE id = ?`,
            [
                time_a || null,
                time_b || null,
                status_a || 'VALID',
                status_b || 'VALID',
                winnerId,
                req.params.matchId
            ]
        );
        
        // Emit WebSocket event
        io.emit('speed-finals-updated', {
            speed_competition_id: parseInt(req.params.id),
            match_id: parseInt(req.params.matchId)
        });
        
        // Get updated match
        const [updated] = await pool.execute(
            `SELECT 
                m.*,
                ca.name as climber_a_name,
                ca.bib_number as climber_a_bib,
                ca.team as climber_a_team,
                cb.name as climber_b_name,
                cb.bib_number as climber_b_bib,
                cb.team as climber_b_team
             FROM speed_finals_matches m
             JOIN speed_climbers ca ON m.climber_a_id = ca.id
             LEFT JOIN speed_climbers cb ON m.climber_b_id = cb.id
             WHERE m.id = ?`,
            [req.params.matchId]
        );
        
        res.json(updated[0]);
    } catch (error) {
        console.error('[API] Error updating finals match:', error);
        res.status(500).json({ error: 'Failed to update finals match' });
    }
});

// ============================================
// APPEALS MANAGEMENT - Unlock/Edit Finalized Scores
// ============================================

// Unlock score for editing (SUPER_ADMIN/CHIEF_JUDGE only)
app.post('/api/scores/unlock', requireAuth, validate(unlockScoreSchema), async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        // Check if user has appeal permission
        const hasPermission = await hasAppealPermission(pool, userId);
        if (!hasPermission) {
            return res.status(403).json({ error: 'Only SUPER_ADMIN or CHIEF_JUDGE can unlock scores' });
        }
        
        const { reason, entity_type, entity_id } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('user-agent');
        
        // Unlock based on entity type
        let unlockResult;
        if (entity_type === 'boulder_score') {
            // Unlock boulder score
            const [scores] = await pool.execute(
                'SELECT * FROM scores WHERE id = ?',
                [entity_id]
            );
            
            if (scores.length === 0) {
                return res.status(404).json({ error: 'Score not found' });
            }
            
            if (!scores[0].is_finalized && !scores[0].is_locked) {
                return res.status(400).json({ error: 'Score is not locked or finalized' });
            }
            
            await pool.execute(
                'UPDATE scores SET is_finalized = FALSE, is_locked = FALSE WHERE id = ?',
                [entity_id]
            );
            
            unlockResult = { entity_type: 'boulder_score', entity_id, unlocked: true };
            
        } else if (entity_type === 'speed_qualification') {
            // Unlock speed qualification score
            const [scores] = await pool.execute(
                'SELECT * FROM speed_qualification_scores WHERE id = ?',
                [entity_id]
            );
            
            if (scores.length === 0) {
                return res.status(404).json({ error: 'Score not found' });
            }
            
            if (!scores[0].is_finalized) {
                return res.status(400).json({ error: 'Score is not finalized' });
            }
            
            await pool.execute(
                'UPDATE speed_qualification_scores SET is_finalized = FALSE WHERE id = ?',
                [entity_id]
            );
            
            unlockResult = { entity_type: 'speed_qualification', entity_id, unlocked: true };
            
        } else if (entity_type === 'speed_final') {
            // Unlock speed final match
            const [matches] = await pool.execute(
                'SELECT * FROM speed_finals_matches WHERE id = ?',
                [entity_id]
            );
            
            if (matches.length === 0) {
                return res.status(404).json({ error: 'Match not found' });
            }
            
            if (!matches[0].is_finalized) {
                return res.status(400).json({ error: 'Match is not finalized' });
            }
            
            await pool.execute(
                'UPDATE speed_finals_matches SET is_finalized = FALSE, winner_id = NULL WHERE id = ?',
                [entity_id]
            );
            
            unlockResult = { entity_type: 'speed_final', entity_id, unlocked: true };
            
        } else {
            return res.status(400).json({ error: 'Invalid entity_type' });
        }
        
        // Log audit event
        await logAuditEvent(pool, {
            userId,
            action: 'unlock_score',
            entityType: entity_type,
            entityId: entity_id,
            details: {
                reason: sanitizeString(reason),
                unlocked_at: new Date().toISOString()
            },
            ipAddress,
            userAgent
        });
        
        res.json({
            success: true,
            message: 'Score unlocked successfully. You can now edit it.',
            ...unlockResult
        });
    } catch (error) {
        console.error('[API] Error unlocking score:', error);
        res.status(500).json({ error: 'Failed to unlock score: ' + error.message });
    }
});

// Create finals match (Admin only)
app.post('/api/speed-competitions/:id/finals', requireAuth, async (req, res) => {
    try {
        const { stage, climber_a_id, climber_b_id, match_order } = req.body;
        
        if (!stage || !climber_a_id || !climber_b_id) {
            return res.status(400).json({ error: 'Stage, climber_a_id, and climber_b_id are required' });
        }
        
        const [result] = await pool.execute(
            `INSERT INTO speed_finals_matches 
             (speed_competition_id, stage, climber_a_id, climber_b_id, match_order)
             VALUES (?, ?, ?, ?, ?)`,
            [req.params.id, stage, climber_a_id, climber_b_id, match_order || 0]
        );
        
        const [matches] = await pool.execute(
            `SELECT 
                m.*,
                ca.name as climber_a_name,
                ca.bib_number as climber_a_bib,
                ca.team as climber_a_team,
                cb.name as climber_b_name,
                cb.bib_number as climber_b_bib,
                cb.team as climber_b_team
             FROM speed_finals_matches m
             JOIN speed_climbers ca ON m.climber_a_id = ca.id
             LEFT JOIN speed_climbers cb ON m.climber_b_id = cb.id
             WHERE m.id = ?`,
            [result.insertId]
        );
        
        res.status(201).json(matches[0]);
    } catch (error) {
        console.error('[API] Error creating finals match:', error);
        res.status(500).json({ error: 'Failed to create finals match' });
    }
});

// Delete finals match (Admin only)
app.delete('/api/speed-competitions/:id/finals/:matchId', requireAuth, async (req, res) => {
    try {
        const [result] = await pool.execute(
            'DELETE FROM speed_finals_matches WHERE id = ? AND speed_competition_id = ?',
            [req.params.matchId, req.params.id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Match not found' });
        }
        
        res.json({ message: 'Match deleted successfully' });
    } catch (error) {
        console.error('[API] Error deleting finals match:', error);
        res.status(500).json({ error: 'Failed to delete finals match' });
    }
});

// Generate finals bracket automatically from qualification results (Admin only)
// REFACTORED: Now uses MySQL transactions for ACID compliance
app.post('/api/speed-competitions/:id/generate-bracket', requireAuth, validate(generateBracketSchema), async (req, res) => {
    try {
        const { topCount = 8 } = req.body; // Validated by schema
        
        // Use transaction to ensure all-or-nothing bracket generation
        const result = await withTransaction(pool, async (connection) => {
            // Double-click protection: Check if bracket already exists
            const [existing] = await connection.execute(
                'SELECT COUNT(*) as count FROM speed_finals_matches WHERE speed_competition_id = ?',
                [req.params.id]
            );
            
            if (existing[0].count > 0) {
                throw new Error('Bracket already exists. Delete existing matches first.');
            }
            
            // Get qualification leaderboard
            const [qualification] = await connection.execute(
                `SELECT sqs.*, sc.id as climber_id, sc.name, sc.bib_number, sc.team 
                 FROM speed_qualification_scores sqs
                 JOIN speed_climbers sc ON sqs.climber_id = sc.id
                 WHERE sqs.speed_competition_id = ? AND sqs.status = 'VALID' AND sqs.rank IS NOT NULL
                 ORDER BY sqs.rank ASC
                 LIMIT ?`,
                [req.params.id, topCount]
            );
            
            if (qualification.length < 2) {
                throw new Error('Need at least 2 qualified climbers to generate bracket');
            }
            
            const matches = [];
            
            // Generate bracket based on topCount
            // IFSC/FPTI Standard Seeding: Higher seed (lower rank number) always in Lane A
            if (topCount === 8) {
                // Quarter Finals (4 matches) - Fixed Seeding Order
                // Match 1: Rank 1 (Lane A) vs Rank 8 (Lane B)
                if (qualification.length >= 8) {
                    matches.push({ stage: 'Quarter Final', climber_a: qualification[0], climber_b: qualification[7], order: 1 });
                } else if (qualification.length >= 1) {
                    // BYE: Rank 1 advances automatically
                    matches.push({ stage: 'Quarter Final', climber_a: qualification[0], climber_b: null, order: 1, is_bye: true });
                }
                
                // Match 2: Rank 4 (Lane A) vs Rank 5 (Lane B)
                if (qualification.length >= 5) {
                    matches.push({ stage: 'Quarter Final', climber_a: qualification[3], climber_b: qualification[4], order: 2 });
                } else if (qualification.length >= 4) {
                    // BYE: Rank 4 advances automatically
                    matches.push({ stage: 'Quarter Final', climber_a: qualification[3], climber_b: null, order: 2, is_bye: true });
                }
                
                // Match 3: Rank 3 (Lane A) vs Rank 6 (Lane B)
                if (qualification.length >= 6) {
                    matches.push({ stage: 'Quarter Final', climber_a: qualification[2], climber_b: qualification[5], order: 3 });
                } else if (qualification.length >= 3) {
                    // BYE: Rank 3 advances automatically
                    matches.push({ stage: 'Quarter Final', climber_a: qualification[2], climber_b: null, order: 3, is_bye: true });
                }
                
                // Match 4: Rank 2 (Lane A) vs Rank 7 (Lane B)
                if (qualification.length >= 7) {
                    matches.push({ stage: 'Quarter Final', climber_a: qualification[1], climber_b: qualification[6], order: 4 });
                } else if (qualification.length >= 2) {
                    // BYE: Rank 2 advances automatically
                    matches.push({ stage: 'Quarter Final', climber_a: qualification[1], climber_b: null, order: 4, is_bye: true });
                }
            } else if (topCount === 16) {
                // Round of 16 (8 matches)
                for (let i = 0; i < 8; i++) {
                    matches.push({
                        stage: 'Round of 16',
                        climber_a: qualification[i],
                        climber_b: qualification[15 - i],
                        order: i + 1
                    });
                }
            } else {
                throw new Error('topCount must be 8 or 16');
            }
            
            // Insert matches within transaction
            const insertedMatches = [];
            for (const match of matches) {
                // Handle BYE: if climber_b is null, set winner_id immediately to climber_a
                let winnerId = null;
                if (match.is_bye && match.climber_b === null) {
                    winnerId = match.climber_a.climber_id;
                }
                
                const [result] = await connection.execute(
                    `INSERT INTO speed_finals_matches 
                     (speed_competition_id, stage, climber_a_id, climber_b_id, match_order, winner_id, status_b)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        req.params.id, 
                        match.stage, 
                        match.climber_a.climber_id, 
                        match.climber_b ? match.climber_b.climber_id : null, 
                        match.order,
                        winnerId,
                        match.is_bye ? 'DNS' : 'VALID' // Mark BYE opponent as DNS
                    ]
                );
                
                const [newMatch] = await connection.execute(
                    `SELECT 
                        m.*,
                        ca.name as climber_a_name,
                        ca.bib_number as climber_a_bib,
                        ca.team as climber_a_team,
                        cb.name as climber_b_name,
                        cb.bib_number as climber_b_bib,
                        cb.team as climber_b_team
                     FROM speed_finals_matches m
                     JOIN speed_climbers ca ON m.climber_a_id = ca.id
                     LEFT JOIN speed_climbers cb ON m.climber_b_id = cb.id
                     WHERE m.id = ?`,
                    [result.insertId]
                );
                
                insertedMatches.push(newMatch[0]);
            }
            
            // Update competition status to 'finals' within transaction
            await connection.execute(
                'UPDATE speed_competitions SET status = ? WHERE id = ?',
                ['finals', req.params.id]
            );
            
            return { matches: insertedMatches, matchCount: matches.length, stage: matches[0]?.stage };
        });
        
        // Emit WebSocket event (only after successful transaction)
        io.emit('speed-finals-updated', {
            speed_competition_id: parseInt(req.params.id),
            action: 'bracket_generated'
        });
        
        res.json({
            success: true,
            message: `Generated ${result.matchCount} ${result.stage} matches`,
            matches: result.matches
        });
    } catch (error) {
        console.error('[API] Error generating bracket:', error);
        const statusCode = error.message.includes('already exists') || 
                          error.message.includes('Need at least') || 
                          error.message.includes('must be') ? 400 : 500;
        res.status(statusCode).json({ error: 'Failed to generate bracket: ' + error.message });
    }
});

// Generate next round matches (Semi Final, Small Final, Big Final) based on completed matches
app.post('/api/speed-competitions/:id/generate-next-round', requireAuth, async (req, res) => {
    try {
        // Double-click protection: Check what rounds already exist
        const [existingRounds] = await pool.execute(
            `SELECT DISTINCT stage 
             FROM speed_finals_matches 
             WHERE speed_competition_id = ?`,
            [req.params.id]
        );
        
        const existingStages = existingRounds.map(r => r.stage);
        
        // Get all matches
        const [allMatches] = await pool.execute(
            `SELECT * FROM speed_finals_matches 
             WHERE speed_competition_id = ?
             ORDER BY 
                 CASE stage
                     WHEN 'Round of 16' THEN 1
                     WHEN 'Quarter Final' THEN 2
                     WHEN 'Semi Final' THEN 3
                     WHEN 'Small Final' THEN 4
                     WHEN 'Big Final' THEN 5
                 END,
                 match_order ASC`,
            [req.params.id]
        );
        
        const quarterFinals = allMatches.filter(m => m.stage === 'Quarter Final');
        const semiFinals = allMatches.filter(m => m.stage === 'Semi Final');
        const smallFinal = allMatches.find(m => m.stage === 'Small Final');
        const bigFinal = allMatches.find(m => m.stage === 'Big Final');
        
        // Double-click protection: Prevent duplicate generation
        if (existingStages.includes('Semi Final') && semiFinals.length > 0) {
            // Semi Finals already exist, check if we should generate Finals
            if (existingStages.includes('Small Final') || existingStages.includes('Big Final')) {
                return res.status(400).json({ error: 'All rounds already generated. No new matches to create.' });
            }
        } else if (existingStages.includes('Small Final') && existingStages.includes('Big Final')) {
            return res.status(400).json({ error: 'All rounds already generated. No new matches to create.' });
        }
        
        const newMatches = [];
        
        // Generate Semi Finals if all Quarter Finals are completed
        if (quarterFinals.length > 0 && semiFinals.length === 0 && !existingStages.includes('Semi Final')) {
            const completedQuarterFinals = quarterFinals.filter(m => m.winner_id);
            
            if (completedQuarterFinals.length === quarterFinals.length) {
                // Get qualification ranks for dynamic seeding
                const [qualificationRanks] = await pool.execute(
                    `SELECT climber_id, rank 
                     FROM speed_qualification_scores 
                     WHERE speed_competition_id = ? AND rank IS NOT NULL`,
                    [req.params.id]
                );
                
                const rankMap = {};
                qualificationRanks.forEach(q => {
                    rankMap[q.climber_id] = q.rank;
                });
                
                const qf1 = quarterFinals.find(m => m.match_order === 1);
                const qf2 = quarterFinals.find(m => m.match_order === 2);
                const qf3 = quarterFinals.find(m => m.match_order === 3);
                const qf4 = quarterFinals.find(m => m.match_order === 4);
                
                // Semi Final 1: Winner of QF1 vs Winner of QF2
                // Dynamic seeding: Higher seed (lower rank number) goes to Lane A
                if (qf1?.winner_id && qf2?.winner_id) {
                    const rank1 = rankMap[qf1.winner_id] || 999;
                    const rank2 = rankMap[qf2.winner_id] || 999;
                    
                    newMatches.push({
                        stage: 'Semi Final',
                        climber_a_id: rank1 < rank2 ? qf1.winner_id : qf2.winner_id, // Higher seed in Lane A
                        climber_b_id: rank1 < rank2 ? qf2.winner_id : qf1.winner_id, // Lower seed in Lane B
                        order: 1
                    });
                }
                
                // Semi Final 2: Winner of QF3 vs Winner of QF4
                // Dynamic seeding: Higher seed (lower rank number) goes to Lane A
                if (qf3?.winner_id && qf4?.winner_id) {
                    const rank3 = rankMap[qf3.winner_id] || 999;
                    const rank4 = rankMap[qf4.winner_id] || 999;
                    
                    newMatches.push({
                        stage: 'Semi Final',
                        climber_a_id: rank3 < rank4 ? qf3.winner_id : qf4.winner_id, // Higher seed in Lane A
                        climber_b_id: rank3 < rank4 ? qf4.winner_id : qf3.winner_id, // Lower seed in Lane B
                        order: 2
                    });
                }
            }
        }
        
        // Generate Small Final and Big Final if both Semi Finals are completed
        if (semiFinals.length > 0 && !smallFinal && !bigFinal) {
            const completedSemiFinals = semiFinals.filter(m => m.winner_id);
            
            if (completedSemiFinals.length === semiFinals.length) {
                // Get qualification ranks for dynamic seeding
                const [qualificationRanks] = await pool.execute(
                    `SELECT climber_id, rank 
                     FROM speed_qualification_scores 
                     WHERE speed_competition_id = ? AND rank IS NOT NULL`,
                    [req.params.id]
                );
                
                const rankMap = {};
                qualificationRanks.forEach(q => {
                    rankMap[q.climber_id] = q.rank;
                });
                
                const semiFinal1 = semiFinals.find(m => m.match_order === 1);
                const semiFinal2 = semiFinals.find(m => m.match_order === 2);
                
                if (semiFinal1 && semiFinal2) {
                    // Small Final: Loser of SF1 vs Loser of SF2 (for 3rd place)
                    const loserSF1 = semiFinal1.winner_id === semiFinal1.climber_a_id ? semiFinal1.climber_b_id : semiFinal1.climber_a_id;
                    const loserSF2 = semiFinal2.winner_id === semiFinal2.climber_a_id ? semiFinal2.climber_b_id : semiFinal2.climber_a_id;
                    
                    // Dynamic seeding: Higher seed (lower rank number) goes to Lane A
                    if (loserSF1 && loserSF2) {
                        const rankLoser1 = rankMap[loserSF1] || 999;
                        const rankLoser2 = rankMap[loserSF2] || 999;
                        
                        newMatches.push({
                            stage: 'Small Final',
                            climber_a_id: rankLoser1 < rankLoser2 ? loserSF1 : loserSF2, // Higher seed in Lane A
                            climber_b_id: rankLoser1 < rankLoser2 ? loserSF2 : loserSF1, // Lower seed in Lane B
                            order: 1
                        });
                    }
                    
                    // Big Final: Winner of SF1 vs Winner of SF2 (for 1st place)
                    // Dynamic seeding: Higher seed (lower rank number) goes to Lane A
                    if (semiFinal1.winner_id && semiFinal2.winner_id) {
                        const rankWinner1 = rankMap[semiFinal1.winner_id] || 999;
                        const rankWinner2 = rankMap[semiFinal2.winner_id] || 999;
                        
                        newMatches.push({
                            stage: 'Big Final',
                            climber_a_id: rankWinner1 < rankWinner2 ? semiFinal1.winner_id : semiFinal2.winner_id, // Higher seed in Lane A
                            climber_b_id: rankWinner1 < rankWinner2 ? semiFinal2.winner_id : semiFinal1.winner_id, // Lower seed in Lane B
                            order: 1
                        });
                    }
                }
            }
        }
        
        if (newMatches.length === 0) {
            // Provide more specific error message
            let errorMessage = 'No new matches to generate. ';
            
            if (quarterFinals.length > 0 && semiFinals.length === 0) {
                const completedQF = quarterFinals.filter(m => m.winner_id).length;
                errorMessage += `Complete Quarter Final first (${completedQF}/${quarterFinals.length} matches completed).`;
            } else if (semiFinals.length > 0 && !smallFinal && !bigFinal) {
                const completedSF = semiFinals.filter(m => m.winner_id).length;
                errorMessage += `Complete Semi Final first (${completedSF}/${semiFinals.length} matches completed).`;
            } else if (smallFinal && bigFinal) {
                errorMessage += 'All rounds already generated.';
            } else {
                errorMessage += 'Complete current round first.';
            }
            
            return res.status(400).json({ error: errorMessage });
        }
        
        // Use transaction to ensure all-or-nothing match generation
        const result = await withTransaction(pool, async (connection) => {
            // Insert new matches within transaction
            const insertedMatches = [];
            for (const match of newMatches) {
                const [result] = await connection.execute(
                    `INSERT INTO speed_finals_matches 
                     (speed_competition_id, stage, climber_a_id, climber_b_id, match_order)
                     VALUES (?, ?, ?, ?, ?)`,
                    [req.params.id, match.stage, match.climber_a_id, match.climber_b_id, match.order]
                );
                
                const [newMatch] = await connection.execute(
                    `SELECT 
                        m.*,
                        ca.name as climber_a_name,
                        ca.bib_number as climber_a_bib,
                        ca.team as climber_a_team,
                        cb.name as climber_b_name,
                        cb.bib_number as climber_b_bib,
                        cb.team as climber_b_team
                     FROM speed_finals_matches m
                     JOIN speed_climbers ca ON m.climber_a_id = ca.id
                     LEFT JOIN speed_climbers cb ON m.climber_b_id = cb.id
                     WHERE m.id = ?`,
                    [result.insertId]
                );
                
                insertedMatches.push(newMatch[0]);
            }
            
            return insertedMatches;
        });
        
        // Emit WebSocket event (only after successful transaction)
        io.emit('speed-finals-updated', {
            speed_competition_id: parseInt(req.params.id),
            action: 'next_round_generated'
        });
        
        res.json({
            success: true,
            message: `Generated ${newMatches.length} new match(es)`,
            matches: result
        });
    } catch (error) {
        console.error('[API] Error generating next round:', error);
        res.status(500).json({ error: 'Failed to generate next round: ' + error.message });
    }
});

// Delete speed competition (Admin only)
app.delete('/api/speed-competitions/:id', requireAuth, async (req, res) => {
    try {
        const [result] = await pool.execute('DELETE FROM speed_competitions WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Speed competition not found' });
        }
        res.json({ message: 'Speed competition deleted successfully' });
    } catch (error) {
        console.error('[API] Error deleting speed competition:', error);
        res.status(500).json({ error: 'Failed to delete speed competition' });
    }
});

// Update speed climber (Admin only)
app.put('/api/speed-climbers/:id', requireAuth, async (req, res) => {
    try {
        const { name, bib_number, team } = req.body;

        const [result] = await pool.execute(
            'UPDATE speed_climbers SET name = ?, bib_number = ?, team = ? WHERE id = ?',
            [name, parseInt(bib_number), team || '', req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Speed climber not found' });
        }

        const [climbers] = await pool.execute('SELECT * FROM speed_climbers WHERE id = ?', [req.params.id]);
        res.json(climbers[0]);
    } catch (error) {
        console.error('[API] Error updating speed climber:', error);
        res.status(500).json({ error: 'Failed to update speed climber' });
    }
});

// Delete speed climber (Admin only)
app.delete('/api/speed-climbers/:id', requireAuth, async (req, res) => {
    try {
        const [result] = await pool.execute('DELETE FROM speed_climbers WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Speed climber not found' });
        }
        res.json({ message: 'Speed climber deleted successfully' });
    } catch (error) {
        console.error('[API] Error deleting speed climber:', error);
        res.status(500).json({ error: 'Failed to delete speed climber' });
    }
});

// Helper function untuk serve HTML file dengan error handling
function serveHtmlFile(req, res, filename) {
    const filePath = path.join(__dirname, 'public', filename);
    console.log(`[ROUTE] ${req.path} requested`);
    console.log(`[DEBUG] __dirname: ${__dirname}`);
    console.log(`[DEBUG] filePath: ${filePath}`);
    console.log(`[DEBUG] File exists: ${fs.existsSync(filePath)}`);
    
    if (!fs.existsSync(filePath)) {
        console.error(`[ERROR] File not found: ${filePath}`);
        const publicDir = path.join(__dirname, 'public');
        console.error(`[DEBUG] Public dir: ${publicDir}, exists: ${fs.existsSync(publicDir)}`);
        if (fs.existsSync(publicDir)) {
            try {
                const files = fs.readdirSync(publicDir);
                console.error(`[DEBUG] Files in public: ${files.join(', ')}`);
            } catch (e) {
                console.error(`[DEBUG] Cannot read public dir: ${e.message}`);
            }
        }
        return res.status(404).send(`File not found: ${filename}`);
    }
    
    // Set Content-Type explicitly
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    // Disable caching for HTML files to ensure fresh content
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error(`[ERROR] Failed to send ${filename}:`, err);
            res.status(500).send(`Error loading file: ${err.message}`);
        } else {
            console.log(`[SUCCESS] ${filename} sent successfully`);
        }
    });
}

// ============================================
// ROUTING: Landing Page (React) & Timer System
// ============================================

// Serve React build untuk root dan semua routes React (SPA)
// React Router akan handle client-side routing
app.get('/', (req, res) => {
    const reactIndexPath = path.join(__dirname, 'public', 'react-build', 'index.html');
    if (fs.existsSync(reactIndexPath)) {
        res.sendFile(reactIndexPath);
    } else {
        // Fallback jika React build belum ada
        res.send(`
            <html>
                <head><title>FPTI Karanganyar</title></head>
                <body>
                    <h1>FPTI Karanganyar</h1>
                    <p>React build belum tersedia. Silakan jalankan: cd client && npm install && npm run build</p>
                    <p><a href="/timersistem">Akses Timer Sistem</a></p>
                </body>
            </html>
        `);
    }
});

// Timer System Routes - semua di bawah /timersistem
app.get('/timersistem', (req, res) => {
    serveHtmlFile(req, res, 'index.html');
});

app.get('/timersistem/index.html', (req, res) => {
    serveHtmlFile(req, res, 'index.html');
});

app.get('/timersistem/admin.html', (req, res) => {
    serveHtmlFile(req, res, 'admin.html');
});

app.get('/timersistem/display.html', (req, res) => {
    serveHtmlFile(req, res, 'display.html');
});

app.get('/timersistem/boulder-admin.html', (req, res) => {
    serveHtmlFile(req, res, 'boulder-admin.html');
});

app.get('/timersistem/boulder-display.html', (req, res) => {
    serveHtmlFile(req, res, 'boulder-display.html');
});

// Admin Login Route
app.get('/admin-login', (req, res) => {
    serveHtmlFile(req, res, 'admin-login.html');
});

app.get('/admin-login.html', (req, res) => {
    serveHtmlFile(req, res, 'admin-login.html');
});

// Admin Dashboard Route (Protected)
app.get('/admin-dashboard', (req, res, next) => {
    if (!req.session || !req.session.userId) {
        return res.redirect('/admin-login');
    }
    serveHtmlFile(req, res, 'admin-dashboard.html');
});

app.get('/admin-dashboard.html', (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.redirect('/admin-login');
    }
    serveHtmlFile(req, res, 'admin-dashboard.html');
});

// Judge Interface Route (Protected)
app.get('/judge-interface', (req, res, next) => {
    if (!req.session || !req.session.userId) {
        return res.redirect('/admin-login');
    }
    serveHtmlFile(req, res, 'judge-interface.html');
});

app.get('/judge-interface.html', (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.redirect('/admin-login');
    }
    serveHtmlFile(req, res, 'judge-interface.html');
});

// Backward compatibility - redirect old routes ke /timersistem
app.get('/admin.html', (req, res) => {
    res.redirect('/timersistem/admin.html');
});

app.get('/display.html', (req, res) => {
    res.redirect('/timersistem/display.html');
});

app.get('/boulder-admin.html', (req, res) => {
    res.redirect('/timersistem/boulder-admin.html');
});

app.get('/boulder-display.html', (req, res) => {
    res.redirect('/timersistem/boulder-display.html');
});

// Sitemap.xml route - HARUS SEBELUM static middleware
app.get('/sitemap.xml', async (req, res) => {
    console.log('[SITEMAP] Request received for /sitemap.xml');
    try {
        const sitemap = new SitemapStream({
            hostname: 'https://fptikaranganyar.my.id'
        });

        // React Routes (Landing Page & Pages)
        sitemap.write({ url: '/', changefreq: 'weekly', priority: 1.0 });
        sitemap.write({ url: '/tentang', changefreq: 'monthly', priority: 0.8 });
        sitemap.write({ url: '/atlet', changefreq: 'weekly', priority: 0.8 });
        sitemap.write({ url: '/jadwal', changefreq: 'weekly', priority: 0.8 });
        sitemap.write({ url: '/berita', changefreq: 'weekly', priority: 0.8 });
        sitemap.write({ url: '/kontak', changefreq: 'monthly', priority: 0.7 });

        // Timer System Routes
        sitemap.write({ url: '/timersistem', changefreq: 'monthly', priority: 0.6 });
        sitemap.write({ url: '/timersistem/admin.html', changefreq: 'monthly', priority: 0.5 });
        sitemap.write({ url: '/timersistem/display.html', changefreq: 'monthly', priority: 0.5 });
        sitemap.write({ url: '/timersistem/boulder-admin.html', changefreq: 'monthly', priority: 0.5 });
        sitemap.write({ url: '/timersistem/boulder-display.html', changefreq: 'monthly', priority: 0.5 });

        sitemap.end();

        const xml = await streamToPromise(sitemap);
        res.header('Content-Type', 'application/xml');
        console.log('[SITEMAP] Sitemap generated successfully');
        res.send(xml);
    } catch (e) {
        console.error('[ERROR] Error membuat sitemap:', e);
        res.status(500).send('Error membuat sitemap');
    }
});

// Robots.txt route - HARUS SEBELUM static middleware
app.get('/robots.txt', (req, res) => {
    console.log('[ROBOTS] Request received for /robots.txt');
    const robotsTxt = `User-agent: *
Allow: /

Sitemap: https://fptikaranganyar.my.id/sitemap.xml
`;
    res.type('text/plain');
    res.send(robotsTxt);
});

// Middleware untuk skip API routes, sitemap.xml dan robots.txt dari static serving
// HARUS SEBELUM semua static middleware
app.use((req, res, next) => {
    if (req.path.startsWith('/api/') || 
        req.path === '/sitemap.xml' || 
        req.path === '/robots.txt') {
        console.log(`[STATIC] Skipping static serve for ${req.path}`);
        return next(); // Skip static serving, biarkan route handler yang handle
    }
    next();
});

// Serve React build static files (assets dari Vite build)
const reactBuildPath = path.join(__dirname, 'public', 'react-build');
if (fs.existsSync(reactBuildPath)) {
    app.use((req, res, next) => {
        // Skip API routes
        if (req.path.startsWith('/api/')) {
            return next();
        }
        next();
    }, express.static(reactBuildPath, {
        index: false, // Jangan serve index.html via static, sudah di-handle di route
        maxAge: '1y', // Cache static assets
        etag: true,
        lastModified: true
    }));
}

// Serve static files dari folder public (CSS, JS, images, sounds, dll)
// Diletakkan SETELAH explicit routes agar tidak meng-override routing HTML
// Hanya serve file yang bukan HTML
app.use((req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
        return next();
    }
    next();
}, express.static(path.join(__dirname, 'public'), {
    index: false,
    setHeaders: (res, filePath) => {
        // Jangan serve HTML files via static middleware
        if (path.extname(filePath) === '.html') {
            return;
        }
    }
}));

// Fallback untuk React Router - semua routes yang bukan timer system
// harus di-handle oleh React (untuk client-side routing)
// Express 5 tidak support wildcard *, jadi kita gunakan catch-all dengan cara lain
app.use((req, res, next) => {
    // Skip jika route adalah timer system, API, admin pages, sitemap, robots, atau static files
    if (req.path.startsWith('/timersistem') || 
        req.path.startsWith('/api/') ||
        req.path.startsWith('/admin-dashboard') ||
        req.path.startsWith('/admin-login') ||
        req.path.startsWith('/sounds/') || 
        req.path.startsWith('/socket.io/') ||
        req.path.startsWith('/uploads/') ||
        req.path === '/sitemap.xml' ||
        req.path === '/robots.txt' ||
        path.extname(req.path) !== '') {
        return next();
    }
    
    // Skip jika method bukan GET
    if (req.method !== 'GET') {
        return next();
    }
    
    // Serve React index.html untuk semua routes lainnya (SPA routing)
    const reactIndexPath = path.join(__dirname, 'public', 'react-build', 'index.html');
    if (fs.existsSync(reactIndexPath)) {
        // Disable caching for React index.html
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.sendFile(reactIndexPath);
    } else {
        next();
    }
});

// ============================================
// SIMULATION MODE FLAG
// ============================================
const IS_SIMULATION = true; // Set false ketika hardware Arduino ready

// ============================================
// RACE STATE MANAGEMENT
// ============================================
let raceState = {
    config: {
        readyDuration: 2000,    // Waktu injak sensor agar status jadi READY (2 detik)
        countdownTime: 3000,    // Durasi Beep 1..2..3 (3 detik)
    },
    matchStatus: "IDLE",        // IDLE, ARMED, COUNTDOWN, RUNNING, FINISHED
    globalStartTime: null,      // Timestamp saat sinyal GO (Beep ke-3 selesai)
    
    // Jalur Kiri (Lane A)
    laneA: {
        status: "IDLE",         // IDLE, READY, RUNNING, FINISHED, FALSE_START
        sensorBottom: false,    // Status Injak Pad
        sensorTop: false,       // Status Tombol Finish
        startTime: 0,
        finishTime: 0,
        finalDuration: "00:00.000",
        athleteName: "",        // Nama atlet
        readyStartTime: null    // Timestamp saat sensorBottom mulai true
    },
    
    // Jalur Kanan (Lane B)
    laneB: {
        status: "IDLE",
        sensorBottom: false,
        sensorTop: false,
        startTime: 0,
        finishTime: 0,
        finalDuration: "00:00.000",
        athleteName: "",        // Nama atlet
        readyStartTime: null
    }
};

// ============================================
// SERIAL PORT SETUP (Hanya aktif jika IS_SIMULATION = false)
// ============================================
let serialPort = null;

if (!IS_SIMULATION) {
    // Uncomment dan konfigurasi sesuai hardware Arduino Anda
    /*
    try {
        serialPort = new SerialPort({
            path: 'COM3', // Ganti dengan port Arduino Anda (Windows: COM3, Linux/Mac: /dev/ttyUSB0)
            baudRate: 9600,
            autoOpen: false
        });

        serialPort.open((err) => {
            if (err) {
                console.error('Error opening serial port:', err);
            } else {
                console.log('Serial port opened successfully');
            }
        });

        serialPort.on('data', (data) => {
            const message = data.toString().trim();
            console.log('Received from Arduino:', message);
            parseSerialData(message);
        });

        serialPort.on('error', (err) => {
            console.error('Serial port error:', err);
        });
    } catch (error) {
        console.error('Serial port setup error:', error);
    }
    */
}

// Fungsi untuk parse data dari Arduino
function parseSerialData(message) {
    // Format: "A_BOT_ON", "A_BOT_OFF", "A_TOP_HIT", "B_BOT_ON", dll
    const parts = message.split('_');
    if (parts.length < 2) return;

    const lane = parts[0]; // 'A' or 'B'
    const sensor = parts[1]; // 'BOT' or 'TOP'
    const action = parts[2]; // 'ON', 'OFF', 'HIT'

    if (lane === 'A') {
        if (sensor === 'BOT') {
            updateSensor('A', 'bottom', action === 'ON');
        } else if (sensor === 'TOP') {
            if (action === 'HIT') {
                updateSensor('A', 'top', true);
                setTimeout(() => updateSensor('A', 'top', false), 100);
            }
        }
    } else if (lane === 'B') {
        if (sensor === 'BOT') {
            updateSensor('B', 'bottom', action === 'ON');
        } else if (sensor === 'TOP') {
            if (action === 'HIT') {
                updateSensor('B', 'top', true);
                setTimeout(() => updateSensor('B', 'top', false), 100);
            }
        }
    }
}

// ============================================
// SENSOR UPDATE FUNCTION
// ============================================
function updateSensor(lane, sensorType, value) {
    const laneKey = lane === 'A' ? 'laneA' : 'laneB';
    const sensorKey = sensorType === 'bottom' ? 'sensorBottom' : 'sensorTop';
    
    const oldValue = raceState[laneKey][sensorKey];
    raceState[laneKey][sensorKey] = value;

    // Logika untuk sensor bottom (injak pad)
    if (sensorType === 'bottom') {
        if (value && !oldValue) {
            // Sensor baru diinjak
            raceState[laneKey].readyStartTime = Date.now();
            console.log(`[SENSOR] Lane ${lane} bottom sensor ON`);
            
            // Set timeout untuk check ready status setelah readyDuration
            // (akan dicek di akhir fungsi setelah auto-ARM)
            setTimeout(() => {
                // Check lagi apakah sensor masih ON dan status masih IDLE
                if (raceState[laneKey].sensorBottom && 
                    raceState[laneKey].status === 'IDLE' && 
                    raceState.matchStatus === 'ARMED') {
                    raceState[laneKey].status = 'READY';
                    console.log(`[READY] Lane ${lane} is ready (held for ${raceState.config.readyDuration}ms)`);
                    broadcastState();
                }
            }, raceState.config.readyDuration);
        } else if (!value && oldValue) {
            // Sensor dilepas
            raceState[laneKey].readyStartTime = null;
            console.log(`[SENSOR] Lane ${lane} bottom sensor OFF`);
            
            // Check false start (kaki diangkat sebelum GO)
            if (raceState.matchStatus === 'COUNTDOWN' || 
                (raceState.matchStatus === 'RUNNING' && !raceState.globalStartTime)) {
                raceState[laneKey].status = 'FALSE_START';
                console.log(`[FALSE START] Lane ${lane} - lifted foot before GO signal`);
                
                // Play warning sound 3x dengan rentang waktu berdekatan
                io.emit('play-sound', { type: 'false-start', lane: lane });
                
                // Reset match status jika false start
                if (raceState.matchStatus === 'COUNTDOWN') {
                    raceState.matchStatus = 'ARMED';
                }
            } else if (raceState.matchStatus === 'RUNNING' && raceState.globalStartTime) {
                // Valid start (kaki diangkat setelah GO signal)
                if (raceState[laneKey].status === 'READY' || raceState[laneKey].status === 'IDLE') {
                    raceState[laneKey].status = 'RUNNING';
                    raceState[laneKey].startTime = raceState.globalStartTime;
                    console.log(`[VALID START] Lane ${lane} at ${raceState.globalStartTime}`);
                }
            } else if (raceState.matchStatus === 'ARMED') {
                // Reset status jika sensor dilepas sebelum match start
                if (raceState[laneKey].status === 'READY') {
                    raceState[laneKey].status = 'IDLE';
                }
                
                // Auto-disarm jika salah satu sensor OFF
                if (!raceState.laneA.sensorBottom || !raceState.laneB.sensorBottom) {
                    raceState.matchStatus = 'IDLE';
                    console.log('[AUTO-DISARM] One or both sensors OFF - Match disarmed');
                }
            }
        }
    }

    // Logika untuk sensor top (finish button)
    if (sensorType === 'top' && value && !oldValue) {
        if (raceState[laneKey].status === 'RUNNING' && raceState[laneKey].startTime > 0) {
            raceState[laneKey].status = 'FINISHED';
            raceState[laneKey].finishTime = Date.now();
            const duration = raceState[laneKey].finishTime - raceState[laneKey].startTime;
            raceState[laneKey].finalDuration = formatDuration(duration);
            console.log(`[FINISH] Lane ${lane}: ${raceState[laneKey].finalDuration}`);
            
            // Check jika kedua lane sudah finish
            if (raceState.laneA.status === 'FINISHED' && raceState.laneB.status === 'FINISHED') {
                raceState.matchStatus = 'FINISHED';
            }
        }
    }

    // AUTO-ARM: Check setelah semua update selesai
    // Jika kedua sensor bottom ON dan status masih IDLE, auto-arm
    console.log(`[AUTO-ARM CHECK] Match status: ${raceState.matchStatus}, Lane A bottom: ${raceState.laneA.sensorBottom}, Lane B bottom: ${raceState.laneB.sensorBottom}`);
    
    if (raceState.matchStatus === 'IDLE' && 
        raceState.laneA.sensorBottom && 
        raceState.laneB.sensorBottom) {
        raceState.matchStatus = 'ARMED';
        console.log('[AUTO-ARM] ✅ Both sensors ON - Match automatically armed');
        console.log('[AUTO-ARM] Status updated to ARMED');
    }
    
    // Broadcast state setelah semua update dan check auto-ARM selesai
    console.log(`[BROADCAST] Broadcasting state. Match status: ${raceState.matchStatus}`);
    broadcastState();
}

// ============================================
// RACE CONTROL FUNCTIONS
// ============================================
function startMatch() {
    if (raceState.matchStatus !== 'ARMED') {
        console.log('[ERROR] Cannot start match. Status must be ARMED');
        return;
    }

    raceState.matchStatus = 'COUNTDOWN';
    broadcastState();

    // Play beepstartspeed.MP3 (3 detik countdown audio)
    io.emit('play-sound', { type: 'countdown-start' });
    console.log('[COUNTDOWN] Playing beepstartspeed.MP3 (3 seconds)');
    
    // Set global start time setelah 3 detik (durasi audio)
    setTimeout(() => {
        raceState.globalStartTime = Date.now();
        raceState.matchStatus = 'RUNNING';
        
        // Set start time untuk lane yang sudah ready
        if (raceState.laneA.status === 'READY') {
            raceState.laneA.startTime = raceState.globalStartTime;
            raceState.laneA.status = 'RUNNING';
        }
        if (raceState.laneB.status === 'READY') {
            raceState.laneB.startTime = raceState.globalStartTime;
            raceState.laneB.status = 'RUNNING';
        }

        console.log('[GO] Race started at', raceState.globalStartTime);
        broadcastState();
    }, 3000); // 3000ms = 3 detik (durasi beepstartspeed.MP3)
}

function resetMatch() {
    raceState.matchStatus = 'IDLE';
    raceState.globalStartTime = null;
    
    raceState.laneA = {
        status: 'IDLE',
        sensorBottom: false,
        sensorTop: false,
        startTime: 0,
        finishTime: 0,
        finalDuration: '00:00.000',
        athleteName: '',
        readyStartTime: null
    };
    
    raceState.laneB = {
        status: 'IDLE',
        sensorBottom: false,
        sensorTop: false,
        startTime: 0,
        finishTime: 0,
        finalDuration: '00:00.000',
        athleteName: '',
        readyStartTime: null
    };

    console.log('[RESET] Match reset');
    broadcastState();
}

function armMatch() {
    console.log('[ARM] Attempting to arm match. Current status:', raceState.matchStatus);
    if (raceState.matchStatus !== 'IDLE') {
        console.log('[ERROR] Cannot arm match. Status must be IDLE, current:', raceState.matchStatus);
        return false;
    }

    raceState.matchStatus = 'ARMED';
    console.log('[ARMED] Match armed, waiting for sensors...');
    broadcastState();
    return true;
}

// ============================================
// HELPER FUNCTIONS
// ============================================
function formatDuration(ms) {
    const totalSeconds = ms / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const milliseconds = Math.floor((ms % 1000));
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
}

function broadcastState() {
    io.emit('race-state', raceState);
}

// Timer update loop
setInterval(() => {
    if (raceState.matchStatus === 'RUNNING') {
        // Update timer untuk lane yang sedang running
        const now = Date.now();
        
        if (raceState.laneA.status === 'RUNNING' && raceState.laneA.startTime > 0) {
            const elapsed = now - raceState.laneA.startTime;
            raceState.laneA.finalDuration = formatDuration(elapsed);
        }
        
        if (raceState.laneB.status === 'RUNNING' && raceState.laneB.startTime > 0) {
            const elapsed = now - raceState.laneB.startTime;
            raceState.laneB.finalDuration = formatDuration(elapsed);
        }
        
        broadcastState();
    }
}, 16); // Update setiap ~16ms untuk smooth timer (60fps)

// ============================================
// BOULDER TIMER STATE (Terpisah dari Speed Climbing)
// ============================================
// Create namespace untuk Boulder Timer FIRST
const boulderIo = io.of('/boulder');

let boulderState = {
    config: {
        climbDuration: 240,    // 4 menit (dalam detik)
        restDuration: 10,      // 10 detik jeda
        warningTime: 60,       // Bunyi warning di sisa 1 menit
        countdownTime: 5       // Bunyi hitung mundur di 5 detik terakhir
    },
    phase: "IDLE",             // IDLE, CLIMBING, REST
    timeLeft: 0,               // Detik tersisa (countdown)
    isPaused: false,
    lastSoundPlayed: null
};

let boulderTimerInterval = null;

function startBoulderTimerLoop() {
    if (boulderTimerInterval) {
        clearInterval(boulderTimerInterval);
    }

    boulderTimerInterval = setInterval(() => {
        if (boulderState.isPaused || boulderState.phase === "IDLE") {
            boulderBroadcastState();
            return;
        }

        const currentTime = boulderState.timeLeft;

        // LOGIKA AUDIO TRIGGERS
        if (boulderState.phase === "CLIMBING" && !boulderState.isPaused) {
            if (currentTime === boulderState.config.warningTime && boulderState.lastSoundPlayed !== 'warning') {
                boulderIo.emit('play-sound', { type: 'warning' });
                boulderState.lastSoundPlayed = 'warning';
            }
            
            if (currentTime === boulderState.config.countdownTime + 1) {
                boulderState.lastSoundPlayed = null;
            }
            
            if (currentTime <= boulderState.config.countdownTime && currentTime > 0) {
                const expectedSoundKey = `countdown-${currentTime}`;
                if (boulderState.lastSoundPlayed !== expectedSoundKey) {
                    boulderIo.emit('play-sound', { type: 'countdown' });
                    boulderState.lastSoundPlayed = expectedSoundKey;
                }
            }
        }

        if (boulderState.timeLeft > 0) {
            boulderState.timeLeft--;
        }

        // LOGIKA PERPINDAHAN FASE
        if (boulderState.timeLeft <= 0) {
            if (boulderState.phase === "CLIMBING") {
                boulderState.phase = "REST";
                boulderState.timeLeft = boulderState.config.restDuration;
                boulderState.lastSoundPlayed = null;
                setTimeout(() => {
                    boulderIo.emit('play-sound', { type: 'finish' });
                }, 300);
            } else if (boulderState.phase === "REST") {
                boulderState.phase = "CLIMBING";
                boulderState.timeLeft = boulderState.config.climbDuration;
                boulderState.lastSoundPlayed = null;
                boulderIo.emit('play-sound', { type: 'start' });
            }
        }

        boulderBroadcastState();
    }, 1000);
}

function boulderBroadcastState() {
    boulderIo.emit('sync-time', {
        phase: boulderState.phase,
        timeLeft: boulderState.timeLeft,
        isPaused: boulderState.isPaused,
        config: boulderState.config
    });
}

// ============================================
// SOCKET.IO CONNECTIONS - Speed Climbing (Default)
// ============================================
io.on('connection', (socket) => {
    console.log('[SPEED] Client connected:', socket.id);
    
    // Send current state to newly connected client
    socket.emit('race-state', raceState);

    // Keyboard simulation (hanya di simulation mode)
    if (IS_SIMULATION) {
        socket.on('simulate-sensor', (data) => {
            const { lane, sensor, value } = data;
            console.log(`[SIMULATION] Lane ${lane}, Sensor ${sensor}, Value: ${value}`);
            updateSensor(lane, sensor, value);
        });
    }

    // Race control
    socket.on('arm-match', () => {
        armMatch();
    });

    socket.on('start-match', () => {
        startMatch();
    });

    socket.on('reset-match', () => {
        resetMatch();
    });

    // Update athlete name
    socket.on('update-athlete-name', (data) => {
        const { lane, name } = data;
        const laneKey = lane === 'A' ? 'laneA' : 'laneB';
        raceState[laneKey].athleteName = name || '';
        console.log(`[ATHLETE] Lane ${lane} name set to: ${name}`);
        broadcastState();
    });

    socket.on('disconnect', () => {
        console.log('[SPEED] Client disconnected:', socket.id);
    });
});

// ============================================
// SOCKET.IO CONNECTIONS - Boulder Timer (Namespace /boulder)
// ============================================
boulderIo.on('connection', (socket) => {
    console.log('[BOULDER] Client connected:', socket.id);
    
    // Send current state to newly connected client
    socket.emit('sync-time', {
        phase: boulderState.phase,
        timeLeft: boulderState.timeLeft,
        isPaused: boulderState.isPaused,
        config: boulderState.config
    });

    socket.on('startTimer', () => {
        if (!boulderTimerInterval) {
            startBoulderTimerLoop();
        }
        
        if (boulderState.phase === "IDLE") {
            boulderState.phase = "CLIMBING";
            boulderState.timeLeft = boulderState.config.climbDuration;
            boulderState.isPaused = false;
            boulderState.lastSoundPlayed = null;
            boulderIo.emit('play-sound', { type: 'start' });
        } else if (boulderState.isPaused) {
            boulderState.isPaused = false;
        }
        
        boulderBroadcastState();
    });

    socket.on('pauseTimer', () => {
        if (boulderState.phase !== "IDLE" && !boulderState.isPaused) {
            boulderState.isPaused = true;
            boulderBroadcastState();
        }
    });

    socket.on('resetTimer', () => {
        boulderState.phase = "IDLE";
        boulderState.timeLeft = 0;
        boulderState.isPaused = false;
        boulderState.lastSoundPlayed = null;
        
        if (boulderTimerInterval) {
            clearInterval(boulderTimerInterval);
            boulderTimerInterval = null;
        }
        
        boulderBroadcastState();
    });

    socket.on('skipPhase', () => {
        if (boulderState.phase === "CLIMBING") {
            boulderState.phase = "REST";
            boulderState.timeLeft = boulderState.config.restDuration;
            boulderState.lastSoundPlayed = null;
            boulderIo.emit('play-sound', { type: 'finish' });
        } else if (boulderState.phase === "REST") {
            boulderState.phase = "CLIMBING";
            boulderState.timeLeft = boulderState.config.climbDuration;
            boulderState.lastSoundPlayed = null;
            boulderIo.emit('play-sound', { type: 'start' });
        }
        
        boulderBroadcastState();
    });

    socket.on('updateConfig', (newConfig) => {
        if (newConfig.climbDuration && newConfig.climbDuration > 0) {
            boulderState.config.climbDuration = parseInt(newConfig.climbDuration);
        }
        if (newConfig.restDuration && newConfig.restDuration >= 0) {
            boulderState.config.restDuration = parseInt(newConfig.restDuration);
        }
        if (newConfig.warningTime && newConfig.warningTime > 0) {
            boulderState.config.warningTime = parseInt(newConfig.warningTime);
        }
        if (newConfig.countdownTime && newConfig.countdownTime > 0) {
            boulderState.config.countdownTime = parseInt(newConfig.countdownTime);
        }
        
        if (boulderState.phase === "IDLE") {
            boulderState.timeLeft = boulderState.config.climbDuration;
        }
        
        boulderBroadcastState();
    });

    socket.on('disconnect', () => {
        console.log('[BOULDER] Client disconnected:', socket.id);
    });
});

// Start boulder timer loop
startBoulderTimerLoop();

// ============================================
// KEYBOARD HANDLER (Simulation Mode)
// ============================================
if (IS_SIMULATION) {
    // Keyboard handler akan di-handle di client side (admin.html)
    console.log('[SIMULATION MODE] Active - Sensor simulation via keyboard/socket');
}

// ============================================
// SERVER START
// ============================================
// PORT akan di-set otomatis oleh cPanel/Passenger
// Jika tidak ada, gunakan 3000 untuk development
const PORT = process.env.PORT || process.env.PASSENGER_APP_ENV || 3000;

// Function to get local IP address
function getLocalIPAddress() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Skip internal (loopback) and non-IPv4 addresses
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

const LOCAL_IP = getLocalIPAddress();

// Listen on all network interfaces (0.0.0.0) to allow access from other devices
server.listen(PORT, '0.0.0.0', () => {
    console.log('='.repeat(50));
    console.log(`Climbing Timer System`);
    console.log('');
    console.log(`Server running on:`);
    console.log(`  Local:    http://localhost:${PORT}`);
    console.log(`  Network:  http://${LOCAL_IP}:${PORT}`);
    console.log('');
    console.log('Speed Climbing (Dual Lane):');
    console.log(`  Display (Local):   http://localhost:${PORT}/display.html`);
    console.log(`  Display (Network): http://${LOCAL_IP}:${PORT}/display.html`);
    console.log(`  Admin (Local):     http://localhost:${PORT}/admin.html`);
    console.log(`  Admin (Network):   http://${LOCAL_IP}:${PORT}/admin.html`);
    console.log('');
    console.log('Boulder Timer (Countdown):');
    console.log(`  Display (Local):   http://localhost:${PORT}/boulder-display.html`);
    console.log(`  Display (Network): http://${LOCAL_IP}:${PORT}/boulder-display.html`);
    console.log(`  Admin (Local):     http://localhost:${PORT}/boulder-admin.html`);
    console.log(`  Admin (Network):   http://${LOCAL_IP}:${PORT}/boulder-admin.html`);
    console.log('');
    console.log(`Mode: ${IS_SIMULATION ? 'SIMULATION' : 'HARDWARE'}`);
    console.log('');
    console.log(`💡 Akses dari perangkat lain di WiFi yang sama:`);
    console.log(`   Gunakan alamat: http://${LOCAL_IP}:${PORT}`);
    console.log('='.repeat(50));
});

