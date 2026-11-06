@echo off
cd /d "%~dp0"
echo ========================================================
echo        EcoChain V2 - Local E-Waste Lifecycle
echo ========================================================
echo Starting local blockchain node (chainId 31337)...
start "EcoChain chain" cmd /k npm run chain
timeout /t 8 /nobreak >nul

echo Deploying EWasteTracker smart contract...
call npm run deploy

echo Starting backend Express API and SQLite event indexer...
start "EcoChain backend" cmd /k npm run backend
timeout /t 4 /nobreak >nul

echo Seeding 30 simulated devices across lifecycle stages...
call npm run seed

echo Starting Vite React frontend server...
start "EcoChain frontend" cmd /k npm run frontend
timeout /t 5 /nobreak >nul

echo Opening browser at http://localhost:5173 ...
start http://localhost:5173

echo ========================================================
echo EcoChain is now running!
echo To stop everything, simply close the opened command windows.
echo ========================================================
