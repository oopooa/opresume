/**
 * PDF 简历识别 → AI 结构化 → 映射 → 填入模板 的测试 harness
 *
 * 用途：以 opencode 与 qwen 两家 provider 各跑一遍 6 份测试 PDF（+1 负例），
 * 验证「上传 PDF → 文本提取 → AI 解析 → JSON → 映射进 JsonResume」全链路，
 * 并按真值清单（test-data/resumes/*.expected.json）自动打分。
 *
 * 代码复用策略（与生产链路保持一致）：
 * - prompt 模板：直接 import src/utils/pdf-prompts.ts（零依赖）
 * - JSON→简历映射：直接 import src/services/resume-mapper.ts（仅有 type-only import，Node 原生可载入）
 * - opencode 预设（含 relay）：直接 import src/config/ai-providers/opencode.ts（仅有 type-only import）
 * - qwen 预设含 .svg 资源导入，Node 无法载入 → 端点/模型按 qwen.ts 人工核对后内联（见 qwenInline）
 * - PDF 文本提取：逻辑与 src/services/pdf-parser.ts 一致（同一 pdfjs-dist 版本、≥50 字符校验）
 * - chat 请求与 extractJSON：复刻 src/services/ai-generate.ts 语义（temperature 0.3、
 *   非 relay 直连 /v1/chat/completions、relay 走网关 + x-provider-* 头）
 *
 * 用法：
 *   node scripts/test-pdf-import.ts --fixtures-only          # 只校验 7 份 PDF 可提取/负例守卫（离线）
 *   OPENCODE_API_KEY=... QWEN_API_KEY=... node scripts/test-pdf-import.ts
 *   node scripts/test-pdf-import.ts --keys-file test-data/.keys.env   # 从文件读 key（每行 KEY=VALUE，不落盘）
 *   ... node scripts/test-pdf-import.ts --provider opencode
 *   ... node scripts/test-pdf-import.ts --pdf 01-dhu,03-software
 *   ... node scripts/test-pdf-import.ts --strict              # 任一 FAIL 以非零退出
 *
 * 产物：test-data/out/<pdf>-<provider>.{ai,mapped,meta}.json
 * key 优先级：环境变量 > --keys-file 指定的文件（后者避免 key 出现在 shell 历史/对话中）。
 * 模型可用 OPENCODE_MODEL / QWEN_MODEL 覆盖。
 */
import fs from 'node:fs';
import path from 'node:path';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { SYSTEM_PROMPT, buildUserPrompt } from '../src/utils/pdf-prompts.ts';
import { isValidAIResumeData, mapAIJsonToResume } from '../src/services/resume-mapper.ts';
import opencodePreset from '../src/config/ai-providers/opencode.ts';

const RESUME_DIR = path.resolve(import.meta.dirname, '../test-data/resumes');
const OUT_DIR = path.resolve(import.meta.dirname, '../test-data/out');

/** 与 pdf-parser.ts 的阈值一致 */
const MIN_TEXT_CHARS = 50;
/** 计数容差默认值（manifest 可覆盖） */
const DEFAULT_TOLERANCE = 1;

/**
 * qwen 预设（src/config/ai-providers/qwen.ts）内含 svg 资源导入，Node 原生无法载入。
 * 以下常量已与该文件逐项核对一致（defaultApiUrl / recommendedModel），仅用于本 harness。
 */
const qwenInline = {
  defaultApiUrl: 'https://dashscope.aliyuncs.com/compatible-mode',
  recommendedModel: 'qwen-plus',
};

interface ProviderRun {
  id: string;
  baseUrl: string;
  relay?: { baseUrl: string; providerId: string; optionsBaseUrl?: boolean };
  model: string;
  apiKey: string;
}

interface CaseResult {
  pdf: string;
  provider: string;
  model: string;
  chars: number;
  extractMs: number;
  aiMs: number;
  httpStatus: number | null;
  extractError?: string;
  aiOk: boolean;
  jsonOk: boolean;
  mapped: Record<string, unknown> | null;
  score: Record<string, unknown> | null;
  pass: boolean;
}

/* ------------------------------------------------------------------ */
/*  基础工具（与生产代码语义一致）                                     */
/* ------------------------------------------------------------------ */

