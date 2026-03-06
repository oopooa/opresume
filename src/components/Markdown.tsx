import ReactMarkdown from 'react-markdown';

interface MarkdownProps {
  content: string;
  className?: string;
  /** 文字大小类名，默认 text-sm；传入 tokens.typography.contentSize 可与模板保持一致 */
  textSize?: string;
}

export function Markdown({ content, className, textSize = 'text-sm' }: MarkdownProps) {
  return (
    <div className={className}>
      <ReactMarkdown
        components={{
        ul: ({ children }) => (
          <ul className="list-disc pl-4 space-y-0.5">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal pl-4 space-y-0.5">{children}</ol>
        ),
        li: ({ children }) => <li className={textSize}>{children}</li>,
        p: ({ children }) => <p className={textSize}>{children}</p>,
        a: ({ href, children }) => (
          <a
            href={href}
            className="text-resume-primary underline"
            target="_blank"
            rel="noreferrer"
          >
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
    </div>
  );
}
