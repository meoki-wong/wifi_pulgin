@echo off
chcp 65001 >nul
title Windows打包脚本 - Node.js项目打包成可执行文件

echo ===================================
echo 开始打包Windows可执行文件...
echo ===================================
echo.

:: 检查是否安装了Node.js
echo [1/4] 检查Node.js环境...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未检测到Node.js，请先安装Node.js
    echo 下载地址: https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo ✓ Node.js已安装
node --version
echo.

:: 检查是否安装了pkg
echo [2/4] 检查pkg打包工具...
pkg --version >nul 2>&1
if %errorlevel% neq 0 (
    echo pkg未安装，正在安装...
    npm install -g pkg
    if %errorlevel% neq 0 (
        echo 错误: pkg安装失败
        pause
        exit /b 1
    )
)
echo ✓ pkg已安装
pkg --version
echo.

:: 安装项目依赖
echo [3/4] 安装项目依赖...
npm install
if %errorlevel% neq 0 (
    echo 错误: 依赖安装失败
    pause
    exit /b 1
)
echo ✓ 依赖安装完成
echo.

:: 创建build目录
if not exist build mkdir build

:: 打包Windows版本
echo [4/4] 正在打包Windows版本...
echo 这可能需要几分钟时间，请耐心等待...
echo.
pkg . --targets node18-win-x64 --outpath build
if %errorlevel% neq 0 (
    echo 错误: 打包失败
    pause
    exit /b 1
)
echo.

:: 检查是否打包成功
if exist "build\resource-consumer-server.exe" (
    echo ===================================
    echo ✓ 打包成功！
    echo ===================================
    echo.
    echo 可执行文件位置: build\resource-consumer-server.exe
    echo.
    echo 在Windows上运行方法:
    echo   方法1: 双击 resource-consumer-server.exe
    echo   方法2: 在命令行中运行: resource-consumer-server.exe
    echo.
    echo 服务器将在 http://localhost:3000 启动
    echo   访问 /status 查看状态
    echo   访问 /start 启动流量消耗
    echo   访问 /stop 停止流量消耗
    echo.
) else (
    echo 错误: 打包失败，未找到生成的可执行文件
    pause
    exit /b 1
)

pause
