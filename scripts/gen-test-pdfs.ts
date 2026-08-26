/**
 * 生成 PDF 简历测试集（离线完成，无需网络）
 *
 * 产物目录：test-data/resumes/
 * - 01-dhu-cv-template.pdf        现有模板原稿（中文，1 页，技能为分类描述格式）
 * - 02-latex-multi-page.pdf       现有 LaTeX 简历（中文，2 页，提取含图标噪声，最难样本）
 * - 03-software-dev-en.pdf        手写英文：软件开发（逐条技能+熟练度）
 * - 04-product-analyst-en.pdf     手写英文：产品/数据分析（多年经验，多段工作）
 * - 05-academic-cv-en.pdf         手写英文：学术 CV（含出版与奖励）
 * - 06-fresh-grad-plain-en.pdf    手写英文：应届生弱排版（技能为叙述句→应被省略）
 * - 07-short-text-negative.pdf    负例：文本不足 50 字符，验证优雅失败
 *
 * 每份正例同时生成 <name>.expected.json（真值清单，供 harness 打分）。
 *
 * 运行：node scripts/gen-test-pdfs.ts
 * 幂等：重复运行会覆盖（重新生成/拷贝），可安全重跑。
 */
import fs from 'node:fs';
import path from 'node:path';

const WORKSPACE = path.resolve(import.meta.dirname, '../../');
const OUT_DIR = path.resolve(import.meta.dirname, '../test-data/resumes');

/* ------------------------------------------------------------------ */
/*  极简 PDF 生成器（单页、Helvetica、ASCII 文本，含正确 xref）        */
/* ------------------------------------------------------------------ */

function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function buildPdf(lines: string[]): Buffer {
  const ops: string[] = ['BT', '/F1 11 Tf', '46 790 Td'];
  for (const line of lines) {
    ops.push(`(${esc(line)}) Tj`);
    ops.push('0 -14 Td');
  }
  ops.push('ET');
  const stream = ops.join('\n') + '\n';

  const objects = [
    { n: 1, body: '<< /Type /Catalog /Pages 2 0 R >>' },
    { n: 2, body: '<< /Type /Pages /Kids [3 0 R] /Count 1 >>' },
    { n: 3, body: '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>' },
    { n: 4, body: `<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}endstream` },
    { n: 5, body: '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>' },
  ];

  let pdf = Buffer.from('%PDF-1.4\n');
  const offsets: number[] = [];
  for (const o of objects) {
    offsets[o.n] = pdf.length;
    pdf = Buffer.concat([pdf, Buffer.from(`${o.n} 0 obj\n${o.body}\nendobj\n`, 'utf8')]);
  }
  const xrefStart = pdf.length;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  xref += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  return Buffer.concat([pdf, Buffer.from(xref, 'utf8')]);
}

function writePdf(name: string, lines: string[]): void {
  const buf = buildPdf(lines);
  fs.writeFileSync(path.join(OUT_DIR, name), buf);
  console.log(`generated ${name} (${buf.length} bytes, ${lines.length} lines)`);
}

/* ------------------------------------------------------------------ */
/*  4 份手写英文简历 + 1 负例                                          */
/* ------------------------------------------------------------------ */

interface TestSample {
  name: string;
  lines: string[];
  expected: {
    basics: { name: string; email: string; phone: string; label?: string | null; city?: string | null };
    counts: { education: number; work: number; projects: number; skills: number; awards: number };
    notes?: string;
  };
}

