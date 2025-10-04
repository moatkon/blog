import express from 'express';
import path from 'path';
import { CONTENT_PATHS, getDefaultFrontmatter, getBeijingTime } from '../config.js';
import { 
  getAllMarkdownFiles, 
  readMarkdownFile, 
  writeMarkdownFile, 
  deleteFile, 
  generateFilePath 
} from '../utils/fileUtils.js';

const router = express.Router();

// 获取所有tags
router.get('/', async (req, res) => {
  try {
    const files = await getAllMarkdownFiles(CONTENT_PATHS.tags);
    const tags = [];
    
    for (const file of files) {
      const tag = await readMarkdownFile(file);
      if (tag) {
        const relativePath = path.relative(CONTENT_PATHS.tags, file);
        const tagName = path.basename(relativePath, path.extname(relativePath));
        tags.push({
          id: relativePath.replace(/\\/g, '/'),
          name: tagName,
          ...tag.frontmatter,
          body: tag.body,
          filePath: file,
          createdAt: tag.stats.birthtime,
          modifiedAt: tag.stats.mtime
        });
      }
    }
    
    // 按名称排序
    tags.sort((a, b) => a.name.localeCompare(b.name));
    
    res.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// 获取单个tag
router.get('/:id(*)', async (req, res) => {
  try {
    const filePath = path.join(CONTENT_PATHS.tags, req.params.id);
    const tag = await readMarkdownFile(filePath);
    
    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }
    
    const tagName = path.basename(req.params.id, path.extname(req.params.id));
    
    res.json({
      id: req.params.id,
      name: tagName,
      ...tag.frontmatter,
      body: tag.body,
      filePath
    });
  } catch (error) {
    console.error('Error fetching tag:', error);
    res.status(500).json({ error: 'Failed to fetch tag' });
  }
});

// 创建新tag
router.post('/', async (req, res) => {
  try {
    const { name, title, description, body } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Tag name is required' });
    }

    // 检查是否已存在同名的tag
    const existingTags = await getAllMarkdownFiles(CONTENT_PATHS.tags);
    const tagExists = existingTags.some(file => {
      const tagName = path.basename(file, path.extname(file));
      return tagName.toLowerCase() === name.toLowerCase();
    });

    if (tagExists) {
      return res.status(409).json({ error: `标签 "${name}" 已存在，不能创建重复的标签` });
    }

    const frontmatter = {
      ...getDefaultFrontmatter('tag'),
      title: title || name,
      description: description || ''
    };

    const filePath = await generateFilePath(CONTENT_PATHS.tags, 'tag', name);
    const success = await writeMarkdownFile(filePath, frontmatter, body || '');

    if (success) {
      const relativePath = path.relative(CONTENT_PATHS.tags, filePath);
      res.json({
        id: relativePath.replace(/\\/g, '/'),
        message: 'Tag created successfully',
        filePath
      });
    } else {
      res.status(500).json({ error: 'Failed to create tag' });
    }
  } catch (error) {
    console.error('Error creating tag:', error);
    res.status(500).json({ error: 'Failed to create tag' });
  }
});

// 更新tag
router.put('/:id(*)', async (req, res) => {
  try {
    const filePath = path.join(CONTENT_PATHS.tags, req.params.id);
    const existingTag = await readMarkdownFile(filePath);
    
    if (!existingTag) {
      return res.status(404).json({ error: 'Tag not found' });
    }
    
    const { title, description, body } = req.body;
    
    const updatedFrontmatter = {
      ...existingTag.frontmatter,
      title: title !== undefined ? title : existingTag.frontmatter.title,
      description: description !== undefined ? description : existingTag.frontmatter.description
    };
    
    const success = await writeMarkdownFile(
      filePath, 
      updatedFrontmatter, 
      body !== undefined ? body : existingTag.body
    );
    
    if (success) {
      res.json({ message: 'Tag updated successfully' });
    } else {
      res.status(500).json({ error: 'Failed to update tag' });
    }
  } catch (error) {
    console.error('Error updating tag:', error);
    res.status(500).json({ error: 'Failed to update tag' });
  }
});

// 删除tag
router.delete('/:id(*)', async (req, res) => {
  try {
    const filePath = path.join(CONTENT_PATHS.tags, req.params.id);
    const success = await deleteFile(filePath);
    
    if (success) {
      res.json({ message: 'Tag deleted successfully' });
    } else {
      res.status(500).json({ error: 'Failed to delete tag' });
    }
  } catch (error) {
    console.error('Error deleting tag:', error);
    res.status(500).json({ error: 'Failed to delete tag' });
  }
});

export default router;