function normalizeApiBaseUrl(raw: string): string {
  let url = raw.trim();
  if (!url) return url;
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  url = url.replace(/\/+$/, '');
  url = url.replace(/\/chat\/completions$/i, '');
  url = url.replace(/\/v1$/i, '');
  return url;
}

/** PDF 文本提取：与 pdf-parser.ts#extractTextFromPDF 一致 */
async function extractText(filePath: string): Promise<{ text: string; chars: number; ms: number }> {
  const t0 = Date.now();
  const data = new Uint8Array(fs.readFileSync(filePath));
  const pdf = await getDocument({ data }).promise;
  const parts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    parts.push(
      content.items
        .filter((item) => 'str' in item)
        .map((item) => (item as { str: string }).str)
        .join(' '),
    );
  }
  const text = parts.join('\n\n');
  const trimmed = text.trim();
  if (!trimmed || trimmed.length < MIN_TEXT_CHARS) {
    throw new Error(`insufficient text: ${trimmed.length} chars < ${MIN_TEXT_CHARS}`);
  }
  return { text, chars: trimmed.length, ms: Date.now() - t0 };
}

/** chat 调用：复刻 ai-generate.ts#generateText 的请求构造 */
async function chatCompletion(
  cfg: ProviderRun,
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
): Promise<{ status: number; text: string; ms: number }> {
  const base = normalizeApiBaseUrl(cfg.baseUrl);
  const t0 = Date.now();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (cfg.apiKey) headers.Authorization = `Bearer ${cfg.apiKey}`;
  let url: string;
  if (cfg.relay) {
    url = `${cfg.relay.baseUrl}/v1/chat/completions`;
    headers['x-provider-id'] = cfg.relay.providerId;
    if (cfg.relay.optionsBaseUrl !== false) {
      headers['x-provider-options'] = JSON.stringify({
        baseURL: base,
        ...(cfg.apiKey ? { apiKey: cfg.apiKey } : {}),
      });
    }
  } else {
    url = `${base}/v1/chat/completions`;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ model: cfg.model, messages, temperature: 0.3 }),
    signal: AbortSignal.timeout(120_000),
  });
  const text = await res.text();
  if (!res.ok) {
    return { status: res.status, text: text.slice(0, 200), ms: Date.now() - t0 };
  }
  const data = JSON.parse(text);
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') {
    throw new Error(`invalid AI response: ${text.slice(0, 200)}`);
  }
  return { status: res.status, text: content, ms: Date.now() - t0 };
}

/** JSON 提取：复刻 ai-generate.ts#extractJSON */
function extractJSON(text: string): unknown {
  const jsonText =
    text.match(/```json\s*([\s\S]*?)\s*```/)?.[1] ??
    text.match(/```\s*([\s\S]*?)\s*```/)?.[1] ??
    text.trim();
  return JSON.parse(jsonText);
}

/* ------------------------------------------------------------------ */
/*  打分                                                               */
/* ------------------------------------------------------------------ */

function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

function digitsOnly(s: string): string {
  return (s ?? '').replace(/\D/g, '');
}

interface ExpectedManifest {
  file?: string;
  basics?: { name?: string | null; email?: string | null; phone?: string | null; label?: string | null; city?: string | null };
  counts?: { education?: number; work?: number; projects?: number; skills?: number; awards?: number };
  countTolerance?: number;
  notes?: string;
}

function loadExpected(pdfName: string): ExpectedManifest | null {
  const p = path.join(RESUME_DIR, pdfName.replace(/\.pdf$/, '.expected.json'));
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf-8')) as ExpectedManifest;
}

