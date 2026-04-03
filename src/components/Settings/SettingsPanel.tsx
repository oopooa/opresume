import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/store/ui';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { AIProviderSection } from './AIProviderSection';

export function SettingsPanel() {
  const { t } = useTranslation();
  const { settingsPanelOpen, closeSettingsPanel } = useUIStore();

  return (
    <Sheet open={settingsPanelOpen} onOpenChange={(open) => !open && closeSettingsPanel()}>
      <SheetContent side="left" className="w-[320px] p-0">
        <SheetHeader className="border-b px-4 py-4">
          <SheetTitle className="text-base">
            {t('settings.title')}
          </SheetTitle>
          <SheetDescription className="sr-only">
            {t('settings.description')}
          </SheetDescription>
        </SheetHeader>

        <div className="h-[calc(100vh-65px)] overflow-y-auto">
          <div className="space-y-6 p-4">
            <AIProviderSection />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
