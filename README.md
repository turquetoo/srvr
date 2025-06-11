# Instagram Clone Server

A Node.js server that provides API proxy endpoints for the Instagram clone application with real Instagram data integration.

## 🚀 Features

- **API Proxy**: Proxies requests to Instagram APIs with proper headers
- **Image Proxy**: Handles Instagram image CORS issues
- **Production Ready**: Includes security, compression, and error handling
- **Health Checks**: Built-in health monitoring endpoint
- **Docker Support**: Ready for containerized deployment

## 📋 Requirements

- Node.js 16+ 
- npm 8+
- Docker (optional)

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start
```

## 🔗 Endpoints

### Main Application
- `GET /` - API information
- `GET /upinstagram1.html?username=c.dthr` - Instagram clone
- `GET /health` - Health check

### API Proxy
- `POST /api/profile-data` - Get Instagram profile data
- `POST /api/followers-stories` - Get followers and stories
- `POST /api/feed-media` - Get feed media
- `GET /api/proxy/instagram-image?url=<image_url>` - Proxy Instagram images

## 🐳 Docker Deployment

### Build and Run Locally
```bash
# Build image
docker build -t instagram-clone-server .

# Run container
docker run -p 3000:3000 instagram-clone-server
```

### Docker Compose
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

## 🔗 DigitalOcean Deployment

### Option 1: App Platform (Recommended)

1. **Create App on DigitalOcean**:
   ```bash
   # Install doctl CLI
   snap install doctl
   doctl auth init
   ```

2. **Deploy from GitHub**:
   - Connect your GitHub repository
   - Select the `server/` folder as the source
   - DigitalOcean will auto-detect Node.js and deploy

3. **Environment Variables**:
   ```
   NODE_ENV=production
   PORT=3000
   ```

### Option 2: Droplet with Docker

1. **Create Ubuntu Droplet**:
   ```bash
   # Connect to your droplet
   ssh root@your_droplet_ip
   
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   
   # Install Docker Compose
   curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   chmod +x /usr/local/bin/docker-compose
   ```

2. **Deploy Application**:
   ```bash
   # Clone your repository
   git clone https://github.com/your-username/your-repo.git
   cd your-repo/server
   
   # Build and run
   docker build -t instagram-clone-server .
   docker run -d -p 80:3000 --name instagram-app instagram-clone-server
   ```

3. **Set up Nginx (Optional)**:
   ```bash
   # Install Nginx
   apt update && apt install nginx -y
   
   # Configure Nginx
   cat > /etc/nginx/sites-available/instagram-clone << 'EOF'
   server {
       listen 80;
       server_name your-domain.com;
       
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
   }
   EOF
   
   # Enable site
   ln -s /etc/nginx/sites-available/instagram-clone /etc/nginx/sites-enabled/
   nginx -t && systemctl reload nginx
   ```

### Option 3: One-Click Deployment Script

```bash
#!/bin/bash
# deploy.sh - Run this on your DigitalOcean droplet

# Update system
apt update && apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install PM2 for process management
npm install -g pm2

# Clone repository (replace with your repo)
git clone https://github.com/your-username/your-repo.git
cd your-repo/server

# Install dependencies
npm install --production

# Start with PM2
pm2 start server.js --name "instagram-clone"
pm2 startup
pm2 save

# Install and configure Nginx
apt install nginx -y
cat > /etc/nginx/sites-available/default << 'EOF'
server {
    listen 80;
    server_name _;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

systemctl restart nginx
systemctl enable nginx

echo "🚀 Deployment complete! Your app should be running on your droplet's IP address."
```

## 🔧 Configuration

### Environment Variables

```bash
# Production
NODE_ENV=production
PORT=3000

# Optional: Custom CORS origins
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Performance Tuning

```bash
# For production droplets, set these in your .bashrc or systemd service:
export NODE_OPTIONS="--max-old-space-size=1024"
export UV_THREADPOOL_SIZE=4
```

## 📊 Monitoring

### Health Checks
```bash
# Check if server is running
curl http://your-domain.com/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2025-01-09T...",
  "environment": "production"
}
```

### PM2 Monitoring
```bash
# View logs
pm2 logs instagram-clone

# Monitor performance
pm2 monit

# Restart app
pm2 restart instagram-clone
```

## 🔐 Security

The server includes:
- **Helmet.js** for security headers
- **CORS** configuration
- **Input validation**
- **Rate limiting** (can be added)
- **Non-root Docker user**

## 🚨 Troubleshooting

### Common Issues

1. **Port 3000 already in use**:
   ```bash
   # Find process using port 3000
   lsof -i :3000
   # Kill the process
   kill -9 <PID>
   ```

2. **Docker build fails**:
   ```bash
   # Clear Docker cache
   docker system prune -a
   ```

3. **API requests fail**:
   - Check if external APIs are accessible
   - Verify network connectivity
   - Check server logs: `pm2 logs` or `docker logs <container_id>`

### Logs Location
- **PM2**: `~/.pm2/logs/`
- **Docker**: `docker logs instagram-clone-server`
- **Nginx**: `/var/log/nginx/`

## 📱 Usage

After deployment, access your Instagram clone at:
```
http://your-droplet-ip/upinstagram1.html?username=c.dthr
```

Replace `c.dthr` with any Instagram username to analyze.

## 🤝 Support

If you encounter issues:
1. Check the health endpoint: `/health`
2. Review server logs
3. Verify all environment variables are set
4. Ensure external APIs are accessible

---

**Happy coding! 🚀** 