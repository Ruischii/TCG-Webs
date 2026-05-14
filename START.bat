@echo off
echo ========================================
echo    TCG Platform - Starting Local Server
echo ========================================
echo.

echo Checking Docker...
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running!
    echo Please start Docker Desktop first.
    pause
    exit
)
echo [OK] Docker is running
echo.

echo Starting TCG Platform...
docker-compose up -d
echo.

echo Waiting for services to start...
timeout /t 15 /nobreak >nul
echo.

echo ========================================
echo    TCG Platform is Running!
echo ========================================
echo.
echo Frontend:     http://localhost:3000
echo API:          http://localhost:3001
echo Database UI:  http://localhost:8080
echo.
echo Admin Login:
echo   Email:    admin@tcgstore.com
echo   Password: admin123
echo.
echo Press any key to open the website...
pause >nul
start http://localhost:3000