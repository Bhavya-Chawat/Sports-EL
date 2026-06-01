@echo off
echo ================================================
echo   KabaddiIQ - Starting Backend (FastAPI)
echo ================================================
cd /d "%~dp0backend"

:: Activate venv
call venv\Scripts\activate.bat

:: Install deps if needed
if not exist venv\Scripts\uvicorn.exe (
    echo Installing dependencies into venv...
    pip install -r requirements.txt
)

echo.
echo  Starting FastAPI server on http://localhost:8000
echo  API Docs: http://localhost:8000/docs
echo.
python main.py
