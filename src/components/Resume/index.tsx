import type { ResumeConfig } from '@/types';
import { useUIStore } from '@/store/ui';
import { Template1 } from './Template1';
import { Template2 } from './Template2';
import { Template3 } from './Template3';
import { Template4 } from './Template4';

interface ResumeViewProps {
  config: ResumeConfig;
}

const templates: Record<string, React.ComponentType<{ config: ResumeConfig }>> = {
  template1: Template1,
  template2: Template2,
  template3: Template3,
  template4: Template4,
};

export function ResumeView({ config }: ResumeViewProps) {
  const template = useUIStore((s) => s.template);
  const Component = templates[template] ?? Template1;
  return <Component config={config} />;
}
