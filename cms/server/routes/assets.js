import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import { CONTENT_PATHS } from '../config.js';

const router = express.Router();

// 配置multer用于文件上传
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(CONTENT_PATHS.assets, req.body.folder || '');
    await fs.ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // 保持原文件名，如果有重复则添加时间戳
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}${ext}`);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB限制
  }
});

// 递归获取目录结构
async function getDirectoryStructure(dir, basePath = '') {
  const items = [];
  
  if (!await fs.pathExists(dir)) {
    return items;
  }
  
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.join(basePath, entry.name);
    
    if (entry.isDirectory()) {
      const children = await getDirectoryStructure(fullPath, relativePath);
      items.push({
        name: entry.name,
        type: 'directory',
        path: relativePath,
        children
      });
    } else {
      const stats = await fs.stat(fullPath);
      items.push({
        name: entry.name,
        type: 'file',
        path: relativePath,
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        ext: path.extname(entry.name).toLowerCase()
      });
    }
  }
  
  return items.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'directory' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}

// 获取资源列表
router.get('/', async (req, res) => {
  try {
    const structure = await getDirectoryStructure(CONTENT_PATHS.assets);
    res.json(structure);
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ error: 'Failed to fetch assets' });
  }
});

// 获取特定目录的内容
router.get('/folder/*', async (req, res) => {
  try {
    const folderPath = req.params[0];
    const fullPath = path.join(CONTENT_PATHS.assets, folderPath);
    
    // 安全检查，确保路径在assets目录内
    if (!fullPath.startsWith(CONTENT_PATHS.assets)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const structure = await getDirectoryStructure(fullPath, folderPath);
    res.json(structure);
  } catch (error) {
    console.error('Error fetching folder contents:', error);
    res.status(500).json({ error: 'Failed to fetch folder contents' });
  }
});

// 上传文件
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const relativePath = path.relative(CONTENT_PATHS.assets, req.file.path);
    
    res.json({
      message: 'File uploaded successfully',
      file: {
        name: req.file.filename,
        path: relativePath.replace(/\\/g, '/'),
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// 创建文件夹
router.post('/folder', async (req, res) => {
  try {
    const { name, parent = '' } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Folder name is required' });
    }
    
    const folderPath = path.join(CONTENT_PATHS.assets, parent, name);
    
    // 安全检查
    if (!folderPath.startsWith(CONTENT_PATHS.assets)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await fs.ensureDir(folderPath);
    
    res.json({ 
      message: 'Folder created successfully',
      path: path.relative(CONTENT_PATHS.assets, folderPath).replace(/\\/g, '/')
    });
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

// 重命名文件或文件夹
router.put('/rename', async (req, res) => {
  try {
    const { oldPath, newName } = req.body;

    if (!oldPath || !newName) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    const oldFullPath = path.join(CONTENT_PATHS.assets, oldPath);
    const parentDir = path.dirname(oldFullPath);
    const newFullPath = path.join(parentDir, newName);

    // 安全检查
    if (!oldFullPath.startsWith(CONTENT_PATHS.assets) || !newFullPath.startsWith(CONTENT_PATHS.assets)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // 检查原文件是否存在
    if (!await fs.pathExists(oldFullPath)) {
      return res.status(404).json({ error: '原文件不存在' });
    }

    // 检查新文件名是否已存在
    if (await fs.pathExists(newFullPath)) {
      return res.status(409).json({ error: '目标文件名已存在' });
    }

    // 验证文件名（不能包含特殊字符）
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(newName)) {
      return res.status(400).json({ error: '文件名包含无效字符' });
    }

    // 执行重命名
    await fs.move(oldFullPath, newFullPath);

    // 返回新的文件信息
    const stats = await fs.stat(newFullPath);
    const newPath = path.relative(CONTENT_PATHS.assets, newFullPath).replace(/\\/g, '/');

    res.json({
      message: '重命名成功',
      newPath: newPath,
      name: newName,
      type: stats.isDirectory() ? 'directory' : 'file',
      size: stats.isDirectory() ? undefined : stats.size,
      modifiedAt: stats.mtime.toISOString()
    });
  } catch (error) {
    console.error('Rename error:', error);
    res.status(500).json({ error: '重命名失败' });
  }
});

// 删除文件或文件夹
router.delete('/*', async (req, res) => {
  try {
    const itemPath = req.params[0];
    const fullPath = path.join(CONTENT_PATHS.assets, itemPath);
    
    // 安全检查
    if (!fullPath.startsWith(CONTENT_PATHS.assets)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await fs.remove(fullPath);
    
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// 获取文件内容（用于预览）
router.get('/preview/*', async (req, res) => {
  try {
    const filePath = req.params[0];
    const fullPath = path.join(CONTENT_PATHS.assets, filePath);
    
    // 安全检查
    if (!fullPath.startsWith(CONTENT_PATHS.assets)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (!await fs.pathExists(fullPath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const stats = await fs.stat(fullPath);
    if (stats.isDirectory()) {
      return res.status(400).json({ error: 'Cannot preview directory' });
    }
    
    // 设置适当的Content-Type
    const ext = path.extname(fullPath).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
      '.txt': 'text/plain',
      '.md': 'text/markdown',
      '.json': 'application/json'
    };
    
    const mimeType = mimeTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', mimeType);
    
    const fileStream = fs.createReadStream(fullPath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error previewing file:', error);
    res.status(500).json({ error: 'Failed to preview file' });
  }
});

export default router;
