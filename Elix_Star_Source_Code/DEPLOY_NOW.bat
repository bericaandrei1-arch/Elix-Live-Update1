@echo off
echo 🦁 Starting Digital Ocean Deployment...
echo.

echo 1. Checking authentication...
call doctl account get >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  You are NOT authenticated.
    echo Please enter your Digital Ocean API Token when prompted.
    echo (You can get it from: https://cloud.digitalocean.com/account/api/tokens)
    echo.
    call doctl auth init
)

echo.
echo 2. Deploying App...
call doctl apps create --spec .do/app.yaml

if %errorlevel% equ 0 (
    echo ✅ Deployment started successfully!
    echo Check your dashboard for progress.
) else (
    echo ❌ Deployment failed. Please check the errors above.
)

pause