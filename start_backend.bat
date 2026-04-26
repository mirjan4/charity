@echo off
set PHP_PATH=C:\xampp\php\php.exe
if exist %PHP_PATH% (
    echo Starting Laravel Backend...
    cd backend
    %PHP_PATH% artisan serve
) else (
    echo Error: PHP not found at C:\xampp\php\php.exe
    echo Please ensure XAMPP is installed in the default location.
    pause
)
