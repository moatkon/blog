#!/bin/bash

# 启动主项目 dev
npm run dev &
PID1=$!

# 启动 cms dev
cd cms
npm run dev &
PID2=$!

# 捕获 Ctrl+C 信号，终止两个进程
trap "kill $PID1 $PID2" INT

# 等待两个进程结束
wait
