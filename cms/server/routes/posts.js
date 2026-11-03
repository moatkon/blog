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

function normalizeCoverImage(coverImage) {
  if (!coverImage || !coverImage.src) return null;

  return {
    src: String(coverImage.src).replace(/^\/public\//, '').replace(/^\/+/, ''),
    alt: coverImage.alt ? String(coverImage.alt) : ''
  };
}

function normalizeTags(tags) {
  if (!Array.isArray(tags)) return undefined;

  const seen = new Set();
  const result = [];

  for (const tag of tags) {
    const value = String(tag).trim();
    if (!value) continue;

    const key = value.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    result.push(value);
  }

  return result;
}

function validateTitle(title) {
  if (typeof title !== 'string' || !title.trim()) {
    return '标题不能为空';
  }
  if (title.trim().length > 60) {
    return '标题不能超过 60 个字符';
  }
  return null;
}

// 获取所有posts
router.get('/', async (req, res) => {
  try {
    const files = await getAllMarkdownFiles(CONTENT_PATHS.posts);
    const posts = [];

    for (const file of files) {
      const post = await readMarkdownFile(file);
      if (!post) continue;

      const relativePath = path.relative(CONTENT_PATHS.posts, file);

      posts.push({
        id: relativePath.replace(/\\/g, '/'),
        ...post.frontmatter,
        body: post.body,
        filePath: file,
        createdAt: post.stats.birthtime.toISOString(),
        modifiedAt: post.stats.mtime.toISOString()
      });
    }

    posts.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));

    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// 获取单个post
router.get('/:id(*)', async (req, res) => {
  try {
    const filePath = resolveWithin(CONTENT_PATHS.posts, req.params.id);

    if (!filePath) {
      return res.status(400).json({ error: 'Invalid post path' });
    }

    const post = await readMarkdownFile(filePath);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({
      id: req.params.id,
      ...post.frontmatter,
      body: post.body,
      filePath
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// 重命名post路径
router.put('/:id(*)/rename', async (req, res) => {
  try {
    const { newPath } = req.body;

    if (!newPath) {
      return res.status(400).json({ error: 'New path is required' });
    }

    const oldFilePath = resolveWithin(CONTENT_PATHS.posts, req.params.id);
    const newFilePath = resolveWithin(CONTENT_PATHS.posts, newPath);

    if (!oldFilePath || !newFilePath) {
      return res.status(400).json({ error: 'Invalid post path' });
    }
    if (!(await fs.pathExists(oldFilePath))) {
      return res.status(404).json({ error: 'Post not found' });
    }
    if (await fs.pathExists(newFilePath)) {
      return res.status(409).json({ error: 'New path already exists' });
    }

    await fs.ensureDir(path.dirname(newFilePath));
    await fs.move(oldFilePath, newFilePath);

    res.json({
      message: 'Post path updated successfully',
      newPath,
      oldPath: req.params.id
    });
  } catch (error) {
    console.error('Error renaming post:', error);
    res.status(500).json({ error: 'Failed to rename post' });
  }
});

// 创建新post
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      body,
      draft = true,
      tags = [],
      pinned = false,
      coverImage = null,
      publishDate
    } = req.body;

    const titleError = validateTitle(title);
    if (titleError) {
      return res.status(400).json({ error: titleError });
    }

    const frontmatter = {
      ...getDefaultFrontmatter('post'),
      title: title.trim(),
      description: description !== undefined ? String(description) : title.trim(),
      publishDate: publishDate ? String(publishDate) : getBeijingTime('simple'),
      draft: Boolean(draft),
      tags: normalizeTags(tags) || [],
      pinned: Boolean(pinned)
    };

    const normalizedCover = normalizeCoverImage(coverImage);
    if (normalizedCover) frontmatter.coverImage = normalizedCover;

    const filePath = await generateFilePath(CONTENT_PATHS.posts, 'post', frontmatter.title);
    const success = await writeMarkdownFile(filePath, frontmatter, String(body || ''));

    if (!success) {
      return res.status(500).json({ error: 'Failed to create post' });
    }

    const relativePath = path.relative(CONTENT_PATHS.posts, filePath);
    res.status(201).json({
      id: relativePath.replace(/\\/g, '/'),
      message: 'Post created successfully',
      filePath
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// 更新post
router.put('/:id(*)', async (req, res) => {
  try {
    const filePath = resolveWithin(CONTENT_PATHS.posts, req.params.id);

    if (!filePath) {
      return res.status(400).json({ error: 'Invalid post path' });
    }

    const existingPost = await readMarkdownFile(filePath);
    if (!existingPost) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const { title, description, body, draft, tags, pinned, coverImage, publishDate } = req.body;

    if (title !== undefined) {
      const titleError = validateTitle(title);
      if (titleError) {
        return res.status(400).json({ error: titleError });
      }
    }

    const updatedFrontmatter = {
      ...existingPost.frontmatter,
      title: title !== undefined ? title.trim() : existingPost.frontmatter.title,
      description:
        description !== undefined ? String(description) : existingPost.frontmatter.description,
      draft: draft !== undefined ? Boolean(draft) : existingPost.frontmatter.draft,
      tags: tags !== undefined ? normalizeTags(tags) : existingPost.frontmatter.tags,
      pinned: pinned !== undefined ? Boolean(pinned) : existingPost.frontmatter.pinned
    };

    if (publishDate !== undefined) {
      updatedFrontmatter.publishDate = String(publishDate);
    }

    if (coverImage !== undefined) {
      const normalizedCover = normalizeCoverImage(coverImage);
      if (normalizedCover) updatedFrontmatter.coverImage = normalizedCover;
      else delete updatedFrontmatter.coverImage;
    }

    const nextBody = body !== undefined ? String(body) : existingPost.body;

    const hasChanges =
      updatedFrontmatter.title !== existingPost.frontmatter.title ||
      updatedFrontmatter.description !== existingPost.frontmatter.description ||
      updatedFrontmatter.draft !== existingPost.frontmatter.draft ||
      JSON.stringify(updatedFrontmatter.tags) !== JSON.stringify(existingPost.frontmatter.tags) ||
      updatedFrontmatter.pinned !== existingPost.frontmatter.pinned ||
      JSON.stringify(updatedFrontmatter.publishDate) !==
        JSON.stringify(existingPost.frontmatter.publishDate) ||
      JSON.stringify(updatedFrontmatter.coverImage) !==
        JSON.stringify(existingPost.frontmatter.coverImage) ||
      nextBody !== existingPost.body;

    if (!hasChanges) {
      return res.json({ message: 'No changes detected', updatedDate: existingPost.frontmatter.updatedDate });
    }

    updatedFrontmatter.updatedDate = getBeijingTime('simple');

    const success = await writeMarkdownFile(filePath, updatedFrontmatter, nextBody);

    if (!success) {
      return res.status(500).json({ error: 'Failed to update post' });
    }

    res.json({
      message: 'Post updated successfully',
      updatedDate: updatedFrontmatter.updatedDate
    });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// 删除post
router.delete('/:id(*)', async (req, res) => {
  try {
    const filePath = resolveWithin(CONTENT_PATHS.posts, req.params.id);

    if (!filePath) {
      return res.status(400).json({ error: 'Invalid post path' });
    }
    if (!(await fs.pathExists(filePath))) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const success = await deleteFile(filePath);

    if (success) {
      await removeEmptyParents(filePath, CONTENT_PATHS.posts);
      res.json({ message: 'Post deleted successfully' });
    } else {
      res.status(500).json({ error: 'Failed to delete post' });
    }
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

export default router;
