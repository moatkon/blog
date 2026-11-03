import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import { CMS_PORT, CONTENT_PATHS } from './config.js';
import postsRouter from './routes/posts.js';
import notesRouter from './routes/notes.js';
import tagsRouter from './routes/tags.js';
import assetsRouter from './routes/assets.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const clientDist = path.join(__dirname, '../client/dist');
const hasClientBuild = fs.existsSync(path.join(clientDist, 'index.html'));

app.use(cors());
app.use(express.json({ limit: '5mb' }));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

app.get('/api/blog-status', async (req, res) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1200);

  try {
    await fetch('http://localhost:4321/', { signal: controller.signal });
    res.json({ online: true });
  } catch {
    res.json({ online: false });
  } finally {
    clearTimeout(timer);
  }
});

// CMS 自己的媒体入口：预览 Markdown 图片时不再依赖 Astro dev server
app.use(
  '/media',
  express.static(CONTENT_PATHS.assets, {
    dotfiles: 'ignore',
    index: false,
    maxAge: '1h'
  })
);

app.use('/api/posts', postsRouter);
app.use('/api/notes', notesRouter);
app.use('/api/tags', tagsRouter);
app.use('/api/assets', assetsRouter);

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API not found' });
});

if (hasClientBuild) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.status(200).send(`
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif; padding: 40px; color: #334155;">
        <h2>CMS API 已启动</h2>
        <p>前端开发服务器请访问 <a href="http://localhost:5173">http://localhost:5173</a>。</p>
        <p>如果要使用单端口生产模式，请先执行 <code>npm run build</code>，再重启服务。</p>
      </div>
    `);
  });
}

app.use((error, req, res, next) => {
  console.error('Unhandled server error:', error);
  if (res.headersSent) return next(error);
  res.status(500).json({ error: 'Internal server error' });
});

const server = app.listen(CMS_PORT, () => {
  console.log(`CMS API running on http://localhost:${CMS_PORT}`);
  console.log(
    hasClientBuild
      ? `CMS UI available on http://localhost:${CMS_PORT}`
      : 'CMS client dev server: http://localhost:5173'
  );
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(
      `端口 ${CMS_PORT} 已被占用。请关闭占用该端口的进程，或用 CMS_PORT=其他端口 npm start 启动。`
    );
    process.exit(1);
  }
  throw error;
});
