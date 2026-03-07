/**
 * 隐私打码工具函数
 *
 * 仅影响渲染层，不修改存储数据。
 * 根据字段类型应用不同的打码规则，保留部分可辨识字符。
 */

/** 用 * 替换字符串指定区间 */
function replaceRange(str: string, start: number, end: number): string {
  return str.slice(0, start) + '*'.repeat(Math.max(0, end - start)) + str.slice(end);
}

/** 姓名：保留首字，其余替换为 * */
function maskName(value: string): string {
  if (value.length <= 1) return value;
  return replaceRange(value, 1, value.length);
}

/** 手机号：保留前 3 位，其余替换为 * */
function maskMobile(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 3) return value;
  const masked = digits.slice(0, 3) + '*'.repeat(digits.length - 3);
  let di = 0;
  return Array.from(value)
    .map((ch) => (/\d/.test(ch) ? masked[di++] ?? ch : ch))
    .join('');
}

/** 邮箱：@ 前保留前 2 字符，其余替换为 * */
function maskEmail(value: string): string {
  const atIdx = value.indexOf('@');
  if (atIdx <= 0) return value;
  const local = value.slice(0, atIdx);
  const domain = value.slice(atIdx);
  const keep = Math.min(2, local.length);
  return local.slice(0, keep) + '*'.repeat(Math.max(0, local.length - keep)) + domain;
}

/** 通用短文本：保留前 2 字符，其余替换为 * */
function maskGeneric(value: string): string {
  if (value.length <= 2) return value;
  return replaceRange(value, 2, value.length);
}

/** 学校：保留末尾，前面替换为 *（如 北京大学 → **大学） */
function maskSchool(value: string): string {
  if (value.length <= 2) return '*'.repeat(value.length);
  return '*'.repeat(value.length - 2) + value.slice(-2);
}

/** 公司：仅保留最后 2 字，前面替换为 *（如 某某科技有限公司 → ******公司） */
function maskCompany(value: string): string {
  if (value.length <= 2) return '*'.repeat(value.length);
  return '*'.repeat(value.length - 2) + value.slice(-2);
}

/** 部门：全部替换为 * */
function maskFull(value: string): string {
  return '*'.repeat(value.length);
}

/** 打码规则映射 */
const MASK_RULES: Record<string, (v: string) => string> = {
  name: maskName,
  mobile: maskMobile,
  email: maskEmail,
  workPlace: maskGeneric,
  companyName: maskCompany,
  departmentName: maskFull,
  school: maskSchool,
};

/**
 * 对敏感字段进行打码
 *
 * @param value 原始值
 * @param fieldKey 字段标识，决定打码规则
 * @returns 打码后的字符串
 */
export function maskField(value: string, fieldKey: string): string {
  if (!value) return value;
  const rule = MASK_RULES[fieldKey];
  return rule ? rule(value) : value;
}
