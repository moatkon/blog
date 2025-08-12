#!/bin/bash

# 拉取最新代码到本地仓库
echo "=========>>>开始检测指定文件夹下的文件变动,并更新lastUpdated时间"
#sh last_update.sh
echo "=========>>>lastUpdated end"
echo ""


# 拉取最新代码到本地仓库
echo "=========>>>拉取最新代码到本地仓库,开始fetch操作"
git fetch
echo "=========>>>fetch 成功"

echo ""


# 检查本地分支是否落后于远程分支,如果是,则先合并远程分支
if [ -n "$(git status -uno | grep 'Your branch is behind')" ]; then
    echo "=========>>>本地分支落后于远程分支,先合并远程分支"
    git pull
    echo "=========>>>合并远程分支完成"
    echo ""
fi

# 获取当前分支
branch=$(git rev-parse --abbrev-ref HEAD)

# 检查是否存在未推送的本地 commit,如果有则先执行推送操作
if [ -n "$(git log origin/${branch}..HEAD --oneline)" ]; then
    echo "=========>>>存在未推送的本地 commit,先执行推送操作"
    git push origin HEAD
    echo "=========>>>push 完成"
fi

# 检查是否存在未提交的修改
if [ -z "$(git status --porcelain)" ]; then
    echo "=========>>>当前仓库没有未提交的修改,很干净"
    exit 1
fi

timeValue=0

# 获取提交注释
if [ -z "$1" ]
  then
    echo "=========>>>请在 $timeValue s内输入提交注释,否则使用默认提交信息进行提交 | 快捷操作:直接回车:"
    read -t $timeValue message

    # echo "=========>>>请在输入提交注释 | 如需默认提交信息,请按回车键 "
    # read message
    if [ -z "$message" ]
      then
        # echo "必须输入提交注释!!!!!!!!!!!!"
        # exit 1
        timestamp=$(date +%s)
        message="moatkon.com commit $timestamp"
    fi
  else
    message="$1"
fi

# 添加所有修改到 Git
git add .

# 提交修改
git commit -m "$message" --no-verify

# 输出提交信息
echo "=========>>>提交注释:  $message"

# 推送代码到远程 Git 仓库
git push origin HEAD

# 输出推送信息
echo "=========>>>已将代码推送到远程仓库"
