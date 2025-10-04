import express from 'express';
import path from 'path';
import { CONTENT_PATHS, DEFAULT_FRONTMATTER } from '../config.js';
import { 
  getAllMarkdownFiles, 
  readMarkdownFile, 
  writeMarkdownFile, 
  deleteFile, 
  generateFilePath 
} from '../utils/fileUtils.js';

const router = express.Router();

// 获取所有posts
router.get('/', async (req, res) => {
  try {
    const files = await getAllMarkdownFiles(CONTENT_PATHS.posts);
    const posts = [];
    
    for (const file of files) {
      const post = await readMarkdownFile(file);
      if (post) {
        const relativePath = path.relative(CONTENT_PATHS.posts, file);
        posts.push({
          id: relativePath.replace(/\\/g, '/'),
          ...post.frontmatter,
          body: post.body,
          filePath: file,
          createdAt: post.stats.birthtime,
          modifiedAt: post.stats.mtime
        });
      }
    }
    
    // 按发布日期排序
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
    const filePath = path.join(CONTENT_PATHS.posts, req.params.id);
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

// 创建新post
router.post('/', async (req, res) => {
  try {
    const { title, description, body, draft = true, tags = [], pinned = false } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    const frontmatter = {
      ...DEFAULT_FRONTMATTER.post,
      title,
      description: description || title,
      draft,
      tags,
      pinned
    };
    
    const filePath = await generateFilePath(CONTENT_PATHS.posts, 'post', title);
    const success = await writeMarkdownFile(filePath, frontmatter, body || '');
    
    if (success) {
      const relativePath = path.relative(CONTENT_PATHS.posts, filePath);
      res.json({ 
        id: relativePath.replace(/\\/g, '/'),
        message: 'Post created successfully',
        filePath
      });
    } else {
      res.status(500).json({ error: 'Failed to create post' });
    }
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// 更新post
router.put('/:id(*)', async (req, res) => {
  try {
    const filePath = path.join(CONTENT_PATHS.posts, req.params.id);
    const existingPost = await readMarkdownFile(filePath);
    
    if (!existingPost) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const { title, description, body, draft, tags, pinned } = req.body;
    
    const updatedFrontmatter = {
      ...existingPost.frontmatter,
      title: title || existingPost.frontmatter.title,
      description: description || existingPost.frontmatter.description,
      draft: draft !== undefined ? draft : existingPost.frontmatter.draft,
      tags: tags || existingPost.frontmatter.tags,
      pinned: pinned !== undefined ? pinned : existingPost.frontmatter.pinned,
      updatedDate: new Date().toISOString().slice(0, 19).replace('T', ' ')
    };
    
    const success = await writeMarkdownFile(
      filePath, 
      updatedFrontmatter, 
      body !== undefined ? body : existingPost.body
    );
    
    if (success) {
      res.json({ message: 'Post updated successfully' });
    } else {
      res.status(500).json({ error: 'Failed to update post' });
    }
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// 删除post
router.delete('/:id(*)', async (req, res) => {
  try {
    const filePath = path.join(CONTENT_PATHS.posts, req.params.id);
    const success = await deleteFile(filePath);
    
    if (success) {
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
