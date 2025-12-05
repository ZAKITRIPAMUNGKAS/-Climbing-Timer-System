// Script untuk menambahkan data dummy ke database
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function seedDummyData() {
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '272800',
            database: process.env.DB_NAME || 'fpti_karanganyar',
            port: process.env.DB_PORT || 3306
        });

        console.log('Seeding dummy data...');
        
        // Dummy Athletes
        const dummyAthletes = [
            {
                name: 'Ahmad Rizki',
                category: 'Speed Climbing',
                age: 22,
                achievement: 'Medali Emas Kejurnas 2024',
                image: '/uploads/dummy-athlete-1.jpg'
            },
            {
                name: 'Siti Nurhaliza',
                category: 'Lead / Boulder',
                age: 20,
                achievement: 'Juara 1 Kejurprov Jateng',
                image: '/uploads/dummy-athlete-2.jpg'
            },
            {
                name: 'Budi Santoso',
                category: 'Boulder',
                age: 24,
                achievement: 'Medali Perak Porprov 2024',
                image: '/uploads/dummy-athlete-3.jpg'
            },
            {
                name: 'Rina Wati',
                category: 'Speed Climbing',
                age: 19,
                achievement: 'Juara 3 Kejurnas 2024',
                image: '/uploads/dummy-athlete-4.jpg'
            },
            {
                name: 'Dedi Kurniawan',
                category: 'Lead',
                age: 25,
                achievement: 'Medali Emas Kejurda',
                image: '/uploads/dummy-athlete-5.jpg'
            },
            {
                name: 'Maya Sari',
                category: 'Boulder',
                age: 21,
                achievement: 'Juara 2 Kejurprov',
                image: '/uploads/dummy-athlete-6.jpg'
            }
        ];

        // Dummy Schedules
        const dummySchedules = [
            {
                date: '15 Desember 2024',
                title: 'Kejurkab Karanganyar 2024',
                location: 'Gedung Olahraga Karanganyar',
                time: '08:00 - 17:00 WIB',
                status: 'upcoming',
                category: 'Kompetisi',
                description: 'Kompetisi panjat tebing tingkat kabupaten dengan berbagai kategori usia dan kelas'
            },
            {
                date: '10 November 2024',
                title: 'Kejurprov Jawa Tengah',
                location: 'Semarang',
                time: '08:00 - 18:00 WIB',
                status: 'past',
                category: 'Kompetisi',
                description: 'Kejuaraan provinsi Jawa Tengah dengan partisipasi dari seluruh kabupaten/kota'
            },
            {
                date: '5 Oktober 2024',
                title: 'Kejurnas Indonesia',
                location: 'Jakarta',
                time: '09:00 - 19:00 WIB',
                status: 'past',
                category: 'Kompetisi Nasional',
                description: 'Kejuaraan nasional dengan atlet terbaik dari seluruh Indonesia'
            },
            {
                date: '20 Januari 2025',
                title: 'Latihan Intensif Pra-Kompetisi',
                location: 'Fasilitas FPTI Karanganyar',
                time: '14:00 - 17:00 WIB',
                status: 'upcoming',
                category: 'Latihan',
                description: 'Program latihan khusus untuk persiapan kompetisi mendatang'
            },
            {
                date: '25 Januari 2025',
                title: 'Kejurda Jawa Tengah',
                location: 'Solo',
                time: '08:00 - 17:00 WIB',
                status: 'upcoming',
                category: 'Kompetisi',
                description: 'Kejuaraan daerah Jawa Tengah dengan berbagai kategori'
            }
        ];

        // Dummy News
        const dummyNews = [
            {
                title: 'Kejurkab Karanganyar 2024 Sukses Digelar',
                category: 'Kompetisi',
                color: 'crimson',
                date: '10 Desember 2024',
                description: '<p>Kompetisi panjat tebing tingkat kabupaten berhasil diselenggarakan dengan antusiasme tinggi dari peserta. Total <strong>150 atlet</strong> dari berbagai klub mengikuti kompetisi ini.</p><p>Kompetisi ini menampilkan berbagai kategori termasuk Speed Climbing, Lead, dan Boulder untuk berbagai kelompok usia.</p>',
                image: '/uploads/dummy-news-1.jpg'
            },
            {
                title: 'Program Latihan Intensif untuk Atlet Muda',
                category: 'Latihan',
                color: 'goldenrod',
                date: '5 Desember 2024',
                description: '<p>FPTI Karanganyar meluncurkan program latihan khusus untuk mengembangkan bakat atlet muda. Program ini akan berlangsung selama <em>3 bulan</em> dengan pelatih berpengalaman.</p><p>Program ini terbuka untuk atlet usia 12-18 tahun dengan fokus pada teknik dasar dan pengembangan kemampuan fisik.</p>',
                image: '/uploads/dummy-news-2.jpg'
            },
            {
                title: 'Atlet FPTI Raih Medali di Kejurprov',
                category: 'Prestasi',
                color: 'crimson',
                date: '28 November 2024',
                description: '<p>Prestasi membanggakan diraih oleh atlet FPTI Karanganyar dalam kejuaraan provinsi Jawa Tengah. Total <strong>5 medali</strong> berhasil dibawa pulang.</p><ul><li>2 Medali Emas</li><li>2 Medali Perak</li><li>1 Medali Perunggu</li></ul>',
                image: '/uploads/dummy-news-3.jpg'
            },
            {
                title: 'Pendaftaran Kejurnas 2025 Dibuka',
                category: 'Kompetisi',
                color: 'crimson',
                date: '20 November 2024',
                description: '<p>Pendaftaran untuk Kejuaraan Nasional 2025 sudah dibuka. Segera daftarkan atlet Anda sebelum kuota penuh.</p><p>Informasi lebih lanjut dapat menghubungi sekretariat FPTI Karanganyar.</p>',
                image: '/uploads/dummy-news-4.jpg'
            },
            {
                title: 'Workshop Teknik Panjat Tebing untuk Pemula',
                category: 'Latihan',
                color: 'goldenrod',
                date: '15 November 2024',
                description: '<p>Workshop khusus untuk pemula akan diadakan akhir bulan ini. Daftar segera karena terbatas untuk <strong>30 peserta</strong>.</p><p>Workshop akan membahas teknik dasar, peralatan keselamatan, dan praktik langsung di wall climbing.</p>',
                image: '/uploads/dummy-news-5.jpg'
            },
            {
                title: 'Atlet FPTI Lolos ke Kejurnas',
                category: 'Prestasi',
                color: 'crimson',
                date: '1 November 2024',
                description: '<p>Tiga atlet FPTI Karanganyar berhasil lolos ke Kejuaraan Nasional setelah menjuarai kompetisi tingkat provinsi.</p><p>Atlet yang lolos akan mengikuti pelatihan intensif selama 2 bulan sebelum kompetisi nasional dimulai.</p>',
                image: '/uploads/dummy-news-6.jpg'
            }
        ];

        // Clear existing data (optional - comment out if you want to keep existing data)
        console.log('Clearing existing data...');
        await connection.query('DELETE FROM news');
        await connection.query('DELETE FROM schedules');
        await connection.query('DELETE FROM athletes');
        console.log('✅ Existing data cleared');

        // Insert Athletes
        console.log('Inserting athletes...');
        for (const athlete of dummyAthletes) {
            await connection.query(
                'INSERT INTO athletes (name, category, age, achievement, image) VALUES (?, ?, ?, ?, ?)',
                [athlete.name, athlete.category, athlete.age, athlete.achievement, athlete.image]
            );
        }
        console.log(`✅ Inserted ${dummyAthletes.length} athletes`);

        // Insert Schedules
        console.log('Inserting schedules...');
        for (const schedule of dummySchedules) {
            await connection.query(
                'INSERT INTO schedules (date, title, location, time, status, category, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [schedule.date, schedule.title, schedule.location, schedule.time, schedule.status, schedule.category, schedule.description]
            );
        }
        console.log(`✅ Inserted ${dummySchedules.length} schedules`);

        // Insert News
        console.log('Inserting news...');
        for (const news of dummyNews) {
            await connection.query(
                'INSERT INTO news (title, category, color, date, description, image) VALUES (?, ?, ?, ?, ?, ?)',
                [news.title, news.category, news.color, news.date, news.description, news.image]
            );
        }
        console.log(`✅ Inserted ${dummyNews.length} news articles`);

        console.log('✅ Dummy data seeded successfully!');
        
    } catch (error) {
        console.error('❌ Error seeding dummy data:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

seedDummyData();

