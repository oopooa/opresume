import type { ModuleProps } from '../types';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { EditableSection, getTitle, isHidden } from '../shared';

export function WorkListModule({ config, tokens }: ModuleProps) {
  const { t } = useTranslation();
  const { SectionTitle } = tokens;
  if (isHidden(config, 'workList') || !config.workList?.length) return null;

  return (
    <EditableSection module="workList">
      <section className={tokens.moduleSpacing}>
        <SectionTitle title={getTitle(config, 'workList', t('module.workList'))} />
        {config.workList.map((item) => (
          <div key={item.id} className="mb-2">
            <p className={cn('text-sm font-semibold', tokens.textPrimary)}>
              {item.workName}
              {item.visitLink && (
                <a
                  href={item.visitLink}
                  className="ml-2 text-xs font-normal text-resume-primary underline"
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  {item.visitLink}
                </a>
              )}
            </p>
            {item.workDesc && (
              <p className={cn('text-xs', tokens.textSecondary)}>{item.workDesc}</p>
            )}
          </div>
        ))}
      </section>
    </EditableSection>
  );
}
