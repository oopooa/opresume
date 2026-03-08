import { useTranslation } from 'react-i18next';
import { EyeOff, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/ui';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { LangSwitcher } from './LangSwitcher';

export { FloatingToolbar } from './FloatingToolbar';

export function Toolbar() {
  const { t } = useTranslation();
  const privacyMode = useUIStore((s) => s.privacyMode);
  const togglePrivacy = useUIStore((s) => s.togglePrivacy);

  return (
    <header className="flex h-12 items-center justify-between border-b bg-white px-4 print:hidden">
      <div className="flex items-center gap-0.5 select-none">
        <span className="flex h-7 w-8 items-center justify-center rounded-md border border-black bg-[#2d3748] text-sm font-bold text-white">
          Op
        </span>
        <span className="text-base font-bold text-gray-800 tracking-tight">
          Resume
        </span>
      </div>
      <div className="flex items-center gap-2">
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={togglePrivacy}
                className={cn(
                  'inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-all',
                  privacyMode
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : 'border-transparent bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {privacyMode ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {t('toolbar.privacyMode')}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {privacyMode ? t('toolbar.privacyOn') : t('toolbar.privacyOff')}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <LangSwitcher />
      </div>
    </header>
  );
}
