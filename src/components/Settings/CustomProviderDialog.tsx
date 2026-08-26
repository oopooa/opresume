import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, ServerCog } from 'lucide-react';
import { toast } from 'sonner';
import { useAIStore } from '@/store/ai';
import { useUIStore } from '@/store/ui';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { normalizeApiBaseUrl } from '@/lib/utils';
import type { CustomProvider } from '@/types';

/**
 * 自定义供应商快速创建对话框（OpenAI 兼容端点的轻量封装，类似 Vercel AI SDK UI 的
 * “选 Provider → 填 Base URL → 粘 API Key” 流程）：
 * 名称 + Base URL + API Key（可空）+ 模型 ID → 保存后自动打开配置对话框去验证。
 */
export function CustomProviderDialog() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');

  const upsertCustomProvider = useAIStore((s) => s.upsertCustomProvider);
  const openProviderConfig = useUIStore((s) => s.openProviderConfig);

  useEffect(() => {
    if (!open) {
      setName('');
      setApiUrl('');
      setApiKey('');
      setModel('');
    }
  }, [open]);

  const handleCreate = useCallback(() => {
    const trimmedName = name.trim();
    const trimmedModel = model.trim();
    // 归一化 Base URL：补协议、去结尾斜杠与多余 /v1（用户常粘贴 https://api.example.com/v1）
    const trimmedUrl = normalizeApiBaseUrl(apiUrl);
    if (!trimmedName || !trimmedUrl || !trimmedModel) {
      toast.error(t('settings.customProviderRequired'));
      return;
    }

    const cp: CustomProvider = {
      id: `custom-${Date.now()}`,
      name: trimmedName,
      apiUrl: trimmedUrl,
      apiKey: apiKey.trim(),
      model: trimmedModel,
      verified: false,
    };
    upsertCustomProvider(cp);
    setOpen(false);
    // 直接进入该供应商的配置对话框：验证密钥 / 拉取模型列表 / 保存为当前引擎
    openProviderConfig(cp.id);
  }, [name, apiUrl, apiKey, model, upsertCustomProvider, openProviderConfig, t]);

  return (
    <>
      <Button
        variant="outline"
        className="w-full"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-4 w-4" />
        {t('settings.addCustomProvider')}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
          <DialogHeader className="px-6 pb-0 pt-5">
            <DialogTitle className="flex items-center gap-2 text-base">
              <ServerCog className="h-4 w-4 text-primary" />
              {t('settings.addCustomProvider')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 px-6 py-5">
            <div className="space-y-1.5">
              <Label htmlFor="cpName">{t('settings.customProviderName')}</Label>
              <Input
                id="cpName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="我的中转 / vLLM 网关 …"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cpUrl">{t('settings.customProviderBaseUrl')}</Label>
              <Input
                id="cpUrl"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="https://api.example.com"
                className="font-mono"
              />
              <p className="text-[11px] text-slate-400">{t('settings.customProviderBaseUrlHint')}</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cpKey">{t('settings.apiKey')}</Label>
              <Input
                id="cpKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cpModel">{t('settings.customProviderModel')}</Label>
              <Input
                id="cpModel"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="gpt-4o-mini / qwen2.5:7b …"
                className="font-mono"
              />
            </div>
          </div>

          <DialogFooter className="border-t px-6 py-4">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleCreate}>{t('settings.customProviderCreate')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}