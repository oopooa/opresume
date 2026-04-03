import { useTranslation } from 'react-i18next';
import { Settings2 } from 'lucide-react';
import { useAIStore } from '@/store/ai';
import { AI_PROVIDER_PRESETS } from '@/config/ai-providers';
import type { AIProviderId } from '@/types';
import { cn } from '@/lib/utils';

interface ProviderCardProps {
  providerId: AIProviderId;
  onClick: () => void;
}

export function ProviderCard({ providerId, onClick }: ProviderCardProps) {
  const { t } = useTranslation();
  const { activeProviderId } = useAIStore();

  const preset = AI_PROVIDER_PRESETS[providerId];
  const isActive = activeProviderId === providerId;
  const name = t(preset.nameKey);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition-all duration-200 hover:shadow-sm',
        'border-border bg-card hover:border-muted-foreground/30 hover:bg-muted/40',
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        {/* 供应商图标 */}
        <div className="shrink-0">
          {preset.icon ? (
            <img src={preset.icon} alt={name} className="h-7 w-7 rounded-lg" />
          ) : (
            <div
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-bold text-white shadow-sm',
                preset.brandColor,
              )}
            >
              {preset.abbr}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <span className="text-sm font-medium">{name}</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {/* 状态指示圆点 */}
        {isActive ? (
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
        ) : (
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-gray-300" />
        )}
        <Settings2 className="h-4 w-4 text-muted-foreground transition-colors duration-200 group-hover:text-foreground" />
      </div>
    </button>
  );
}
