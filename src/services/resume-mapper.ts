/**
 * AI 返回的 JSON 数据 → ExtendedJSONResume 格式映射
 *
 * 采用宽松映射策略：缺失字段使用默认值，格式错误尝试修复，
 * 确保即使 AI 返回不完美的数据也能正常工作。
 */

import type { ExtendedJSONResume } from '@/types/extended-json-resume';

/**
 * 将 AI 返回的 JSON 映射为 ExtendedJSONResume 格式
 * @param aiJson AI 解析的简历数据（类型未知，需要容错处理）
 * @returns 标准化的简历数据
 */
export function mapAIJsonToResume(aiJson: unknown): ExtendedJSONResume {
  if (!aiJson || typeof aiJson !== 'object' || Array.isArray(aiJson)) {
    throw new Error('无效的数据格式');
  }

  const data = aiJson as Record<string, unknown>;

  const basics = extractBasics(data.basics);
  const work = extractWorkList(data.work);
  const education = extractEducationList(data.education);
  const projects = extractProjectList(data.projects);
  const skills = extractSkillList(data.skills);
  const awards = extractAwardList(data.awards);

  const result: ExtendedJSONResume = {
    basics,
  };

  // 只添加非空数组
  if (work.length > 0) result.work = work;
  if (education.length > 0) result.education = education;
  if (projects.length > 0) result.projects = projects;
  if (skills.length > 0) result.skills = skills;
  if (awards.length > 0) result.awards = awards;

  // 自我评价存储为 HTML（兼容数组和字符串）
  const rawBasics = data.basics as Record<string, unknown> | undefined;
  const aboutmeHtml = rawBasics ? toListHtml(rawBasics.summary) || toListHtml(rawBasics.about) || toListHtml(rawBasics.bio) : undefined;
  if (aboutmeHtml) {
    result['x-op-aboutmeHtml'] = aboutmeHtml;
  }

  // 工作年限
  if (rawBasics) {
    const workExpYear = asString(rawBasics.workExpYear) || asString(rawBasics.yearsOfExperience);
    if (workExpYear) {
      result['x-op-workExpYear'] = workExpYear.replace(/[^\d.]/g, '');
    }
  }

  // 额外联系方式 → x-op-customFields
  const customFields = extractCustomFields(rawBasics);
  if (customFields.length > 0) {
    result['x-op-customFields'] = customFields;
  }

  return result;
}

/**
 * 验证 AI 返回的数据是否包含最基本的信息
 */
export function isValidAIResumeData(data: unknown): boolean {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  const obj = data as Record<string, unknown>;
  // 至少需要 basics 或任意一个 section
  return !!(obj.basics || obj.work || obj.education || obj.projects || obj.skills);
}

// --- 内部辅助函数 ---

function generateId(): string {
  return crypto.randomUUID();
}

function formatDate(date?: unknown): string {
  if (!date || typeof date !== 'string') return '';
  const d = date.trim();
  if (!d) return '';

  // 处理"至今"/"present"
  if (d === '至今' || d.toLowerCase() === 'present' || d === '现在') return 'present';

  // 尝试匹配 YYYY-MM 格式
  const yyyyMmMatch = d.match(/^(\d{4})[年.\-/](\d{1,2})/);
  if (yyyyMmMatch) {
    return `${yyyyMmMatch[1]}-${yyyyMmMatch[2].padStart(2, '0')}`;
  }

  // 尝试匹配纯年份
  const yearMatch = d.match(/^(\d{4})/);
  if (yearMatch) {
    return `${yearMatch[1]}-01`;
  }

  return d;
}

function asString(val: unknown): string {
  if (typeof val === 'string') return val.trim();
  if (typeof val === 'number') return String(val);
  return '';
}

/** 兼容字符串和字符串数组，数组时拼接为换行分隔的纯文本 */
function asFlexString(val: unknown): string {
  if (typeof val === 'string') return val.trim();
  if (Array.isArray(val)) {
    return val.filter((v): v is string => typeof v === 'string' && v.trim() !== '').join('\n');
  }
  return '';
}

function asStringArray(val: unknown): string[] {
  if (!Array.isArray(val)) return [];
  return val.filter((v): v is string => typeof v === 'string' && v.trim() !== '');
}

