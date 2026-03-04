import type { ModuleProps } from '../types';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { EditableSection, TimeRange, getTitle, isHidden } from '../shared';

export function EducationModule({ config, tokens }: ModuleProps) {
  const { t } = useTranslation();
  const { SectionTitle } = tokens;
  if (isHidden(config, 'educationList') || !config.educationList?.length) return null;

  return (
    <EditableSection module="educationList">
      <section className={tokens.moduleSpacing}>
        <SectionTitle title={getTitle(config, 'educationList', t('module.educationList'))} />
        {config.educationList.map((edu) => (
          <div
            key={edu.id}
            className={cn('mb-2', tokens.educationInline && 'flex items-baseline justify-between')}
          >
            <div className={cn(tokens.educationInline && 'flex items-baseline gap-2')}>
              <p className={cn(tokens.educationInline ? 'text-sm' : 'text-xs', 'font-semibold', tokens.textPrimary)}>
                {edu.school}
              </p>
              {tokens.educationInline ? (
                <span className={cn('text-xs', tokens.textSecondary)}>
                  {edu.major}{edu.academicDegree && ` · ${edu.academicDegree}`}
                </span>
              ) : (
                <p className={cn('text-xs', tokens.textSecondary)}>
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
