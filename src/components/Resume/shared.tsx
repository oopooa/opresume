import type { ReactNode } from 'react';
import type { ResumeConfig, Avatar } from '@/types/resume';
import { useUIStore } from '@/store/ui';
import { Avatar as AvatarUI, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const RING_STYLE = {
  '--tw-ring-color': 'color-mix(in srgb, var(--resume-primary) 40%, transparent)',
} as React.CSSProperties;

export function EditableSection({ module, children }: { module: string; children: ReactNode }) {
  const openEditor = useUIStore((s) => s.openEditor);
  return (
    <div
      className="cursor-pointer rounded transition-shadow hover:ring-2 print:cursor-default print:hover:ring-0"
      style={RING_STYLE}
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

export function avatarStyle(a?: Avatar): React.CSSProperties {
  const w = a?.width ?? 90;
  const h = a?.height ?? 90;
  const r = a?.borderRadius ?? 999;
  return { width: w, height: h, borderRadius: Math.min(r, Math.min(w, h) / 2) };
}

export function ResumeAvatar({ avatar, name, className }: { avatar?: Avatar; name?: string; className?: string }) {
  if (!avatar?.src || avatar.hidden) return null;
  return (
    <AvatarUI className={cn('h-auto w-auto rounded-none', className)} style={avatarStyle(avatar)}>
      <AvatarImage src={avatar.src} alt={name ?? ''} className="object-cover" />
      <AvatarFallback className="rounded-none text-xs">{name?.[0] ?? ''}</AvatarFallback>
    </AvatarUI>
  );
}

/** 根据生日计算周岁，未填写返回 null */
export function calculateAge(birthday?: string): number | null {
  if (!birthday) return null;
  const birth = new Date(birthday);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}
