import { useUIStore } from '@/store/ui';

const LANGS = [
  { code: 'zh-CN', label: '中' },
  { code: 'en-US', label: 'EN' },
] as const;

export function LangSwitcher() {
  const lang = useUIStore((s) => s.lang);
  const setLang = useUIStore((s) => s.setLang);

  return (
    <div className="inline-flex h-8 items-center rounded-md border bg-muted/40 p-0.5 text-xs font-medium">
      {LANGS.map((l) => {
        const active = lang === l.code;
        return (
          <button
            key={l.code}
            type="button"
            onClick={() => setLang(l.code)}
            className={`relative h-full rounded-[5px] px-2.5 transition-all ${
              active
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {l.label}
          </button>
        );
      })}
    </div>
  );
}
