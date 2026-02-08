# Digital Ocean Deployment Guide for Elix Star Live

## Prerequisites

1. Digital Ocean account
2. Docker installed locally
3. Digital Ocean CLI (doctl) installed (optional but recommended)

## Option 1: Deploy to Digital Ocean App Platform (Recommended)

### Step 1: Create a new app
1. Go to https://cloud.digitalocean.com/apps
2. Click "Create App"
3. Choose "Source Code" and connect your GitHub repository
4. Configure your app:
   - Name: `elix-star-live`
   - Environment: `Node.js`
   - Build Command: `npm run build`
   - Run Command: `npm run preview`
   - HTTP Port: `4173`

### Step 2: Environment Variables
Add these environment variables in the app settings:
```
NODE_ENV=production
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Step 3: Deploy
Click "Create App" and Digital Ocean will automatically build and deploy your application.

## Option 2: Deploy to Digital Ocean Droplet

### Step 1: Create a Droplet
1. Go to https://cloud.digitalocean.com/droplets
2. Click "Create Droplet"
3. Choose:
   - Image: Ubuntu 22.04 LTS
   - Plan: Basic ($6/month minimum)
   - Size: 1GB RAM, 1 vCPU
   - Region: Choose closest to your users
   - Authentication: SSH keys (recommended)

### Step 2: Connect to your Droplet
```bash
ssh root@your_droplet_ip
```

### Step 3: Install Docker and Docker Compose
```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Add user to docker group
usermod -aG docker $USER
```

### Step 4: Upload your application
```bash
# Copy your application files to the droplet
scp -r . root@your_droplet_ip:/root/elix-star-live
```

### Step 5: Deploy with Docker
```bash
# Navigate to your app directory
cd /root/elix-star-live

# Make deployment script executable
chmod +x deploy-digitalocean.sh

# Run deployment
./deploy-digitalocean.sh
```

### Step 6: Configure Firewall
```bash
# Allow HTTP and HTTPS traffic
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
ufw enable
```

### Step 7: Set up Domain (Optional)
1. Point your domain to the droplet IP
2. Update nginx.conf with your domain name
3. Restart the application

## Option 3: Deploy with Docker Hub

### Step 1: Build and push to Docker Hub
```bash
# Build the image
docker build -t yourusername/elix-star-live .

# Push to Docker Hub
docker push yourusername/elix-star-live
```

### Step 2: Deploy on Digital Ocean
```bash
# On your droplet
docker pull yourusername/elix-star-live
docker run -d -p 80:3000 yourusername/elix-star-live
```

## Monitoring and Maintenance

### View logs
```bash
docker-compose logs -f
```

### Update application
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

### Backup data
```bash
# Create backup script
./backup.sh
```

## Security Recommendations

1. Use HTTPS with Let's Encrypt
2. Set up fail2ban for SSH protection
3. Regular security updates
4. Use environment variables for sensitive data
5. Implement proper authentication

## Troubleshooting

### App not starting
- Check Docker logs: `docker-compose logs`
- Verify port availability: `netstat -tulpn`
- Check firewall settings: `ufw status`

### Performance issues
- Monitor resource usage: `htop`
- Check Docker stats: `docker stats`
- Review nginx logs: `docker-compose logs nginx`

### Database connection issues
- Verify Supabase connection
- Check environment variables
- Test connection manually

## Support

For issues specific to this deployment:
1. Check the application logs
2. Verify all environment variables
3. Ensure all dependencies are installed
4. Test locally before deploying