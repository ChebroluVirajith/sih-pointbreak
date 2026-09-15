@echo off
echo =====================================================================
echo  GovInteroperability Hub - SIH 2026 Federated Prototype Launcher
echo =====================================================================
echo.
echo Starting FastAPI Interoperability Backend on http://localhost:8000 ...
start "GovConnect Backend (FastAPI)" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --reload --port 8000"

timeout /t 2 /nobreak >nul

echo Starting React + Tailwind Portal on http://localhost:5173 ...
start "GovConnect Portal (React + Vite)" cmd /k "cd /d %~dp0frontend && npm.cmd run dev"

echo.
echo =====================================================================
echo  Services started successfully!
echo  - Frontend Portal:  http://localhost:5173
echo  - Backend API Docs: http://localhost:8000/docs
echo =====================================================================
