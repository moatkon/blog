#!/bin/bash

# Blog CMS 启动脚本

cd "$(dirname "$0")" || exit 1

echo "🚀 启动 Blog CMS 系统..."

if [ ! -d "node_modules" ]; then
    echo "📦 安装后端依赖..."
    npm install
fi

if [ ! -d "client/node_modules" ]; then
    echo "📦 安装前端依赖..."
    cd client && npm install && cd ..
fi

echo "后端 API: http://localhost:3001"
echo "CMS 界面: http://localhost:5173"
echo ""
echo "按 Ctrl+C 停止服务器"

npm run dev