const samples: TestSample[] = [
  {
    name: '03-software-dev-en.pdf',
    lines: [
      'Chen Yu',
      'Frontend Developer | Shanghai',
      'Email: chen.yu@outlook.com | Phone: +86 139 1234 5678 | GitHub: github.com/chenyu',
      '',
      'EDUCATION',
      'Donghua University, Software Engineering, Bachelor',
      '2020-09 - 2024-06',
      '',
      'WORK EXPERIENCE',
      'Alibaba Cloud, Frontend Engineer, 2022-06 - present',
      '- Built a design system with React and TypeScript, cutting UI development time by 30%',
      '- Led migration of legacy pages to Next.js and improved LCP by 40%',
      'ByteDance, Frontend Intern, 2021-06 - 2021-09',
      '- Developed dashboard components used by 20+ internal teams',
      '',
      'PROJECTS',
      'Open Source Resume Editor (2023-01 - 2023-06)',
      '- Live preview and JSON importer, 800+ GitHub stars',
      'Mini Chat App (2022-03 - 2022-05)',
      '- Real-time chat with WebSocket, 5k demo users in one month',
      '',
      'SKILLS',
      'JavaScript - 精通',
      'TypeScript - 熟练',
      'React - 熟练',
      'Node.js - 熟练',
      'CSS - 熟练',
      '',
      'AWARDS',
      'ACM-ICPC Regional Bronze Medal, 2022-11',
    ],
    expected: {
      basics: {
        name: 'Chen Yu',
        email: 'chen.yu@outlook.com',
        phone: '8613912345678',
        label: 'Frontend Developer',
        city: 'Shanghai',
      },
      counts: { education: 1, work: 2, projects: 2, skills: 5, awards: 1 },
      notes: '逐条“技能+熟练度”格式，skills 应完整提取；含 GitHub 简介（extraFields）。',
    },
  },
  {
    name: '04-product-analyst-en.pdf',
    lines: [
      'Emily Zhang',
      'Senior Product Analyst | 10 years of experience',
      'Email: emily.zhang@gmail.com | Phone: +1 415 555 0132 | Location: Beijing',
      '',
      'EDUCATION',
      'Fudan University, Master of Business Analytics, 2018-09 - 2020-06',
      'East China Normal University, Bachelor of Statistics, 2014-09 - 2018-06',
      '',
      'WORK EXPERIENCE',
      'Meituan, Senior Product Analyst, 2020-07 - present',
      '- Led A/B testing framework across 12 product lines, +8% conversion',
      'JD.com, Product Analyst, 2018-07 - 2020-06',
      '- Built user retention dashboards with SQL and Tableau',
      'Kuaishou, Data Analyst Intern, 2017-06 - 2017-09',
      '- Analyzed 10M+ daily events to support recommendation tuning',
      '',
      'SKILLS',
      'SQL - 精通',
      'Python - 熟练',
      'Tableau - 熟练',
      'A/B Testing - 熟练',
      '',
      'AWARDS',
      'Best Analyst Award, Meituan Data Team, 2022-12',
    ],
    expected: {
      basics: {
        name: 'Emily Zhang',
        email: 'emily.zhang@gmail.com',
        phone: '14155550132',
        label: 'Senior Product Analyst',
        city: 'Beijing',
      },
      counts: { education: 2, work: 3, projects: 0, skills: 4, awards: 1 },
      notes: '多年经验（3 段工作、2 段教育、10 年工作年限 → workExpYear）。',
    },
  },
  {
    name: '05-academic-cv-en.pdf',
    lines: [
      'Dr. Liu Min',
      'Research Scientist | Shanghai',
      'Email: liu.min@dhu.edu.cn | Phone: +86 21 5555 0123',
      '',
      'EDUCATION',
      'PhD, Mechanical Engineering, Shanghai Jiao Tong University, 2016-09 - 2021-06',
      'BS, Mechanical Engineering, Donghua University, 2012-09 - 2016-06',
      '',
      'RESEARCH EXPERIENCE',
      'Postdoctoral Researcher, DHU Robotics Lab, 2021-07 - present',
      '- Finite element analysis and topology optimization of robot joints',
      '',
      'PUBLICATIONS (selected)',
      'Liu M. et al. Lightweight design of robot joints via topology optimization, JMSE, 2024',
      'Liu M. et al. Dynamic analysis of flexible manipulators, Mechanism and Machine Theory, 2022',
      '',
      'AWARDS',
      'Best Paper Award, IFToMM World Congress 2023',
      'Excellent PhD Thesis, Shanghai Jiao Tong University, 2021',
      '',
      'SKILLS',
      'ANSYS - 精通',
      'MATLAB - 熟练',
      'Python - 熟练',
    ],
    expected: {
      basics: {
        name: 'Liu Min',
        email: 'liu.min@dhu.edu.cn',
        phone: '862155550123',
        label: 'Research Scientist',
        city: 'Shanghai',
      },
      counts: { education: 2, work: 1, projects: 0, skills: 3, awards: 2 },
      notes: '学术 CV：Publications 不在标准 chunks 内，应被忽略或进入 extraFields；重点核对教育与奖励。',
    },
  },
  {
    name: '06-fresh-grad-plain-en.pdf',
    lines: [
      'Sun Hao',
      'sun.hao@163.com | 138 0000 1111',
      '',
      'Education: Donghua University, Mechanical Engineering, Bachelor, 2021-09 - 2025-06',
      '',
      'Course Project: Gearbox Design (2024-03 - 2024-06)',
      'Designed a two-stage gearbox, built the 3D model in SolidWorks, produced drawings and a design report.',
      '',
      'Internship: Jiangsu Machinery Co., Ltd. (2024-07 - 2024-09)',
      'Assisted in workshop process scheduling and inspected parts on the production line.',
      '',
      'Skills: Proficient in AutoCAD, SolidWorks and Microsoft Office; familiar with Python and data analysis.',
    ],
    expected: {
      basics: {
        name: 'Sun Hao',
        email: 'sun.hao@163.com',
        phone: '13800001111',
        label: null,
        city: null,
      },
      counts: { education: 1, work: 1, projects: 1, skills: 0, awards: 0 },
      notes: '弱排版纯文本；技能为叙述句而非“技能+熟练度”逐条 → skills 应被省略（prompt 规则 6）。',
    },
  },
];

function genExpectedFile(name: string, expected: TestSample['expected'], notes?: string): void {
  const out = {
    file: name,
    ...expected,
    notes,
  };
  fs.writeFileSync(path.join(OUT_DIR, name.replace(/\.pdf$/, '.expected.json')), JSON.stringify(out, null, 2) + '\n');
}

/* ------------------------------------------------------------------ */
/*  入口                                                                */
/* ------------------------------------------------------------------ */

fs.mkdirSync(OUT_DIR, { recursive: true });

// 现有两份 PDF：拷贝（保持源文件不变）
const copies: Array<[string, string]> = [
  [path.join(WORKSPACE, 'template/DHU_CV_Template.pdf'), '01-dhu-cv-template.pdf'],
  [path.join(WORKSPACE, 'latex/main.pdf'), '02-latex-multi-page.pdf'],
];
for (const [src, dst] of copies) {
  if (!fs.existsSync(src)) {
    console.warn(`skip copy: source missing ${src}`);
    continue;
  }
  fs.copyFileSync(src, path.join(OUT_DIR, dst));
  console.log(`copied ${src} -> ${dst} (${fs.statSync(src).size} bytes)`);
}

for (const s of samples) {
  writePdf(s.name, s.lines);
  genExpectedFile(s.name, s.expected, s.expected.notes);
}

// 负例：文本不足 50 字符（只有一行 “Sample”）
writePdf('07-short-text-negative.pdf', ['Sample']);

// 01/02 的真值清单由人工依据模板原稿编写（01-dhu-cv-template.expected.json 等），
// 不在本脚本内生成，避免与源模板内容重复维护两处。
console.log('\ndone. fixtures under test-data/resumes/');