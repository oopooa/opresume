import { useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { EyeOff, Eye, FileJson, FileUp, FileDown, Trash2, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/ui';
import { useResumeStore } from '@/store/resume';
import { exportResume, importResume } from '@/services/resume';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { LangSwitcher } from './LangSwitcher';

export { FloatingToolbar } from './FloatingToolbar';

export function Toolbar() {
  const { t } = useTranslation();
  const privacyMode = useUIStore((s) => s.privacyMode);
  const togglePrivacy = useUIStore((s) => s.togglePrivacy);
  const config = useResumeStore((s) => s.config);
  const update = useResumeStore((s) => s.update);
  const reset = useResumeStore((s) => s.reset);
  const save = useResumeStore((s) => s.save);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [clearAlertOpen, setClearAlertOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openMenu = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setMenuOpen(true);
  }, []);

  const scheduleClose = useCallback(() => {
    closeTimer.current = setTimeout(() => setMenuOpen(false), 150);
  }, []);

  const handleExport = () => {
    if (!config) return;
    const name = config.basics?.name || '';
    const title = config.basics?.label || '';
    const filename = [name, title].filter(Boolean).join('-') || 'resume';
    exportResume(config, `${filename}.json`);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setPendingFile(file);
    setAlertOpen(true);
  };

  const handleClearConfirm = async () => {
    reset();
    try {
      await save();
      toast.success(t('toolbar.clearSuccess'));
    } catch {
      toast.error(t('common.saveError'));
    }
  };

  const handleImportConfirm = async () => {
    if (!pendingFile) return;
    try {
      const extended = await importResume(pendingFile);
      update(extended);
      await save();
      toast.success(t('toolbar.importSuccess'));
    } catch {
      toast.error(t('toolbar.importParseFailed'));
    } finally {
      setPendingFile(null);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 flex h-12 items-center justify-between border-b bg-white px-4 print:hidden">
        <div className="flex items-center gap-0.5 select-none">
          <span className="flex h-7 w-8 items-center justify-center rounded-md border border-black bg-[#2d3748] text-sm font-bold text-white">
            Op
          </span>
          <span className="text-base font-bold text-gray-800 tracking-tight">
            Resume
          </span>
          <Badge variant="secondary" className="ml-1.5 translate-y-px px-1.5 py-0 text-[10px] leading-4 font-medium text-muted-foreground">
            v{__APP_VERSION__}
          </Badge>
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
          <div onMouseEnter={openMenu} onMouseLeave={scheduleClose} onMouseMove={openMenu}>
            <DropdownMenu open={menuOpen} onOpenChange={(open) => {
              if (open) openMenu();
              else scheduleClose();
            }} modal={false}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex h-8 items-center gap-1.5 rounded-md border border-transparent bg-muted/40 px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none"
                >
                  <FileJson className="h-3.5 w-3.5" />
                  {t('toolbar.jsonMenu')}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="min-w-0"
                onMouseEnter={openMenu}
                onMouseLeave={scheduleClose}
              >
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                  <FileUp className="h-4 w-4" />
                  {t('toolbar.importJSON')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExport}>
                  <FileDown className="h-4 w-4" />
                  {t('toolbar.exportJSON')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setClearAlertOpen(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  {t('toolbar.clearData')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        aria-label="Import JSON"
        onChange={handleFileSelect}
      />

      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <TriangleAlert className="h-5 w-5 text-amber-500" />
              {t('toolbar.importWarning')}
            </AlertDialogTitle>
            <AlertDialogDescription>{t('toolbar.importWarningDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingFile(null)}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90"
              onClick={handleImportConfirm}
            >
              {t('toolbar.importConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={clearAlertOpen} onOpenChange={setClearAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <TriangleAlert className="h-5 w-5 text-destructive" />
              {t('toolbar.clearWarning')}
            </AlertDialogTitle>
            <AlertDialogDescription>{t('toolbar.clearWarningDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90"
              onClick={handleClearConfirm}
            >
              {t('toolbar.clearConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
