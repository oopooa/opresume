import type { ModuleProps } from '../types';
import type { ExtendedSkill } from '@/types/extended-json-resume';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { EditableSection, getTitle, isHidden, useModuleIcon } from '../shared';

interface SkillListProps {
  skills: ExtendedSkill[];
  tokens: ModuleProps['tokens'];
}

function SkillBarList({ skills, tokens }: SkillListProps) {
  return (
    <>
      {skills.map((skill, i) => (
        <div key={skill['x-op-id'] ?? i} className={tokens.spacing.item}>
          <div className="mb-0.5 flex items-center justify-between text-xs">
            <span>{skill.name}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-gray-200">
            <div
              className="h-1.5 rounded-full bg-resume-primary"
              style={{ width: `${skill['x-op-skillLevel'] ?? 0}%` }}
            />
          </div>
        </div>
      ))}
    </>
  );
}

function SkillNumberList({ skills, tokens }: SkillListProps) {
  return (
    <ul className="list-inside space-y-1">
      {skills.map((skill, i) => (
        <li key={skill['x-op-id'] ?? i} className={cn(tokens.typography.contentSize, tokens.colors.primary)}>
          <span className={cn('mr-1 text-xs', tokens.typography.titleWeight, 'text-resume-primary')}>
            {i + 1}.
          </span>
          {skill.name}
          {skill.level && (
            <span className={cn('ml-1 text-xs', tokens.colors.muted)}>— {skill.level}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

function SkillTagList({ skills, tokens }: SkillListProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((skill, i) => (
        <span
          key={skill['x-op-id'] ?? i}
          className={cn('rounded-full px-3 py-1', tokens.typography.contentSize, tokens.colors.primary)}
          style={{ backgroundColor: 'color-mix(in srgb, var(--resume-primary) 15%, transparent)' }}
        >
          {skill.name}
        </span>
      ))}
    </div>
  );
}

export function SkillModule({ config, tokens, showTitle = true }: ModuleProps) {
  const { t } = useTranslation();
  const moduleIcon = useModuleIcon('skillList');
  const skillList = config.skills as ExtendedSkill[] | undefined;
  if (isHidden(config, 'skillList') || !skillList?.length) return null;

  const { SectionTitle } = tokens.components;

  return (
    <EditableSection module="skillList">
      <div className={tokens.spacing.module}>
        {showTitle && <SectionTitle title={getTitle(config, 'skillList', t('module.skillList'))} icon={moduleIcon} />}
        {tokens.variants.skill === 'bar' && <SkillBarList skills={skillList} tokens={tokens} />}
        {tokens.variants.skill === 'list' && <SkillNumberList skills={skillList} tokens={tokens} />}
        {tokens.variants.skill === 'tags' && <SkillTagList skills={skillList} tokens={tokens} />}
      </div>
    </EditableSection>
  );
}
