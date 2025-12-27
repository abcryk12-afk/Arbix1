#!/bin/bash

echo "=== Arbix VPS Deployment Script ==="
echo "Starting deployment..."

# Step 1: Update system
echo "Step 1: Updating system..."
sudo apt update && sudo apt upgrade -y

# Step 2: Install Node.js
echo "Step 2: Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Step 3: Install PM2
echo "Step 3: Installing PM2..."
sudo npm install -g pm2

# Step 4: Install Nginx
echo "Step 4: Installing Nginx..."
sudo apt install nginx -y

# Step 5: Install Git
echo "Step 5: Installing Git..."
sudo apt install git -y

# Step 6: Clone repository
echo "Step 6: Cloning repository..."
cd /var/www
sudo git clone https://github.com/abcryk12-afk/Arbix1.git arbix
sudo chown -R root:root /var/www/arbix
cd arbix

# Step 7: Install dependencies
echo "Step 7: Installing dependencies..."
cd backend
npm install

cd ../frontend
npm install

# Step 8: Setup environment
echo "Step 8: Setting up environment..."
cd /var/www/arbix/backend
cat > .env << 'EOF'
NODE_ENV=production
PORT=5000
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=CHANGE_ME
EMAIL_PASS=CHANGE_ME
JWT_SECRET=CHANGE_ME
FRONTEND_URL=https://www.arbix.space
ADMIN_API_KEY=CHANGE_ME_STRONG_KEY
ADMIN_EMAILS=admin@example.com
ADMIN_LOGIN_CODE=CHANGE_ME
EOF

# Step 9: Build frontend
echo "Step 9: Building frontend..."
cd /var/www/arbix/frontend
npm run build

# Step 10: Setup PM2
echo "Step 10: Setting up PM2..."
cd /var/www/arbix
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'arbix-backend',
      script: './backend/server.js',
      cwd: '/var/www/arbix',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
        ADMIN_API_KEY: 'CHANGE_ME_STRONG_KEY',
        ADMIN_EMAILS: 'admin@example.com'
      }
    },
    {
      name: 'arbix-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/arbix/frontend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        BACKEND_URL: 'http://216.219.95.100:5000',
        ADMIN_API_KEY: 'CHANGE_ME_STRONG_KEY'
      }
    }
  ]
};
EOF

# Step 11: Start applications
echo "Step 11: Starting applications..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Step 12: Setup Nginx
echo "Step 12: Setting up Nginx..."
cat > /etc/nginx/sites-available/arbix << 'EOF'
server {
    listen 80;
    server_name arbix.space www.arbix.space;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Step 13: Enable Nginx site
echo "Step 13: Enabling Nginx site..."
sudo ln -s /etc/nginx/sites-available/arbix /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# Step 14: Install SSL
echo "Step 14: Installing SSL certificate..."
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d arbix.space -d www.arbix.space --non-interactive --agree-tos --email admin@example.com

# Step 15: Setup firewall
echo "Step 15: Setting up firewall..."
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Step 16: Check services
echo "Step 16: Checking services..."
pm2 status
sudo systemctl status nginx --no-pager

echo "=== Deployment Complete! ==="
echo "Your website should be live at: https://www.arbix.space"
echo "Backend API: https://www.arbix.space/api"
echo "To check logs: pm2 logs"
echo "To restart: pm2 restart all"
