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

// 图片处理配置
export const IMAGE_PROCESSING_CONFIG = {
  // 是否启用图片元信息抹除
  enableMetadataStripping: true,

  // 是否启用图片优化
  enableOptimization: true,

  // 图片质量设置 (1-100)
  quality: 85,

  // 是否使用渐进式JPEG
  progressive: true,

  // 是否针对Web优化
  optimizeForWeb: true,

  // 支持的图片格式
  supportedFormats: ['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.tif'],

  // 最大文件大小 (字节)
  maxFileSize: 10 * 1024 * 1024, // 10MB

  // 是否记录处理日志
  enableLogging: true,

  // 是否在上传前检查隐私风险
  enablePrivacyCheck: true
};

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
