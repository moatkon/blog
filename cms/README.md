# Blog CMS 内容管理系统

为 Moatkon Blog 开发的本地内容管理系统，直接读写 `src/content` 与 `public`，不需要数据库。

## 功能

### 写作

- 编辑 / 分屏 / 预览三种模式，预览样式接近博客正文
- Markdown 工具栏、快捷键、字数与阅读时长统计、全屏写作
- 拖拽、粘贴、选择图片上传，图片自动写入 `public/images/YYYY/MM/`
- 右键菜单之外的所有常用格式：标题、粗体、斜体、删除线、代码、引用、列表、任务列表、表格、分割线

### 文章

- 草稿 / 发布状态切换，编辑已发布文章时自动更新 `updatedDate`
- 发布日期、标签、置顶、摘要、封面图
- 本地草稿自动保存：新文章不会在输入时立刻生成文件，只有点击保存/发布才写入 `src/content`
- 文件路径重命名、复制路径、在本地博客中打开

### 笔记 / 标签 / 资源

- Notes 已恢复，支持同样的 Markdown 编辑器与发布日期
- 标签页显示每个标签被多少篇文章使用，可直接筛选相关文章
- 资源页提供图片缩略图、图片预览、复制 Markdown、上传、重命名、删除、文件夹管理
- 文章内图片通过 CMS 的 `/media` 直接读取 `public`，预览不再依赖 Astro dev server

## 技术栈

- 后端：Node.js + Express + gray-matter + multer + sharp
- 前端：React 18 + Vite + Tailwind CSS
- 数据：直接操作 Blog 项目的 Markdown 文件

## 快速开始

首次使用先安装依赖：

```bash
cd cms
npm run install:all
```

从博客根目录启动：

```bash
npm run cms
```

或在 `cms` 目录启动：

```bash
npm run dev
```

访问：

- CMS 界面：http://localhost:5173
- API：http://localhost:3001

### 单端口生产模式

```bash
npm run cms:start
```

该命令会构建前端并由 Express 直接提供页面，之后访问 http://localhost:3001 即可。

### 端口

- 前端固定使用 `5173`（Vite `strictPort`）
- API 默认使用 `3001`，可通过 `CMS_PORT` 修改：`CMS_PORT=3002 npm start`

## 目录结构

```
cms/
├── server/                 # Express API
│   ├── index.js            # 服务入口、/media 静态资源
│   ├── config.js           # 路径、时区、frontmatter 模板
│   ├── routes/             # posts / notes / tags / assets
│   └── utils/              # 文件与图片处理
├── client/                 # React 前端
│   └── src/
│       ├── components/     # 编辑器、预览、弹窗等
│       ├── pages/          # 仪表板、文章、笔记、标签、资源
│       ├── hooks/          # 自动保存
│       └── utils/          # 日期、URL 工具
└── package.json
```

## 文件组织

| 内容 | 路径 |
| --- | --- |
| 文章 | `src/content/post/YYYY/MM/DD/index.md`（同日多篇为 `1.md`、`2.md`） |
| 笔记 | `src/content/note/YYYY/MM/DD/index.md` |
| 标签 | `src/content/tag/标签名.md` |
| 图片 / 文件 | `public/任意目录` |

## Frontmatter

### 文章

```yaml
---
title: "文章标题"          # 最多 60 字符
description: "文章摘要"
publishDate: "2026-11-03 23:00:00"
draft: false
tags: ["记录", "周记"]
pinned: false
updatedDate: "2026-11-03 23:10:00"  # 编辑时自动维护
coverImage:
  src: 202511/cover.jpg               # 相对 public 的路径
  alt: "封面描述"
---
```

### 笔记

```yaml
---
title: "笔记标题"
description: ""
publishDate: "2026-11-03T23:00:00+08:00"
---
```

### 标签

```yaml
---
title: "显示名称"
description: "标签描述"
---
```

## 快捷键

| 快捷键 | 功能 |
| --- | --- |
| `⌘/Ctrl + S` | 保存 |
| `⌘/Ctrl + B` | 粗体 |
| `⌘/Ctrl + I` | 斜体 |
| `⌘/Ctrl + K` | 链接 |
| `Tab` | 插入两个空格 |

## 预览说明

- 编辑器内的 Markdown 预览由 CMS 自己渲染，图片走 `/media`，不需要启动 Astro。
- “在博客中打开”会跳转到 `http://localhost:4321` 下对应文章，需要先运行博客的 `npm run dev`。
- 仪表板左下角会显示博客开发服务器是否在线。

## API

- `GET /api/health` 健康检查
- `GET /api/blog-status` 博客开发服务器状态
- `GET/POST/PUT/DELETE /api/posts` 文章
- `PUT /api/posts/:id/rename` 重命名文章路径
- `GET/POST/PUT/DELETE /api/notes` 笔记
- `PUT /api/notes/:id/rename` 重命名笔记路径
- `GET/POST/PUT/DELETE /api/tags` 标签
- `GET /api/assets` 资源树
- `GET /api/assets/folder/*` 目录内容
- `POST /api/assets/upload` 上传文件
- `POST /api/assets/folder` 新建文件夹
- `PUT /api/assets/rename` 重命名
- `DELETE /api/assets/*` 删除
- `GET /api/assets/preview/*` 预览文件
- `GET /media/*` 直接访问 `public` 文件

## 故障排除

1. **页面打不开**：确认 `cms-api` 与 `cms-web` 都在运行，前端端口为 5173。
2. **端口被占用**：API 可用 `CMS_PORT=其他端口 npm start`；前端请释放 5173。
3. **图片预览失败**：确认 `public` 下文件存在，且 API 服务的 `/media` 可访问。
4. **保存失败**：查看 API 终端日志；确认 `src/content` 有写权限。
5. **博客打不开**：CMS 只负责内容，文章站点需要单独运行 `npm run dev`（4321）。