function scoreCase(mapped: Record<string, unknown>, expected: ExpectedManifest): { pass: boolean; detail: string[] } {
  const detail: string[] = [];
  const basics = (mapped.basics ?? {}) as Record<string, unknown>;
  const expBasics = expected.basics ?? {};

  const checkText = (key: string, actual: string, exp: string | null | undefined, field: string): boolean => {
    if (!exp) {
      detail.push(`${field}: expected null/absent — skip`);
      return true;
    }
    const a = norm(actual);
    const e = norm(exp);
    const ok = a !== '' && (a === e || a.includes(e) || e.includes(a));
    detail.push(`${field}: ${ok ? 'OK' : `MISS`} (expected "${exp}" ${ok ? 'in' : 'vs'} "${actual}")`);
    return ok;
  };

  const nameOk = checkText('name', String(basics.name ?? ''), expBasics.name, 'name');
  const emailOk = checkText('email', String(basics.email ?? ''), expBasics.email, 'email');
  const phoneActual = String(basics.phone ?? '');
  const expPhone = expBasics.phone;
  let phoneOk = true;
  if (!expPhone) {
    detail.push('phone: expected null/absent — skip');
  } else {
    const a = digitsOnly(phoneActual);
    const e = digitsOnly(expPhone);
    phoneOk = a !== '' && (a === e || a.includes(e) || e.includes(a));
    detail.push(`phone: ${phoneOk ? 'OK' : `MISS`} (expected ${e} vs "${phoneActual}")`);
  }
  const labelOk = checkText('label', String(basics.label ?? ''), expBasics.label, 'label');
  const cityOk = checkText('city', String((basics.location as Record<string, unknown> | undefined)?.city ?? ''), expBasics.city, 'city');

  // 计数比对（容差）
  const counts = mapped;
  const expCounts = expected.counts ?? {};
  const tol = expected.countTolerance ?? DEFAULT_TOLERANCE;
  const countKeys: Array<keyof typeof expCounts> = ['education', 'work', 'projects', 'skills', 'awards'];
  let countPass = 0;
  let countTotal = 0;
  for (const key of countKeys) {
    if (expCounts[key] === undefined) continue;
    countTotal++;
    const actual = Number(((counts as Record<string, unknown>)[key] as unknown[] | undefined)?.length ?? 0);
    const diff = Math.abs(actual - (expCounts[key] ?? 0));
    const ok = diff <= tol;
    if (ok) countPass++;
    detail.push(`count.${key}: ${ok ? 'OK' : `MISS`} (expected ${expCounts[key]}±${tol}, got ${actual})`);
  }
  const countsOk = countTotal === 0 || countPass / countTotal >= 0.6;

  detail.push(`counts: ${countPass}/${countTotal} within tolerance`);
  const pass = nameOk && emailOk && phoneOk && labelOk && cityOk && countsOk;
  return { pass, detail };
}

/* ------------------------------------------------------------------ */
/*  主流程                                                             */
/* ------------------------------------------------------------------ */

function parseArgs(): { fixturesOnly: boolean; provider?: string; pdf?: string; strict: boolean; keysFile?: string } {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const i = args.indexOf(flag);
    return i >= 0 && i + 1 < args.length ? args[i + 1] : undefined;
  };
  return {
    fixturesOnly: args.includes('--fixtures-only'),
    provider: get('--provider'),
    pdf: get('--pdf'),
    strict: args.includes('--strict'),
    keysFile: get('--keys-file'),
  };
}

/** 从 KEY=VALUE 文件读取 API key（与 --keys-file 配套，避免 key 进入 shell 历史） */
function readKeysFromFile(file: string): { opencode?: string; qwen?: string } {
  const out: { opencode?: string; qwen?: string } = {};
  const raw = fs.readFileSync(file, 'utf-8');
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.+?)\s*$/);
    if (!m) continue;
    const [_, k, v] = m;
    const key = k.toUpperCase();
    if (key === 'OPENCODE_API_KEY' || key === 'QWEN_API_KEY') {
      out[key === 'OPENCODE_API_KEY' ? 'opencode' : 'qwen'] = v;
    }
  }
  return out;
}

