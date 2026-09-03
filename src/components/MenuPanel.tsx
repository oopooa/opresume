import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/store/ui';
import {
  Sheet,
  SheetBackdrop,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet';
import { AIProviderSection } from '@/components/Settings';
import { MyResumesSection } from '@/components/Resumes';

export function MenuPanel() {
  const { t } = useTranslation();
  const menuPanelOpen = useUIStore((s) => s.menuPanelOpen);
  const closeMenuPanel = useUIStore((s) => s.closeMenuPanel);

  return (
    <>
      <SheetBackdrop
        open={menuPanelOpen}
        className="!top-[var(--app-header-height)] z-40 print:hidden"
      />

      <Sheet
        modal={false}
        open={menuPanelOpen}
        onOpenChange={(open) => !open && closeMenuPanel()}
      >
        <SheetContent
          side="leftBelowHeader"
          hideClose
          className="flex w-[320px] flex-col gap-0 p-0"
        >
          <SheetTitle className="sr-only">{t('common.menu')}</SheetTitle>
          <SheetDescription className="sr-only">
            {t('menu.description')}
          </SheetDescription>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="divide-y divide-border">
              <div className="px-4 py-3">
                <MyResumesSection />
              </div>
              <div className="px-4 py-3">
                <AIProviderSection />
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
