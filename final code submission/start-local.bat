@echo off
echo Starting HRMS Local Backend...
start cmd /k "cd backend && ..\.venv\Scripts\pip install -r requirements.txt && ..\.venv\Scripts\python -m uvicorn app.main:app --reload --port 8000"
echo Starting HRMS Local Frontend...
start cmd /k "cd frontend && npm run dev"
echo Both services are spinning up!
echo Frontend will be running at http://localhost:5173
echo Backend API Docs will be running at http://localhost:8000/api/docs
pause
