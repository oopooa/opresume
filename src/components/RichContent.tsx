import { cn } from '@/lib/utils';

interface RichContentProps {
  content: string;
  className?: string;
  textSize?: string;
}

export function RichContent({ content, className, textSize = 'resume-body-text' }: RichContentProps) {
  if (!content) return null;

  return (
    <div
      className={cn('rich-content', textSize, className)}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
