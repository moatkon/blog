
# 创建 .npmrc 文件
cat > .npmrc << EOF
registry=https://registry.npmmirror.com/
sharp_binary_host=https://npmmirror.com/mirrors/sharp
sharp_libvips_binary_host=https://npmmirror.com/mirrors/sharp-libvips
EOF

# 清理并安装
sudo rm -rf node_modules package-lock.json
sudo npm cache clean --force
sudo npm install