@echo off
REM Part Numbers Monitoring - Native Startup (Without Docker)
REM This script starts both backend and frontend

cls
echo.
echo ============================================
echo   PART NUMBERS MONITORING (NATIVE)
echo ============================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    echo.
    echo Please install Python 3.11+ from: https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation
    echo.
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo.
    echo Please install Node.js 18+ from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo ✓ Python found
echo ✓ Node.js found
echo.

REM Check if venv exists, if not create it
if not exist "backend\venv" (
    echo Creating Python virtual environment...
    cd backend
    python -m venv venv
    cd ..
    echo.
)

REM Check if node_modules exists, if not install
if not exist "frontend\node_modules" (
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
    echo.
)

echo Starting services...
echo.
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:5173
echo   Admin:    http://localhost:5173/admin (password: 123)
echo.
echo Press Ctrl+C to stop
echo.
echo ============================================
echo.

REM Start backend in new window
start "Part Monitoring Backend" cmd /k "cd backend && venv\Scripts\Activate.ps1 && uvicorn main:app --reload --host 0.0.0.0 --port 8000"

REM Wait a second for backend to start
timeout /t 2 /nobreak

REM Start frontend in new window
start "Part Monitoring Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Both services started. Opening browser...
timeout /t 3 /nobreak

REM Open browser
start http://localhost:5173

echo.
echo To stop: Close both command windows or press Ctrl+C
pause
