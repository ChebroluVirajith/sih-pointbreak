#!/usr/bin/env bash

echo "================================================================="
echo " GovConnect - SIH 2026 Codespaces Launcher"
echo "================================================================="

# 1. Install Backend Dependencies
echo "[1/4] Installing Python backend dependencies..."
pip install -r backend/requirements.txt --quiet

# 2. Install & Fix Frontend Permissions
echo "[2/4] Setting up frontend & fixing Linux permissions..."
cd frontend
if [ ! -d "node_modules" ]; then
  npm install
fi
# Fix permission denied on Linux/Codespaces binaries
chmod -R +x node_modules/.bin 2>/dev/null || true
cd ..

# 3. Start FastAPI Backend in Background
echo "[3/4] Starting FastAPI Backend on http://0.0.0.0:8000 ..."
cd backend
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
cd ..

sleep 2

# 4. Start Vite React Frontend
echo "[4/4] Starting React Frontend on http://0.0.0.0:5173 ..."
cd frontend
npx vite --host 0.0.0.0

# Cleanup on exit
trap "kill $BACKEND_PID" EXIT
