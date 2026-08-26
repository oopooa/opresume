/**
 * 校徽图片工具（浏览器端，零网络依赖）
 *
 * - loadSchoolLogoImage: 加载校徽图片（data URL 直连；远程 URL 走 crossOrigin，
 *   以便 Canvas 无污染读取像素）
 * - extractAccentColorFromImage: 从校徽图片提取主底色（#RRGGBB）
 *
 * 提取算法（先排除空白，再压成“深墨”主色，参照原 DHU 模板的深红色条）：
 *   1. 最近邻降采样到最长边 ≤ 96px 的小画布（关闭平滑，保留校徽图形本身的纯色“墨点”，
 *      避免细线稿与白色/透明边缘混色后把平均色拉浅）
 *   2. 空白背景检测：采样图片外圈 2px 环，多数派颜色视为背景色；
 *      背景为近白/近透明时，将该背景色（含容差）的像素整体排除 —— 避免白色底把
 *      统计结果拉向浅色，保证取到的是校徽图形本身的“墨色”
 *   3. 逐像素过滤：透明、近黑、近白、低饱和灰
 *   4. 15° 色相桶量化；桶内按 不透明度 × 深度 加权累计（深色不透明像素占主导），
 *      再按 像素数 × (0.35 + 平均饱和度) 取主色
 *   5. HSL 压深：明度上限 0.33、最低饱和度 0.78 —— 产出与原模板一致的深红墨色（深且饱和）
 *   6. 有效彩色像素过少（纯空白/纯色图）→ 返回 null，由调用方回退默认色
 */
import { ACCENT_FALLBACK } from './campus-brands';

/** 降采样画布最长边（px） */
const MAX_DIM = 96;
/** 空白背景容差（RGB 欧氏距离） */
const BG_TOLERANCE = 42;
/** 背景判定：平均通道 ≥ 该值时视为近白背景 */
const BG_LIGHT_THRESHOLD = 238;

interface Rgb { r: number; g: number; b: number; a: number }

/** 加载图片（失败时 reject） */
export function loadSchoolLogoImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('IMAGE_LOAD_FAILED'));
    img.src = src;
  });
}

