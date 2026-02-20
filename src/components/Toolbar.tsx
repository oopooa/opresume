import { useTranslation } from 'react-i18next';
import { Printer } from 'lucide-react';

export function Toolbar() {
  const { t } = useTranslation();

  const handlePrint = () => {
    window.print();
  };

  return (
    <header className="flex h-12 items-center justify-between border-b bg-white px-4 print:hidden">
      <span className="text-sm font-semibold text-gray-700">opresume</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 rounded-md bg-resume-primary px-3 py-1.5 text-xs text-white transition-colors hover:opacity-90"
        >
          <Printer className="h-3.5 w-3.5" />
          {t('toolbar.print')}
        </button>
      </div>
    </header>
  );
}
