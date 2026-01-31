@echo off
title Stop Resource Consumer Server
echo Stopping Resource Consumer Server...
taskkill /F /IM resource-consumer-server.exe 2>nul
if %errorlevel% equ 0 (
    echo Server stopped successfully.
) else (
    echo Server is not running or already stopped.
)
echo.
pause