# DM Sans 字体集成说明

## 概述
已成功集成 DM Sans Variable 字体来优化中文字体展示。DM Sans 是一个现代的无衬线字体，具有良好的中文字符支持和可读性。

## 集成内容

### 1. 字体引入 (src/components/BaseHead.astro)
- 添加了 Google Fonts 的 DM Sans Variable 字体链接
- 包含了 preconnect 链接以优化加载性能
- 支持完整的字重范围 (100-1000) 和斜体变体

### 2. 字体栈配置 (src/styles/global.css)
```css
font-family: "DM Sans Variable", "DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans SC", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial, sans-serif;
```

字体回退顺序：
1. DM Sans Variable (主要字体)
2. DM Sans (回退)
3. 系统字体 (-apple-system, BlinkMacSystemFont, Segoe UI)
4. 中文字体 (Noto Sans SC, PingFang SC, Hiragino Sans GB, Microsoft YaHei)
5. 通用无衬线字体 (Helvetica Neue, Helvetica, Arial, sans-serif)

### 3. Tailwind CSS 配置 (tailwind.config.ts)
- 更新了 fontFamily.sans 配置
- 保持了 fontFamily.mono 用于代码块
- 优化了 typography 插件配置

### 4. 中文字体优化 (src/styles/global.css)
- 添加了字体渲染优化设置
- 针对中文字符的特殊样式优化
- 改进了行高、字重和字间距设置

### 5. 布局更新 (src/layouts/Base.astro)
- 移除了 `font-mono` 类，使用默认的 sans-serif 字体栈

## 字体优化特性

### 渲染优化
- `font-feature-settings: "kern" 1, "liga" 1, "calt" 1` - 启用字距调整、连字和上下文替代
- `text-rendering: optimizeLegibility` - 优化文本渲染
- `-webkit-font-smoothing: antialiased` - 抗锯齿渲染
- `-moz-osx-font-smoothing: grayscale` - macOS 灰度渲染

### 中文字体特殊优化
- 针对 `:lang(zh)` 的特殊字重和字间距设置
- 优化的行高设置 (1.7-1.8)
- 标题字体权重优化 (600)
- 段落文本行高优化 (1.8)

### Typography 插件优化
- 基础字体设置继承全局配置
- 优化的标题样式 (字重 600, 行高 1.4)
- 改进的段落和列表样式 (行高 1.8)

## 保留的等宽字体使用
以下组件和功能仍然使用等宽字体，这是合适的：
- 代码块 (Expressive Code)
- NamingDisplay 组件
- Giscus 评论系统
- OG 图像生成 (Roboto Mono)

## 测试建议
1. 检查中文文本的渲染效果
2. 验证英文文本的可读性
3. 确认代码块仍使用等宽字体
4. 测试不同字重的显示效果
5. 验证深色模式下的字体表现

## 性能考虑
- 使用了 Google Fonts 的 `display=swap` 参数以避免字体加载阻塞
- 添加了 preconnect 链接以优化网络连接
- Variable 字体减少了需要加载的字体文件数量
