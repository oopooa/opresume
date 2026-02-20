import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';

const DATA_FILE = path.resolve(__dirname, 'data/resume.json');

function resumeApiPlugin(): Plugin {
  return {
    name: 'resume-api',
    configureServer(server) {
      server.middlewares.use('/api/resume', async (req, res) => {
        try {
          if (req.method === 'GET') {
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
    },
    async writeBundle() {
      if (!existsSync(DATA_FILE)) {
        console.warn(`[resume-api] ${DATA_FILE} 不存在，跳过复制到 dist`);
        return;
      }
      const outDir = path.resolve(__dirname, 'dist/data');
      await fs.mkdir(outDir, { recursive: true });
      await fs.copyFile(DATA_FILE, path.resolve(outDir, 'resume.json'));
    },
  };
}

export default defineConfig({
  plugins: [react(), resumeApiPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