async function main(): Promise<void> {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const opts = parseArgs();
  const pdfs = fs.readdirSync(RESUME_DIR).filter((f) => f.endsWith('.pdf')).sort();

  if (opts.pdf) {
    const wantedPieces = opts.pdf.split(',').map((s) => s.trim()).filter(Boolean);
    const wanted = pdfs.filter((f) => wantedPieces.some((p) => f.includes(p)));
    if (wanted.length === 0) {
      console.error(`no PDF matches --pdf ${opts.pdf}; available: ${pdfs.join(', ')}`);
      process.exitCode = 1;
      return;
    }
    pdfs.length = 0;
    pdfs.push(...wanted);
  }

  // 获取 provider 运行配置（key 优先级：环境变量 > --keys-file 文件）
  const fileKeys = opts.keysFile ? readKeysFromFile(opts.keysFile) : {};
  const opencodeKey = process.env.OPENCODE_API_KEY?.trim() || fileKeys.opencode?.trim() || '';
  const qwenKey = process.env.QWEN_API_KEY?.trim() || fileKeys.qwen?.trim() || '';
  const providers: ProviderRun[] = [
    {
      id: 'qwen',
      baseUrl: qwenInline.defaultApiUrl,
      model: process.env.QWEN_MODEL?.trim() || qwenInline.recommendedModel,
      apiKey: qwenKey,
    },
    {
      id: 'opencode',
      baseUrl: opencodePreset.defaultApiUrl,
      relay: opencodePreset.relay,
      model: process.env.OPENCODE_MODEL?.trim() || opencodePreset.recommendedModel,
      apiKey: opencodeKey,
    },
  ].filter((p) => !opts.provider || p.id === opts.provider);

  if (providers.length === 0) {
    console.error(`unknown provider: ${opts.provider}`);
    process.exitCode = 1;
    return;
  }

  if (!opts.fixturesOnly) {
    const missing = providers.filter((p) => !p.apiKey);
    for (const p of missing) {
      console.error(`missing env key for provider '${p.id}' (set ${p.id.toUpperCase()}_API_KEY)`);
    }
    if (missing.length > 0) {
      process.exitCode = 1;
      return;
    }
  }

  console.log(`PDFs: ${pdfs.length} | providers: ${providers.map((p) => `${p.id}(${p.model})`).join(', ')} | fixturesOnly: ${opts.fixturesOnly}\n`);

  const results: CaseResult[] = [];

  for (const pdf of pdfs) {
    const filePath = path.join(RESUME_DIR, pdf);
    const isNegative = /negative/i.test(pdf);

    // ── 提取阶段（所有 PDF 都必须跑）──
    let extracted: { text: string; chars: number; ms: number };
    let extractError: string | undefined;
    try {
      extracted = await extractText(filePath);
    } catch (e) {
      extractError = e instanceof Error ? e.message : String(e);
      if (!isNegative) {
        results.push({ pdf, provider: '-', model: '-', chars: 0, extractMs: 0, aiMs: 0, httpStatus: null, extractError, aiOk: false, jsonOk: false, mapped: null, score: null, pass: false });
        console.log(`[FAIL] ${pdf} extraction error: ${extractError}`);
        continue;
      }
      // 负例：提取失败 = 预期行为 → PASS（不调 AI）
      results.push({ pdf, provider: '-', model: '-', chars: 0, extractMs: 0, aiMs: 0, httpStatus: null, extractError, aiOk: false, jsonOk: false, mapped: null, score: { guard: 'extraction rejected (<50 chars)' }, pass: true });
      console.log(`[PASS] ${pdf} negative-case guard OK: ${extractError}`);
      continue;
    }

    if (isNegative) {
      results.push({ pdf, provider: '-', model: '-', chars: extracted.chars, extractMs: extracted.ms, aiMs: 0, httpStatus: null, aiOk: false, jsonOk: false, mapped: null, score: { guard: 'negative case unexpectedly extractable' }, pass: false });
      console.log(`[FAIL] ${pdf} negative case extractable (${extracted.chars} chars) — should be rejected`);
      continue;
    }

    if (opts.fixturesOnly) {
      results.push({ pdf, provider: '-', model: '-', chars: extracted.chars, extractMs: extracted.ms, aiMs: 0, httpStatus: null, aiOk: false, jsonOk: false, mapped: null, score: { fixture: extracted.chars }, pass: true });
      console.log(`[OK]   ${pdf} extractable (${extracted.chars} chars, ${extracted.ms}ms)`);
      continue;
    }

    // ── AI 阶段（每 provider 各跑一遍）──
    const expected = loadExpected(pdf);
    for (const provider of providers) {
      const base: CaseResult = {
        pdf, provider: provider.id, model: provider.model,
        chars: extracted.chars, extractMs: extracted.ms, aiMs: 0, httpStatus: null,
        aiOk: false, jsonOk: false, mapped: null, score: null, pass: false,
      };
      try {
        const ai = await chatCompletion(provider, [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt(extracted.text) },
        ]);
        base.httpStatus = ai.status;
        base.aiMs = ai.ms;
        if (ai.status !== 200) {
          base.extractError = `HTTP ${ai.status}: ${ai.text}`;
          console.log(`[FAIL] ${pdf} x ${provider.id} HTTP ${ai.status}: ${ai.text}`);
          results.push(base);
          continue;
        }
        base.aiOk = true;

        const aiJson = extractJSON(ai.text);
        if (!isValidAIResumeData(aiJson)) {
          base.extractError = 'AI data invalid (missing basics/work/education/projects/skills)';
          console.log(`[FAIL] ${pdf} x ${provider.id} invalid AI data`);
          results.push(base);
          continue;
        }
        base.jsonOk = true;

        const mapped = mapAIJsonToResume(aiJson) as unknown as Record<string, unknown>;
        base.mapped = mapped;

        // 落盘
        const tag = `${pdf.replace(/\.pdf$/, '')}-${provider.id}`;
        fs.writeFileSync(path.join(OUT_DIR, `${tag}.ai.json`), JSON.stringify(aiJson, null, 2));
        fs.writeFileSync(path.join(OUT_DIR, `${tag}.mapped.json`), JSON.stringify(mapped, null, 2));
        fs.writeFileSync(path.join(OUT_DIR, `${tag}.meta.json`), JSON.stringify({
          pdf, provider: provider.id, model: provider.model, chars: extracted.chars,
          extractMs: extracted.ms, aiMs: ai.ms, httpStatus: ai.status,
        }, null, 2));

        let score: { pass: boolean; detail: string[] } | null = null;
        if (expected) {
          score = scoreCase(mapped as Record<string, unknown>, expected);
          base.score = { pass: score.pass, detail: score.detail };
          base.pass = score.pass;
        } else {
          base.pass = true;
          base.score = { pass: true, detail: ['no manifest — flow only'] };
        }
        const counts = { edu: (mapped.education as unknown[] | undefined)?.length ?? 0, work: (mapped.work as unknown[] | undefined)?.length ?? 0, proj: (mapped.projects as unknown[] | undefined)?.length ?? 0, skills: (mapped.skills as unknown[] | undefined)?.length ?? 0, awards: (mapped.awards as unknown[] | undefined)?.length ?? 0 };
        console.log(`${base.pass ? '[PASS]' : '[FAIL]'} ${pdf} x ${provider.id} (${provider.model}) chars=${extracted.chars} aiMs=${ai.ms} | basics: ${String((mapped.basics as Record<string, unknown> | undefined)?.name ?? '').slice(0, 18)} | counts: ${JSON.stringify(counts)}`);
        if (score && !score.pass) {
          for (const d of score.detail) console.log(`         ${d}`);
        }
      } catch (e) {
        base.extractError = e instanceof Error ? e.message : String(e);
        console.log(`[FAIL] ${pdf} x ${provider.id} error: ${base.extractError}`);
      }
      results.push(base);
    }
  }

  // ── 汇总 ──
  console.log('\n=== summary ===');
  const cases = results.filter((r) => r.provider !== '-');
  const passCases = cases.filter((r) => r.pass);
  const fixtures = results.filter((r) => r.provider === '-');
  console.log(`fixtures: ${fixtures.filter((r) => r.pass).length}/${fixtures.length} extraction OK`);
  console.log(`AI cases: ${passCases.length}/${cases.length} PASS`);
  for (const r of results) {
    console.log(`  [${r.pass ? 'PASS' : 'FAIL'}] ${r.pdf} ${r.provider === '-' ? '' : `x ${r.provider} (${r.model})`} ${r.extractError ? `— ${r.extractError}` : ''}`);
  }

  if (opts.strict && (passCases.length !== cases.length || fixtures.some((r) => !r.pass))) {
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error('harness crashed:', e);
  process.exitCode = 1;
});