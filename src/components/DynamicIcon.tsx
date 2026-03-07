import { memo } from 'react';
import { cn } from '@/lib/utils';
import { ICON_REGISTRY } from '@/config/icons';
import { useUIStore } from '@/store/ui';

interface DynamicIconProps {
  name?: string;
  className?: string;
  style?: React.CSSProperties;
  /** 为 true 时忽略全局图标隐藏设置，编辑器中使用 */
  forceShow?: boolean;
}

/** 根据图标名称动态渲染 lucide 图标，名称无效或全局图标隐藏时返回 null */
export const DynamicIcon = memo(function DynamicIcon({ name, className, style, forceShow }: DynamicIconProps) {
  const showIcons = useUIStore((s) => s.showIcons);
  if (!name) return null;
  if (!forceShow && !showIcons) return null;
  const Icon = ICON_REGISTRY[name];
  if (!Icon) return null;
  return <Icon className={cn('h-4 w-4 shrink-0', className)} style={style} />;
});
