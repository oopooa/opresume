/**
 * 校徽品牌解析器（浏览器端，零网络依赖）
 *
 * 输入学校名 → 输出 { logoUrl, color }：
 *   1. 内置精选高校品牌库 BRAND_DB（见 campus-brands-data.ts，由 tools/school_brand.py 生成）
 *   （原「维基百科运行时检索」已移除：校徽以用户上传为主，网络搜索只会引入不可控的
 *     时效性与跨域问题，且违背免后端纯前端的数据流。检索失败时既不显示校徽也不阻塞渲染。）
 *
 * 失败时返回空 logoUrl + 默认主色 ACCENT_FALLBACK（东华红 #A9021F）。
 */

import { BRAND_DB } from './campus-brands-data';

export interface SchoolBrand {
  logoUrl: string;
  color: string;
}

/** 无校徽/未命中时的默认主体色：模板默认红 #A9021F */
export const ACCENT_FALLBACK = '#A9021F';

function lookupDatabase(school: string): SchoolBrand | null {
  if (!school) return null;
  const exact = BRAND_DB[school];
  if (exact) return exact;
  // 宽松匹配：数据库键包含学校名（或反之）
  const s = school.replace(/[（(].*?[)）]/g, '').trim();
  for (const key of Object.keys(BRAND_DB)) {
    if (key === s || key.includes(s) || s.includes(key)) return BRAND_DB[key];
  }
  return null;
}

export async function resolveSchoolBrand(school: string): Promise<SchoolBrand> {
  const name = school.trim();
  const db = lookupDatabase(name);
  if (db) return db;
  return { logoUrl: '', color: ACCENT_FALLBACK };
}