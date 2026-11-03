### 说明
项目基于[astro-theme-cactus](https://github.com/chrismwilliams/astro-theme-cactus) 构建

### 新增功能

#### 20261103
CMS 深度优化：分屏 Markdown 编辑器、Notes 恢复、资源缩略图、本地草稿自动保存、时区与端口修复。启动方式：根目录 `npm run cms`。

#### 20251006
使用Augment Code开发了本Blog的CMS管理服务

#### 20250831
> 以下功能100%由AI完成

- Post 添加下一篇/上一篇功能

#### 20250822
> 以下功能99%由AI完成,自己只参与了微调

- 相关内容推荐
- 添加统计页面
- 添加阅读进度
- 集成 Giscus 评论系统（基于 GitHub Discussions）

#### 20250830
- 统计页面新增Notes内容统计

### 优化
#### 20250821
- 网站配色调整,调整为Moatkon主题色


### Build
指定时区构建: TZ=Asia/Shanghai npm run build

> OG 分享图生成时会自动使用构建机上的中文字体（macOS 的 Arial Unicode，或 Linux 的 Noto Sans CJK .ttf/.otf 文件）。如果构建环境没有可读取的中文字体文件，中文标题会缺失；可在 `src/utils/og-image.ts` 的候选路径中补充部署机的字体位置。
