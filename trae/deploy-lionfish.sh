#!/bin/bash

# Lionfish App (Digital Ocean App Platform) Deployment Script
echo "🦁 Deploying to Lionfish App on Digital Ocean..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if doctl is installed
if ! command -v doctl &> /dev/null; then
    print_warning "doctl not found. Installing..."
    
    # Install doctl
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        curl -sL https://github.com/digitalocean/doctl/releases/latest/download/doctl-$(curl -s https://api.github.com/repos/digitalocean/doctl/releases/latest | grep 'tag_name' | cut -d'"' -f4)-linux-amd64.tar.gz | tar -xzv
        sudo mv doctl /usr/local/bin
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        brew install doctl
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        print_error "Please install doctl manually from: https://github.com/digitalocean/doctl/releases"
        exit 1
    fi
fi

# Check if logged in to Digital Ocean
print_step "Checking Digital Ocean authentication..."
if ! doctl account get &> /dev/null; then
    print_error "Not authenticated with Digital Ocean. Please run: doctl auth init"
    echo "Get your API token from: https://cloud.digitalocean.com/account/api/tokens"
    exit 1
fi

print_status "Authenticated with Digital Ocean ✓"

# Get app name from app.yaml
APP_NAME=$(grep "^name:" .do/app.yaml | awk '{print $2}')
if [ -z "$APP_NAME" ]; then
    APP_NAME="lionfish-app"
fi

print_step "Deploying application: $APP_NAME"

# Create or update the app
print_status "Creating/updating app on Digital Ocean App Platform..."
doctl apps create --spec .do/app.yaml

if [ $? -eq 0 ]; then
    print_status "✅ App created/updated successfully!"
    
    # Get app info
    APP_ID=$(doctl apps list | grep "$APP_NAME" | awk '{print $1}')
    if [ ! -z "$APP_ID" ]; then
        print_status "App ID: $APP_ID"
        
        # Get live URL
        LIVE_URL=$(doctl apps get "$APP_ID" | grep "Live URL" | awk '{print $3}')
        if [ ! -z "$LIVE_URL" ]; then
            print_status "🌐 Your app is live at: $LIVE_URL"
            echo "Opening in browser..."
            
            # Open in browser
            if [[ "$OSTYPE" == "linux-gnu"* ]]; then
                xdg-open "$LIVE_URL"
            elif [[ "$OSTYPE" == "darwin"* ]]; then
                open "$LIVE_URL"
            elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
                start "$LIVE_URL"
            fi
        fi
    fi
else
    print_error "❌ Failed to create/update app"
    exit 1
fi

print_status "🎉 Deployment complete!"
echo ""
echo "Useful commands:"
echo "  View logs: doctl apps logs $APP_ID"
echo "  Update app: doctl apps update $APP_ID --spec .do/app.yaml"
echo "  Delete app: doctl apps delete $APP_ID"
echo "  List apps: doctl apps list"