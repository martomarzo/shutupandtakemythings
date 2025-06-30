🛍️ Item Sales Management System
A modern, secure web application for managing and selling personal items, featuring a beautiful public-facing storefront and a comprehensive admin panel. This system includes a database backend, a complete authentication system, and flexible user notification options via WhatsApp or Gotify.

✨ Features
🏪 Public Store
Modern, responsive, and animated storefront for an excellent user experience.

Real-time search and filtering by category and availability.

User Contact Options: Buyers can easily contact you via a modal with options for WhatsApp or Email (powered by Gotify).

Link Previews: Automatically generates rich social media link previews (image, title, description) when the site URL is shared.

⚙️ Admin Panel
Complete Item Management (CRUD): Create, read, update, and delete items.

Image Uploads: Includes an image preview when adding or editing items.

Detailed Item Specifications: Fields for dimensions, color, material, condition, and more.

Real-time Status Updates: Instantly mark items as "Available" or "Sold".

Advanced Filtering and Search: Easily find and manage your items.

🔐 Security & Backend
Secure JWT-based Authentication: Protects all admin routes.

Password Hashing: Uses bcrypt for secure password storage.

SQLite Database: A reliable and simple file-based database for storing all item and user data.

Flexible Notifications: Configure notifications to be sent to your Gotify server for a secure, self-hosted solution.

🚀 Quick Setup
Prerequisites
Node.js (v14 or higher)

npm (v6 or higher)

pm2 for process management (npm install -g pm2)

Installation
Clone or download the project files into a new directory.

Bash

mkdir shutupandtakemythings
cd shutupandtakemythings
# (Add all project files to this directory)
Install dependencies. This includes axios for sending notifications.

Bash

npm install
Create and configure your environment file.
Create a file named .env in the root of the project and add the following variables.

Code snippet

# --- General Server Settings ---
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-this
ADMIN_PASSWORD=your-secure-admin-password-here

# --- Contact Options (Choose one) ---

# Option 1: WhatsApp
# Use your full number in international format without any '+', '00', or '-'
# Example: 491761234567
WHATSAPP_NUMBER=your_whatsapp_number

# Option 2: Gotify Notifications (more secure)
# The URL to your Gotify server and the Application Token
GOTIFY_URL=https://gotify.your-domain.com
GOTIFY_TOKEN=your-gotify-app-token
Start the application with pm2. This will run the server in the background and ensure it restarts automatically if it crashes.

Bash

pm2 start server.js --name "item-store"
Save the process list. This is a crucial step to make the service restart automatically on server reboots.

Bash

pm2 save
🔑 Default Admin Login
On the first startup, a default admin user is created with the following credentials:

Username: admin

Password: The password you set for ADMIN_PASSWORD in your .env file.

⚠️ It is highly recommended to change the default password immediately after your first login!

🌐 Making Your Site Public with Tailscale Funnel
If you are running this on a local server, you can use Tailscale Funnel to securely expose it to the internet.

Install Tailscale on your server and authenticate it to your tailnet.

Create a systemd service to manage the funnel and ensure it starts on boot.
Create a new file:

Bash

sudo nano /etc/systemd/system/tailscale-funnel.service
Add the following content:

Ini, TOML

[Unit]
Description=Tailscale Funnel for Sales App
After=network-online.target tailscaled.service
Requires=tailscaled.service

[Service]
Restart=always
ExecStart=/usr/bin/tailscale funnel 3000

[Install]
WantedBy=multi-user.target
Enable and start the service:

Bash

sudo systemctl enable tailscale-funnel.service
sudo systemctl start tailscale-funnel.service
Your site will now be available at https://your-machine-name.your-tailnet.ts.net.

📁 Project Structure
.
├── server.js              # The main Node.js backend server
├── package.json           # Project dependencies and scripts
├── .env                   # Environment variables (you must create this)
├── items.db               # SQLite database (auto-created)
├── uploads/               # Directory for item images (auto-created)
├── public/                # All frontend files
│   ├── index.html         # The public-facing store page
│   ├── admin.html         # The admin panel
│   ├── admin-login.html   # The admin login page
│   ├── public.js          # JavaScript for the public store
│   ├── admin.js           # JavaScript for the admin panel
│   ├── login.js           # JavaScript for the login page
│   ├── public.css         # CSS for the public store
│   └── admin.css          # CSS for the admin panel and login page
└── README.md              # This documentation file