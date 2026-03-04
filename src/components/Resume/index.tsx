import type { ResumeConfig } from '@/types';
import type { TemplateDefinition } from './types';
import { useUIStore } from '@/store/ui';
import { useTemplateModules } from './modules';
import { definitions, defaultDefinition } from './templates';

function TemplateRenderer({ def, config }: { def: TemplateDefinition; config: ResumeConfig }) {
  const { sidebarContent, mainContent } = useTemplateModules(def, config);
  const Shell = def.LayoutShell;
  return <Shell config={config} sidebarContent={sidebarContent} mainContent={mainContent} />;
}

export function ResumeView({ config }: { config: ResumeConfig }) {
  const template = useUIStore((s) => s.template);
  const def = definitions[template] ?? defaultDefinition;
  return <TemplateRenderer def={def} config={config} />;
}
