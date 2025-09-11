@echo off
echo "=== Deploying Real Estate Chat Interface ==="

echo "1. Installing dependencies..."
npm install

echo "2. Building project..."
npm run build

echo "3. Testing build locally..."
echo "Starting server on http://localhost:3000"
echo "Press Ctrl+C to stop the server"
npm start
