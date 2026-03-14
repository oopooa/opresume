import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs/promises';
import { existsSync, unlinkSync, readFileSync } from 'fs';

const DATA_FILE = path.resolve(__dirname, 'data/resume.json');
const DATA_DIR = path.resolve(__dirname, 'data');
const SAMPLE_FILE = path.resolve(__dirname, 'src/config/sample-resume.json');

const MIME_EXT: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
};

const EXT_MIME: Record<string, string> = Object.fromEntries(
  Object.entries(MIME_EXT).map(([m, e]) => [e, m]),
);

/** 从示例数据生成用户初始数据（重置头像配置） */
async function readSampleAsUserData(): Promise<string> {
  const raw = await fs.readFile(SAMPLE_FILE, 'utf-8');
  const sample = JSON.parse(raw);
  if (sample.avatar) {
    sample.avatar.hidden = false;
    delete sample.avatar.src;
  }
  return JSON.stringify(sample, null, 2);
}

function resumeApiPlugin(): Plugin {
  return {
    name: 'resume-api',
    configureServer(server) {
      server.middlewares.use('/api/resume', async (req, res) => {
        try {
          if (req.method === 'GET') {
            if (!existsSync(DATA_FILE)) {
              await fs.mkdir(DATA_DIR, { recursive: true });
              await fs.writeFile(DATA_FILE, await readSampleAsUserData(), 'utf-8');
            }
            const data = await fs.readFile(DATA_FILE, 'utf-8');
            res.setHeader('Content-Type', 'application/json');
            res.end(data);
            return;
          }

          if (req.method === 'POST') {
            const body = await new Promise<string>((resolve, reject) => {
              let data = '';
              req.on('data', (chunk: Buffer) => { data += chunk; });
              req.on('end', () => resolve(data));
              req.on('error', reject);
            });
            try {
              JSON.parse(body);
            } catch {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'JSON 格式无效' }));
              return;
            }
            await fs.writeFile(DATA_FILE, body, 'utf-8');
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true }));
            return;
          }

          res.statusCode = 405;
          res.end();
        } catch (e) {
          res.statusCode = 500;
          const msg = e instanceof Error ? e.message : '服务器内部错误';
          res.end(JSON.stringify({ error: msg }));
        }
      });

      // 头像
      server.middlewares.use('/api/avatar', async (req, res) => {
        try {
          // GET: 返回头像文件
          if (req.method === 'GET') {
            for (const [ext, mime] of Object.entries(EXT_MIME)) {
              const file = path.join(DATA_DIR, `avatar${ext}`);
              if (existsSync(file)) {
                const buf = await fs.readFile(file);
                res.setHeader('Content-Type', mime);
                res.setHeader('Cache-Control', 'no-cache');
                res.end(buf);
                return;
              }
            }
            res.statusCode = 404;
            res.end();
            return;
          }

          // POST: 上传头像
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.end();
            return;
          }

          const contentType = req.headers['content-type'] ?? '';
          const ext = MIME_EXT[contentType];
          if (!ext) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: '不支持的图片格式' }));
            return;
          }

          const chunks: Uint8Array[] = [];
          let totalSize = 0;
          await new Promise<void>((resolve, reject) => {
            req.on('data', (chunk: Uint8Array) => {
              totalSize += chunk.length;
              if (totalSize > 500 * 1024) { reject(new Error('FILE_TOO_LARGE')); return; }
              chunks.push(chunk);
            });
            req.on('end', resolve);
            req.on('error', reject);
          });

          // 删除旧头像文件
          for (const e of Object.values(MIME_EXT)) {
            const old = path.join(DATA_DIR, `avatar${e}`);
            if (existsSync(old)) unlinkSync(old);
          }

          const data = new Uint8Array(totalSize);
          let offset = 0;
          for (const c of chunks) { data.set(c, offset); offset += c.length; }
          await fs.writeFile(path.join(DATA_DIR, `avatar${ext}`), data);

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ src: '/api/avatar' }));
        } catch (e) {
          if (e instanceof Error && e.message === 'FILE_TOO_LARGE') {
            res.statusCode = 413;
            res.end(JSON.stringify({ error: '文件大小超过 500KB' }));
            return;
          }
          res.statusCode = 500;
          const msg = e instanceof Error ? e.message : '服务器内部错误';
          res.end(JSON.stringify({ error: msg }));
        }
      });
    },
    async writeBundle() {
      const outDir = path.resolve(__dirname, 'dist/data');
      await fs.mkdir(outDir, { recursive: true });

      // data/resume.json 不存在时，从示例数据初始化到 dist
      let resumeRaw: string;
      if (!existsSync(DATA_FILE)) {
        resumeRaw = await readSampleAsUserData();
      } else {
        resumeRaw = await fs.readFile(DATA_FILE, 'utf-8');
      }

      // 复制头像文件，记录实际路径
      let avatarStaticPath: string | null = null;
      for (const ext of Object.values(MIME_EXT)) {
        const src = path.join(DATA_DIR, `avatar${ext}`);
        if (existsSync(src)) {
          await fs.copyFile(src, path.resolve(outDir, `avatar${ext}`));
          avatarStaticPath = `/data/avatar${ext}`;
        }
      }

      // 复制 resume.json，将 /api/avatar 替换为静态文件路径
      let output = resumeRaw;
      if (avatarStaticPath) {
        try {
          const config = JSON.parse(resumeRaw);
          if (config.avatar?.src?.startsWith('/api/avatar')) {
            config.avatar.src = avatarStaticPath;
            output = JSON.stringify(config, null, 2);
          }
        } catch { /* 解析失败则原样复制 */ }
      }
      await fs.writeFile(path.resolve(outDir, 'resume.json'), output);
    },
  };
}

const pkg = JSON.parse(
  readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8'),
);

export default defineConfig({
  plugins: [react(), resumeApiPlugin()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-tiptap': [
            '@tiptap/react',
            '@tiptap/starter-kit',
            '@tiptap/extension-link',
            '@tiptap/extension-placeholder',
          ],
          'vendor-dnd': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
          'vendor-i18n': ['i18next', 'react-i18next'],
          'vendor-radix': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-select',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-slider',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-collapsible',
          ],
        },
      },
    },
  },
});
