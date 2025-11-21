@echo off
echo 🚀 启动学生项目管理系统...

echo 🔍 检查端口占用...
netstat -ano | findstr :8090 && (
    echo 🛑 端口8090被占用，正在终止占用进程...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8090') do (
        taskkill /PID %%a /F >nul 2>&1
    )
)

echo 📦 启动后端服务器...
start "后端服务器" cmd /k "cd /d d:/Work/Project && node start_server.js"

echo 🌐 启动前端服务器...
timeout /t 3 >nul
start "前端服务器" cmd /k "cd /d d:/Work/Project/temp-frontend && npm run dev"

echo 🌟 正在打开应用...
timeout /t 5 >nul
start http://localhost:5176
start file:///D:/Work/Project/simple-frontend.html

echo ✅ 启动完成！
pause