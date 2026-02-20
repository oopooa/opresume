import { useTranslation } from 'react-i18next';
import { Printer } from 'lucide-react';
import { ThemePanel } from './ThemePanel';
import { TemplateSelector } from './TemplateSelector';
import { LangSwitcher } from './LangSwitcher';

export function Toolbar() {
  const { t } = useTranslation();

  return (
    <header className="flex h-12 items-center justify-between border-b bg-white px-4 print:hidden">
      <span className="text-sm font-semibold text-gray-700">opresume</span>
      <div className="flex items-center gap-1">
        <TemplateSelector />
        <ThemePanel />
        <LangSwitcher />
        <div className="mx-1 h-5 w-px bg-gray-200" />
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-md bg-resume-primary px-3 py-1.5 text-xs text-white transition-colors hover:opacity-90"
        >
          <Printer className="h-3.5 w-3.5" />
          {t('toolbar.print')}
        </button>
      </div>
    </header>
  );
}
