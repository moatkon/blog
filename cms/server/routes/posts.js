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

// 标准化封面图路径，移除 /public/ 前缀
function normalizeCoverImagePath(coverImage) {
  if (!coverImage || !coverImage.src) {
    return coverImage;
  }

  return {
    ...coverImage,
    src: coverImage.src.replace(/^\/public\//, '')
  };
}

// 为API响应准备封面图路径
function prepareCoverImageForResponse(coverImage) {
  return normalizeCoverImagePath(coverImage);
}

// 获取所有posts
router.get('/', async (req, res) => {
  try {
    const files = await getAllMarkdownFiles(CONTENT_PATHS.posts);
    const posts = [];
    
    for (const file of files) {
      const post = await readMarkdownFile(file);
      if (post) {
        const relativePath = path.relative(CONTENT_PATHS.posts, file);
        // 将文件系统时间戳转换为北京时间
        const createdAt = new Date(post.stats.birthtime.getTime() + (8 * 60 * 60 * 1000));
        const modifiedAt = new Date(post.stats.mtime.getTime() + (8 * 60 * 60 * 1000));

        const normalizedPost = {
          id: relativePath.replace(/\\/g, '/'),
          ...post.frontmatter,
          body: post.body,
          filePath: file,
          createdAt: createdAt.toISOString(),
          modifiedAt: modifiedAt.toISOString()
        };

        // 标准化封面图路径
        if (normalizedPost.coverImage) {
          normalizedPost.coverImage = prepareCoverImageForResponse(normalizedPost.coverImage);
        }

        posts.push(normalizedPost);
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
    
    const responsePost = {
      id: req.params.id,
      ...post.frontmatter,
      body: post.body,
      filePath
    };

    // 标准化封面图路径
    if (responsePost.coverImage) {
      responsePost.coverImage = prepareCoverImageForResponse(responsePost.coverImage);
    }

    res.json(responsePost);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// 创建新post
router.post('/', async (req, res) => {
  try {
    const { title, description, body, draft = true, tags = [], pinned = false, coverImage = null } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    const frontmatter = {
      ...getDefaultFrontmatter('post'),
      title,
      description: description !== undefined ? description : title,
      draft,
      tags: tags || [],
      pinned
    };

    // 添加封面图信息（如果有的话）
    if (coverImage && coverImage.src) {
      frontmatter.coverImage = normalizeCoverImagePath(coverImage);
    }
    
    const filePath = await generateFilePath(CONTENT_PATHS.posts, 'post', title);
    const success = await writeMarkdownFile(filePath, frontmatter, body || '');
    
    if (success) {
      const relativePath = path.relative(CONTENT_PATHS.posts, filePath);
      res.status(201).json({
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
    
    const { title, description, body, draft, tags, pinned, coverImage } = req.body;
    
    const updatedFrontmatter = {
      ...existingPost.frontmatter,
      title: title || existingPost.frontmatter.title,
      description: description !== undefined ? description : existingPost.frontmatter.description,
      draft: draft !== undefined ? draft : existingPost.frontmatter.draft,
      tags: tags !== undefined ? tags : existingPost.frontmatter.tags,
      pinned: pinned !== undefined ? pinned : existingPost.frontmatter.pinned,
    };

    // 检查是否有实际更改，如果有则更新 updatedDate
    const hasChanges = 
      (title && title !== existingPost.frontmatter.title) ||
      (description !== undefined && description !== existingPost.frontmatter.description) ||
      (draft !== undefined && draft !== existingPost.frontmatter.draft) ||
      (tags !== undefined && JSON.stringify(tags) !== JSON.stringify(existingPost.frontmatter.tags)) ||
      (pinned !== undefined && pinned !== existingPost.frontmatter.pinned) ||
      (coverImage !== undefined) ||  // 封面图是否更改
      (body !== undefined && body !== existingPost.body);

    if (hasChanges) {
      updatedFrontmatter.updatedDate = getBeijingTime('simple');
    }

    // 处理封面图更新
    if (coverImage !== undefined) {
      if (coverImage && coverImage.src) {
        updatedFrontmatter.coverImage = normalizeCoverImagePath(coverImage);
      } else {
        // 如果传入null或空对象，则删除封面图
        delete updatedFrontmatter.coverImage;
      }
    }
    
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
