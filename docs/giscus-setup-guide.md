# Giscus 评论系统设置指南

## 概述

Giscus 是一个基于 GitHub Discussions 的评论系统，它将你的博客评论存储在 GitHub 仓库的 Discussions 中。这个指南将帮助你完成完整的设置过程。

## 前置要求

- 一个公开的 GitHub 仓库
- 仓库必须启用 Discussions 功能
- 安装 Giscus GitHub App

## 详细设置步骤

### 1. 启用 GitHub Discussions

1. 进入你的 GitHub 仓库
2. 点击 **Settings** 标签
3. 滚动到 **Features** 部分
4. 勾选 **Discussions** 复选框
5. 点击 **Set up discussions** 按钮

### 2. 创建讨论分类（推荐）

1. 进入仓库的 **Discussions** 标签
2. 点击右侧的 **Categories** 
3. 点击 **New category**
4. 创建一个名为 "Comments" 的分类
5. 选择 **Announcement** 类型（这样只有维护者可以创建新讨论，但任何人都可以评论）

### 3. 安装 Giscus GitHub App

1. 访问 [https://github.com/apps/giscus](https://github.com/apps/giscus)
2. 点击 **Install** 按钮
3. 选择要安装的仓库（可以选择所有仓库或特定仓库）
4. 点击 **Install** 完成安装

### 4. 获取配置参数

1. 访问 [https://giscus.app/zh-CN](https://giscus.app/zh-CN)
2. 在 **仓库** 部分输入你的仓库信息：`用户名/仓库名`
3. 在 **页面 ↔️ discussion 映射关系** 部分选择 `pathname`
4. 在 **Discussion 分类** 部分选择你创建的 "Comments" 分类
5. 在 **特性** 部分：
   - 勾选 "启用反应"
   - 选择 "评论框在评论上方"
6. 在 **主题** 部分选择 "preferred_color_scheme"
7. 复制生成的配置参数

### 5. 更新博客配置

编辑 `src/site.config.ts` 文件，找到 `giscusConfig` 对象并更新：

```typescript
export const giscusConfig: GiscusConfig = {
  // 替换为你的仓库信息
  repo: "your-username/your-repo",
  repoId: "R_kgDOH...", // 从 giscus.app 复制
  category: "Comments",
  categoryId: "DIC_kwDOH...", // 从 giscus.app 复制
  
  // 以下参数通常不需要修改
  mapping: "pathname",
  strict: "0",
  reactionsEnabled: "1",
  emitMetadata: "0",
  inputPosition: "bottom",
  theme: "preferred_color_scheme",
  lang: "zh-CN",
  loading: "lazy"
};
```

## 配置参数说明

| 参数 | 说明 | 示例值 |
|------|------|--------|
| `repo` | GitHub 仓库 | `"username/repo-name"` |
| `repoId` | 仓库 ID | `"R_kgDOH..."` |
| `category` | 讨论分类名称 | `"Comments"` |
| `categoryId` | 分类 ID | `"DIC_kwDOH..."` |
| `mapping` | 页面映射方式 | `"pathname"` |
| `strict` | 严格标题匹配 | `"0"` (关闭) |
| `reactionsEnabled` | 启用反应 | `"1"` (开启) |
| `emitMetadata` | 发送元数据 | `"0"` (关闭) |
| `inputPosition` | 输入框位置 | `"bottom"` |
| `theme` | 主题 | `"preferred_color_scheme"` |
| `lang` | 语言 | `"zh-CN"` |
| `loading` | 加载方式 | `"lazy"` |

## 测试配置

1. 启动开发服务器：`npm run dev`
2. 访问任意博客文章页面
3. 滚动到页面底部，应该能看到 Giscus 评论框
4. 尝试切换深色/浅色主题，评论框主题应该同步切换

## 常见问题

### Q: 评论框不显示
A: 检查以下几点：
- 仓库是否为公开仓库
- 是否启用了 Discussions
- 是否安装了 Giscus GitHub App
- 配置参数是否正确

### Q: 主题不同步
A: 确保你的博客使用的是标准的主题切换机制，Giscus 组件会自动监听主题变化事件。

### Q: 评论不显示
A: 检查浏览器控制台是否有错误信息，确保网络连接正常。

### Q: 如何管理评论
A: 所有评论都存储在 GitHub Discussions 中，你可以在仓库的 Discussions 页面管理评论。

## 高级配置

### 自定义样式

你可以通过修改 `src/components/blog/Giscus.astro` 中的 CSS 来自定义评论区域的样式：

```css
.giscus-container {
  /* 自定义样式 */
  border-radius: 8px;
  padding: 1rem;
  background: var(--color-bg-secondary);
}
```

### 禁用评论

如果你想在某些文章中禁用评论，可以在文章的 frontmatter 中添加：

```yaml
---
title: "文章标题"
disableComments: true
---
```

然后修改 `BlogPost.astro` 布局文件，添加条件渲染：

```astro
{!post.data.disableComments && <Giscus {...giscusConfig} />}
```

## 支持

如果遇到问题，可以：
1. 查看 [Giscus 官方文档](https://giscus.app/zh-CN)
2. 在 [Giscus GitHub 仓库](https://github.com/giscus/giscus) 提交 Issue
3. 检查浏览器开发者工具的控制台错误信息