/**
 * 将字符串数组或纯文本转为 <ul><li><p>...</p></li></ul> 格式的 HTML
 * 兼容 AI 返回数组或字符串两种情况
 */
function toListHtml(val: unknown): string | undefined {
  // 数组 → 每个元素一个 <li>
  if (Array.isArray(val)) {
    const items = val.filter((v): v is string => typeof v === 'string' && v.trim() !== '');
    if (items.length === 0) return undefined;
    const lis = items.map((item) => `<li><p>${item}</p></li>`).join('');
    return `<ul>${lis}</ul>`;
  }

  // 字符串 → 按换行符拆分为列表
  if (typeof val === 'string' && val.trim()) {
    const lines = val.split(/\n+/).map((l) => l.trim()).filter(Boolean);
    if (lines.length <= 1) {
      // 单行直接返回段落
      return lines[0] ? `<p>${lines[0]}</p>` : undefined;
    }
    const lis = lines.map((line) => `<li><p>${line}</p></li>`).join('');
    return `<ul>${lis}</ul>`;
  }

  return undefined;
}

function extractBasics(raw: unknown): NonNullable<ExtendedJSONResume['basics']> {
  if (!raw || typeof raw !== 'object') {
    return { name: '' };
  }

  const obj = raw as Record<string, unknown>;

  const location = obj.location;
  let city = '';
  if (typeof location === 'string') {
    city = location;
  } else if (location && typeof location === 'object') {
    const loc = location as Record<string, unknown>;
    city = asString(loc.city) || asString(loc.region) || asString(loc.address) || '';
  }

  return {
    name: asString(obj.name),
    email: asString(obj.email) || undefined,
    phone: asString(obj.phone) || asString(obj.tel) || asString(obj.mobile) || undefined,
    label: asString(obj.label) || asString(obj.title) || asString(obj.position) || undefined,
    summary: asFlexString(obj.summary) || asFlexString(obj.about) || asFlexString(obj.bio) || undefined,
    location: city ? { city } : undefined,
  };
}

function extractWorkList(raw: unknown): ExtendedJSONResume['work'] & object[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .filter((item) => {
      // 至少需要公司名或职位
      const name = asString(item.name) || asString(item.company) || asString(item.companyName);
      const position = asString(item.position) || asString(item.title) || asString(item.role);
      return !!(name || position);
    })
    .map((item) => {
      const summary = asString(item.summary) || asString(item.description) || asString(item.content);
      return {
        name: asString(item.name) || asString(item.company) || asString(item.companyName),
        position: asString(item.position) || asString(item.title) || asString(item.role),
        startDate: formatDate(item.startDate),
        endDate: formatDate(item.endDate),
        summary,
        highlights: asStringArray(item.highlights),
        'x-op-id': generateId(),
        'x-op-departmentName': asString(item.department) || asString(item.departmentName) || undefined,
        'x-op-workDescHtml': toListHtml(item.summary) || toListHtml(item.description) || toListHtml(item.content),
      };
    });
}

function extractEducationList(raw: unknown): ExtendedJSONResume['education'] & object[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .filter((item) => {
      const institution = asString(item.institution) || asString(item.school);
      return !!institution;
    })
    .map((item) => ({
      institution: asString(item.institution) || asString(item.school),
      area: asString(item.area) || asString(item.major) || asString(item.field),
      studyType: asString(item.studyType) || asString(item.degree),
      startDate: formatDate(item.startDate),
      endDate: formatDate(item.endDate),
      score: asString(item.score) || asString(item.gpa) || undefined,
      'x-op-id': generateId(),
    }));
}

function extractProjectList(raw: unknown): ExtendedJSONResume['projects'] & object[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .filter((item) => {
      const name = asString(item.name) || asString(item.projectName);
      return !!name;
    })
    .map((item) => {
      // description = 简短项目描述，content = 详细项目内容，两者分开映射
      const description = asString(item.description);
      return {
        name: asString(item.name) || asString(item.projectName),
        description: description || undefined,
        highlights: asStringArray(item.highlights),
        roles: asStringArray(item.roles) || (asString(item.role) ? [asString(item.role)] : undefined),
        startDate: formatDate(item.startDate),
        endDate: formatDate(item.endDate),
        'x-op-id': generateId(),
        'x-op-type': 'project' as const,
        'x-op-projectContentHtml': toListHtml(item.content) || toListHtml(item.details),
      };
    });
}

