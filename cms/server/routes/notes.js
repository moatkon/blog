import express from 'express';
import path from 'path';
import fs from 'fs-extra';
import { CONTENT_PATHS, getDefaultFrontmatter, getBeijingTime } from '../config.js';
import { 
  getAllMarkdownFiles, 
  readMarkdownFile, 
  writeMarkdownFile, 
  deleteFile, 
  generateFilePath 
} from '../utils/fileUtils.js';

const router = express.Router();

// 获取所有notes
router.get('/', async (req, res) => {
  try {
    const files = await getAllMarkdownFiles(CONTENT_PATHS.notes);
    const notes = [];
    
    for (const file of files) {
      const note = await readMarkdownFile(file);
      if (note) {
        const relativePath = path.relative(CONTENT_PATHS.notes, file);
        // 将文件系统时间戳转换为北京时间
        const createdAt = new Date(note.stats.birthtime.getTime() + (8 * 60 * 60 * 1000));
        const modifiedAt = new Date(note.stats.mtime.getTime() + (8 * 60 * 60 * 1000));

        notes.push({
          id: relativePath.replace(/\\/g, '/'),
          ...note.frontmatter,
          body: note.body,
          filePath: file,
          createdAt: createdAt.toISOString(),
          modifiedAt: modifiedAt.toISOString()
        });
      }
    }
    
    // 按发布日期排序
    notes.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));
    
    res.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// 获取单个note
router.get('/:id(*)', async (req, res) => {
  try {
    const filePath = path.join(CONTENT_PATHS.notes, req.params.id);
    const note = await readMarkdownFile(filePath);
    
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    res.json({
      id: req.params.id,
      ...note.frontmatter,
      body: note.body,
      filePath
    });
  } catch (error) {
    console.error('Error fetching note:', error);
    res.status(500).json({ error: 'Failed to fetch note' });
  }
});

// 重命名note路径
router.put('/:id(*)/rename', async (req, res) => {
  try {
    const { newPath } = req.body;
    
    if (!newPath) {
      return res.status(400).json({ error: 'New path is required' });
    }

    const oldFilePath = path.join(CONTENT_PATHS.notes, req.params.id);
    
    // 检查原始文件是否存在
    if (!await fs.pathExists(oldFilePath)) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const newFilePath = path.join(CONTENT_PATHS.notes, newPath);

    // 检查目标路径是否已存在
    if (await fs.pathExists(newFilePath)) {
      return res.status(409).json({ error: 'New path already exists' });
    }

    // 确保目标目录存在
    await fs.ensureDir(path.dirname(newFilePath));

    // 重命名文件
    await fs.move(oldFilePath, newFilePath);

    res.json({ 
      message: 'Note path updated successfully',
      newPath: newPath,
      oldPath: req.params.id
    });
  } catch (error) {
    console.error('Error renaming note:', error);
    res.status(500).json({ error: 'Failed to rename note' });
  }
});

// 创建新note
router.post('/', async (req, res) => {
  try {
    const { title, description, body } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    const frontmatter = {
      ...getDefaultFrontmatter('note'),
      title,
      description: description !== undefined ? description : ''
    };
    
    const filePath = await generateFilePath(CONTENT_PATHS.notes, 'note', title);
    const success = await writeMarkdownFile(filePath, frontmatter, body || '');
    
    if (success) {
      const relativePath = path.relative(CONTENT_PATHS.notes, filePath);
      res.json({ 
        id: relativePath.replace(/\\/g, '/'),
        message: 'Note created successfully',
        filePath
      });
    } else {
      res.status(500).json({ error: 'Failed to create note' });
    }
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// 更新note
router.put('/:id(*)', async (req, res) => {
  try {
    const filePath = path.join(CONTENT_PATHS.notes, req.params.id);
    const existingNote = await readMarkdownFile(filePath);
    
    if (!existingNote) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    const { title, description, body } = req.body;
    
    // 检查是否有实际更改
    const hasChanges = 
      (title && title !== existingNote.frontmatter.title) ||
      (description !== undefined && description !== existingNote.frontmatter.description) ||
      (body !== undefined && body !== existingNote.body);

    if (!hasChanges) {
      // 没有实际更改，直接返回成功而不更新文件
      return res.json({ message: 'No changes detected, note not updated' });
    }
    
    const updatedFrontmatter = {
      ...existingNote.frontmatter,
      title: title || existingNote.frontmatter.title,
      description: description !== undefined ? description : existingNote.frontmatter.description
    };
    
    const success = await writeMarkdownFile(
      filePath, 
      updatedFrontmatter, 
      body !== undefined ? body : existingNote.body
    );
    
    if (success) {
      res.json({ message: 'Note updated successfully' });
    } else {
      res.status(500).json({ error: 'Failed to update note' });
    }
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// 删除note
router.delete('/:id(*)', async (req, res) => {
  try {
    const filePath = path.join(CONTENT_PATHS.notes, req.params.id);
    const success = await deleteFile(filePath);
    
    if (success) {
      res.json({ message: 'Note deleted successfully' });
    } else {
      res.status(500).json({ error: 'Failed to delete note' });
    }
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

export default router;
