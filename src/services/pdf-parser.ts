import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import i18n from '@/i18n';

// 使用 Vite 的 ?url 后缀直接引入本地 Worker 文件，
// 避免 CDN 版本不匹配或网络加载失败
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/**
 * 从 PDF 文件中提取纯文本
 * @param file PDF 文件对象
 * @returns 提取的文本内容
 * @throws 如果 PDF 解析失败
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  // 1. 读取文件为 ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();

  // 2. 加载 PDF 文档
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  // 3. 逐页提取文本
  const textParts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .filter((item) => 'str' in item)
      .map((item) => (item as { str: string }).str)
      .join(' ');
    textParts.push(pageText);
  }

  // 4. 合并所有页面的文本
  const fullText = textParts.join('\n\n');

  // 5. 验证提取的文本是否有效
  if (!fullText || fullText.trim().length < 50) {
    throw new Error(i18n.t('importPDF.errorInsufficientText'));
  }

  return fullText;
}
