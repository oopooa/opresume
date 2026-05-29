import type { ModuleProps } from '../types';
import type { JsonGrant } from '@/types/json-resume';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { EditableSection, TimeRange, getTitle, isHidden, useModuleIcon } from '../shared';

export function GrantModule({ config, tokens, itemRange, showTitle = true }: ModuleProps) {
  const { t } = useTranslation();
  const moduleIcon = useModuleIcon('grantList');
  const { SectionTitle } = tokens.components;
  if (isHidden(config, 'grantList')) return null;

  const all = (config['x-op-grants'] ?? []) as JsonGrant[];
  if (!all.length) return null;

  const list = itemRange ? all.slice(itemRange[0], itemRange[1]) : all;
  const indexOffset = itemRange ? itemRange[0] : 0;

  return (
    <EditableSection module="grantList">
      <section className={tokens.spacing.module}>
        {showTitle && (
          <SectionTitle
            title={getTitle(config, 'grantList', t('module.grantList'))}
            icon={moduleIcon}
          />
        )}
        {list.map((g, i) => {
          const header = [g.title, g.grantId ? `(${g.grantId})` : null].filter(Boolean).join(' ');
          return (
            <div
              key={g['x-op-id'] ?? i}
              data-item-index={indexOffset + i}
              className={tokens.spacing.item}
            >
              <div className={cn('flex justify-between', tokens.layout.flexAlign)}>
                <p
                  className={cn(
                    tokens.typography.titleSize,
                    tokens.typography.titleWeight,
                    tokens.colors.primary,
                  )}
                >
                  {header}
                </p>
                <TimeRange startDate={g.startDate} endDate={g.endDate} />
              </div>
              {g.agency && (
                <p className={cn(tokens.typography.contentSize, tokens.colors.secondary)}>
                  {g.agency}
                </p>
              )}
              {g.role && (
                <p className={cn(tokens.typography.contentSize, tokens.colors.secondary)}>
                  {t('field.grantRole')}: {g.role}
                </p>
              )}
              {g.total && (
                <p className={cn(tokens.typography.contentSize, tokens.colors.secondary)}>
                  {t('field.grantTotal')}: {g.total}
                </p>
              )}
            </div>
          );
        })}
      </section>
    </EditableSection>
  );
}
