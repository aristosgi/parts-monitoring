#!/bin/bash

# Part Numbers Monitoring - Startup Script for Linux/macOS

echo ""
echo "============================================"
echo "Part Numbers Monitoring - Docker Startup"
echo "============================================"
echo ""

# Check if podman is installed
if ! command -v podman &> /dev/null; then
    echo "ERROR: Podman is not installed"
    echo ""
    echo "Install Podman:"
    echo "  macOS: brew install podman"
    echo "  Ubuntu/Debian: sudo apt install podman"
    echo "  Fedora/RHEL: sudo dnf install podman"
    echo ""
    echo "Or visit: https://podman.io/docs/installation"
    exit 1
fi

echo "Podman is installed and ready."
echo ""
echo "Starting services..."
echo "  - Backend API: http://localhost:8000"
echo "  - Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop services"
echo ""

# Run podman compose
podman compose up --build