function rgbDistance(a: Rgb, b: Rgb): number {
  const dr = a.r - b.r, dg = a.g - b.g, db = a.b - b.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/** 像素是否“贴近”背景色（含容差） */
function nearBackground(p: Rgb, bg: Rgb): boolean {
  return rgbDistance(p, bg) <= BG_TOLERANCE;
}

/** 将主色压成深色、高饱和、不透明的“墨色”（参照原模板的深色主色条） */
function darkenColor(
  hex: string,
  lightnessFactor = 0.8,
  lightnessCap = 0.33,
  minLightness = 0.14,
  minSaturation = 0.78,
): string {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return hex;

  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }

  // “深墨化”：明度只降不抬（保留本来就深的原色），并收敛到深色区间；饱和度补足到下限
  const newL = l < minLightness ? l : Math.min(l * lightnessFactor, lightnessCap);
  const newS = Math.max(s, minSaturation);

  const hueToRgb = (p: number, q: number, t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };

  const q = newL < 0.5 ? newL * (1 + newS) : newL + newS - newL * newS;
  const p = 2 * newL - q;
  const rr = hueToRgb(p, q, h + 1 / 3);
  const gg = hueToRgb(p, q, h);
  const bb = hueToRgb(p, q, h - 1 / 3);

  const toHex = (v: number) => Math.round(Math.max(0, Math.min(1, v)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `#${toHex(rr)}${toHex(gg)}${toHex(bb)}`;
}

/** 从校徽图片提取主底色；失败或纯空白时返回 null */
export function extractAccentColorFromImage(img: HTMLImageElement): string | null {
  try {
    const ratio = Math.min(1, MAX_DIM / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * ratio));
    const h = Math.max(1, Math.round(img.naturalHeight * ratio));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    // 最近邻采样：保留校徽纯色墨点，避免平滑降采样把细线稿混成浅色
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0, w, h);
    const { data } = ctx.getImageData(0, 0, w, h);

    const pixels: Rgb[] = [];
    for (let i = 0; i < data.length; i += 4) {
      pixels.push({ r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] });
    }
    if (pixels.length === 0) return null;

    /* ---- 2. 空白背景检测：外圈 2px 环多数派颜色 ---- */
    const ring: Rgb[] = [];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (x < 2 || y < 2 || x >= w - 2 || y >= h - 2) ring.push(pixels[y * w + x]);
      }
    }

    // 环形像素量化（每通道 16 级）统计多数派
    const ringBuckets = new Map<number, { sum: number; n: number }>();
    for (const p of ring) {
      if (p.a < 120) continue; // 透明环 → 按“透明空白背景”处理（不参与背景色判定）
      const key = ((p.r >> 4) << 8) | ((p.g >> 4) << 4) | (p.b >> 4);
      const prev = ringBuckets.get(key);
      if (prev) { prev.sum += p.r + p.g + p.b; prev.n += 1; }
      else ringBuckets.set(key, { sum: p.r + p.g + p.b, n: 1 });
    }

    let background: Rgb | null = null;
    let bgTopN = 0;
    for (const [key, b] of ringBuckets) {
      if (b.n > bgTopN) {
        bgTopN = b.n;
        background = {
          r: ((key >> 8) & 0xf) * 16 + 8,
          g: ((key >> 4) & 0xf) * 16 + 8,
          b: (key & 0xf) * 16 + 8,
          a: 255,
        };
      }
    }

    // 背景近白（外圈基本是白色）或外圈全透明 → 视为“空白背景”，需把与该背景相近的像素排除；
    // 近黑/深色底（如深蓝校徽底）是常见墨色，不属于空白，不排除。
    const blankBackground = background === null ||
      (background.r + background.g + background.b) / 3 >= BG_LIGHT_THRESHOLD;

    /* ---- 3/4. 过滤 + 色相桶量化 ---- */
    const buckets = new Map<number, { r: number; g: number; b: number; n: number; s: number }>();
    let useful = 0;
    for (const p of pixels) {
      if (p.a < 120) continue; // 透明排除
      if (blankBackground && background && nearBackground(p, background)) continue; // 空白背景排除
      const max = Math.max(p.r, p.g, p.b) / 255;
      const min = Math.min(p.r, p.g, p.b) / 255;
      const l = (max + min) / 2;
      if (l < 0.14 || l > 0.9) continue; // 近黑 / 近白像素排除
      let s = 0;
      if (max - min > 1e-6) s = (max - min) / (1 - Math.abs(2 * l - 1));
      if (s < 0.16) continue; // 近灰排除
      let hue = 0;
      const delta = max - min;
      if (delta > 1e-6) {
        if (max === p.r / 255) hue = 60 * (((p.g / 255 - p.b / 255) / delta) % 6);
        else if (max === p.g / 255) hue = 60 * ((p.b / 255 - p.r / 255) / delta + 2);
        else hue = 60 * ((p.r / 255 - p.g / 255) / delta + 4);
        if (hue < 0) hue += 360;
      }
      // 按 不透明度 × 深度 加权：深色不透明像素（墨色核心）比浅色边缘像素更主导
      const weight = (p.a / 255) * (1.6 - l);
      const bucket = Math.round(hue / 15);
      const prev = buckets.get(bucket);
      if (prev) {
        prev.r += p.r * weight; prev.g += p.g * weight; prev.b += p.b * weight;
        prev.n += weight; prev.s += s * weight;
      } else {
        buckets.set(bucket, { r: p.r * weight, g: p.g * weight, b: p.b * weight, n: weight, s: s * weight });
      }
      useful += 1;
    }

    // 有效彩色像素过少（纯空白 / 纯色 / 几乎无内容）→ 无主色可提取
    if (useful < 12) return null;

    let best: { r: number; g: number; b: number; n: number } | null = null;
    let bestScore = 0;
    for (const b of buckets.values()) {
      const avgS = b.s / b.n;
      const score = b.n * (0.35 + avgS);
      if (score > bestScore) { bestScore = score; best = b; }
    }
    if (!best) return null;

    const r = Math.round(best.r / best.n);
    const g = Math.round(best.g / best.n);
    const b = Math.round(best.b / best.n);
    const raw = `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
    return darkenColor(raw);
  } catch {
    // Canvas 被污染（远程图片未开 CORS）或其它异常 → 调用方回退默认色
    return null;
  }
}

/** 便捷：给定图片 src（data URL 或远程 URL），异步解析主底色 */
export async function extractAccentColorFromSrc(src: string): Promise<string | null> {
  try {
    const img = await loadSchoolLogoImage(src);
    return extractAccentColorFromImage(img);
  } catch {
    return null;
  }
}

export { ACCENT_FALLBACK };