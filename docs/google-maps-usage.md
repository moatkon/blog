# Google Maps 嵌入使用指南

本指南介绍如何在博客文章中方便地嵌入 Google Maps 地图。

## 功能特点

- 🗺️ **简单易用** - 支持多种嵌入方式
- 📱 **响应式设计** - 自动适配不同屏幕尺寸
- ⚡ **性能优化** - 支持懒加载
- 🎨 **样式统一** - 与博客主题保持一致

## 使用方法

### 方法一：使用指令语法（推荐）

在 Markdown 文件中使用 `::map` 指令：

```markdown
::map{src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d4637.427721076213!2d103.98376110968208!3d30.59898122794867!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1szh-CN!2s!4v1759126259180!5m2!1szh-CN!2s"}
```

#### 自定义尺寸和标题

```markdown
::map{src="https://www.google.com/maps/embed?pb=..." width="800" height="400" title="我的位置"}
```

#### 支持的参数

- `src` - Google Maps 嵌入 URL（必需）
- `width` - 地图宽度（默认：100%）
- `height` - 地图高度（默认：450px）
- `title` - 地图标题，用于无障碍访问（默认：Google Map）

### 方法二：在 MDX 文件中直接使用组件

如果你的文章是 `.mdx` 格式，可以直接使用组件：

```mdx
<GoogleMap 
  src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d4637.427721076213!2d103.98376110968208!3d30.59898122794867!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1szh-CN!2s!4v1759126259180!5m2!1szh-CN!2s"
  width="100%"
  height="450"
  title="成都某地"
/>
```

## 获取 Google Maps 嵌入代码

1. 打开 [Google Maps](https://maps.google.com/)
2. 搜索你想要嵌入的地点
3. 点击左侧信息面板中的"分享"按钮
4. 选择"嵌入地图"标签
5. 选择合适的尺寸或自定义尺寸
6. 复制 iframe 的 `src` 属性值

### 示例 URL 结构

```
https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d4637.427721076213!2d103.98376110968208!3d30.59898122794867!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1szh-CN!2s!4v1759126259180!5m2!1szh-CN!2s
```

## 样式和响应式

地图组件已经内置了响应式设计：

- **桌面端**：使用指定的宽度和高度
- **移动端**：自动调整为 300px 高度，宽度 100%
- **圆角和阴影**：与博客整体设计保持一致

## 性能优化

- **懒加载**：默认启用 `loading="lazy"`，只有当地图进入视口时才开始加载
- **隐私保护**：使用 `referrerpolicy="no-referrer-when-downgrade"`

## 完整示例

### 在 Markdown 文章中使用

```markdown
---
title: "我的旅行记录"
description: "记录一次美好的旅行"
publishDate: "2025-01-01"
tags: ["旅行", "记录"]
---

# 我的旅行记录

今天去了一个很棒的地方，位置如下：

::map{src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d4637.427721076213!2d103.98376110968208!3d30.59898122794867!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1szh-CN!2s!4v1759126259180!5m2!1szh-CN!2s" title="旅行目的地"}

这个地方真的很美，推荐大家去看看！
```

### 在 MDX 文章中使用

```mdx
---
title: "餐厅推荐"
description: "推荐一家好吃的餐厅"
publishDate: "2025-01-01"
tags: ["美食", "推荐"]
---

# 餐厅推荐

这家餐厅的位置：

<GoogleMap 
  src="https://www.google.com/maps/embed?pb=..."
  width="100%"
  height="350"
  title="推荐餐厅位置"
/>

餐厅的菜品非常棒，环境也很好！
```

## 注意事项

1. **URL 有效性**：确保 Google Maps 嵌入 URL 是有效的
2. **隐私考虑**：嵌入地图会加载 Google 的资源，请注意隐私政策
3. **加载性能**：虽然使用了懒加载，但仍建议在一篇文章中不要嵌入过多地图
4. **移动端体验**：在移动设备上测试地图的显示效果

## 故障排除

### 地图不显示

1. 检查 `src` URL 是否正确
2. 确保网络连接正常
3. 检查浏览器控制台是否有错误信息

### 样式问题

1. 确保使用了正确的宽度和高度值
2. 检查是否有 CSS 冲突
3. 在不同设备上测试显示效果

## 技术实现

这个功能通过以下技术实现：

- **Astro 组件**：`src/components/GoogleMap.astro`
- **Remark 插件**：`src/plugins/remark-google-maps.ts`
- **自动配置**：在 `astro.config.ts` 中自动启用

如果你需要自定义样式或功能，可以直接修改相应的组件文件。
