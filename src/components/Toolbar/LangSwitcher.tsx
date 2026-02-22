import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import { useUIStore } from '@/store/ui';
import { Button } from '@/components/ui/button';

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
    <Button
      variant="ghost"
      size="sm"
      className="gap-1.5"
      aria-label={t('toolbar.language')}
      onClick={() => setLang(next)}
    >
      <Languages className="h-3.5 w-3.5" />
      {current?.label}
    </Button>
  );
}
