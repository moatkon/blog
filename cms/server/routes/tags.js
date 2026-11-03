import express from 'express';
import path from 'path';
import fs from 'fs-extra';
import { CONTENT_PATHS, getDefaultFrontmatter } from '../config.js';
import {
  getAllMarkdownFiles,
  readMarkdownFile,
  writeMarkdownFile,
  deleteFile,
  generateFilePath,
  resolveWithin,
  removeEmptyParents
} from '../utils/fileUtils.js';

const router = express.Router();

function normalizeTagName(name) {
  const value = String(name || '').trim();

  if (!value) return null;
  if (value.length > 50) return null;
  if (/[<>:"/\\|?*\u0000-\u001f]/.test(value)) return null;
  if (value === '.' || value === '..') return null;

  return value;
}

// 获取所有tags
router.get('/', async (req, res) => {
  try {
    const files = await getAllMarkdownFiles(CONTENT_PATHS.tags);
    const tags = [];

    for (const file of files) {
      const tag = await readMarkdownFile(file);
      if (!tag) continue;

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
    const filePath = resolveWithin(CONTENT_PATHS.tags, req.params.id);

    if (!filePath) {
      return res.status(400).json({ error: 'Invalid tag path' });
    }

    const tag = await readMarkdownFile(filePath);

    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    res.json({
      id: req.params.id,
      name: path.basename(req.params.id, path.extname(req.params.id)),
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
    const tagName = normalizeTagName(name);

    if (!tagName) {
      return res.status(400).json({ error: '标签名称不合法（不能为空、超过 50 字符或包含特殊字符）' });
    }

    const existingTags = await getAllMarkdownFiles(CONTENT_PATHS.tags);
    const tagExists = existingTags.some((file) => {
      const existingName = path.basename(file, path.extname(file));
      return existingName.toLowerCase() === tagName.toLowerCase();
    });

    if (tagExists) {
      return res.status(409).json({ error: `标签 "${tagName}" 已存在，不能创建重复的标签` });
    }

    const frontmatter = {
      ...getDefaultFrontmatter('tag'),
      title: title !== undefined && String(title).trim() ? String(title).trim() : tagName,
      description: description !== undefined ? String(description) : ''
    };

    const filePath = await generateFilePath(CONTENT_PATHS.tags, 'tag', tagName);
    const success = await writeMarkdownFile(filePath, frontmatter, String(body || ''));

    if (!success) {
      return res.status(500).json({ error: 'Failed to create tag' });
    }

    const relativePath = path.relative(CONTENT_PATHS.tags, filePath);
    res.status(201).json({
      id: relativePath.replace(/\\/g, '/'),
      message: 'Tag created successfully',
      filePath
    });
  } catch (error) {
    console.error('Error creating tag:', error);
    res.status(500).json({ error: 'Failed to create tag' });
  }
});

// 更新tag
router.put('/:id(*)', async (req, res) => {
  try {
    const filePath = resolveWithin(CONTENT_PATHS.tags, req.params.id);

    if (!filePath) {
      return res.status(400).json({ error: 'Invalid tag path' });
    }

    const existingTag = await readMarkdownFile(filePath);
    if (!existingTag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    const { title, description, body } = req.body;

    const updatedFrontmatter = {
      ...existingTag.frontmatter,
      title:
        title !== undefined ? String(title).trim() : existingTag.frontmatter.title,
      description:
        description !== undefined ? String(description) : existingTag.frontmatter.description
    };

    const success = await writeMarkdownFile(
      filePath,
      updatedFrontmatter,
      body !== undefined ? String(body) : existingTag.body
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
    const filePath = resolveWithin(CONTENT_PATHS.tags, req.params.id);

    if (!filePath) {
      return res.status(400).json({ error: 'Invalid tag path' });
    }
    if (!(await fs.pathExists(filePath))) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    const success = await deleteFile(filePath);

    if (success) {
      await removeEmptyParents(filePath, CONTENT_PATHS.tags);
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
