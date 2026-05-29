import type { ModuleProps } from '../types';
import type { JsonTeaching } from '@/types/json-resume';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { RichContent } from '@/components/RichContent';
import { EditableSection, EditableSectionTitle, PolishHost, TimeRange, getTitle, isHidden, useModuleIcon, usePrivacyMask } from '../shared';

export function TeachingModule({ config, tokens, itemRange, showTitle = true }: ModuleProps) {
  const { t } = useTranslation();
  const moduleIcon = useModuleIcon('teachingList');
  const { SectionTitle } = tokens.components;
  const mask = usePrivacyMask();
  if (isHidden(config, 'teachingList') || !config['x-op-teaching']?.length) return null;

  const allTeaching = config['x-op-teaching'] as JsonTeaching[];
  const list = itemRange ? allTeaching.slice(itemRange[0], itemRange[1]) : allTeaching;
  const indexOffset = itemRange ? itemRange[0] : 0;

  return (
    <EditableSection module="teachingList" hoverScope="title">
      <section className={tokens.spacing.module}>
        {showTitle && (
          <EditableSectionTitle>
            <SectionTitle title={getTitle(config, 'teachingList', t('module.teachingList'))} icon={moduleIcon} />
          </EditableSectionTitle>
        )}
        {list.map((teaching, i) => (
          <div key={teaching['x-op-id'] ?? i} className={tokens.spacing.item} data-item-index={indexOffset + i}>
            <div className={cn('flex justify-between', tokens.layout.flexAlign)}>
              <div>
                <p className={cn(tokens.typography.titleSize, tokens.typography.titleWeight, tokens.colors.primary)}>
                  {mask(teaching.name, 'companyName')}
                </p>
                {teaching['x-op-departmentName'] && (
                  <p className={cn(tokens.typography.contentSize, tokens.colors.secondary)}>
                    {mask(teaching['x-op-departmentName'], 'departmentName')}
                  </p>
                )}
                {teaching['x-op-advisor'] && (
                  <p className={cn('italic', tokens.typography.contentSize, tokens.colors.secondary)}>
                    {teaching['x-op-advisor']}
                  </p>
                )}
              </div>
              <TimeRange startDate={teaching.startDate} endDate={teaching.endDate} />
            </div>
            {teaching['x-op-workDescHtml'] && (
              <PolishHost className="mt-1" itemIndex={indexOffset + i}>
                <RichContent content={teaching['x-op-workDescHtml']} textSize={tokens.typography.contentSize} />
              </PolishHost>
            )}
          </div>
        ))}
      </section>
    </EditableSection>
  );
}
