import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import { useUIStore } from '@/store/ui';

const LANGS = [
  { code: 'zh-CN', label: '中文' },
  { code: 'en-US', label: 'EN' },
] as const;

export function LangSwitcher() {
  const { t } = useTranslation();
  const lang = useUIStore((s) => s.lang);
  const setLang = useUIStore((s) => s.setLang);

  const next = lang === 'zh-CN' ? 'en-US' : 'zh-CN';
  const current = LANGS.find((l) => l.code === lang);

  return (
    <button
      type="button"
      onClick={() => setLang(next)}
      aria-label={t('toolbar.language')}
      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-gray-600 transition-colors hover:bg-gray-100"
    >
      <Languages className="h-3.5 w-3.5" />
      {current?.label}
    </button>
  );
}