function extractSkillList(raw: unknown): ExtendedJSONResume['skills'] & object[] {
  if (!Array.isArray(raw)) return [];

  const items = raw.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object');

  // 判断是否为"技能标签+熟练度"格式：
  // 1. name 必须是简短标签（不超过 20 字符），不能是一句描述
  // 2. level 必须是纯粹的熟练度词（不超过 10 字符），不能是一句话
  const validItems = items.filter((item) => {
    const name = asString(item.name) || asString(item.skillName);
    const level = asString(item.level);
    if (!name) return false;
    // name 太长说明是描述性文本，不是技能标签
    if (name.length > 20) return false;
    // level 必须存在且是简短的熟练度关键词
    if (!level || level.length > 10) return false;
    return isValidSkillLevel(level);
  });

  if (validItems.length === 0) return [];

  return validItems.map((item) => {
    const level = asString(item.level);
    const normalizedLevel = normalizeSkillLevel(level);
    return {
      name: asString(item.name) || asString(item.skillName),
      level: normalizedLevel,
      keywords: asStringArray(item.keywords),
      'x-op-id': generateId(),
      'x-op-skillLevel': skillLevelToNumber(normalizedLevel),
    };
  });
}

function extractAwardList(raw: unknown): ExtendedJSONResume['awards'] & object[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .filter((item) => {
      const title = asString(item.title) || asString(item.name) || asString(item.awardInfo);
      return !!title;
    })
    .map((item) => ({
      title: asString(item.title) || asString(item.name) || asString(item.awardInfo),
      date: formatDate(item.date) || asString(item.awardTime) || undefined,
      awarder: asString(item.awarder) || asString(item.issuer) || undefined,
      'x-op-id': generateId(),
    }));
}

function normalizeSkillLevel(level: string): string {
  const l = level.toLowerCase();
  if (['master', '精通', '专家'].some((k) => l.includes(k))) return '精通';
  if (['advanced', '熟练', '高级'].some((k) => l.includes(k))) return '熟练';
  if (['beginner', '入门', '初级', '了解'].some((k) => l.includes(k))) return '了解';
  return '熟练';
}

/** 判断 level 值是否为有效的技能熟练度描述 */
function isValidSkillLevel(level: string): boolean {
  const l = level.toLowerCase();
  const keywords = ['精通', '熟练', '了解', '掌握', '熟悉', '入门', '初级', '高级', '专家',
    'master', 'advanced', 'intermediate', 'beginner', 'expert', 'proficient'];
  return keywords.some((k) => l.includes(k));
}

function skillLevelToNumber(level: string): number {
  switch (level) {
    case '了解': return 25;
    case '熟练': return 50;
    case '精通': return 95;
    default: return 50;
  }
}

/** basics 中已知字段之外的额外信息 → x-op-customFields */
function extractCustomFields(raw: unknown): Array<{ key: string; value: string }> {
  if (!raw || typeof raw !== 'object') return [];
  const obj = raw as Record<string, unknown>;

  const results: Array<{ key: string; value: string }> = [];

  // 1. AI 返回的 extraFields 数组
  if (Array.isArray(obj.extraFields)) {
    for (const item of obj.extraFields) {
      if (!item || typeof item !== 'object') continue;
      const f = item as Record<string, unknown>;
      const key = asString(f.key);
      const value = asString(f.value);
      if (key && value) {
        results.push({ key, value });
      }
    }
  }

  // 2. 标准 JSON Resume 字段中 OpResume 不直接支持的，也转为自定义字段
  const url = asString(obj.url) || asString(obj.website);
  if (url) results.push({ key: '个人网站', value: url });

  // profiles 数组（GitHub、LinkedIn 等）
  if (Array.isArray(obj.profiles)) {
    for (const p of obj.profiles) {
      if (!p || typeof p !== 'object') continue;
      const profile = p as Record<string, unknown>;
      const network = asString(profile.network);
      const profileUrl = asString(profile.url) || asString(profile.username);
      if (network && profileUrl) {
        results.push({ key: network, value: profileUrl });
      }
    }
  }

  return results;
}
