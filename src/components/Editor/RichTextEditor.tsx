import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { RichTextToolbar } from './RichTextToolbar';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const { t } = useTranslation();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        strike: false,
        code: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { target: '_blank', rel: 'noreferrer' },
      }),
      Placeholder.configure({
        placeholder: placeholder ?? t('editor.placeholder', ''),
      }),
    ],
    content: value,
    onUpdate: ({ editor: e }) => {
      const html = e.getHTML();
      onChange(html === '<p></p>' ? '' : html);
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== current && value !== (current === '<p></p>' ? '' : current)) {
      editor.commands.setContent(value || '');
    }
  }, [value, editor]);

  const handleEditorClick = useCallback(() => {
    editor?.commands.focus();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="rounded-md border border-input shadow-sm transition-colors focus-within:border-ring">
      <RichTextToolbar editor={editor} />
      <div
        className="px-3 py-2 cursor-text"
        onClick={handleEditorClick}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
