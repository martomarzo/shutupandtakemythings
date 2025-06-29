const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT
const JWT_SECRET = process.env.JWT_SECRET
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static('uploads'));
app.use(express.static('public'));

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'item-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

// Initialize SQLite database
const db = new sqlite3.Database('items.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
        initializeDatabase();
    }
});

// Initialize database tables
function initializeDatabase() {
    // Create items table
    db.run(`
        CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            category TEXT NOT NULL,
            description TEXT,
            height REAL,
            length REAL,
            depth REAL,
            color TEXT,
            material TEXT,
            condition TEXT DEFAULT 'excellent',
            notes TEXT,
            image_path TEXT,
            status TEXT DEFAULT 'available',
            date_added DATETIME DEFAULT CURRENT_TIMESTAMP,
            date_updated DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('Error creating items table:', err.message);
        } else {
            console.log('Items table ready.');
        }
    });

    // Create admin users table
    db.run(`
        CREATE TABLE IF NOT EXISTS admin_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, async (err) => {
        if (err) {
            console.error('Error creating admin_users table:', err.message);
        } else {
            console.log('Admin users table ready.');
            await createDefaultAdmin();
        }
    });
}

// Create default admin user
async function createDefaultAdmin() {
    const defaultPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    
    db.run(
        'INSERT OR IGNORE INTO admin_users (username, password_hash) VALUES (?, ?)',
        ['admin', hashedPassword],
        function(err) {
            if (err) {
                console.error('Error creating default admin:', err.message);
            } else if (this.changes > 0) {
                console.log(`Default admin created. Username: admin, Password: ${defaultPassword}`);
                console.log('IMPORTANT: Change the default password immediately!');
            }
        }
    );
}

// JWT middleware for protected routes
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// ROUTES
// Get server configuration (public route)
app.get('/api/config', (req, res) => {
    res.json({
        ntfyUrl: process.env.NTFY_URL
    });
});
 

// Get all items (protected route for admin)
app.get('/api/admin/items', authenticateToken, (req, res) => {
    try {
        // Simple query to get all items for admin
        db.all('SELECT * FROM items ORDER BY date_added DESC', [], (err, rows) => {
            if (err) {
                console.error('Error fetching items for admin:', err);
                res.status(500).json({ error: 'Database error' });
            } else {
                // Add full image URLs
                const items = rows.map(item => ({
                    ...item,
                    image_url: item.image_path ? `/uploads/${path.basename(item.image_path)}` : null
                }));
                res.json(items);
            }
        });
    } catch (error) {
        console.error('Error in admin items route:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        db.get(
            'SELECT * FROM admin_users WHERE username = ?',
            [username],
            async (err, user) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Database error' });
                }

                if (!user) {
                    return res.status(401).json({ error: 'Invalid credentials' });
                }

                const validPassword = await bcrypt.compare(password, user.password_hash);
                if (!validPassword) {
                    return res.status(401).json({ error: 'Invalid credentials' });
                }

                const token = jwt.sign(
                    { userId: user.id, username: user.username },
                    JWT_SECRET,
                    { expiresIn: '24h' }
                );

                res.json({ token, username: user.username });
            }
        );
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all items (public route)
app.get('/api/items', (req, res) => {
    const { status, category, search } = req.query;
    
    let query = 'SELECT * FROM items WHERE 1=1';
    const params = [];

    if (status) {
        query += ' AND status = ?';
        params.push(status);
    }

    if (category) {
        query += ' AND category = ?';
        params.push(category);
    }

    if (search) {
        query += ' AND (name LIKE ? OR description LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY date_added DESC';

    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('Error fetching items:', err);
            res.status(500).json({ error: 'Database error' });
        } else {
            // Add full image URLs
            const items = rows.map(item => ({
                ...item,
                image_url: item.image_path ? `/uploads/${path.basename(item.image_path)}` : null
            }));
            res.json(items);
        }
    });
});

// Get single item (public route)
app.get('/api/items/:id', (req, res) => {
    const { id } = req.params;

    db.get('SELECT * FROM items WHERE id = ?', [id], (err, row) => {
        if (err) {
            console.error('Error fetching item:', err);
            res.status(500).json({ error: 'Database error' });
        } else if (!row) {
            res.status(404).json({ error: 'Item not found' });
        } else {
            const item = {
                ...row,
                image_url: row.image_path ? `/uploads/${path.basename(row.image_path)}` : null
            };
            res.json(item);
        }
    });
});

