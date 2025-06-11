#!/bin/bash

# DigitalOcean Droplet Deployment Script for Instagram Clone Server
# Run this script on your Ubuntu 20.04+ droplet

set -e

echo "🚀 Starting Instagram Clone Server deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run as root (use sudo)"
    exit 1
fi

# Update system
print_status "Updating system packages..."
apt update && apt upgrade -y

# Install Node.js 18.x
print_status "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Verify installation
node_version=$(node --version)
npm_version=$(npm --version)
print_status "Node.js $node_version installed"
print_status "npm $npm_version installed"

# Install PM2 globally
print_status "Installing PM2 process manager..."
npm install -g pm2

# Install Git if not present
if ! command -v git &> /dev/null; then
    print_status "Installing Git..."
    apt install git -y
fi

# Create app directory
APP_DIR="/var/www/instagram-clone"
print_status "Creating application directory at $APP_DIR..."
mkdir -p $APP_DIR

# Get the repository URL from user input
read -p "Enter your GitHub repository URL (e.g., https://github.com/username/repo.git): " REPO_URL

if [ -z "$REPO_URL" ]; then
    print_error "Repository URL is required"
    exit 1
fi

# Clone repository
print_status "Cloning repository..."
cd /tmp
rm -rf temp-repo
git clone $REPO_URL temp-repo

# Copy server files
if [ -d "temp-repo/server" ]; then
    print_status "Copying server files..."
    cp -r temp-repo/server/* $APP_DIR/
else
    print_error "Server directory not found in repository"
    print_warning "Make sure your repository has a 'server' folder"
    exit 1
fi

# Set permissions
chown -R www-data:www-data $APP_DIR
chmod -R 755 $APP_DIR

# Install dependencies
print_status "Installing Node.js dependencies..."
cd $APP_DIR
npm install --production

# Create systemd service
print_status "Creating systemd service..."
cat > /etc/systemd/system/instagram-clone.service << EOF
[Unit]
Description=Instagram Clone Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
systemctl daemon-reload
systemctl enable instagram-clone
systemctl start instagram-clone

# Install and configure Nginx
print_status "Installing and configuring Nginx..."
apt install nginx -y

# Create Nginx configuration
cat > /etc/nginx/sites-available/instagram-clone << 'EOF'
server {
    listen 80;
    server_name _;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # Main application
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        proxy_pass http://127.0.0.1:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Enable site
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/instagram-clone /etc/nginx/sites-enabled/

# Test and restart Nginx
nginx -t
systemctl restart nginx
systemctl enable nginx

# Configure firewall
print_status "Configuring firewall..."
ufw --force enable
ufw allow ssh
ufw allow 'Nginx Full'

# Create monitoring script
print_status "Creating monitoring script..."
cat > /usr/local/bin/monitor-instagram-clone.sh << 'EOF'
#!/bin/bash

# Check if service is running
if ! systemctl is-active --quiet instagram-clone; then
    echo "$(date): Instagram Clone service is down, restarting..." >> /var/log/instagram-clone-monitor.log
    systemctl restart instagram-clone
fi

# Check if health endpoint responds
if ! curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "$(date): Health check failed, restarting service..." >> /var/log/instagram-clone-monitor.log
    systemctl restart instagram-clone
fi
EOF

chmod +x /usr/local/bin/monitor-instagram-clone.sh

# Add to cron for monitoring every 5 minutes
(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/monitor-instagram-clone.sh") | crontab -

# Get server IP
SERVER_IP=$(curl -s http://169.254.169.254/metadata/v1/interfaces/public/0/ipv4/address || hostname -I | awk '{print $1}')

# Final status check
print_status "Checking service status..."
sleep 5

if systemctl is-active --quiet instagram-clone; then
    print_status "✅ Instagram Clone service is running"
else
    print_error "❌ Instagram Clone service failed to start"
    print_warning "Check logs with: journalctl -u instagram-clone -f"
fi

if systemctl is-active --quiet nginx; then
    print_status "✅ Nginx is running"
else
    print_error "❌ Nginx failed to start"
fi

# Test health endpoint
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    print_status "✅ Health check passed"
else
    print_warning "❌ Health check failed"
fi

# Cleanup
rm -rf /tmp/temp-repo

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "📱 Your Instagram Clone is available at:"
echo "   http://$SERVER_IP/upinstagram1.html?username=c.dthr"
echo ""
echo "🔍 Health check:"
echo "   http://$SERVER_IP/health"
echo ""
echo "📊 Useful commands:"
echo "   systemctl status instagram-clone    # Check service status"
echo "   journalctl -u instagram-clone -f    # View logs"
echo "   systemctl restart instagram-clone   # Restart service"
echo "   tail -f /var/log/instagram-clone-monitor.log  # Monitor logs"
echo ""
echo "🔒 Security:"
echo "   - Firewall is enabled (SSH and HTTP allowed)"
echo "   - Service runs as www-data user"
echo "   - Security headers configured in Nginx"
echo ""

print_warning "Remember to:"
print_warning "1. Set up a domain name and SSL certificate (Let's Encrypt)"
print_warning "2. Configure regular backups"
print_warning "3. Monitor system resources"
print_warning "4. Keep the system updated"

echo ""
print_status "Deployment script completed successfully! 🚀" 