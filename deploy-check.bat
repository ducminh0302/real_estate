@echo off
echo ================================
echo  REAL ESTATE CHAT DEPLOYMENT
echo ================================
echo.

echo 1. Checking Node.js version...
node --version
echo.

echo 2. Checking npm version...
npm --version
echo.

echo 3. Installing dependencies...
npm install
echo.

echo 4. Running build test...
npm run build
if %ERRORLEVEL% neq 0 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)
echo.

echo 5. Checking git status...
git status --short
echo.

echo 6. Ready to deploy!
echo.
echo Next steps:
echo - git push origin main (if you have changes)
echo - Deploy to Vercel: https://vercel.com/new/clone?repository-url=https://github.com/ducminh0302/real_estate
echo.

pause
