@echo off
title WhatsApp Bot
color 0A
echo.
echo ========================================
echo    🤖 WHATSAPP BOT
echo ========================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    echo.
    call npm install
    echo.
    echo ✅ Dependencies installed!
    echo.
)

echo 🚀 Starting WhatsApp Bot...
echo.
echo Press CTRL+C to stop the bot
echo.

REM Start the bot
node index.js
