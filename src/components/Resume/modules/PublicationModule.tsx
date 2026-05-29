import type { ModuleProps } from '../types';
import type { JsonPublication } from '@/types/json-resume';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { EditableSection, getTitle, isHidden, useModuleIcon, renderAuthors } from '../shared';

/** 去掉字符串结尾的句号/逗号/分号/空格，让外层统一加分隔符 */
function stripTrailingPunct(s?: string): string {
  if (!s) return '';
  return s.replace(/[\s.,;]+$/, '');
}

function PublicationEntry({ pub, tokens }: { pub: JsonPublication; tokens: ModuleProps['tokens'] }) {
  const cleanAuthors = stripTrailingPunct(pub.authors);
  const cleanTitle = stripTrailingPunct(pub.title);
  return (
    <li className={cn(tokens.spacing.item, tokens.typography.contentSize, 'leading-snug')}>
      {renderAuthors(cleanAuthors, pub.selfAuthor)}
      {cleanAuthors && cleanTitle ? '. ' : ''}
      {cleanTitle && <span>&ldquo;{cleanTitle}&rdquo;.</span>}
      {pub.venue && (
        <>
          {' '}In: <em>{pub.venue}</em>
          {pub.year ? ` (${pub.year})` : ''}
          {pub.note ? `, ${pub.note}` : ''}.
        </>
      )}
      {!pub.venue && pub.year ? ` (${pub.year}).` : ''}
      {(pub.doi || pub.url) && (
        <>
          {' '}
          {pub.doi && (
            <a
              href={pub.doi.startsWith('http') ? pub.doi : `https://doi.org/${pub.doi}`}
              className={cn('underline', tokens.colors.secondary)}
              target="_blank"
              rel="noreferrer"
            >
              DOI: {pub.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//, '')}
            </a>
          )}
          {!pub.doi && pub.url && (
            <a
              href={pub.url}
              className={cn('underline', tokens.colors.secondary)}
              target="_blank"
              rel="noreferrer"
            >
              {pub.url}
            </a>
          )}
        </>
      )}
    </li>
  );
}

export function PublicationModule({ config, tokens, itemRange, showTitle = true }: ModuleProps) {
  const { t } = useTranslation();
  const moduleIcon = useModuleIcon('publicationList');
  const { SectionTitle } = tokens.components;
  if (isHidden(config, 'publicationList')) return null;

  const all = (config['x-op-publications'] ?? []) as JsonPublication[];
  if (!all.length) return null;

  const list = itemRange ? all.slice(itemRange[0], itemRange[1]) : all;
  const indexOffset = itemRange ? itemRange[0] : 0;

  const firstGroup = list.filter((p) => (p.category ?? 'first') === 'first');
  const contribGroup = list.filter((p) => p.category === 'contributing');

  // 分组小标题只在「本切片首次包含该分组的第一条」时渲染，避免跨页重复。
  const firstFirstIdx = all.findIndex((p) => (p.category ?? 'first') === 'first');
  const firstContribIdx = all.findIndex((p) => p.category === 'contributing');
  const showFirstHead = firstGroup.length > 0 && firstFirstIdx >= indexOffset;
  const showContribHead = contribGroup.length > 0 && firstContribIdx >= indexOffset;

  return (
    <EditableSection module="publicationList">
      <section className={tokens.spacing.module}>
        {showTitle && (
          <SectionTitle
            title={getTitle(config, 'publicationList', t('module.publicationList'))}
            icon={moduleIcon}
          />
        )}
        {firstGroup.length > 0 && (
          <>
            {showFirstHead && (
              <div className="mb-1 flex items-baseline justify-between gap-3">
                <p
                  className={cn(
                    'font-bold',
                    tokens.typography.contentSize,
                    tokens.colors.primary,
                  )}
                >
                  {t('module.publicationFirstAuthor')}
                </p>
                {firstGroup.some((p) => /[*#]/.test(p.authors ?? '')) && (
                  <p
                    className={cn(
                      'italic shrink-0',
                      tokens.typography.contentSize,
                      tokens.colors.secondary,
                    )}
                  >
                    {t('module.publicationLegendFirst')}
                  </p>
                )}
              </div>
            )}
            <ol className="ml-5 list-decimal space-y-1">
              {firstGroup.map((pub, i) => (
                <div key={pub['x-op-id'] ?? `f-${i}`} data-item-index={indexOffset + i}>
                  <PublicationEntry pub={pub} tokens={tokens} />
                </div>
              ))}
            </ol>
          </>
        )}
        {contribGroup.length > 0 && (
          <>
            {showContribHead && (
              <p
                className={cn(
                  'mt-2 mb-1 font-bold',
                  tokens.typography.contentSize,
                  tokens.colors.primary,
                )}
              >
                {t('module.publicationContributing')}
              </p>
            )}
            <ol className="ml-5 list-decimal space-y-1">
              {contribGroup.map((pub, i) => (
                <div
                  key={pub['x-op-id'] ?? `c-${i}`}
                  data-item-index={indexOffset + firstGroup.length + i}
                >
                  <PublicationEntry pub={pub} tokens={tokens} />
                </div>
              ))}
            </ol>
          </>
        )}
      </section>
    </EditableSection>
  );
}
