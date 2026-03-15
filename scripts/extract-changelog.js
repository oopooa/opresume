import { readFileSync } from 'node:fs';

const changelog = readFileSync('CHANGELOG.md', 'utf8');
// 按版本标题分割，取第一个版本块
const latest = changelog.split(/(?=^## v)/m).find(s => /^## v/.test(s));

if (latest) {
  // 移除版本标题行，只保留正文内容
  const content = latest.replace(/^## v.*\n/, '').trim();
  process.stdout.write(content);
}
