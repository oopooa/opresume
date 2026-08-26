import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, ChevronDown } from 'lucide-react';
import { useAIStore } from '@/store/ai';
import { useUIStore } from '@/store/ui';
import { AI_PROVIDER_IDS, getProviderPreset } from '@/config/ai-providers';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ProviderCard } from './ProviderCard';
import { ProviderConfigDialog } from './ProviderConfigDialog';
import { CustomProviderDialog } from './CustomProviderDialog';
import type { AIProviderId } from '@/types';

export function AIProviderSection() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(true);
  const activeProviderId = useAIStore((s) => s.activeProviderId);
  const customProviders = useAIStore((s) => s.customProviders);
  const isVerified = useAIStore((s) =>
    s.activeProviderId ? !!s.providers[s.activeProviderId]?.verified : false,
  );
  const { editingProviderId, openProviderConfig, closeProviderConfig } = useUIStore();

  const activeProviderPreset = activeProviderId
    ? getProviderPreset(activeProviderId, customProviders)
    : undefined;
  const activeProviderName = activeProviderPreset
    ? activeProviderPreset.custom
      ? (customProviders.find((c) => c.id === activeProviderId)?.name ?? activeProviderId)
      : t(activeProviderPreset.nameKey)
    : t('settings.notConfigured');

  const handleCardClick = (providerId: AIProviderId) => {
    openProviderConfig(providerId);
  };

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="group relative z-10 flex w-full items-center justify-between py-2">
          <div className="flex shrink-0 items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{t('settings.aiEngine')}</span>
          </div>
          <div className="flex items-center gap-2 overflow-hidden">
            {activeProviderId && isVerified && (
              <Badge
                variant="outline"
                className={cn(
                  'border-emerald-500/50 bg-emerald-50 text-emerald-600 text-xs transition-opacity duration-300',
                  open ? 'opacity-0' : 'opacity-100',
                )}
              >
                {activeProviderName}
              </Badge>
            )}
            <ChevronDown
              className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180"
            />
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="space-y-2 pt-2">
            {AI_PROVIDER_IDS.map((id) => (
              <ProviderCard key={id} providerId={id} onClick={() => handleCardClick(id)} />
            ))}

            {/* 用户自定义供应商（OpenAI 兼容端点） */}
            {customProviders.map((cp) => (
              <ProviderCard key={cp.id} providerId={cp.id} onClick={() => handleCardClick(cp.id)} />
            ))}

            <CustomProviderDialog />
          </div>
        </CollapsibleContent>
      </Collapsible>

      <ProviderConfigDialog
        providerId={editingProviderId}
        open={!!editingProviderId}
        onOpenChange={(open) => {
          if (!open) closeProviderConfig();
        }}
      />
    </>
  );
}
