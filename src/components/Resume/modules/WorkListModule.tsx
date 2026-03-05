import type { ModuleProps } from '../types';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { EditableSection, getTitle, isHidden } from '../shared';

export function WorkListModule({ config, tokens }: ModuleProps) {
  const { t } = useTranslation();
  const { SectionTitle } = tokens.components;
  if (isHidden(config, 'workList') || !config.workList?.length) return null;

  return (
    <EditableSection module="workList">
      <section className={tokens.spacing.module}>
        <SectionTitle title={getTitle(config, 'workList', t('module.workList'))} />
        {config.workList.map((item) => (
          <div key={item.id} className={tokens.spacing.item}>
            <p className={cn(tokens.typography.titleSize, tokens.typography.titleWeight, tokens.colors.primary)}>
              {item.workName}
              {item.visitLink && (
                <a
                  href={item.visitLink}
                  className={cn('ml-2', tokens.typography.contentSize, 'font-normal text-resume-primary underline')}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  {item.visitLink}
                </a>
              )}
            </p>
            {item.workDesc && (
              <p className={cn(tokens.typography.contentSize, tokens.colors.secondary)}>{item.workDesc}</p>
            )}
          </div>
        ))}
      </section>
    </EditableSection>
  );
}
