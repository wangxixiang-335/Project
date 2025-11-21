@echo off
echo ========================================
echo    启动教师管理系统
echo ========================================
echo.

echo 正在启动后端服务器...
cd /d "%~dp0"
start /B node src/app.js

echo 等待服务器启动...
timeout /t 3 >nul

echo.
echo 🚀 服务器已启动！
echo.
echo 📋 使用方法：
echo 1. 打开浏览器访问：http://localhost:3000/src/login.html
echo 2. 使用教师账号登录：
echo    邮箱: teacher1763449748933@example.com
echo    密码: password123
echo.
echo 📖 详细功能说明请查看: TEACHER_SYSTEM_DEMO.md
echo.
echo 按任意键关闭此窗口...
pause >nul