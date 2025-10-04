# Blog CMS 内容管理系统

这是一个为你的Blog项目开发的内容管理系统(CMS)，可以方便地管理Posts、Notes、Tags和静态资源。

## 功能特性

### 📝 Posts管理
- 创建、编辑、删除博客文章
- 草稿状态管理
- 自动更新updatedDate字段
- 标签管理和分类
- 文章置顶功能
- 实时Markdown预览

### 📓 Notes管理
- 创建、编辑、删除笔记
- 简洁的笔记界面
- Markdown支持
- 按时间排序

### 🏷️ Tags管理
- 创建、编辑、删除标签
- 标签描述和详细内容
- 可视化标签管理

### 📁 静态资源管理
- 文件上传（拖拽支持）
- 文件夹管理
- 图片预览
- 文件删除和组织

## 技术栈

### 后端
- Node.js + Express
- 文件系统操作
- Gray-matter (Frontmatter解析)
- Multer (文件上传)

### 前端
- React 18
- React Router
- Tailwind CSS
- Lucide React (图标)
- React Hot Toast (通知)
- React Dropzone (文件上传)
- React Markdown (预览)

## 安装和使用

### 1. 安装依赖

```bash
# 安装根目录依赖
cd cms
npm install

# 安装前端依赖
cd client
npm install
```

### 2. 启动开发服务器

```bash
# 在cms目录下运行
npm run dev
```

这会同时启动：
- 后端服务器 (端口 3001)
- 前端开发服务器 (端口 5173)

### 3. 访问CMS

打开浏览器访问 `http://localhost:5173`

## 目录结构

```
cms/
├── server/                 # 后端代码
│   ├── index.js           # 服务器入口
│   ├── config.js          # 配置文件
│   ├── routes/            # API路由
│   │   ├── posts.js       # Posts API
│   │   ├── notes.js       # Notes API
│   │   ├── tags.js        # Tags API
│   │   └── assets.js      # 静态资源API
│   └── utils/             # 工具函数
│       └── fileUtils.js   # 文件操作工具
├── client/                # 前端代码
│   ├── src/
│   │   ├── components/    # React组件
│   │   ├── pages/         # 页面组件
│   │   ├── services/      # API服务
│   │   └── ...
│   └── ...
└── package.json
```

## API接口

### Posts API
- `GET /api/posts` - 获取所有posts
- `GET /api/posts/:id` - 获取单个post
- `POST /api/posts` - 创建post
- `PUT /api/posts/:id` - 更新post
- `DELETE /api/posts/:id` - 删除post

### Notes API
- `GET /api/notes` - 获取所有notes
- `GET /api/notes/:id` - 获取单个note
- `POST /api/notes` - 创建note
- `PUT /api/notes/:id` - 更新note
- `DELETE /api/notes/:id` - 删除note

### Tags API
- `GET /api/tags` - 获取所有tags
- `GET /api/tags/:id` - 获取单个tag
- `POST /api/tags` - 创建tag
- `PUT /api/tags/:id` - 更新tag
- `DELETE /api/tags/:id` - 删除tag

### Assets API
- `GET /api/assets` - 获取资源列表
- `POST /api/assets/upload` - 上传文件
- `POST /api/assets/folder` - 创建文件夹
- `DELETE /api/assets/:path` - 删除文件/文件夹
- `GET /api/assets/preview/:path` - 预览文件

## 文件组织

### Posts
- 路径：`src/content/post/YYYY/MM/DD/index.md`
- 支持草稿功能
- 自动处理updatedDate字段

### Notes
- 路径：`src/content/note/YYYY/MM-DD.md`
- 简单的日期组织结构

### Tags
- 路径：`src/content/tag/标签名.md`
- 扁平化组织结构

### 静态资源
- 路径：`public/`
- 支持任意目录结构
- 支持各种文件类型

## 开发说明

### 添加新功能
1. 在`server/routes/`中添加新的API路由
2. 在`client/src/pages/`中添加新的页面组件
3. 在`client/src/services/api.js`中添加API调用
4. 更新路由配置

### 自定义配置
编辑`server/config.js`文件来修改：
- Blog项目路径
- 内容目录路径
- 默认frontmatter模板

## 注意事项

1. 确保CMS目录与Blog项目目录的相对位置正确
2. 编辑内容时会直接修改Blog项目的源文件
3. 建议在使用前备份重要内容
4. Posts的draft状态会影响Blog的显示

## 故障排除

### 常见问题

1. **无法加载内容**
   - 检查Blog项目路径配置
   - 确保有读写权限

2. **文件上传失败**
   - 检查public目录权限
   - 确认文件大小限制

3. **预览不显示**
   - 检查markdown语法
   - 确认frontmatter格式

## 贡献

欢迎提交Issue和Pull Request来改进这个CMS系统。
