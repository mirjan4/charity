@echo off
echo ==========================================
echo      ANTI-GRAVITY AUTO DEPLOYMENT
echo ==========================================

echo [1/3] installing tools & building app...
call npm install --save-dev firebase-tools
call npm run build

echo.
echo [2/3] Login to Firebase
echo A browser window will open. Please sign in.
echo.
call npx firebase login

echo.
echo [3/3] Deploying to Internet...
call npx firebase deploy

echo.
echo ==========================================
echo      DEPLOYMENT COMPLETE!
echo ==========================================
pause
