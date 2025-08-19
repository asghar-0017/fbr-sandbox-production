@echo off
echo 🚀 Starting Database Schema Check...
echo.

cd /d "%~dp0"
node check-missing-columns.js

echo.
echo ✅ Schema check completed!
pause
