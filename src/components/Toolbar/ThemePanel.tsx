import { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/ui';

const PRESETS = [
  { color: '#2f5785', tagColor: '#8bc34a' },
  { color: '#2e7d32', tagColor: '#ff9800' },
  { color: '#c62828', tagColor: '#42a5f5' },
  { color: '#6a1b9a', tagColor: '#fdd835' },
  { color: '#00695c', tagColor: '#ef5350' },
  { color: '#37474f', tagColor: '#26c6da' },
];

export function ThemePanel() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const theme = useUIStore((s) => s.theme);
  const updateTheme = useUIStore((s) => s.updateTheme);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-gray-600 transition-colors hover:bg-gray-100"
      >
        <Palette className="h-3.5 w-3.5" />
        {t('toolbar.theme')}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-lg border bg-white p-3 shadow-lg">
          {/* 预设主题 */}
          <div className="mb-3 flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.color}
                type="button"
                aria-label={preset.color}
                onClick={() => updateTheme(preset)}
                className={cn(
                  'h-6 w-6 rounded-full border-2 transition-transform hover:scale-110',
                  theme.color === preset.color ? 'border-gray-800' : 'border-transparent',
                )}
                style={{ backgroundColor: preset.color }}
              />
            ))}
          </div>

          {/* 自定义颜色 */}
          <div className="space-y-2">
            <label className="flex items-center justify-between text-xs text-gray-600">
              {t('theme.primaryColor')}
              <input
                type="color"
                value={theme.color}
                onChange={(e) => updateTheme({ color: e.target.value })}
                className="h-6 w-8 cursor-pointer rounded border border-gray-300"
              />
            </label>
            <label className="flex items-center justify-between text-xs text-gray-600">
              {t('theme.tagColor')}
              <input
                type="color"
                value={theme.tagColor}
                onChange={(e) => updateTheme({ tagColor: e.target.value })}
                className="h-6 w-8 cursor-pointer rounded border border-gray-300"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}