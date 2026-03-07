import { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link as LinkIcon,
  Undo2,
  Redo2,
  Check,
  X,
} from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface ToolbarButtonProps {
  tooltip: string;
  pressed: boolean;
  onPressedChange: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

function ToolbarButton({ tooltip, pressed, onPressedChange, disabled, children }: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Toggle
          size="sm"
          pressed={pressed}
          onPressedChange={onPressedChange}
          disabled={disabled}
        >
          {children}
        </Toggle>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

function LinkPopover({ editor }: { editor: Editor }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  // 保存打开 Popover 时的选区，防止焦点转移到 Input 后选区丢失
  const savedSelection = useRef<{ from: number; to: number } | null>(null);

  const handleOpen = useCallback((isOpen: boolean) => {
    if (isOpen) {
      const { from, to } = editor.state.selection;
      savedSelection.current = { from, to };
      const existing = editor.getAttributes('link').href ?? '';
      setUrl(existing);
    } else {
      savedSelection.current = null;
    }
    setOpen(isOpen);
  }, [editor]);

  const handleConfirm = useCallback(() => {
    let href = url.trim();
    // 自动补全协议前缀
    if (href && !/^https?:\/\//i.test(href)) {
      href = `https://${href}`;
    }
    // 恢复之前保存的选区
    if (savedSelection.current) {
      const { from, to } = savedSelection.current;
      editor.chain().focus().setTextSelection({ from, to }).run();
    } else {
      editor.chain().focus().run();
    }

    if (href) {
      if (editor.isActive('link')) {
        // 编辑已有链接
        editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
      } else if (savedSelection.current && savedSelection.current.from === savedSelection.current.to) {
        // 没有选中文本：插入 URL 作为链接文本
        editor.chain().focus().insertContent({
          type: 'text',
          text: href,
          marks: [{ type: 'link', attrs: { href, target: '_blank', rel: 'noreferrer' } }],
        }).run();
      } else {
        // 有选中文本：给选中文本添加链接
        editor.chain().focus().setLink({ href }).run();
      }
    } else {
      editor.chain().focus().unsetLink().run();
    }
    setOpen(false);
  }, [editor, url]);

  const handleRemove = useCallback(() => {
    if (savedSelection.current) {
      const { from, to } = savedSelection.current;
      editor.chain().focus().setTextSelection({ from, to }).run();
    }
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    setOpen(false);
  }, [editor]);

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Toggle
              size="sm"
              pressed={editor.isActive('link')}
              onPressedChange={() => handleOpen(!open)}
            >
              <LinkIcon className="h-4 w-4" />
            </Toggle>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {t('editor.link')}
        </TooltipContent>
      </Tooltip>
      <PopoverContent className="w-72 p-2" side="bottom" align="start">
        <div className="flex items-center gap-1.5">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={t('editor.linkPlaceholder')}
            className="h-8 text-xs"
            onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
          />
          <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={handleConfirm}>
            <Check className="h-3.5 w-3.5" />
          </Button>
          {editor.isActive('link') && (
            <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={handleRemove}>
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function RichTextToolbar({ editor }: { editor: Editor }) {
  const { t } = useTranslation();

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-0.5 border-b border-input px-1.5 py-1">
        {/* 文字格式 */}
        <ToolbarButton
          tooltip={t('editor.bold')}
          pressed={editor.isActive('bold')}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          tooltip={t('editor.italic')}
          pressed={editor.isActive('italic')}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-0.5 h-5" />

        {/* 列表 */}
        <ToolbarButton
          tooltip={t('editor.bulletList')}
          pressed={editor.isActive('bulletList')}
          onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          tooltip={t('editor.orderedList')}
          pressed={editor.isActive('orderedList')}
          onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-0.5 h-5" />

        {/* 链接 */}
        <LinkPopover editor={editor} />

        <Separator orientation="vertical" className="mx-0.5 h-5" />

        {/* 撤销重做 */}
        <ToolbarButton
          tooltip={t('editor.undo')}
          pressed={false}
          disabled={!editor.can().undo()}
          onPressedChange={() => editor.chain().focus().undo().run()}
        >
          <Undo2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          tooltip={t('editor.redo')}
          pressed={false}
          disabled={!editor.can().redo()}
          onPressedChange={() => editor.chain().focus().redo().run()}
        >
          <Redo2 className="h-4 w-4" />
        </ToolbarButton>
      </div>
    </TooltipProvider>
  );
}
