#!/bin/bash

# Blog CMS 启动脚本

echo "🚀 启动 Blog CMS 系统..."

# 检查是否安装了依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装后端依赖..."
    npm install
fi

if [ ! -d "client/node_modules" ]; then
    echo "📦 安装前端依赖..."
    cd client && npm install && cd ..
fi

# 启动开发服务器
echo "🌟 启动开发服务器..."
echo "后端服务器: http://localhost:3001"
echo "前端界面: http://localhost:5173"
echo ""
echo "按 Ctrl+C 停止服务器"

npm run dev
