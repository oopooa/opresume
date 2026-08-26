/**
 * AI provider 端点探活脚本（无需有效 key）
 *
 * 目的：验证 src/config/ai-providers/*.ts 中填写的 base URL / modelsEndpoint / relay
 * 配置是否与真实端点一致（Phase 0 的“配置核实”自动化部分）。
 *
 * 判断基准（与 verifyApiKey 在 src/services/ai.ts 中的判定一致）：
 * - 401 / 403 → 端点存在且需要 Bearer 鉴权（配置形态正确，缺 key 时的预期结果）
 * - 200        → 端点开放并返回（通常意味着带上了有效 key）
 * - 404 / 405 → URL 或方法错误（配置可疑，需要修正）
 * - 网络异常   → 当前环境无法出网（脚本需在可联网环境运行），不计入配置判断
 *
 * 用法：
 *   node scripts/verify-provider-endpoints.ts                # 全部 7 家，假 key 探测
 *   PROVIDER_KEY_QWEN=sk-xxx node scripts/verify-provider-endpoints.ts   # 带真 key 探测单家
 *
 * 说明：base URL / modelsEndpoint / relay 配置以正则方式直接从 ai-providers/*.ts
 * 读取，与预设文件内容保持同步，避免手抄漂移。
 */
import fs from 'node:fs';
import path from 'node:path';

const PROVIDERS_DIR = path.resolve(import.meta.dirname, '../src/config/ai-providers');
const PROVIDER_IDS = ['opencode', 'qwen', 'deepseek', 'mimo', 'minimax', 'moonshot', 'siliconflow'];

interface ProviderConfig {
  id: string;
  baseUrl: string;
  modelsEndpoint?: string;
  relay?: { baseUrl: string; providerId: string; optionsBaseUrl?: boolean };
  recommendedModel: string;
}

/** 与 src/lib/utils.ts#normalizeApiBaseUrl 语义一致（去尾斜杠、去冗余 /v1、补 https） */
function normalizeApiBaseUrl(raw: string): string {
  let url = raw.trim();
  if (!url) return url;
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  url = url.replace(/\/+$/, '');
  url = url.replace(/\/chat\/completions$/i, '');
  url = url.replace(/\/v1$/i, '');
  return url;
}

function readProviderConfig(id: string): ProviderConfig {
  const file = path.join(PROVIDERS_DIR, `${id}.ts`);
  const src = fs.readFileSync(file, 'utf-8');
  const baseUrl = src.match(/defaultApiUrl:\s*'([^']+)'/)?.[1] ?? '';
  const modelsEndpoint = src.match(/modelsEndpoint:\s*'([^']+)'/)?.[1];
  const recommendedModel = src.match(/recommendedModel:\s*'([^']+)'/)?.[1] ?? '';
  const relayMatch = src.match(/relay\s*:\s*\{[\s\S]*?baseUrl:\s*'([^']+)'[\s\S]*?providerId:\s*'([^']+)'[\s\S]*?optionsBaseUrl:\s*(true|false)/);
  const relay = relayMatch
    ? { baseUrl: relayMatch[1], providerId: relayMatch[2], optionsBaseUrl: relayMatch[3] === 'true' }
    : undefined;
  return { id, baseUrl, modelsEndpoint, relay, recommendedModel };
}

interface ProbeResult {
  id: string;
  kind: 'models' | 'relay-chat';
  status: number | 'ERR';
  ms: number;
  url: string;
  snippet: string;
}

async function probe(): Promise<void> {
  const results: ProbeResult[] = [];

  for (const id of PROVIDER_IDS) {
    const cfg = readProviderConfig(id);
    const base = normalizeApiBaseUrl(cfg.baseUrl);
    const envKey = `PROVIDER_KEY_${id.toUpperCase()}`;
    const realKey = process.env[envKey]?.trim() ?? '';
    const bearer = realKey || 'probe-invalid-key';

    const t0 = Date.now();
    try {
      if (cfg.relay) {
        // relay 供应商：与 verifyApiKey 的 relay 分支一致，用最小 chat 探测
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'x-provider-id': cfg.relay.providerId,
        };
        // optionsBaseUrl=true 时 apiKey 放 x-provider-options（与 ai-generate.ts resolveTarget 一致）；假 key 不发送
        if (cfg.relay.optionsBaseUrl !== false) {
          headers['x-provider-options'] = JSON.stringify({
            baseURL: base,
            ...(realKey ? { apiKey: realKey } : {}),
          });
        }
        if (realKey) headers['Authorization'] = `Bearer ${bearer}`;
        const url = `${cfg.relay.baseUrl}/v1/chat/completions`;
        const res = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({ model: cfg.recommendedModel || 'default', messages: [{ role: 'user', content: 'ping' }], max_tokens: 1, stream: false }),
          signal: AbortSignal.timeout(20000),
        });
        results.push({
          id, kind: 'relay-chat', status: res.status, ms: Date.now() - t0, url,
          snippet: (await res.text()).replace(/\s+/g, ' ').slice(0, 160),
        });
      } else {
        const endpoint = cfg.modelsEndpoint ?? '/v1/models';
        const url = `${base}${endpoint}`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${bearer}` },
          signal: AbortSignal.timeout(20000),
        });
        const text = await res.text();
        results.push({
          id, kind: 'models', status: res.status, ms: Date.now() - t0, url,
          snippet: text.replace(/\s+/g, ' ').slice(0, 160),
        });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      results.push({
        id, kind: cfg.relay ? 'relay-chat' : 'models', status: 'ERR', ms: Date.now() - t0,
        url: cfg.relay ? `${cfg.relay.baseUrl}/v1/chat/completions` : `${base}${cfg.modelsEndpoint ?? '/v1/models'}`,
        snippet: msg.slice(0, 160),
      });
    }
  }

  console.log('\n=== provider endpoint probe ===');
  for (const r of results) {
    const verdict =
      r.status === 401 || r.status === 403 ? 'endpoint OK (auth required)' :
      r.status === 200 ? 'endpoint OK (models/chat)' :
      typeof r.status === 'number' ? 'SUSPECT — check config' :
      'NETWORK ERROR — run on a machine with internet';
    console.log(`${r.id.padEnd(12)} HTTP ${String(r.status).padEnd(4)} ${verdict.padEnd(30)} ${r.ms}ms  ${r.url}`);
    if (r.snippet) console.log(`  -> ${r.snippet}`);
  }

  const errors = results.filter((r) => typeof r.status === 'number' && r.status >= 400 && r.status !== 401 && r.status !== 403);
  const netErrors = results.filter((r) => r.status === 'ERR');
  console.log('\nsummary:');
  console.log(`  configured OK (401/403 expected without key): ${PROVIDER_IDS.length - errors.length - netErrors}/${PROVIDER_IDS.length}`);
  if (netErrors.length) console.log(`  network unreachable here: ${netErrors.map((r) => r.id).join(', ')} — rerun on a connected machine`);
}

probe().catch((e) => {
  console.error('probe failed:', e);
  process.exitCode = 1;
});