# Google Maps Plugin for Astro

这是一个模仿 `remark-github-card` 的 Google 地图插件，用于在 Markdown 文件中嵌入 Google 地图。

## 特性

- ✅ 支持经纬度坐标
- ✅ 支持地点名称搜索
- ✅ 网络检测：只有在能访问 Google 地图时才加载
- ✅ 无网络访问时不占用页面空间
- ✅ iframe 宽度自动调整为 100%
- ✅ 支持自定义高度和缩放级别

## 安装和配置

1. 插件文件已创建在 `src/plugins/remark-google-maps.ts`

2. 在 `astro.config.ts` 中注册插件：

```typescript
import { remarkGoogleMaps } from "./src/plugins/remark-google-maps";

export default defineConfig({
  markdown: {
    remarkPlugins: [
      // ... 其他插件
      remarkGoogleMaps,
      // ... 其他插件
    ],
  },
});
```

## 使用方法

### 使用经纬度坐标

```markdown
::googlemap{lat="39.9042" lng="116.4074" zoom="12"}
```

### 使用地点名称

```markdown
::googlemap{place="Eiffel Tower, Paris" zoom="15"}
```

### 自定义高度

```markdown
::googlemap{lat="40.7128" lng="-74.0060" zoom="11" height="300"}
```

## 参数说明

| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| `lat` | string | 是* | - | 纬度坐标 |
| `lng` | string | 是* | - | 经度坐标 |
| `place` | string | 是* | - | 地点名称 |
| `zoom` | string | 否 | "13" | 缩放级别 (1-20) |
| `height` | string | 否 | "450" | 地图高度 (像素) |
| `width` | string | 否 | "100%" | 地图宽度 |

*注意：`lat`+`lng` 或 `place` 必须提供其中一组

## 网络检测机制

插件会自动检测是否能访问 Google 地图：

1. 如果能访问，正常加载地图
2. 如果不能访问（如网络限制），地图容器会完全隐藏，不占用页面空间

## 示例

查看 `src/content/post/draft/google-maps-test.md` 文件中的完整示例。

## 技术实现

- 基于 `remark-directive` 处理 `::googlemap{}` 语法
- 使用 `fetch` API 检测网络连通性
- 动态创建 iframe 元素加载 Google 地图
- 使用 Google 地图的嵌入 URL 格式，无需 API 密钥

## 浏览器兼容性

- 支持所有现代浏览器
- 需要 JavaScript 支持
- 使用 `fetch` API 和 `AbortController`
