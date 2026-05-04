import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Palette, Check, ArrowRightLeft, Minus, Plus } from 'lucide-react';
import { LayoutGroup, motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/ui';
import { getSampleResume } from '@/config/sample-resume';
import { TITLE_FONT_SIZE_RANGE, BODY_FONT_SIZE_RANGE } from '@/config/layout';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { templateIds, definitions } from '@/components/Resume/templates';
import { ResumeView } from '@/components/Resume';
import type { SpacingPreset } from '@/types';

const PRESETS = [
  { key: 'onyxBlack', color: '#18181B', tagColor: '#71717A' },
  { key: 'executiveNavy', color: '#2C3E50', tagColor: '#5B8C5A' },
  { key: 'techBlue', color: '#2563EB', tagColor: '#F59E0B' },
  { key: 'ivyTeal', color: '#115E59', tagColor: '#EA580C' },
  { key: 'charcoalSlate', color: '#334155', tagColor: '#818CF8' },
  { key: 'burgundy', color: '#7F1D1D', tagColor: '#CA8A04' },
  { key: 'mutedPlum', color: '#5B21B6', tagColor: '#14B8A6' },
  { key: 'espressoBrown', color: '#4E342E', tagColor: '#D97706' },
];

const SPACING_PRESETS: SpacingPreset[] = ['compact', 'standard', 'spacious'];

const MAX_VISIBLE_TAGS = 4;

/** 根据当前语言获取示例简历用于模板预览 */
function usePreviewResume() {
  const lang = useUIStore((s) => s.lang);
  return useMemo(() => getSampleResume(lang), [lang]);
}

function FontSizeStepper({ value, onChange, min, max, step = 1 }: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        aria-label="decrease"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - step))}
        className="flex h-7 w-7 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="w-10 text-center text-sm font-medium tabular-nums text-muted-foreground">
        {value}px
      </span>
      <button
        type="button"
        aria-label="increase"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + step))}
        className="flex h-7 w-7 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function SpacingPresetGroup({ value, onChange, labels }: {
  value: SpacingPreset;
  onChange: (v: SpacingPreset) => void;
  labels: Record<SpacingPreset, string>;
}) {
  const reduceMotion = useReducedMotion();
  // useId 给 LayoutGroup 一个 SSR 安全的稳定 ID，确保多个 SpacingPresetGroup 同时挂载时
  // (页边距 + 模块间距) layoutId="capsule-pill" 严格隔离在各自分组内。framer-motion 不传
  // id 时会自动隔离命名空间，但显式传入更稳健，避免 React 严格模式或边缘场景下的命名空间漂移。
  const groupId = useId();
  return (
    <LayoutGroup id={groupId}>
      <div className="grid grid-cols-3 rounded-full bg-gray-100 p-1">
        {SPACING_PRESETS.map((preset) => {
          const isActive = value === preset;
          return (
            <button
              key={preset}
              type="button"
              onClick={() => onChange(preset)}
              className={cn(
                // 容器加 relative 给 absolute 滑块提供锚点；transition-colors 与下方滑块时长对齐，
                // 让"文字变深"和"白胶囊滑入"在同一时间窗口内完成，整体动作更同步丝滑。
                'relative rounded-full px-3 py-1.5 text-sm font-medium transition-colors duration-[600ms]',
                isActive ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700',
              )}
            >
              {/*
                白色高亮胶囊：layoutId 让它从旧选中按钮"飞"到新选中按钮（条件渲染下，
                framer-motion 通过共享 layoutId 自动追踪卸载/挂载并连贯过渡）。
                tween 而非 spring：spring 的速率由弹性公式决定，远距离会"被弹得很快但停得也快"，
                本质仍是变速且时长不固定；tween + 固定 duration 才能保证"无论从相邻还是从最左到最右
                时长都一样，远的滑得更快"——正是需求要求的行为。
                duration / ease 与 useThemeEffect 中 SPACING_TRANSITION 严格一致：切换 preset 时，
                "胶囊滑动"和"简历预览页边距/模块间距 framer-motion 渐变"在同一时间窗口、同一曲线下
                完成；时长 0.6s 偏缓让整个动作可清晰感知，不仓促。
              */}
              {isActive && (
                <motion.span
                  layoutId="capsule-pill"
                  className="absolute inset-0 rounded-full bg-white shadow-sm"
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
                  }
                />
              )}
              {/* 文字浮于滑块之上：relative + z-10，否则会被 absolute 滑块的 bg-white 遮住 */}
              <span className="relative z-10">{labels[preset]}</span>
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}

export function AppearanceDrawer() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const previewResume = usePreviewResume();
  const template = useUIStore((s) => s.template);
  const setTemplate = useUIStore((s) => s.setTemplate);
  const theme = useUIStore((s) => s.theme);
  const updateTheme = useUIStore((s) => s.updateTheme);
  const showIcons = useUIStore((s) => s.showIcons);
  const toggleIcons = useUIStore((s) => s.toggleIcons);
  const layout = useUIStore((s) => s.layout);
  const setPageMargin = useUIStore((s) => s.setPageMargin);
  const setModuleGap = useUIStore((s) => s.setModuleGap);
  const setTitleFontSize = useUIStore((s) => s.setTitleFontSize);
  const setBodyFontSize = useUIStore((s) => s.setBodyFontSize);
  const setLineHeight = useUIStore((s) => s.setLineHeight);

  // drawer 动画完成后才启用缩略图 hover 效果，避免鼠标滑过时误触
  const [drawerReady, setDrawerReady] = useState(false);
  const readyTimer = useRef<ReturnType<typeof setTimeout>>();

  const closeTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => { clearTimeout(closeTimer.current); clearTimeout(readyTimer.current); }, []);

  useEffect(() => {
    if (!open) {
      setDrawerReady(false);
      clearTimeout(readyTimer.current);
      return;
    }
    readyTimer.current = setTimeout(() => setDrawerReady(true), 500);
    return () => { clearTimeout(readyTimer.current); };
  }, [open]);

  const handleTemplateSelect = useCallback((key: string) => {
    setTemplate(key);
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setTemplateDialogOpen(false), 350);
  }, [setTemplate]);

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl text-muted-foreground hover:text-foreground"
            onClick={() => setOpen(true)}
          >
            <Palette className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">{t('toolbar.appearanceSettings')}</TooltipContent>
      </Tooltip>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex w-[380px] flex-col p-0 sm:max-w-[380px]">
          <SheetHeader className="border-b px-4 py-3">
            <SheetTitle>{t('toolbar.appearanceSettings')}</SheetTitle>
            <SheetDescription className="sr-only">{t('toolbar.appearanceSettings')}</SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div className="space-y-6 px-4 py-4">
              {/* 模板选择 — 缩略图打开 Dialog */}
              <section>
                <h3 className="mb-2 text-sm font-medium text-foreground">{t('toolbar.template')}</h3>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setTemplateDialogOpen(true)}
                  className={cn(
                    'w-full cursor-pointer overflow-hidden rounded-xl ring-1 ring-gray-200 transition-all',
                    drawerReady ? 'hover:ring-gray-300 hover:shadow-md' : 'pointer-events-none',
                  )}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setTemplateDialogOpen(true);
                    }
                  }}
                >
                  {/* 静态骨架 */}
                  <div className="bg-gray-50/50 px-6 py-5">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-2.5 w-20 rounded-full bg-gray-200" />
                      </div>
                      <div className="space-y-2 pt-0.5">
                        <div className="h-2 w-full rounded-full bg-gray-200/70" />
                        <div className="h-2 w-3/4 rounded-full bg-gray-200/70" />
                        <div className="h-2 w-full rounded-full bg-gray-200/70" />
                        <div className="h-2 w-5/6 rounded-full bg-gray-200/70" />
                        <div className="h-2 w-2/3 rounded-full bg-gray-200/70" />
                      </div>
                    </div>
                  </div>
                  {/* 模板信息 */}
                  <div className="flex items-center justify-between border-t border-gray-100 bg-white px-4 py-3">
                    <div>
                      <p className="text-[11px] text-muted-foreground">{t('toolbar.currentTemplate')}</p>
                      <p className="text-sm font-semibold text-foreground">{t(`template.${template}`)}</p>
                    </div>
                    <ArrowRightLeft className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </section>

              {/* 主题配色 */}
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-foreground">{t('toolbar.theme')}</h3>
                  {(() => {
                    const key = PRESETS.find((p) => p.color === theme.color)?.key;
                    return key ? (
                      <span className="text-sm font-medium text-muted-foreground">
                        {t(`theme.${key}`)}
                      </span>
                    ) : null;
                  })()}
                </div>
                <div className="flex flex-wrap gap-3">
                  {PRESETS.map((preset) => {
                    const active = theme.color === preset.color;
                    return (
                      <button
                        key={preset.key}
                        type="button"
                        aria-label={t(`theme.${preset.key}`)}
                        onClick={() => updateTheme({ color: preset.color, tagColor: preset.tagColor })}
                        className="h-7 w-7 shrink-0 rounded-full transition-shadow"
                        style={{
                          backgroundColor: preset.color,
                          boxShadow: active
                            ? `0 0 0 2px #fff, 0 0 0 4px ${preset.color}`
                            : undefined,
                        }}
                      />
                    );
                  })}
                </div>
              </section>

              {/* 图标显示 */}
              <section className="border-t border-gray-100 pt-6">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">{t('toolbar.iconMode')}</Label>
                  <Switch
                    checked={showIcons}
                    onCheckedChange={toggleIcons}
                    aria-label={showIcons ? t('toolbar.hideIcons') : t('toolbar.showIcons')}
                  />
                </div>
              </section>

              {/* 页边距 */}
              <section>
                <h3 className="mb-2.5 text-sm font-medium text-foreground">{t('toolbar.pageMargin')}</h3>
                <SpacingPresetGroup value={layout.pageMargin} onChange={setPageMargin} labels={{ compact: t('toolbar.narrow'), standard: t('toolbar.standard'), spacious: t('toolbar.wide') }} />
              </section>

              {/* 模块间距 */}
              <section>
                <h3 className="mb-2.5 text-sm font-medium text-foreground">{t('toolbar.moduleGap')}</h3>
                <SpacingPresetGroup value={layout.moduleGap} onChange={setModuleGap} labels={{ compact: t('toolbar.compact'), standard: t('toolbar.standard'), spacious: t('toolbar.spacious') }} />
              </section>

              {/* 标题字号 */}
              <section>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-foreground">{t('toolbar.titleFontSize')}</h3>
                  <FontSizeStepper value={layout.titleFontSize} onChange={setTitleFontSize} min={TITLE_FONT_SIZE_RANGE.min} max={TITLE_FONT_SIZE_RANGE.max} />
                </div>
              </section>

              {/* 正文字号 */}
              <section>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-foreground">{t('toolbar.bodyFontSize')}</h3>
                  <FontSizeStepper value={layout.bodyFontSize} onChange={setBodyFontSize} min={BODY_FONT_SIZE_RANGE.min} max={BODY_FONT_SIZE_RANGE.max} />
                </div>
              </section>

              {/* 行间距 */}
              <section>
                <div className="mb-2.5 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-foreground">{t('toolbar.lineHeight')}</h3>
                  <span className="text-sm font-medium tabular-nums text-muted-foreground">{layout.lineHeight.toFixed(1)}</span>
                </div>
                <Slider
                  value={[layout.lineHeight]}
                  min={1.2}
                  max={1.8}
                  step={0.1}
                  onValueChange={([v]) => setLineHeight(v)}
                />
              </section>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* 模板选择 Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[85vh] flex flex-col" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{t('toolbar.template')}</DialogTitle>
            <DialogDescription className="sr-only">{t('toolbar.templateDesc')}</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto overscroll-contain pb-1 pl-1 pr-3">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(13rem,1fr))] justify-items-center gap-x-5 gap-y-6 py-2">
              {templateIds.map((key) => {
                const selected = template === key;
                const label = t(`template.${key}`);
                return (
                  <button
                    key={key}
                    type="button"
                    aria-label={label}
                    onClick={() => handleTemplateSelect(key)}
                    className={cn(
                      'group relative w-full max-w-56 cursor-pointer overflow-hidden rounded-lg bg-white text-left transition-all duration-200',
                      selected
                        ? 'ring-2 ring-resume-primary shadow-md'
                        : 'ring-1 ring-gray-200 hover:ring-gray-300 hover:-translate-y-1 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-resume-primary focus-visible:outline-none',
                    )}
                  >
                    {selected && (
                      <span className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-resume-primary text-white shadow-sm">
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      </span>
                    )}
                    <div className="relative h-72 w-full overflow-hidden">
                      <div className="pointer-events-none absolute left-0 top-0 w-[210mm] origin-top-left scale-[0.28]">
                        <ResumeView config={previewResume} templateId={key} disablePagination />
                      </div>
                    </div>
                    <div className="border-t border-gray-100 px-3 py-2.5">
                      <p className={cn(
                        'text-sm font-medium',
                        selected ? 'text-resume-primary' : 'text-gray-700',
                      )}>
                        {label}
                      </p>
                      {(() => {
                        const tags = definitions[key].tags;
                        const visible = tags.slice(0, MAX_VISIBLE_TAGS);
                        const overflow = tags.length - MAX_VISIBLE_TAGS;
                        return (
                          <div className="mt-2 flex flex-wrap items-center gap-1">
                            {visible.map((tag) => (
                              <span
                                key={tag}
                                className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500"
                              >
                                {t(`templateTag.${tag}`)}
                              </span>
                            ))}
                            {overflow > 0 && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="cursor-default rounded bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-400">
                                    +{overflow}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="border border-gray-200/80 bg-white p-2 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
                                  <div className="flex flex-wrap gap-1">
                                    {tags.slice(MAX_VISIBLE_TAGS).map((tag) => (
                                      <span
                                        key={tag}
                                        className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500"
                                      >
                                        {t(`templateTag.${tag}`)}
                                      </span>
                                    ))}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
