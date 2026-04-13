@echo off
REM Part Numbers Monitoring - Startup Script for Windows

echo.
echo ============================================
echo Part Numbers Monitoring - Docker Startup
echo ============================================
echo.

REM Check if podman is installed
podman --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Podman is not installed or not in PATH
    echo.
    echo Please install Podman from: https://podman.io/docs/installation
    echo.
    pause
    exit /b 1
)

echo Podman is installed and ready.
echo.
echo Starting services...
echo  - Backend API: http://localhost:8000
echo  - Frontend: http://localhost:3000
echo.
echo Press Ctrl+C to stop services
echo.

REM Run podman compose
podman compose up --build

pause
