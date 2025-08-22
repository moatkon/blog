
## Giscus 评论系统配置

### 配置步骤

1. **启用 GitHub Discussions**
   - 在你的 GitHub 仓库中，进入 Settings > General
   - 在 Features 部分勾选 "Discussions"

2. **安装 Giscus GitHub App**
   - 访问 [Giscus GitHub App](https://github.com/apps/giscus)
   - 点击 "Install" 并选择你的仓库

3. **获取配置参数**
   - 访问 [giscus.app](https://giscus.app/zh-CN)
   - 输入你的仓库信息
   - 选择讨论分类（建议创建专门的 "Comments" 分类）
   - 复制生成的配置参数

4. **更新配置文件**
   - 编辑 `src/site.config.ts` 中的 `giscusConfig` 对象
   - 替换以下参数：
     ```typescript
     export const giscusConfig: GiscusConfig = {
       repo: "your-username/your-repo",           // 你的仓库
       repoId: "your-repo-id",                    // 仓库 ID
       category: "Comments",                      // 讨论分类名称
       categoryId: "your-category-id",            // 分类 ID
       // 其他参数保持默认即可
     };
     ```

### 功能特性

- ✅ **主题同步**：自动与博客的深色/浅色主题保持同步
- ✅ **响应式设计**：在移动设备上完美显示
- ✅ **多语言支持**：默认使用中文界面
- ✅ **GitHub 集成**：使用 GitHub 账号登录和评论
- ✅ **Markdown 支持**：支持 Markdown 格式的评论
- ✅ **反应功能**：支持点赞等反应
- ✅ **邮件通知**：GitHub 会发送评论通知邮件

### 注意事项

- 评论数据存储在 GitHub Discussions 中，完全由 GitHub 管理
- 用户需要 GitHub 账号才能评论
- 评论会在对应的 GitHub Discussion 中显示
- 可以在 GitHub 仓库的 Discussions 页面管理所有评论