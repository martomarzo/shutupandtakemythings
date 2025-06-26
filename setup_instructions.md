# 🛍️ Item Sales Management System

A modern, secure web application for managing and selling personal items with a beautiful UI, database backend, and complete authentication system.

## ✨ Features

### 🔐 **Security & Authentication**
- Secure JWT-based authentication
- Password hashing with bcrypt
- Protected admin routes
- Session management
- Password change functionality

### 🏪 **Public Store**
- Modern, animated storefront
- Real-time search and filtering
- Responsive design for all devices
- Smooth animations and interactions
- Professional item presentation

### ⚙️ **Admin Panel**
- Complete item management (CRUD)
- Image upload with preview
- Structured specifications (dimensions, color, material, condition)
- Real-time status updates
- Advanced filtering and search

### 💾 **Database Features**
- SQLite database for reliable storage
- Structured item specifications
- Image file management
- Automatic admin user creation

## 🚀 Quick Setup

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. **Create project directory and save files**
   ```bash
   mkdir item-sales-manager
   cd item-sales-manager
   ```

2. **Save these files in your project directory:**
   - `server.js` - Backend server
   - `package.json` - Dependencies
   - `.env` - Environment variables
   - `public/index.html` - Public store
   - `public/admin.html` - Admin panel
   - `public/admin-login.html` - Login page
   - `public/styles.css` - Styles
   - `public/public.js` - Public store functionality
   - `public/admin.js` - Admin panel functionality

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Create environment file**
   ```bash
   cp .env.example .env
   nano .env
   ```

   Configure your settings:
   ```bash
   PORT=3000
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   ADMIN_PASSWORD=your-secure-password-here
   DB_PATH=./items.db
   MAX_FILE_SIZE=5242880
   UPLOAD_PATH=./uploads
   NODE_ENV=development
   ```

5. **Start the application**
   ```bash
   npm start
   ```

6. **Access the application**
   - **Public Store**: http://localhost:3000
   - **Admin Login**: http://localhost:3000/admin-login
   - **Admin Panel**: http://localhost:3000/admin (after login)

## 🔑 Default Login

The system creates a default admin user on first startup:
- **Username**: `admin`
- **Password**: Whatever you set in `ADMIN_PASSWORD` in .env

⚠️ **Change the default password immediately after first login!**

## 📁 Project Structure

```
item-sales-manager/
├── server.js              # Node.js backend server
├── package.json           # Dependencies and scripts
├── .env                   # Environment variables (create this)
├── items.db              # SQLite database (auto-created)
├── uploads/              # Image storage (auto-created)
└── public/               # Frontend files
    ├── index.html        # Public store
    ├── admin.html        # Admin panel
    ├── admin-login.html  # Login page
    ├── styles.css        # Shared styles
    ├── public.js         # Public store logic
    └── admin.js          # Admin panel logic
```

## 🛠️ Configuration

### Environment Variables

**Required variables in `.env`:**

```bash
# Server port
PORT=3000

# Security (CHANGE THESE!)
JWT_SECRET=generate-a-long-random-string-here
ADMIN_PASSWORD=your-secure-password

# Database
DB_PATH=./items.db

# File uploads
MAX_FILE_SIZE=5242880  # 5MB in bytes
UPLOAD_PATH=./uploads

# Environment
NODE_ENV=development
```

### Adding Categories

To add new item categories, edit both `admin.html` and `index.html`:

```html
<option value="yourcategory">Your Category Name</option>
```

## 📱 API Endpoints

### Public Endpoints
```
GET  /api/items           # Get all items (with filters)
GET  /api/items/:id       # Get single item
```

### Admin Endpoints (Protected)
```
POST /api/auth/login                    # Admin login
GET  /api/admin/items                   # Get items for admin
POST /api/admin/items                   # Create new item
PUT  /api/admin/items/:id               # Update item
DELETE /api/admin/items/:id             # Delete item
PATCH /api/admin/items/:id/status       # Update item status
POST /api/admin/change-password         # Change admin password
```

### Query Parameters for `/api/items`
- `search` - Search in name/description
- `category` - Filter by category
- `status` - Filter by status (available/sold)

## 🎨 Customization

### Styling
- Edit `public/styles.css` to customize colors, fonts, and layout
- The design uses a modern gradient-based theme
- Animations can be reduced for slower devices

### Branding
- Update titles and descriptions in HTML files
- Replace emoji icons with your logo
- Customize the color scheme in CSS variables

### Features
- Add new item fields by modifying the form in `admin.html`
- Update the database schema in `server.js`
- Modify the display logic in both frontend JS files

## 🔒 Security Notes

### For Production
1. **Use strong secrets**: Generate long, random JWT secrets
2. **Change default password**: Set a secure admin password
3. **Use HTTPS**: Deploy with SSL certificates
4. **Regular backups**: Backup your database regularly
5. **Update dependencies**: Keep npm packages updated

### File Upload Security
- Only images are allowed (jpg, png, gif, webp)
- 5MB file size limit by default
- Files are stored locally in `uploads/` directory

## 🚀 Deployment

### Local Development
```bash
npm start              # Standard start
npm run dev           # Development mode (if nodemon installed)
```

### Production Deployment

**Heroku:**
```bash
# Add to package.json engines
"engines": {
  "node": ">=18.0.0"
}

# Deploy
heroku create your-app-name
git push heroku main
```

**DigitalOcean/VPS:**
```bash
# Use PM2 for process management
npm install -g pm2
pm2 start server.js --name "item-store"
pm2 startup
pm2 save
```

## 🐛 Troubleshooting

### Common Issues

**"Cannot find module 'express'"**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Items not appearing after adding**
- Check server logs for errors
- Verify admin authentication
- Check browser console for JavaScript errors

**Images not loading**
- Check file permissions on `uploads/` directory
- Verify file size is under limit
- Ensure file format is supported

**Login redirect loop**
- Clear browser localStorage
- Check JWT_SECRET in .env
- Verify admin user exists in database

### Reset Everything
```bash
# Stop server
Ctrl + C

# Remove database and uploads
rm items.db
rm -rf uploads

# Restart server (recreates everything)
npm start
```

## 📊 Database Management

### Backup Database
```bash
cp items.db items.db.backup.$(date +%Y%m%d)
```

### View Database Contents
```bash
sqlite3 items.db
.tables
SELECT * FROM items;
SELECT * FROM admin_users;
.quit
```

## 🎯 Usage Tips

### For Sellers
1. Take good photos with proper lighting
2. Write detailed descriptions
3. Include accurate dimensions
4. Be honest about condition
5. Update status promptly when sold

### For Buyers
- Use search and filters to find items
- Check all specifications carefully
- Contact seller directly for questions
- Items marked as "sold" are no longer available

## 📄 License

MIT License - Free to use and modify for personal and commercial projects.

---

## 🎉 You're All Set!

Your item sales management system is ready to use! Start by:

1. ✅ **Logging in** at `/admin-login`
2. ✅ **Adding your first item** in the admin panel
3. ✅ **Viewing it** on the public store
4. ✅ **Sharing the store URL** with potential buyers

Happy selling! 🛍️