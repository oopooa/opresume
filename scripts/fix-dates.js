import fs from 'fs';

const data = JSON.parse(fs.readFileSync('data/resume.json', 'utf-8'));

// 修复 work
data.work?.forEach(item => {
  if (item.startDate && !item.endDate) {
    item.endDate = '';
  }
});

// 修复 projects
data.projects?.forEach(item => {
  if (item.startDate && !item.endDate) {
    item.endDate = '';
  }
});

fs.writeFileSync('data/resume.json', JSON.stringify(data, null, 2));
console.log('✅ 日期字段已修复');
