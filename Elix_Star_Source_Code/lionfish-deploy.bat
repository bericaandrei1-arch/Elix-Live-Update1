@echo off
echo 🦁 Lionfish App (Digital Ocean) Deployment Tool
echo.
echo This tool will help you deploy to Digital Ocean App Platform
echo.

REM Check if we should open the dashboard or deploy
echo What would you like to do?
echo 1. Open Digital Ocean Dashboard
echo 2. Deploy to Lionfish App
echo 3. View deployment guide
echo.

set /p choice="Enter your choice (1-3): "

if "%choice%"=="1" (
    echo 🌊 Opening Digital Ocean Dashboard...
    start https://cloud.digitalocean.com/apps
    echo ✅ Dashboard opened in your browser!
) else if "%choice%"=="2" (
    echo 🚀 Preparing deployment...
    echo.
    echo ⚠️  Make sure you have:
    echo    - Digital Ocean account
    echo    - doctl CLI installed (https://github.com/digitalocean/doctl)
    echo    - Your API token configured
    echo.
    echo 📁 Deployment files ready:
    echo    - .do/app.yaml (App Platform configuration)
    echo    - Dockerfile (Container setup)
    echo    - docker-compose.yml (Multi-service setup)
    echo.
    echo To deploy, run in PowerShell or Git Bash:
    echo   bash deploy-lionfish.sh
    echo.
    echo Or manually:
    echo   1. Go to: https://cloud.digitalocean.com/apps
    echo   2. Click "Create App"
    echo   3. Upload the .do/app.yaml file
    echo   4. Configure your environment variables
    echo   5. Deploy!
) else if "%choice%"=="3" (
    echo 📖 Opening deployment guide...
    start "" "DIGITAL_OCEAN_DEPLOYMENT.md"
) else (
    echo ❌ Invalid choice. Please run the script again.
)

echo.
echo 🎯 Your app name is: lionfish-app
echo 🌐 It will be available at: https://lionfish-app-XXXXX.ondigitalocean.app
echo.
pause