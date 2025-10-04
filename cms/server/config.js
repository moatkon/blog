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

// 默认的frontmatter模板
export const DEFAULT_FRONTMATTER = {
  post: {
    title: '',
    description: '',
    publishDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
    draft: true,
    tags: [],
    pinned: false
  },
  note: {
    title: '',
    description: '',
    publishDate: new Date().toISOString()
  },
  tag: {
    title: '',
    description: ''
  }
};
