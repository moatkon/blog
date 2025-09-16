---
title: "Google Maps Plugin Test - No Network Check Version"
description: "Testing the Google Maps plugin without network check for proxy environments"
publishDate: "2025-01-16"
tags: ["test", "maps", "plugin", "proxy", "no-check"]
draft: false
---

# Google Maps Plugin Test - No Network Check Version

这个版本的 Google Maps 插件专门为代理环境和网络受限环境设计，**跳过网络检测**，直接加载地图。

## 🌐 适用场景

- 使用代理服务器的环境（如 127.0.0.1:7890）
- 网络检测失败但实际可以访问 Google Maps 的情况
- 需要更快加载速度的场景

## 🧪 测试用例

### 1. 基本坐标测试

北京天安门广场：

::googlemap{lat="39.9042" lng="116.4074" zoom="13"}

### 2. 不同城市测试

上海外滩：

::googlemap{lat="31.2304" lng="121.4737" zoom="14"}

深圳市中心：

::googlemap{lat="22.5431" lng="114.0579" zoom="12"}

广州塔：

::googlemap{lat="23.1291" lng="113.2644" zoom="15"}

### 3. 地点搜索测试

埃菲尔铁塔：

::googlemap{place="Eiffel Tower, Paris" zoom="15"}

### 4. 不同地图类型测试

卫星视图 - 东京：

::googlemap{lat="35.6762" lng="139.6503" zoom="14" maptype="satellite"}

混合视图 - 纽约：

::googlemap{lat="40.7128" lng="-74.0060" zoom="13" maptype="hybrid"}

地形视图 - 富士山：

::googlemap{lat="35.3606" lng="138.7274" zoom="12" maptype="terrain"}

### 5. 自定义高度测试

高度 300px：

::googlemap{lat="39.9042" lng="116.4074" zoom="13" height="300"}

高度 600px：

::googlemap{lat="31.2304" lng="121.4737" zoom="14" height="600"}

## 📊 与原版本的区别

| 特性 | 原版本 | 无网络检测版本 |
|------|--------|----------------|
| 网络检测 | ✅ 多端点检测 | ❌ 跳过检测 |
| 加载速度 | 较慢（需等待检测） | 更快（直接加载） |
| 代理环境兼容性 | ❌ 可能失败 | ✅ 完全兼容 |
| 错误处理 | 复杂的重试机制 | 简单直接 |
| 适用场景 | 正常网络环境 | 代理/受限环境 |

## 🔧 技术实现

无网络检测版本的关键改进：

1. **直接生成 iframe**：跳过所有网络检测步骤
2. **简化错误处理**：移除复杂的重试和回退机制
3. **更快的渲染**：减少 JavaScript 执行时间
4. **代理友好**：不依赖网络检测结果

## 💡 使用建议

- **代理环境**：推荐使用此版本
- **正常网络**：两个版本都可以使用
- **生产环境**：根据实际网络情况选择合适版本

## 🎯 测试结果

如果你能看到上面的地图正常显示，说明无网络检测版本在你的环境中工作正常！

---

*测试时间：2025-01-16*  
*插件版本：remark-google-maps-no-check v1.0*
