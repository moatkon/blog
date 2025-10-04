import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Blog项目的根目录路径
export const BLOG_ROOT = path.resolve(__dirname, '../../');

// 内容目录路径
export const CONTENT_PATHS = {
  posts: path.join(BLOG_ROOT, 'src/content/post'),
  notes: path.join(BLOG_ROOT, 'src/content/note'),
  tags: path.join(BLOG_ROOT, 'src/content/tag'),
  assets: path.join(BLOG_ROOT, 'public')
};

// 支持的文件扩展名
export const SUPPORTED_EXTENSIONS = ['.md', '.mdx'];

// 获取北京时间的工具函数
export function getBeijingTime() {
  const now = new Date();
  // 北京时间是UTC+8
  const beijingTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
  return beijingTime.toISOString().replace('T', ' ').slice(0, 19);
}

// 默认的frontmatter模板生成函数
export function getDefaultFrontmatter(type) {
  const currentTime = getBeijingTime();

  const templates = {
    post: {
      title: '',
      description: '',
      publishDate: currentTime,
      draft: true,
      tags: [],
      pinned: false
    },
    note: {
      title: '',
      description: '',
      publishDate: currentTime
    },
    tag: {
      title: '',
      description: ''
    }
  };

  return templates[type] || {};
}
