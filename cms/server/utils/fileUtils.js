import fs from 'fs-extra';
import path from 'path';
import matter from 'gray-matter';
import { SUPPORTED_EXTENSIONS } from '../config.js';

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
 * 生成文件路径
 */
export function generateFilePath(baseDir, type, title, date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  let fileName = title.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim();
  
  if (!fileName) {
    fileName = `untitled-${Date.now()}`;
  }
  
  switch (type) {
    case 'post':
      return path.join(baseDir, String(year), month, day, 'index.md');
    case 'note':
      return path.join(baseDir, String(year), `${month}-${day}.md`);
    case 'tag':
      return path.join(baseDir, `${fileName}.md`);
    default:
      return path.join(baseDir, `${fileName}.md`);
  }
}
