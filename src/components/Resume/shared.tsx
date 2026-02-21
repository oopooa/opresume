import type { ReactNode } from 'react';
import type { ResumeConfig } from '@/types';
import { useUIStore } from '@/store/ui';

export function EditableSection({ module, children }: { module: string; children: ReactNode }) {
  const openEditor = useUIStore((s) => s.openEditor);
  return (
    <div
      className="cursor-pointer rounded transition-shadow hover:ring-2 print:cursor-default print:hover:ring-0"
      style={{ '--tw-ring-color': 'color-mix(in srgb, var(--resume-primary) 40%, transparent)' } as React.CSSProperties}
      onClick={() => openEditor(module)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openEditor(module); }}
    >
      {children}
    </div>
  );
}

export function TimeRange({ time }: { time?: [string?, string?] }) {
  if (!time) return null;
  const [start, end] = time;
  if (!start && !end) return null;
  return (
    <span className="text-xs text-gray-500">
      {start}{start && end ? ' - ' : ''}{end}
    </span>
  );
}

export function getTitle(config: ResumeConfig, key: string, fallback: string) {
  return config.titleNameMap?.[key] ?? fallback;
}

export function isHidden(config: ResumeConfig, key: string) {
  return config.moduleHidden?.[key] === true;
}
