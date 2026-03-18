import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataPath = path.join(__dirname, '../data/resume.json');
const backupPath = path.join(__dirname, '../data/resume.backup.json');

// 读取旧数据
if (!fs.existsSync(dataPath)) {
  console.log('❌ 未找到 data/resume.json 文件');
  process.exit(1);
}

const oldData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

// 检查是否已经是扩展格式
if (oldData.basics || oldData.work || oldData.education) {
  console.log('✅ 数据已经是扩展 JSON Resume 格式，无需迁移');
  process.exit(0);
}

// 备份旧数据
fs.writeFileSync(backupPath, JSON.stringify(oldData, null, 2));
console.log(`📦 旧数据已备份到: ${backupPath}`);

// 转换为新格式
const newData = convertToExtendedJSONResume(oldData);

// 写入新数据
fs.writeFileSync(dataPath, JSON.stringify(newData, null, 2));

console.log('✅ 数据迁移完成！');
console.log('📄 新格式已保存到: data/resume.json');

// 转换函数（简化版）
function convertToExtendedJSONResume(config) {
  return {
    $schema: 'https://raw.githubusercontent.com/jsonresume/resume-schema/master/schema.json',
    basics: {
      name: config.profile?.name || '',
      label: config.profile?.positionTitle,
      image: config.avatar?.src,
      email: config.profile?.email,
      phone: config.profile?.mobile,
      summary: stripHtml(config.aboutme?.aboutmeDesc),
      location: config.profile?.workPlace ? { city: config.profile.workPlace } : undefined,
    },
    work: config.workExpList?.map(w => ({
      name: w.companyName,
      position: config.profile?.positionTitle,
      startDate: formatDate(w.workTime?.[0]),
      endDate: formatDate(w.workTime?.[1]),
      summary: stripHtml(w.workDesc),
      highlights: parseHtmlToList(w.workDesc),
      'x-op-id': w.id,
      'x-op-departmentName': w.departmentName,
      'x-op-workDescHtml': w.workDesc,
    })),
    education: config.educationList?.map(e => ({
      institution: e.school,
      area: e.major,
      studyType: e.academicDegree,
      startDate: formatDate(e.eduTime?.[0]),
      endDate: formatDate(e.eduTime?.[1]),
      'x-op-id': e.id,
    })),
    projects: [
      ...(config.projectList?.map(p => ({
        name: p.projectName,
        description: p.projectDesc,
        highlights: parseHtmlToList(p.projectContent),
        startDate: formatDate(p.projectTime?.[0]),
        endDate: formatDate(p.projectTime?.[1]),
        roles: p.projectRole ? [p.projectRole] : undefined,
        'x-op-id': p.id,
        'x-op-type': 'project',
        'x-op-projectContentHtml': p.projectContent,
      })) || []),
      ...(config.workList?.map(w => ({
        name: w.workName,
        description: w.workDesc,
        url: w.visitLink,
        'x-op-id': w.id,
        'x-op-type': 'portfolio',
      })) || []),
    ],
    skills: config.skillList?.map(s => ({
      name: s.skillName,
      level: convertSkillLevel(s.skillLevel),
      'x-op-id': s.id,
      'x-op-skillLevel': s.skillLevel,
    })),
    awards: config.awardList?.map(a => ({
      title: a.awardInfo,
      date: a.awardTime,
      'x-op-id': a.id,
    })),
    'x-op-avatar': config.avatar,
    'x-op-birthday': config.profile?.birthday,
    'x-op-ageHidden': config.profile?.ageHidden,
    'x-op-workExpYear': config.profile?.workExpYear,
    'x-op-customFields': config.profile?.customFields,
    'x-op-aboutmeHtml': config.aboutme?.aboutmeDesc,
    'x-op-moduleLayout': config.moduleLayout,
    'x-op-moduleHidden': config.moduleHidden,
    'x-op-titleNameMap': config.titleNameMap,
  };
}

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
}

function parseHtmlToList(html) {
  if (!html) return [];
  const matches = html.match(/<li>(.*?)<\/li>/g);
  return matches?.map(m => m.replace(/<\/?li>/g, '').trim()) || [];
}

function formatDate(date) {
  if (!date || date === '至今') return undefined;
  return date.replace(/\./g, '-');
}

function convertSkillLevel(level) {
  if (!level) return 'Intermediate';
  if (level <= 30) return 'Beginner';
  if (level <= 60) return 'Intermediate';
  if (level <= 85) return 'Advanced';
  return 'Master';
}
