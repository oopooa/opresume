import { useId } from 'react';
import { LayoutGroup, motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/ui';

const LANGS = [
  { code: 'zh-CN', label: '中' },
  { code: 'en-US', label: 'EN' },
] as const;

/** 滑块过渡：模块级稳定引用避免每次 render 构造新对象。
 *  时长 0.35s 让语言切换响应迅捷（SpacingPresetGroup 0.6s 强调"撑开缓慢"，诉求不同）。 */
const PILL_TRANSITION_SMOOTH = {
  duration: 0.35,
  ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
} as const;
const PILL_TRANSITION_NONE = { duration: 0 } as const;

export function LangSwitcher() {
  const lang = useUIStore((s) => s.lang);
  const setLang = useUIStore((s) => s.setLang);
  const reduceMotion = useReducedMotion();
  // useId 隔离 layoutId 命名空间，防止未来多实例（如 dialog 内）共用 "lang-pill" 串扰
  const groupId = useId();
  const pillTransition = reduceMotion ? PILL_TRANSITION_NONE : PILL_TRANSITION_SMOOTH;

  return (
    <LayoutGroup id={groupId}>
      <div className="inline-flex h-8 items-center rounded-md border bg-muted/40 p-0.5 text-xs font-medium">
        {LANGS.map((l) => {
          const active = lang === l.code;
          return (
            <button
              key={l.code}
              type="button"
              onClick={() => setLang(l.code)}
              className={cn(
                // 不用 transition-all：避免与外层 motion layout 的尺寸过渡产生双重动画
                'relative h-full rounded-[5px] px-2.5 transition-colors duration-[350ms]',
                active ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {/* 黑色高亮胶囊：layoutId 让它在选项间"飞"过去 */}
              {active && (
                <motion.span
                  layoutId="lang-pill"
                  className="absolute inset-0 rounded-[5px] bg-primary shadow-sm"
                  transition={pillTransition}
                />
              )}
              {/* z-10 必须保留：否则文字被 absolute 滑块遮住 */}
              <span className="relative z-10">{l.label}</span>
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}
