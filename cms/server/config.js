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

// CMS 服务端口。使用独立变量，避免通用 PORT 被开发工具注入时与 Vite 端口冲突。
export const CMS_PORT = Number(process.env.CMS_PORT) || 3001;

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
  supportedFormats: ['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.tif', '.avif'],

  // 最大文件大小 (字节)
  maxFileSize: 10 * 1024 * 1024, // 10MB

  // 是否记录处理日志
  enableLogging: true,

  // 是否在上传前检查隐私风险
  enablePrivacyCheck: true
};

// 北京时间（Asia/Shanghai）的墙上时间，避免手动加减小时导致的时区错位
function getBeijingParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  });

  const parts = Object.fromEntries(
    formatter.formatToParts(date).map((part) => [part.type, part.value])
  );

  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
}

// 获取北京时间的工具函数
export function getBeijingTime(format = 'iso') {
  const simple = getBeijingParts();

  if (format === 'iso') {
    return `${simple.replace(' ', 'T')}+08:00`;
  }

  return simple;
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
