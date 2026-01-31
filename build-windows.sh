#!/bin/bash

# Windows打包脚本 - 将Node.js项目打包成Windows可执行文件
# 使用方法: 在终端运行 ./build-windows.sh

echo "==================================="
echo "开始打包Windows可执行文件..."
echo "==================================="

# 检查操作系统
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "提示: 在macOS上无法直接打包Windows版本。"
    echo ""
    echo "有以下几种方案:"
    echo ""
    echo "方案1 - 在Windows上打包:"
    echo "  1. 将项目文件复制到Windows机器"
    echo "  2. 安装Node.js (https://nodejs.org/)"
    echo "  3. 运行: npm install -g pkg"
    echo "  4. 运行: pkg . --targets node18-win-x64"
    echo ""
    echo "方案2 - 使用GitHub Actions自动打包:"
    echo "  项目已包含.github/workflows目录，可配置CI/CD自动生成Windows可执行文件"
    echo ""
    echo "方案3 - 使用Docker打包:"
    docker run --rm -v $(pwd):/app -w /app node:18-alpine npm install -g pkg > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "  Docker可用，正在使用Docker打包..."
        mkdir -p build
        docker run --rm -v $(pwd):/app -w /app node:18-alpine pkg . --targets node18-win-x64 --outpath build
        if [ -f "build/resource-consumer-server.exe" ]; then
            echo "==================================="
            echo "打包成功！"
            echo "可执行文件位置: build/resource-consumer-server.exe"
            echo "==================================="
            echo ""
            echo "在Windows上运行方法:"
            echo "1. 双击 resource-consumer-server.exe"
            echo "2. 或在命令行中运行: resource-consumer-server.exe"
            echo ""
            echo "服务器将在 http://localhost:3000 启动"
            echo "访问 /status 查看状态"
            echo "访问 /start 启动流量消耗"
            echo "访问 /stop 停止流量消耗"
        else
            echo "Docker打包失败，请尝试方案1或方案2"
        fi
    else
        echo "  Docker未安装，请尝试方案1或方案2"
    fi
    exit 0
fi

# 检查pkg是否安装
if ! command -v pkg &> /dev/null; then
    echo "pkg未安装，正在安装..."
    npm install -g pkg
fi

# 安装项目依赖
echo "正在安装项目依赖..."
npm install

# 创建build目录
echo "正在创建build目录..."
mkdir -p build

# 打包Windows版本
echo "正在打包Windows版本..."
pkg . --targets node18-win-x64 --outpath build

# 检查是否打包成功
if [ -f "build/resource-consumer-server.exe" ]; then
    echo "==================================="
    echo "打包成功！"
    echo "可执行文件位置: build/resource-consumer-server.exe"
    echo "==================================="
    echo ""
    echo "在Windows上运行方法:"
    echo "1. 双击 resource-consumer-server.exe"
    echo "2. 或在命令行中运行: resource-consumer-server.exe"
    echo ""
    echo "服务器将在 http://localhost:3000 启动"
    echo "访问 /status 查看状态"
    echo "访问 /start 启动流量消耗"
    echo "访问 /stop 停止流量消耗"
else
    echo "打包失败，请检查错误信息"
    exit 1
fi
