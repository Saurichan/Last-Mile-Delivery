@echo off
title Push Project to GitHub
color 0A
echo ===================================================
echo   PUSHING ALL SOURCE FILES TO GITHUB (Last-Mile-Delivery)
echo ===================================================
echo.
cd /d "%~dp0"
echo Target Repository: https://github.com/Saurichan/Last-Mile-Delivery
echo Branch: main
echo.
echo Staging and committing changes...
git add .
git commit -m "Update business switcher, Tumakuru geolocation, and all button actions" 2>nul
echo.
echo Pushing updated source files to GitHub...
git push -u origin main --force
echo.
if %ERRORLEVEL% EQU 0 (
    echo ===================================================
    echo  [SUCCESS] All files and folders uploaded to GitHub!
    echo ===================================================
    echo.
    echo Now open Vercel and your deployment will build successfully!
) else (
    echo.
    echo ===================================================
    echo  [NOTICE] Push did not complete. If you see a GitHub
    echo  sign-in prompt, please complete it and try again.
    echo ===================================================
)
echo.
pause