// Create new item (protected route)
app.post('/api/admin/items', authenticateToken, upload.single('image'), (req, res) => {
    try {
        const {
            name, price, category, description, height, length, depth,
            color, material, condition, notes
        } = req.body;

        if (!name || !price || !category) {
            return res.status(400).json({ error: 'Name, price, and category are required' });
        }

        const imagePath = req.file ? req.file.filename : null;

        const query = `
            INSERT INTO items (
                name, price, category, description, height, length, depth,
                color, material, condition, notes, image_path
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
            name, parseFloat(price), category, description || null,
            height ? parseFloat(height) : null,
            length ? parseFloat(length) : null,
            depth ? parseFloat(depth) : null,
            color || null, material || null, condition || 'excellent',
            notes || null, imagePath
        ];

        db.run(query, params, function(err) {
            if (err) {
                console.error('Error creating item:', err);
                res.status(500).json({ error: 'Database error' });
            } else {
                res.status(201).json({
                    id: this.lastID,
                    message: 'Item created successfully'
                });
            }
        });
    } catch (error) {
        console.error('Error creating item:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update item (protected route)
app.put('/api/admin/items/:id', authenticateToken, upload.single('image'), (req, res) => {
    try {
        const { id } = req.params;
        const {
            name, price, category, description, height, length, depth,
            color, material, condition, notes, status
        } = req.body;

        if (!name || !price || !category) {
            return res.status(400).json({ error: 'Name, price, and category are required' });
        }

        // Get current item to handle image update
        db.get('SELECT image_path FROM items WHERE id = ?', [id], (err, currentItem) => {
            if (err) {
                console.error('Error fetching current item:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            if (!currentItem) {
                return res.status(404).json({ error: 'Item not found' });
            }

            let imagePath = currentItem.image_path;

            // If new image uploaded, delete old one and use new one
            if (req.file) {
                if (currentItem.image_path) {
                    const oldImagePath = path.join('uploads', currentItem.image_path);
                    if (fs.existsSync(oldImagePath)) {
                        fs.unlinkSync(oldImagePath);
                    }
                }
                imagePath = req.file.filename;
            }

            const query = `
                UPDATE items SET
                    name = ?, price = ?, category = ?, description = ?,
                    height = ?, length = ?, depth = ?, color = ?, material = ?,
                    condition = ?, notes = ?, image_path = ?, status = ?,
                    date_updated = CURRENT_TIMESTAMP
                WHERE id = ?
            `;

            const params = [
                name, parseFloat(price), category, description || null,
                height ? parseFloat(height) : null,
                length ? parseFloat(length) : null,
                depth ? parseFloat(depth) : null,
                color || null, material || null, condition || 'excellent',
                notes || null, imagePath, status || 'available', id
            ];

            db.run(query, params, function(err) {
                if (err) {
                    console.error('Error updating item:', err);
                    res.status(500).json({ error: 'Database error' });
                } else if (this.changes === 0) {
                    res.status(404).json({ error: 'Item not found' });
                } else {
                    res.json({ message: 'Item updated successfully' });
                }
            });
        });
    } catch (error) {
        console.error('Error updating item:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete item (protected route)
app.delete('/api/admin/items/:id', authenticateToken, (req, res) => {
    const { id } = req.params;

    // Get item to delete associated image
    db.get('SELECT image_path FROM items WHERE id = ?', [id], (err, item) => {
        if (err) {
            console.error('Error fetching item for deletion:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }

        // Delete the item from database
        db.run('DELETE FROM items WHERE id = ?', [id], function(err) {
            if (err) {
                console.error('Error deleting item:', err);
                res.status(500).json({ error: 'Database error' });
            } else if (this.changes === 0) {
                res.status(404).json({ error: 'Item not found' });
            } else {
                // Delete associated image file
                if (item.image_path) {
                    const imagePath = path.join('uploads', item.image_path);
                    if (fs.existsSync(imagePath)) {
                        fs.unlinkSync(imagePath);
                    }
                }
                res.json({ message: 'Item deleted successfully' });
            }
        });
    });
});

// Update item status (protected route)
app.patch('/api/admin/items/:id/status', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['available', 'sold'].includes(status)) {
        return res.status(400).json({ error: 'Status must be either "available" or "sold"' });
    }

    db.run(
        'UPDATE items SET status = ?, date_updated = CURRENT_TIMESTAMP WHERE id = ?',
        [status, id],
        function(err) {
            if (err) {
                console.error('Error updating item status:', err);
                res.status(500).json({ error: 'Database error' });
            } else if (this.changes === 0) {
                res.status(404).json({ error: 'Item not found' });
            } else {
                res.json({ message: 'Item status updated successfully' });
            }
        }
    );
});

// Change admin password (protected route)
app.post('/api/admin/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current and new passwords required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters' });
        }

        // Get current user
        db.get(
            'SELECT * FROM admin_users WHERE id = ?',
            [req.user.userId],
            async (err, user) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Database error' });
                }

                if (!user) {
                    return res.status(404).json({ error: 'User not found' });
                }

                // Verify current password
                const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
                if (!validPassword) {
                    return res.status(401).json({ error: 'Current password is incorrect' });
                }

                // Hash new password
                const newPasswordHash = await bcrypt.hash(newPassword, 10);

                // Update password
                db.run(
                    'UPDATE admin_users SET password_hash = ? WHERE id = ?',
                    [newPasswordHash, req.user.userId],
                    function(err) {
                        if (err) {
                            console.error('Error updating password:', err);
                            res.status(500).json({ error: 'Database error' });
                        } else {
                            res.json({ message: 'Password updated successfully' });
                        }
                    }
                );
            }
        );
    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/admin-login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
        }
    }
    
    console.error('Unhandled error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Handle 404
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down gracefully...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('Database connection closed.');
        }
        process.exit(0);
    });
});

app.listen(PORT, () => {
    console.log(`\n🚀 Server running at http://localhost:${PORT}`);
    console.log(`📱 Public store: http://localhost:${PORT}`);
    console.log(`⚙️  Admin panel: http://localhost:${PORT}/admin`);
    console.log(`🔐 Admin login: http://localhost:${PORT}/admin-login`);
    console.log('\nDefault admin credentials:');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('\n⚠️  IMPORTANT: Change the default password immediately!\n');
});