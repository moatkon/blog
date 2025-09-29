# Google Maps 快速开始

## 🚀 快速使用

在你的 Markdown 文章中，只需要一行代码就可以嵌入 Google Maps：

```markdown
::map{src="你的Google Maps嵌入URL"}
```

✅ **功能已完全实现** - 自动转换为优化的 iframe，包含懒加载和网络优化！

## 📋 获取嵌入URL的步骤

1. 打开 [Google Maps](https://maps.google.com/)
2. 搜索地点
3. 点击"分享" → "嵌入地图"
4. 复制 iframe 中的 `src` 属性值

## 💡 实际示例

### 基本用法
```markdown
::map{src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d4637.427721076213!2d103.98376110968208!3d30.59898122794867!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1szh-CN!2s!4v1759126259180!5m2!1szh-CN!2s"}
```

### 自定义尺寸
```markdown
::map{src="..." width="800" height="400" title="我的位置"}
```

### 在 MDX 文件中使用
```mdx
<GoogleMap 
  src="..."
  width="100%"
  height="450"
  title="地图标题"
/>
```

## ✨ 特性

- 🗺️ **简单易用** - 一行代码搞定
- 📱 **响应式** - 自动适配移动端
- ⚡ **懒加载** - 性能优化
- 🎨 **美观** - 圆角阴影效果
- 🔒 **隐私保护** - 正确的 referrer policy 设置
- ♿ **无障碍访问** - 支持屏幕阅读器
- 🌐 **SEO 友好** - 语义化 HTML 结构

## 🔧 支持的参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `src` | string | - | Google Maps 嵌入 URL（必需）|
| `width` | string/number | "100%" | 地图宽度 |
| `height` | string/number | 450 | 地图高度 |
| `title` | string | "Google Map" | 地图标题（无障碍访问）|

## 🎯 自动优化特性

- **懒加载**: 使用 `loading="lazy"` 属性，提升页面性能
- **隐私保护**: 自动设置 `referrerpolicy="no-referrer-when-downgrade"`
- **响应式**: 自动添加响应式样式类
- **无障碍**: 支持 `allowfullscreen` 和正确的 `title` 属性
- **美观样式**: 自动添加圆角和阴影效果

就这么简单！现在你可以在任何 `.md` 文章中轻松嵌入 Google Maps 了！🎉
