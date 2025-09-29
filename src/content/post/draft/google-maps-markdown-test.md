---
title: "Google Maps Markdown 测试"
description: "测试在 Markdown 文件中使用 ::map 指令嵌入 Google Maps"
publishDate: "2025-12-01"
draft: false
tags: ["测试", "地图", "Markdown"]
---

# Google Maps Markdown 测试

这篇文章测试在纯 Markdown 文件中使用 `::map{}` 指令嵌入 Google Maps 的功能。

## 基本用法

下面是使用 `::map` 指令嵌入的地图：

::map{src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d4637.427721076213!2d103.98376110968208!3d30.59898122794867!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1szh-CN!2s!4v1759126259180!5m2!1szh-CN!2s"}

## 自定义尺寸

这是一个自定义尺寸的地图：

::map{src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d4637.427721076213!2d103.98376110968208!3d30.59898122794867!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1szh-CN!2s!4v1759126259180!5m2!1szh-CN!2s" width="800" height="400" title="成都某地"}

## 小尺寸地图

这是一个较小的地图：

::map{src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d4637.427721076213!2d103.98376110968208!3d30.59898122794867!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1szh-CN!2s!4v1759126259180!5m2!1szh-CN!2s" width="600" height="300"}

## 自定义错误信息

这是一个带有自定义错误信息的地图：

::map{src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d4637.427721076213!2d103.98376110968208!3d30.59898122794867!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1szh-CN!2s!4v1759126259180!5m2!1szh-CN!2s" fallback="网络连接有问题，请稍后再试"}

## 原始 iframe 对比

下面是直接使用 HTML iframe 的地图（作为对比）：

<iframe src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d4637.427721076213!2d103.98376110968208!3d30.59898122794867!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1szh-CN!2s!4v1759126259180!5m2!1szh-CN!2s" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>

## 总结

Markdown 中的 `::map{}` 指令功能测试完成，支持：

- ✅ **基本嵌入** - 简单的 `::map{src="..."}` 语法
- ✅ **自定义尺寸** - 支持 width 和 height 参数
- ✅ **自定义标题** - 支持 title 参数，提升无障碍访问
- ✅ **错误处理** - 网络问题时显示友好错误信息
- ✅ **重试功能** - 支持一键重试加载
- ✅ **响应式设计** - 自动适配不同屏幕尺寸
- ✅ **性能优化** - 懒加载和超时保护

现在你可以在任何 `.md` 文件中使用 `::map{}` 指令来嵌入 Google Maps 了！
