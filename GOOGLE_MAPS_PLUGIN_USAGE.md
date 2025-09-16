# Google Maps Plugin 使用指南

## 概述

这是一个模仿 `remark-github-card` 的 Google 地图插件，用于在 Astro 博客的 Markdown 文件中嵌入 Google 地图。

## 主要特性

✅ **智能网络检测**：只有在能访问 Google 地图时才加载地图  
✅ **零空间占用**：无法访问时完全隐藏，不占用页面空间  
✅ **响应式设计**：iframe 宽度自动调整为 100%  
✅ **经纬度支持**：支持精确的坐标定位  
✅ **地点搜索**：支持地点名称搜索  
✅ **自定义参数**：支持自定义高度、缩放级别等

## 安装步骤

### 1. 插件文件
插件已创建在 `src/plugins/remark-google-maps.ts`

### 2. 配置 Astro
在 `astro.config.ts` 中已添加插件配置：

```typescript
import { remarkGoogleMaps } from "./src/plugins/remark-google-maps";

export default defineConfig({
  markdown: {
    remarkPlugins: [
      remarkReadingTime, 
      remarkDirective, 
      remarkGithubCard, 
      remarkGoogleMaps,  // ← 新增的 Google 地图插件
      remarkAdmonitions
    ],
  },
});
```

## 使用方法

### 基本语法

```markdown
::googlemap{参数}
```

### 参数说明

| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| `lat` | string | 条件必需* | - | 纬度坐标 |
| `lng` | string | 条件必需* | - | 经度坐标 |
| `place` | string | 条件必需* | - | 地点名称 |
| `zoom` | string | 否 | "13" | 缩放级别 (1-20) |
| `height` | string | 否 | "450" | 地图高度 (像素) |

*注意：必须提供 `lat`+`lng` 或 `place` 其中一组

### 使用示例

#### 1. 使用经纬度坐标
```markdown
::googlemap{lat="39.9042" lng="116.4074" zoom="12"}
```

#### 2. 使用地点名称
```markdown
::googlemap{place="Eiffel Tower, Paris" zoom="15"}
```

#### 3. 自定义高度
```markdown
::googlemap{lat="40.7128" lng="-74.0060" height="300"}
```

#### 4. 完整参数示例
```markdown
::googlemap{lat="35.6762" lng="139.6503" zoom="10" height="400"}
```

## 测试文件

查看 `src/content/post/draft/google-maps-test.md` 获取完整的测试示例。

## 网络检测机制

插件会自动检测 Google 地图的可访问性：

- ✅ **可访问**：正常加载地图 iframe
- ❌ **不可访问**：完全隐藏容器，不占用页面空间

这对于在网络受限地区的用户特别有用。

## 技术实现

- 基于 `remark-directive` 处理 `::googlemap{}` 语法
- 使用 `fetch` API 检测网络连通性
- 动态创建 iframe 元素
- 使用 Google 地图嵌入 URL，无需 API 密钥
- 支持现代浏览器的所有特性

## 浏览器支持

- Chrome/Edge 60+
- Firefox 55+
- Safari 11+
- 需要 JavaScript 支持

## 故障排除

### 地图不显示
1. 检查网络连接
2. 确认 Google 地图在当前地区可访问
3. 检查参数格式是否正确

### 参数错误
- 确保 `lat` 和 `lng` 同时提供，或提供 `place`
- 坐标格式：纬度 -90 到 90，经度 -180 到 180
- 缩放级别：1 到 20 之间的数字

## 示例坐标

一些常用城市的坐标供参考：

- **北京**: `lat="39.9042" lng="116.4074"`
- **上海**: `lat="31.2304" lng="121.4737"`
- **纽约**: `lat="40.7128" lng="-74.0060"`
- **伦敦**: `lat="51.5074" lng="-0.1278"`
- **东京**: `lat="35.6762" lng="139.6503"`
- **巴黎**: `lat="48.8566" lng="2.3522"`
