import type { ModuleProps } from '../types';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { EditableSection, TimeRange, getTitle, isHidden, useModuleIcon } from '../shared';

export function EducationModule({ config, tokens }: ModuleProps) {
  const { t } = useTranslation();
  const moduleIcon = useModuleIcon('educationList');
  const { SectionTitle } = tokens.components;
  if (isHidden(config, 'educationList') || !config.educationList?.length) return null;

  const isInline = tokens.variants.education === 'inline';

  return (
    <EditableSection module="educationList">
      <section className={tokens.spacing.module}>
        <SectionTitle title={getTitle(config, 'educationList', t('module.educationList'))} icon={moduleIcon} />
        {config.educationList.map((edu) => (
          <div
            key={edu.id}
            className={cn(tokens.spacing.item, isInline && 'flex items-baseline justify-between')}
          >
            <div className={cn(isInline && 'flex items-baseline gap-2')}>
              <p className={cn(isInline ? tokens.typography.titleSize : tokens.typography.contentSize, tokens.typography.titleWeight, tokens.colors.primary)}>
                {edu.school}
              </p>
              {isInline ? (
                <span className={cn(tokens.typography.contentSize, tokens.colors.secondary)}>
                  {edu.major}{edu.academicDegree && ` · ${edu.academicDegree}`}
                </span>
              ) : (
                <p className={cn(tokens.typography.contentSize, tokens.colors.secondary)}>
                  {edu.major}{edu.academicDegree && ` · ${edu.academicDegree}`}
                </p>
              )}
            </div>
            <TimeRange time={edu.eduTime} />
          </div>
        ))}
      </section>
    </EditableSection>
  );
}
