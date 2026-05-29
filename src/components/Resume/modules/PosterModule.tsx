import type { ModuleProps } from '../types';
import type { JsonPoster } from '@/types/json-resume';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { EditableSection, getTitle, isHidden, useModuleIcon, renderAuthors } from '../shared';

export function PosterModule({ config, tokens, itemRange, showTitle = true }: ModuleProps) {
  const { t } = useTranslation();
  const moduleIcon = useModuleIcon('posterList');
  const { SectionTitle } = tokens.components;
  if (isHidden(config, 'posterList')) return null;

  const all = (config['x-op-posters'] ?? []) as JsonPoster[];
  if (!all.length) return null;

  const list = itemRange ? all.slice(itemRange[0], itemRange[1]) : all;
  const indexOffset = itemRange ? itemRange[0] : 0;

  return (
    <EditableSection module="posterList">
      <section className={tokens.spacing.module}>
        {showTitle && (
          <SectionTitle
            title={getTitle(config, 'posterList', t('module.posterList'))}
            icon={moduleIcon}
          />
        )}
        <ol className="ml-5 list-decimal space-y-1">
          {list.map((p, i) => (
            <li
              key={p['x-op-id'] ?? i}
              data-item-index={indexOffset + i}
              className={cn(tokens.typography.contentSize, 'leading-snug')}
            >
              {renderAuthors(p.authors, p.selfAuthor)}
              {p.authors && p.title ? '. ' : ''}
              {p.title && <span>&ldquo;{p.title}&rdquo;.</span>}
              {p.venue && (
                <>
                  {' '}In: <em>{p.venue}</em>
                  {p.year ? `, ${p.year}` : ''}.
                </>
              )}
              {!p.venue && p.year ? ` ${p.year}.` : ''}
            </li>
          ))}
        </ol>
      </section>
    </EditableSection>
  );
}
