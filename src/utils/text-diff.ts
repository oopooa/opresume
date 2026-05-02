type DiffSegment = { type: 'equal' | 'delete' | 'insert'; text: string };

export function extractText(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent ?? '';
}

function tokenize(text: string): string[] {
  const tokens: string[] = [];
  const re =
    /[一-鿿㐀-䶿＀-￯　-〿]|[a-zA-Z0-9']+|[^a-zA-Z0-9'一-鿿㐀-䶿＀-￯　-〿]+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) tokens.push(m[0]);
  return tokens;
}

function lcs(a: string[], b: string[]): number[][] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp;
}

function wordDiff(original: string, modified: string): DiffSegment[] {
  const origTokens = tokenize(original);
  const modTokens = tokenize(modified);
  const dp = lcs(origTokens, modTokens);

  const ops: DiffSegment[] = [];
  let i = origTokens.length;
  let j = modTokens.length;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && origTokens[i - 1] === modTokens[j - 1]) {
      ops.push({ type: 'equal', text: origTokens[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.push({ type: 'insert', text: modTokens[j - 1] });
      j--;
    } else {
      ops.push({ type: 'delete', text: origTokens[i - 1] });
      i--;
    }
  }
  ops.reverse();

  const merged: DiffSegment[] = [];
  for (const op of ops) {
    const last = merged[merged.length - 1];
    if (last && last.type === op.type) last.text += op.text;
    else merged.push({ ...op });
  }
  return merged;
}

/**
 * 在保留 polished HTML 完整结构（列表、加粗等）的前提下，
 * 将新增文字用 Tailwind className 包裹的 span 高亮，将删除文字以删除线 span 注入到对应位置。
 * 返回可直接用 dangerouslySetInnerHTML 渲染的 HTML 字符串。
 *
 * 样式不依赖任何全局 CSS：暗/亮模式都靠 Tailwind utility class 表达，避免 index.css 全局选择器污染。
 */
const DIFF_INSERT_CLASS =
  'rounded-[2px] bg-emerald-50 text-emerald-600 dark:bg-emerald-700/25 dark:text-emerald-400';
const DIFF_DELETE_CLASS =
  'rounded-[2px] line-through opacity-55 text-red-500 dark:text-red-300';

export function applyInlineDiff(originalHtml: string, polishedHtml: string): string {
  const originalText = extractText(originalHtml);
  const polishedText = extractText(polishedHtml);
  const segments = wordDiff(originalText, polishedText);

  // 构建 polished text 每个字符的状态，以及每个位置需要注入的删除文字
  const insertMask = new Uint8Array(polishedText.length);
  const deletesAt = new Map<number, string>(); // 在 polished text 的某位置之前需要插入的删除文字

  let pos = 0;
  for (const seg of segments) {
    if (seg.type === 'insert') {
      for (let i = 0; i < seg.text.length; i++) {
        if (pos + i < insertMask.length) insertMask[pos + i] = 1;
      }
      pos += seg.text.length;
    } else if (seg.type === 'delete') {
      deletesAt.set(pos, (deletesAt.get(pos) ?? '') + seg.text);
      // delete 不推进 pos
    } else {
      pos += seg.text.length;
    }
  }

  const div = document.createElement('div');
  div.innerHTML = polishedHtml;

  let textPos = 0;
  const nodeInfos: Array<{ node: Text; start: number }> = [];
  const walker = document.createTreeWalker(div, NodeFilter.SHOW_TEXT);
  let cur: Node | null;
  while ((cur = walker.nextNode()) !== null) {
    const t = cur as Text;
    nodeInfos.push({ node: t, start: textPos });
    textPos += (t.textContent ?? '').length;
  }

  for (let ni = nodeInfos.length - 1; ni >= 0; ni--) {
    const { node: textNode, start } = nodeInfos[ni];
    const text = textNode.textContent ?? '';

    let needsChange = false;
    for (let i = 0; i <= text.length && !needsChange; i++) {
      const absPos = start + i;
      if (i < text.length && insertMask[absPos] === 1) needsChange = true;
      if (deletesAt.has(absPos)) needsChange = true;
    }
    if (!needsChange) continue;

    const frag = document.createDocumentFragment();
    let chunkStart = 0;
    let curIsInsert = text.length > 0 ? insertMask[start] === 1 : false;

    const flushChunk = (end: number) => {
      if (end <= chunkStart) return;
      const chunk = text.slice(chunkStart, end);
      if (curIsInsert) {
        const span = document.createElement('span');
        span.className = DIFF_INSERT_CLASS;
        span.textContent = chunk;
        frag.appendChild(span);
      } else {
        frag.appendChild(document.createTextNode(chunk));
      }
      chunkStart = end;
    };

    const appendDelete = (delText: string) => {
      const span = document.createElement('span');
      span.className = DIFF_DELETE_CLASS;
      span.textContent = delText;
      frag.appendChild(span);
    };

    for (let i = 0; i <= text.length; i++) {
      const absPos = start + i;

      // 在当前位置注入删除内容（在正文之前）
      const delText = deletesAt.get(absPos);
      if (delText) {
        flushChunk(i);
        appendDelete(delText);
      }

      if (i === text.length) break;

      const nextIsInsert = insertMask[absPos] === 1;
      if (nextIsInsert !== curIsInsert) {
        flushChunk(i);
        curIsInsert = nextIsInsert;
      }
    }

    flushChunk(text.length);

    textNode.parentNode!.replaceChild(frag, textNode);
  }

  return div.innerHTML;
}

/**
 * 统计 HTML 中的可见字符数（去除 HTML 标签、折叠连续空白）。
 * 用于字符级的统计与差异百分比，避免混用"CJK 按字 / 英文按词"口径导致
 * "2026 年"（4 数字 + 1 CJK）与单词 "and" 同样计为 1 的失真。
 */
export function countWords(html: string): number {
  const text = extractText(html).trim();
  if (!text) return 0;
  const normalized = text.replace(/\s+/g, ' ');
  return Array.from(normalized).length;
}
