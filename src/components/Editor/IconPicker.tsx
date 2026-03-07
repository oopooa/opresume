import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { ICON_REGISTRY, ICON_CATEGORIES, ICON_KEYWORDS } from '@/config/icons';
import { DynamicIcon } from '@/components/DynamicIcon';

interface IconPickerProps {
  value?: string;
  onChange: (icon: string | undefined) => void;
  /** 触发按钮额外样式 */
  className?: string;
  disabled?: boolean;
}

export function IconPicker({ value, onChange, className, disabled }: IconPickerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(0);

  /** 搜索时跨分类聚合结果，同时匹配英文名和中文关键词 */
  const displayIcons = useMemo(() => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matched: string[] = [];
      for (const cat of ICON_CATEGORIES) {
        for (const name of cat.icons) {
          if (
            name.toLowerCase().includes(q) ||
            (ICON_KEYWORDS[name] && ICON_KEYWORDS[name].includes(q))
          ) {
            matched.push(name);
          }
        }
      }
      return matched;
    }
    return ICON_CATEGORIES[activeCategory]?.icons ?? [];
  }, [search, activeCategory]);

  const isSearching = search.trim().length > 0;

  const handleSelect = useCallback(
    (name: string) => {
      onChange(name === value ? undefined : name);
      setOpen(false);
      setSearch('');
    },
    [value, onChange],
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange(undefined);
    },
    [onChange],
  );

  /** Sheet 的 react-remove-scroll 会拦截 Portal 内的原生滚动，手动处理 scrollTop */
  const handleGridWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const max = el.scrollHeight - el.clientHeight;
    if (max <= 0) return;
    el.scrollTop = Math.max(0, Math.min(max, el.scrollTop + e.deltaY));
  }, []);

  return (
    <Popover open={disabled ? false : open} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors',
            disabled
              ? 'opacity-30 cursor-not-allowed'
              : 'hover:bg-accent hover:text-gray-600',
            value
              ? 'border border-transparent text-gray-600'
              : 'border border-dashed border-gray-300 text-gray-400',
            className,
          )}
          aria-label={t('icon.selectIcon')}
        >
          {value ? (
            <DynamicIcon name={value} className="h-3.5 w-3.5" forceShow />
          ) : (
            <Plus className="h-3 w-3" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start" side="bottom">
        {/* 搜索栏 */}
        <div className="border-b p-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('icon.searchIcon')}
              className="h-8 pl-8 pr-8 text-sm"
            />
            {value && (
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:text-gray-600"
                onClick={handleClear}
                aria-label={t('icon.clearIcon')}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 分类标签栏 */}
        {!isSearching && (
          <div className="border-b px-2 py-1.5">
            <div className="grid grid-cols-3 gap-0.5">
              {ICON_CATEGORIES.map((cat, idx) => (
                <button
                  key={cat.labelKey}
                  type="button"
                  className={cn(
                    'rounded-md px-2 py-1 text-[11px] font-medium transition-colors text-center',
                    idx === activeCategory
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-500 hover:bg-accent hover:text-gray-700',
                  )}
                  onClick={() => setActiveCategory(idx)}
                >
                  {t(cat.labelKey)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 图标网格 */}
        <div className="h-52 overflow-y-auto overscroll-contain" onWheel={handleGridWheel}>
          <div className="p-2">
            {displayIcons.length === 0 ? (
              <p className="py-4 text-center text-xs text-gray-400">{t('icon.noResult')}</p>
            ) : (
              <div className="flex flex-wrap gap-1">
                {displayIcons.map((name) => {
                  const Icon = ICON_REGISTRY[name];
                  if (!Icon) return null;
                  const isActive = name === value;
                  return (
                    <button
                      key={name}
                      type="button"
                      title={name}
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-accent hover:text-gray-700',
                        isActive && 'bg-primary/10 text-primary ring-1 ring-primary/30',
                      )}
                      onClick={() => handleSelect(name)}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
