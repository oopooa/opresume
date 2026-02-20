import type { ResumeConfig } from '@/types';
import { useUIStore } from '@/store/ui';
import { Template1 } from './Template1';

interface ResumeViewProps {
  config: ResumeConfig;
}

const templates: Record<string, React.ComponentType<{ config: ResumeConfig }>> = {
  template1: Template1,
};

export function ResumeView({ config }: ResumeViewProps) {
  const template = useUIStore((s) => s.template);
  const Component = templates[template] ?? Template1;
  return <Component config={config} />;
}
