const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const os = require('os');
// const { SerialPort } = require('serialport'); // Uncomment ketika hardware ready

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(express.json());
const fs = require('fs');

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
    
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error(`[ERROR] Failed to send ${filename}:`, err);
            res.status(500).send(`Error loading file: ${err.message}`);
        } else {
            console.log(`[SUCCESS] ${filename} sent successfully`);
        }
    });
}

// Explicit routes untuk semua halaman HTML (HARUS SEBELUM static middleware)
// Ini memastikan routing HTML bekerja dengan benar di cPanel
app.get('/', (req, res) => {
    serveHtmlFile(req, res, 'index.html');
});

app.get('/index.html', (req, res) => {
    serveHtmlFile(req, res, 'index.html');
});

app.get('/admin.html', (req, res) => {
    serveHtmlFile(req, res, 'admin.html');
});

app.get('/display.html', (req, res) => {
    serveHtmlFile(req, res, 'display.html');
});

app.get('/boulder-admin.html', (req, res) => {
    serveHtmlFile(req, res, 'boulder-admin.html');
});

app.get('/boulder-display.html', (req, res) => {
    serveHtmlFile(req, res, 'boulder-display.html');
});

// Serve static files dari folder public (CSS, JS, images, sounds, dll)
// Diletakkan SETELAH explicit routes agar tidak meng-override routing HTML
// Hanya serve file yang bukan HTML
app.use(express.static(path.join(__dirname, 'public'), {
    index: false,
    setHeaders: (res, filePath) => {
        // Jangan serve HTML files via static middleware
        if (path.extname(filePath) === '.html') {
            return;
        }
    }
}));

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

