@echo off
title 教师管理系统启动器
echo.
echo ========================================
echo    🎓 教师管理系统启动器
echo ========================================
echo.

echo 正在启动服务器...
cd /d "%~dp0"
start /B node src/app.js

echo 等待服务器启动...
ping 127.0.0.1 -n 6 > nul

echo.
echo ✅ 服务器启动成功！
echo.
echo 📱 请使用以下地址访问：
echo.
echo  登录页面: http://localhost:3000/
echo            http://localhost:3000/login.html
echo.
echo  测试页面: http://localhost:3000/test_teacher_simple.html
echo.
echo 👤 教师登录信息：
echo    邮箱: teacher1763449748933@example.com
echo    密码: password123
echo.
echo 🎯 重要提示：
echo    • 访问 http://localhost:3000/ 自动跳转到登录页面
echo    • 请确保使用新创建的教师系统（不是temp-frontend）
echo    • 登录成功后自动进入教师专用首页
echo.
echo 按任意键关闭此窗口...
pause > nul