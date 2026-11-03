import express from 'express';
import multer from 'multer';
import path from 'path';
import os from 'os';
import fs from 'fs-extra';
import { CONTENT_PATHS, IMAGE_PROCESSING_CONFIG } from '../config.js';
import { resolveWithin, nextAvailablePath } from '../utils/fileUtils.js';
import {
  stripImageMetadata,
  isSupportedImageFormat,
  checkImagePrivacy,
  getImageInfo
} from '../utils/imageProcessor.js';

const router = express.Router();

function decodeOriginalName(name) {
  if (!name) return 'file';

  // multer 1.x 按 latin1 解码上传文件名，中文名会乱码
  if (/[^\x00-\xff]/.test(name)) return name;

  const decoded = Buffer.from(name, 'latin1').toString('utf8');
  return decoded.includes('�') ? name : decoded;
}

function sanitizeFilename(name) {
  const ext = path.extname(name);
  let base = path
    .basename(name, ext)
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  if (!base || base === '.' || base === '..') {
    base = `file-${Date.now()}`;
  }

  return `${base}${ext.toLowerCase()}`;
}

function sanitizeFolderName(name) {
  const value = String(name || '').trim();

  if (!value || value === '.' || value === '..') return null;
  if (/[<>:"/\\|?*\u0000-\u001f]/.test(value)) return null;

  return value;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, os.tmpdir()),
  filename: (req, file, cb) => {
    const ext = path.extname(decodeOriginalName(file.originalname)).toLowerCase();
    cb(null, `cms-${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: IMAGE_PROCESSING_CONFIG.maxFileSize
  },
  fileFilter: (req, file, cb) => {
    cb(null, true);
  }
});

// 上传文件
router.post('/upload', (req, res) => {
  upload.single('file')(req, res, async (error) => {
    if (error) {
      if (req.file?.path) await fs.remove(req.file.path);
      const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 500;
      return res.status(status).json({
        error:
          error.code === 'LIMIT_FILE_SIZE'
            ? `文件超过 ${IMAGE_PROCESSING_CONFIG.maxFileSize / 1024 / 1024}MB 限制`
            : 'Failed to upload file'
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
      const folder = String(req.body.folder || '').trim();
      const targetDir = resolveWithin(CONTENT_PATHS.assets, folder);

      if (!targetDir) {
        await fs.remove(req.file.path);
        return res.status(403).json({ error: 'Access denied' });
      }

      await fs.ensureDir(targetDir);

      const originalName = sanitizeFilename(decodeOriginalName(req.file.originalname));
      const targetPath = await nextAvailablePath(targetDir, originalName);

      await fs.move(req.file.path, targetPath);
      req.file.path = targetPath;
      req.file.destination = targetDir;
      req.file.filename = path.basename(targetPath);

      let processingResult = null;
      let privacyCheck = null;
      const isImage = req.file.mimetype.startsWith('image/');

      if (isImage && isSupportedImageFormat(targetPath)) {
        if (IMAGE_PROCESSING_CONFIG.enablePrivacyCheck) {
          privacyCheck = await checkImagePrivacy(targetPath);
          if (IMAGE_PROCESSING_CONFIG.enableLogging && privacyCheck.hasSensitiveData) {
            console.warn(`Privacy issues detected in uploaded image ${req.file.filename}:`, privacyCheck.issues);
          }
        }

        if (IMAGE_PROCESSING_CONFIG.enableMetadataStripping) {
          processingResult = await stripImageMetadata(targetPath, null, {
            quality: IMAGE_PROCESSING_CONFIG.quality,
            progressive: IMAGE_PROCESSING_CONFIG.progressive,
            optimizeForWeb: IMAGE_PROCESSING_CONFIG.optimizeForWeb
          });

          if (!processingResult.success) {
            console.error('Failed to process image metadata:', processingResult.error);
          } else {
            const newStats = await fs.stat(targetPath);
            req.file.size = newStats.size;
          }
        }
      }

      const relativePath = path.relative(CONTENT_PATHS.assets, targetPath).replace(/\\/g, '/');

      const responseData = {
        message: 'File uploaded successfully',
        file: {
          name: req.file.filename,
          path: relativePath,
          size: req.file.size,
          mimetype: req.file.mimetype
        }
      };

      if (isImage && processingResult) {
        responseData.imageProcessing = {
          metadataStripped: processingResult.success && processingResult.exifRemoved.exifRemoved,
          compressionRatio: processingResult.success ? processingResult.compressionRatio : null,
          originalSize: processingResult.success ? processingResult.originalSize : null,
          processedSize: processingResult.success ? processingResult.processedSize : null
        };
      }

      if (privacyCheck) {
        responseData.privacyCheck = {
          hadSensitiveData: privacyCheck.hasSensitiveData,
          issuesFound: privacyCheck.issues.length,
          issues: privacyCheck.issues
        };
      }

      res.json(responseData);
    } catch (uploadError) {
      console.error('Error processing uploaded file:', uploadError);
      if (req.file?.path) await fs.remove(req.file.path);
      res.status(500).json({ error: 'Failed to process uploaded file' });
    }
  });
});

// 递归获取目录结构
async function getDirectoryStructure(dir, basePath = '') {
  const items = [];

  if (!(await fs.pathExists(dir))) {
    return items;
  }

  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

    const fullPath = path.join(dir, entry.name);
    const relativePath = path.join(basePath, entry.name);

    if (entry.isDirectory()) {
      const children = await getDirectoryStructure(fullPath, relativePath);
      items.push({
        name: entry.name,
        type: 'directory',
        path: relativePath.split(path.sep).join('/'),
        children
      });
    } else {
      const stats = await fs.stat(fullPath);
      items.push({
        name: entry.name,
        type: 'file',
        path: relativePath.split(path.sep).join('/'),
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
    const fullPath = resolveWithin(CONTENT_PATHS.assets, folderPath);

    if (!fullPath) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const structure = await getDirectoryStructure(fullPath, folderPath);
    res.json(structure);
  } catch (error) {
    console.error('Error fetching folder contents:', error);
    res.status(500).json({ error: 'Failed to fetch folder contents' });
  }
});

// 检查图片隐私信息
router.get('/privacy-check/:path(*)', async (req, res) => {
  try {
    const filePath = req.params.path;
    const fullPath = resolveWithin(CONTENT_PATHS.assets, filePath);

    if (!fullPath) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (!(await fs.pathExists(fullPath))) {
      return res.status(404).json({ error: 'File not found' });
    }
    if (!isSupportedImageFormat(fullPath)) {
      return res.status(400).json({ error: 'File is not a supported image format' });
    }

    const privacyCheck = await checkImagePrivacy(fullPath);
    const imageInfo = await getImageInfo(fullPath);

    res.json({
      file: filePath,
      imageInfo,
      privacyCheck
    });
  } catch (error) {
    console.error('Error checking image privacy:', error);
    res.status(500).json({ error: 'Failed to check image privacy' });
  }
});

// 手动处理图片元信息
router.post('/strip-metadata/:path(*)', async (req, res) => {
  try {
    const filePath = req.params.path;
    const fullPath = resolveWithin(CONTENT_PATHS.assets, filePath);

    if (!fullPath) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (!(await fs.pathExists(fullPath))) {
      return res.status(404).json({ error: 'File not found' });
    }
    if (!isSupportedImageFormat(fullPath)) {
      return res.status(400).json({ error: 'File is not a supported image format' });
    }

    const options = {
      quality: req.body.quality || IMAGE_PROCESSING_CONFIG.quality,
      progressive:
        req.body.progressive !== undefined
          ? req.body.progressive
          : IMAGE_PROCESSING_CONFIG.progressive,
      optimizeForWeb:
        req.body.optimizeForWeb !== undefined
          ? req.body.optimizeForWeb
          : IMAGE_PROCESSING_CONFIG.optimizeForWeb
    };

    const result = await stripImageMetadata(fullPath, null, options);

    if (result.success) {
      res.json({
        message: 'Image metadata stripped successfully',
        result
      });
    } else {
      res.status(500).json({
        error: 'Failed to strip image metadata',
        details: result.error
      });
    }
  } catch (error) {
    console.error('Error stripping image metadata:', error);
    res.status(500).json({ error: 'Failed to strip image metadata' });
  }
});

// 创建文件夹
router.post('/folder', async (req, res) => {
  try {
    const { name, parent = '' } = req.body;
    const folderName = sanitizeFolderName(name);

    if (!folderName) {
      return res.status(400).json({ error: '文件夹名称不合法' });
    }

    const parentDir = resolveWithin(CONTENT_PATHS.assets, parent);
    if (!parentDir) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const folderPath = path.join(parentDir, folderName);
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

    const trimmedName = String(newName).trim();
    if (!trimmedName || trimmedName === '.' || trimmedName === '..' || /[<>:"/\\|?*\u0000-\u001f]/.test(trimmedName)) {
      return res.status(400).json({ error: '文件名不合法' });
    }

    const oldFullPath = resolveWithin(CONTENT_PATHS.assets, oldPath);

    if (!oldFullPath || oldFullPath === CONTENT_PATHS.assets) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (!(await fs.pathExists(oldFullPath))) {
      return res.status(404).json({ error: '原文件不存在' });
    }

    const newFullPath = path.join(path.dirname(oldFullPath), trimmedName);

    if (!resolveWithin(CONTENT_PATHS.assets, path.relative(CONTENT_PATHS.assets, newFullPath))) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (await fs.pathExists(newFullPath)) {
      return res.status(409).json({ error: '目标文件名已存在' });
    }

    await fs.move(oldFullPath, newFullPath);

    const stats = await fs.stat(newFullPath);
    const newPath = path.relative(CONTENT_PATHS.assets, newFullPath).replace(/\\/g, '/');

    res.json({
      message: '重命名成功',
      newPath,
      name: trimmedName,
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
    const fullPath = resolveWithin(CONTENT_PATHS.assets, itemPath);

    if (!fullPath || fullPath === CONTENT_PATHS.assets) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (!(await fs.pathExists(fullPath))) {
      return res.status(404).json({ error: 'File not found' });
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
    const fullPath = resolveWithin(CONTENT_PATHS.assets, filePath);

    if (!fullPath) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (!(await fs.pathExists(fullPath))) {
      return res.status(404).json({ error: 'File not found' });
    }

    const stats = await fs.stat(fullPath);
    if (stats.isDirectory()) {
      return res.status(400).json({ error: 'Cannot preview directory' });
    }

    const ext = path.extname(fullPath).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
      '.avif': 'image/avif',
      '.bmp': 'image/bmp',
      '.txt': 'text/plain; charset=utf-8',
      '.md': 'text/markdown; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.pdf': 'application/pdf',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.mp3': 'audio/mpeg',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2'
    };

    res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    const fileStream = fs.createReadStream(fullPath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error previewing file:', error);
    res.status(500).json({ error: 'Failed to preview file' });
  }
});

export default router;
