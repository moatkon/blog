import express from 'express';
import path from 'path';
import fs from 'fs-extra';
import { CONTENT_PATHS, getDefaultFrontmatter, getBeijingTime } from '../config.js';
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

function validateTitle(title) {
  if (typeof title !== 'string' || !title.trim()) {
    return '标题不能为空';
  }
  if (title.trim().length > 60) {
    return '标题不能超过 60 个字符';
  }
  return null;
}

// 获取所有notes
router.get('/', async (req, res) => {
  try {
    const files = await getAllMarkdownFiles(CONTENT_PATHS.notes);
    const notes = [];

    for (const file of files) {
      const note = await readMarkdownFile(file);
      if (!note) continue;

      const relativePath = path.relative(CONTENT_PATHS.notes, file);

      notes.push({
        id: relativePath.replace(/\\/g, '/'),
        ...note.frontmatter,
        body: note.body,
        filePath: file,
        createdAt: note.stats.birthtime.toISOString(),
        modifiedAt: note.stats.mtime.toISOString()
      });
    }

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
    const filePath = resolveWithin(CONTENT_PATHS.notes, req.params.id);

    if (!filePath) {
      return res.status(400).json({ error: 'Invalid note path' });
    }

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

    const oldFilePath = resolveWithin(CONTENT_PATHS.notes, req.params.id);
    const newFilePath = resolveWithin(CONTENT_PATHS.notes, newPath);

    if (!oldFilePath || !newFilePath) {
      return res.status(400).json({ error: 'Invalid note path' });
    }
    if (!(await fs.pathExists(oldFilePath))) {
      return res.status(404).json({ error: 'Note not found' });
    }
    if (await fs.pathExists(newFilePath)) {
      return res.status(409).json({ error: 'New path already exists' });
    }

    await fs.ensureDir(path.dirname(newFilePath));
    await fs.move(oldFilePath, newFilePath);

    res.json({
      message: 'Note path updated successfully',
      newPath,
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
    const { title, description, body, publishDate } = req.body;

    const titleError = validateTitle(title);
    if (titleError) {
      return res.status(400).json({ error: titleError });
    }

    const frontmatter = {
      ...getDefaultFrontmatter('note'),
      title: title.trim(),
      description: description !== undefined ? String(description) : '',
      publishDate: publishDate ? String(publishDate) : getBeijingTime('iso')
    };

    const filePath = await generateFilePath(CONTENT_PATHS.notes, 'note', frontmatter.title);
    const success = await writeMarkdownFile(filePath, frontmatter, String(body || ''));

    if (!success) {
      return res.status(500).json({ error: 'Failed to create note' });
    }

    const relativePath = path.relative(CONTENT_PATHS.notes, filePath);
    res.status(201).json({
      id: relativePath.replace(/\\/g, '/'),
      message: 'Note created successfully',
      filePath
    });
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// 更新note
router.put('/:id(*)', async (req, res) => {
  try {
    const filePath = resolveWithin(CONTENT_PATHS.notes, req.params.id);

    if (!filePath) {
      return res.status(400).json({ error: 'Invalid note path' });
    }

    const existingNote = await readMarkdownFile(filePath);
    if (!existingNote) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const { title, description, body, publishDate } = req.body;

    if (title !== undefined) {
      const titleError = validateTitle(title);
      if (titleError) {
        return res.status(400).json({ error: titleError });
      }
    }

    const updatedFrontmatter = {
      ...existingNote.frontmatter,
      title: title !== undefined ? title.trim() : existingNote.frontmatter.title,
      description:
        description !== undefined ? String(description) : existingNote.frontmatter.description
    };

    if (publishDate !== undefined) {
      updatedFrontmatter.publishDate = String(publishDate);
    }

    const nextBody = body !== undefined ? String(body) : existingNote.body;

    const hasChanges =
      updatedFrontmatter.title !== existingNote.frontmatter.title ||
      updatedFrontmatter.description !== existingNote.frontmatter.description ||
      String(updatedFrontmatter.publishDate) !== String(existingNote.frontmatter.publishDate) ||
      nextBody !== existingNote.body;

    if (!hasChanges) {
      return res.json({ message: 'No changes detected' });
    }

    const success = await writeMarkdownFile(filePath, updatedFrontmatter, nextBody);

    if (!success) {
      return res.status(500).json({ error: 'Failed to update note' });
    }

    res.json({ message: 'Note updated successfully' });
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// 删除note
router.delete('/:id(*)', async (req, res) => {
  try {
    const filePath = resolveWithin(CONTENT_PATHS.notes, req.params.id);

    if (!filePath) {
      return res.status(400).json({ error: 'Invalid note path' });
    }
    if (!(await fs.pathExists(filePath))) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const success = await deleteFile(filePath);

    if (success) {
      await removeEmptyParents(filePath, CONTENT_PATHS.notes);
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
