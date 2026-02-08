@echo off
echo 🦁 Digital Ocean Deployment Diagnostic Tool
echo.

echo 1. Checking for doctl...
where doctl >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ doctl is NOT installed or not in PATH.
    echo Please install it from: https://github.com/digitalocean/doctl/releases
    pause
    exit /b
)
echo ✅ doctl found.

echo.
echo 2. Checking authentication...
call doctl account get >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  You are NOT authenticated.
    echo.
    echo We need to log you in.
    echo A browser window might open, or you might need to paste a token.
    echo.
    echo If you have a token, type it now. If not, press Enter to try interactive login.
    echo.
    
    set /p token="Paste Token (or press Enter): "
    
    if "%token%"=="" (
        call doctl auth init
    ) else (
        call doctl auth init -t %token%
    )
)

if %errorlevel% neq 0 (
    echo ❌ Authentication failed. Cannot proceed.
    pause
    exit /b
)

echo ✅ Authenticated successfully!

echo.
echo 3. Preparing deployment...
echo App Spec: .do/app.yaml

if not exist .do\app.yaml (
    echo ❌ Config file .do/app.yaml not found!
    pause
    exit /b
)

echo.
echo 4. Starting Deployment...
call doctl apps create --spec .do/app.yaml

if %errorlevel% equ 0 (
    echo.
    echo ✅✅✅ DEPLOYMENT SUCCESSFUL! ✅✅✅
    echo Your app is being built on Digital Ocean.
    echo Check the dashboard: https://cloud.digitalocean.com/apps
) else (
    echo.
    echo ❌ Deployment command failed.
    echo Check the error message above.
)

echo.
pause