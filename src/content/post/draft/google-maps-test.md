---
title: "Google Maps 嵌入测试"
description: "测试在博客文章中嵌入 Google Maps 的功能"
publishDate: "2025-12-01"
draft: false
---

<!-- 
<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d13738.134472368432!2d104.03797426498134!3d30.590708615831854!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x36efc42bdddd4733%3A0x509ed3feab96174b!2z5Lit5Zu95Zub5bed55yB5oiQ6YO95biC5q2m5L6v5Yy655-z576K5Zy6IOmCruaUv-e8lueggTogNjEwMDQx!5e0!3m2!1szh-CN!2sus!4v1759127199468!5m2!1szh-CN!2sus" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe> -->


::map{src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d13738.134472368432!2d104.03797426498134!3d30.590708615831854!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x36efc42bdddd4733%3A0x509ed3feab96174b!2z5Lit5Zu95Zub5bed55yB5oiQ6YO95biC5q2m5L6v5Yy655-z576K5Zy6IOmCruaUv-e8lueggTogNjEwMDQx!5e0!3m2!1szh-CN!2sus!4v1759127199468!5m2!1szh-CN!2sus"}


---
--



# Google Maps 嵌入测试

这篇文章用于测试在博客中嵌入 Google Maps 的功能。

## 使用指令语法嵌入地图

下面是使用 `::map` 指令嵌入的地图：

::map{src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d4637.427721076213!2d103.98376110968208!3d30.59898122794867!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1szh-CN!2s!4v1759126259180!5m2!1szh-CN!2s"}

## 原始 iframe 测试

下面是直接使用 HTML iframe 的地图：

<iframe src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d4637.427721076213!2d103.98376110968208!3d30.59898122794867!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1szh-CN!2s!4v1759126259180!5m2!1szh-CN!2s" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>

## 自定义尺寸的地图

这是一个自定义尺寸的地图：

::map{src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d4637.427721076213!2d103.98376110968208!3d30.59898122794867!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1szh-CN!2s!4v1759126259180!5m2!1szh-CN!2s" width="800" height="400" title="成都某地"}

## 小尺寸地图

这是一个较小的地图：

::map{src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d4637.427721076213!2d103.98376110968208!3d30.59898122794867!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1szh-CN!2s!4v1759126259180!5m2!1szh-CN!2s" width="600" height="300"}

## 总结

Google Maps 嵌入功能测试完成，支持：

- ✅ 基本地图嵌入
- ✅ 自定义尺寸
- ✅ 自定义标题
- ✅ 响应式设计
- ✅ 懒加载优化
