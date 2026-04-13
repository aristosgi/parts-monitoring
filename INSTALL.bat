@echo off
REM Part Numbers Monitoring - Installation & Startup Script

cls
echo.
echo ============================================
echo   PART NUMBERS MONITORING
echo ============================================
echo.

REM Check if Podman is installed
podman --version >nul 2>&1
if %errorlevel% neq 0 (
    cls
    echo.
    echo ============================================
    echo   PODMAN NOT FOUND
    echo ============================================
    echo.
    echo Podman is required but not installed.
    echo.
    echo INSTALLATION STEPS:
    echo 1. Go to: https://podman.io/docs/installation
    echo 2. Download Podman for Windows
    echo 3. Run the installer and complete setup
    echo 4. RESTART YOUR COMPUTER
    echo 5. Run this script again
    echo.
    echo.
    pause
    exit /b 1
)

echo ✓ Podman found
echo.
echo Starting services...
echo.
echo   Frontend:    http://localhost:3000
echo   Backend API: http://localhost:8000
echo   Admin:       http://localhost:3000/admin (password: 123)
echo.
echo Press Ctrl+C to stop everything
echo.
echo ============================================
echo.

podman compose up --build

pause
