import { memo } from 'react';
import { cn } from '@/lib/utils';
import { ICON_REGISTRY } from '@/config/icons';

interface DynamicIconProps {
  name?: string;
  className?: string;
  style?: React.CSSProperties;
}

/** 根据图标名称动态渲染 lucide 图标，名称无效时返回 null */
export const DynamicIcon = memo(function DynamicIcon({ name, className, style }: DynamicIconProps) {
  if (!name) return null;
  const Icon = ICON_REGISTRY[name];
  if (!Icon) return null;
  return <Icon className={cn('h-4 w-4 shrink-0', className)} style={style} />;
});
