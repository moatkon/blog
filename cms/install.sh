#!/bin/bash

# Blog CMS 安装脚本

echo "📦 Blog CMS 安装程序"
echo "===================="

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js"
    echo "请先安装 Node.js: https://nodejs.org/"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未找到 npm"
    echo "请先安装 npm"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"
echo "✅ npm 版本: $(npm --version)"
echo ""

# 安装后端依赖
echo "📦 安装后端依赖..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ 后端依赖安装失败"
    exit 1
fi

# 安装前端依赖
echo "📦 安装前端依赖..."
cd client
npm install

if [ $? -ne 0 ]; then
    echo "❌ 前端依赖安装失败"
    exit 1
fi

cd ..

echo ""
echo "🎉 安装完成！"
echo ""
echo "使用方法："
echo "  ./start.sh          # 启动开发服务器"
echo "  npm run dev         # 启动开发服务器"
echo "  npm run build       # 构建生产版本"
echo "  npm start           # 启动生产服务器"
echo ""
echo "访问地址："
echo "  前端界面: http://localhost:5173"
echo "  后端API:  http://localhost:3001"
