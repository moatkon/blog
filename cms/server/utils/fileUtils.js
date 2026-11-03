import fs from 'fs-extra';
import path from 'path';
import matter from 'gray-matter';
import { SUPPORTED_EXTENSIONS } from '../config.js';

/**
 * 把用户传入的相对路径限制在 baseDir 内，越界返回 null。
 */
export function resolveWithin(baseDir, userPath = '') {
  const base = path.resolve(baseDir);
  const target = path.resolve(base, userPath);

  if (target !== base && !target.startsWith(base + path.sep)) {
    return null;
  }

  return target;
}

/**
 * 删除文件后清理空父目录，避免留下空的日期目录。
 */
export async function removeEmptyParents(filePath, baseDir) {
  const base = path.resolve(baseDir);
  let dir = path.dirname(path.resolve(filePath));

  while (dir.startsWith(base + path.sep)) {
    const entries = await fs.readdir(dir).catch(() => ['keep']);
    if (entries.length > 0) break;

    await fs.rmdir(dir);
    dir = path.dirname(dir);
  }
}

/**
 * 在目录内生成不冲突的文件路径。
 */
export async function nextAvailablePath(dir, filename) {
  const ext = path.extname(filename);
  const base = path.basename(filename, ext);

  let candidate = path.join(dir, filename);
  let index = 1;

  while (await fs.pathExists(candidate)) {
    candidate = path.join(dir, `${base}-${index}${ext}`);
    index += 1;
  }

  return candidate;
}

/**
 * 递归获取目录下所有markdown文件
 */
export async function getAllMarkdownFiles(dir) {
  const files = [];
  
  if (!await fs.pathExists(dir)) {
    return files;
  }
  
  const items = await fs.readdir(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    
    if (item.isDirectory()) {
      const subFiles = await getAllMarkdownFiles(fullPath);
      files.push(...subFiles);
    } else if (item.isFile() && SUPPORTED_EXTENSIONS.includes(path.extname(item.name))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * 读取并解析markdown文件
 */
export async function readMarkdownFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const { data: frontmatter, content: body } = matter(content);
    
    return {
      path: filePath,
      frontmatter,
      body,
      stats: await fs.stat(filePath)
    };
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return null;
  }
}

/**
 * 写入markdown文件
 */
export async function writeMarkdownFile(filePath, frontmatter, body) {
  try {
    const content = matter.stringify(body, frontmatter);
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, content, 'utf-8');
    return true;
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error);
    return false;
  }
}

/**
 * 删除文件
 */
export async function deleteFile(filePath) {
  try {
    await fs.remove(filePath);
    return true;
  } catch (error) {
    console.error(`Error deleting file ${filePath}:`, error);
    return false;
  }
}

/**
 * 生成唯一的文件路径
 */
export async function generateFilePath(baseDir, type, title, date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  let fileName = title
    .replace(/[<>:"/\\|?*]/g, '')  // 只移除文件系统不允许的字符
    .replace(/\s+/g, '-')          // 将空格替换为连字符
    .trim();

  if (!fileName) {
    fileName = `untitled-${Date.now()}`;
  }

  let filePath;
  let counter = 0;

  switch (type) {
    case 'post':
      // Posts: /YYYY/MM/DD/index.md, 然后 1.md, 2.md, 3.md...
      const postDir = path.join(baseDir, String(year), month, day);
      const indexPath = path.join(postDir, 'index.md');

      if (!await fs.pathExists(indexPath)) {
        // 如果index.md不存在，创建index.md
        filePath = indexPath;
      } else {
        // 如果index.md已存在，按数字序列创建：1.md, 2.md, 3.md...
        let number = 1;
        do {
          filePath = path.join(postDir, `${number}.md`);
          number++;
        } while (await fs.pathExists(filePath));
      }
      break;

    case 'note':
      // Notes: /YYYY/MM/DD/index.md, 然后 1.md, 2.md, 3.md...
      const noteDir = path.join(baseDir, String(year), month, day);
      const noteIndexPath = path.join(noteDir, 'index.md');

      if (!await fs.pathExists(noteIndexPath)) {
        // 如果index.md不存在，创建index.md
        filePath = noteIndexPath;
      } else {
        // 如果index.md已存在，按数字序列创建：1.md, 2.md, 3.md...
        let number = 1;
        do {
          filePath = path.join(noteDir, `${number}.md`);
          number++;
        } while (await fs.pathExists(filePath));
      }
      break;

    case 'tag':
      // 对于tag，如果文件名已存在，在文件名后加数字
      do {
        const tagFileName = counter === 0 ? `${fileName}.md` : `${fileName}-${counter}.md`;
        filePath = path.join(baseDir, tagFileName);
        counter++;
      } while (await fs.pathExists(filePath));
      break;

    default:
      do {
        const defaultFileName = counter === 0 ? `${fileName}.md` : `${fileName}-${counter}.md`;
        filePath = path.join(baseDir, defaultFileName);
        counter++;
      } while (await fs.pathExists(filePath));
      break;
  }

  return filePath;
}
