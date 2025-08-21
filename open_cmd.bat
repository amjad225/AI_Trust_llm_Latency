@echo off
setlocal EnableDelayedExpansion

:: Set the number of windows to open
set windows=9

:: Loop through the number of windows and open each
for /L %%i in (1,1,%windows%) do (
    start cmd /k "cd /d %cd% && node app.js && timeout /t 5 >nul && echo 2"
)

:: Exit the script
exit
