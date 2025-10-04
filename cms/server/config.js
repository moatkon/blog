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
export function getBeijingTime(format = 'iso') {
  const now = new Date();
  // 北京时间是UTC+8
  const beijingTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));

  if (format === 'iso') {
    // 返回ISO 8601格式，带时区偏移量
    return beijingTime.toISOString().replace('Z', '+08:00');
  } else if (format === 'simple') {
    // 返回简单格式，用于post
    return beijingTime.toISOString().replace('T', ' ').slice(0, 19);
  }

  return beijingTime.toISOString();
}

// 默认的frontmatter模板生成函数
export function getDefaultFrontmatter(type) {
  const templates = {
    post: {
      title: '',
      description: '',
      publishDate: getBeijingTime('simple'), // Post使用简单格式
      draft: true,
      tags: [],
      pinned: false
    },
    note: {
      title: '',
      description: '',
      publishDate: getBeijingTime('iso') // Note使用ISO格式
    },
    tag: {
      title: '',
      description: ''
    }
  };

  return templates[type] || {};
}
