#!/bin/bash

# 启动前先释放博客与 CMS 的固定端口
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR" || exit 1

PORTS=(4321 3001 5173)

port_pids() {
  lsof -nP -tiTCP:"$1" -sTCP:LISTEN 2>/dev/null || true
}

kill_port() {
  local port="$1"
  local pids
  pids=$(port_pids "$port")

  if [ -z "$pids" ]; then
    echo "端口 $port 空闲"
    return 0
  fi

  echo "端口 $port 被占用 (PID: $(echo "$pids" | tr '\n' ' '))，正在终止..."
  kill $pids 2>/dev/null || true

  # nodemon / concurrently 可能会自动拉起子进程，顺着父进程链一并停掉
  local pid current parent command_line
  for pid in $pids; do
    current="$pid"
    while true; do
      parent=$(ps -o ppid= -p "$current" 2>/dev/null | tr -d ' ')
      [ -z "$parent" ] || [ "$parent" -le 1 ] && break

      command_line=$(ps -o command= -p "$parent" 2>/dev/null || true)
      case "$command_line" in
        *nodemon*|*concurrently*)
          kill "$parent" 2>/dev/null || true
          break
          ;;
        *zsh*|*bash*|*login*)
          break
          ;;
        *)
          current="$parent"
          ;;
      esac
    done
  done

  local attempt
  for attempt in 1 2 3 4 5 6 7 8 9 10; do
    sleep 0.3
    pids=$(port_pids "$port")
    if [ -z "$pids" ]; then
      echo "端口 $port 已释放"
      return 0
    fi
    kill -9 $pids 2>/dev/null || true
  done

  echo "无法释放端口 $port，请手动处理"
  return 1
}

for port in "${PORTS[@]}"; do
  kill_port "$port" || exit 1
done

cleanup() {
  echo ""
  echo "正在停止开发服务器..."
  [ -n "${PID1:-}" ] && kill "$PID1" 2>/dev/null || true
  [ -n "${PID2:-}" ] && kill "$PID2" 2>/dev/null || true
}
trap cleanup INT TERM

echo "启动博客 dev (4321)..."
npm run dev &
PID1=$!

echo "启动 CMS dev (3001 / 5173)..."
npm --prefix cms run dev &
PID2=$!

wait
