import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, ExternalLink, Loader2, Check, AlertTriangle, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useAIStore } from '@/store/ai';
import { AI_PROVIDER_PRESETS } from '@/config/ai-providers';
import { verifyApiKey, type VerifyErrorCode } from '@/services/ai';
import type { AIProviderId, AIModel } from '@/types';
import qwenIcon from '@/assets/icons/qwen.svg';
import deepseekIcon from '@/assets/icons/deepseek.svg';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ProviderConfigDialogProps {
  providerId: AIProviderId | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type VerifyState = 'idle' | 'verifying' | 'success' | 'error';

/** 验证错误码 → i18n 键 */
const VERIFY_ERROR_I18N: Record<VerifyErrorCode, string> = {
  empty_key: 'settings.verifyEmptyKey',
  invalid_key: 'settings.verifyInvalidKey',
  network_error: 'settings.verifyNetworkError',
  unknown_provider: 'settings.verifyFailed',
  request_failed: 'settings.verifyRequestFailed',
};

/** 标签样式配置（i18n 键 → 样式类名） */
const TAG_STYLES: Record<string, { i18nKey: string; className: string }> = {
  free: { i18nKey: 'settings.tagFree', className: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
  reasoning: { i18nKey: 'settings.tagReasoning', className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
  code: { i18nKey: 'settings.tagCode', className: 'bg-blue-500/15 text-blue-600 dark:text-blue-400' },
  chat: { i18nKey: 'settings.tagChat', className: 'bg-violet-500/15 text-violet-600 dark:text-violet-400' },
};

/** 模型分组 SVG 图标映射 */
const GROUP_ICONS: Record<string, string> = {
  Qwen: qwenIcon,
  'deepseek-ai': deepseekIcon,
};

/** 将模型列表按前缀分组 */
function groupModels(models: AIModel[]): Record<string, AIModel[]> {
  const groups: Record<string, AIModel[]> = {};
  for (const model of models) {
    const slashIdx = model.id.indexOf('/');
    const group = slashIdx > 0 ? model.id.slice(0, slashIdx) : 'other';
    (groups[group] ??= []).push(model);
  }
  return groups;
}

export function ProviderConfigDialog({
  providerId,
  open,
  onOpenChange,
}: ProviderConfigDialogProps) {
  const { t } = useTranslation();
  const { updateProviderConfig, setActiveProvider, setProviderVerified } = useAIStore();

  const [apiKey, setApiKey] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [verifyState, setVerifyState] = useState<VerifyState>('idle');
  /** API 确认的可用模型 ID（null 表示未验证，显示全部预设模型） */
  const [availableIds, setAvailableIds] = useState<Set<string> | null>(null);

  const preset = providerId ? AI_PROVIDER_PRESETS[providerId] : null;

  // 渲染期间同步初始化状态，避免 useEffect 导致首帧空状态闪烁
  const [prevKey, setPrevKey] = useState<string | null>(null);
  const currentKey = providerId && open ? providerId : null;
  if (currentKey !== prevKey) {
    setPrevKey(currentKey);
    if (currentKey) {
      const config = useAIStore.getState().getProviderConfig(currentKey);
      setApiKey(config.apiKey);
      setApiUrl(config.apiUrl);
      setSelectedModel(config.selectedModel);
      setShowKey(false);
      setVerifyState('idle');
      // 恢复已持久化的可用模型 ID
      setAvailableIds(
        config.availableModelIds ? new Set(config.availableModelIds) : null,
      );
    }
  }

  // 预设模型经 API 可用性过滤后的展示列表
  const displayModels = useMemo(() => {
    if (!preset) return [];
    if (!availableIds) return preset.models;
    return preset.models.filter((m) => availableIds.has(m.id));
  }, [preset, availableIds]);

  const groupedModels = useMemo(() => groupModels(displayModels), [displayModels]);
  const groupKeys = useMemo(() => Object.keys(groupedModels).sort(), [groupedModels]);
  const hasModels = displayModels.length > 0;

  const handleVerify = useCallback(async () => {
    if (!providerId || !apiKey.trim()) return;

    setVerifyState('verifying');

    const result = await verifyApiKey(providerId, apiKey, apiUrl);

    if (result.success) {
      setVerifyState('success');
      setProviderVerified(providerId, true);
      toast.success(t('settings.verifySuccess'));

      if (result.availableModelIds) {
        const ids = new Set(result.availableModelIds);
        setAvailableIds(ids);
        // 持久化可用模型 ID
        updateProviderConfig(providerId, { availableModelIds: result.availableModelIds });
        // 如果当前选中的模型不在可用列表中，自动切换
        if (!ids.has(selectedModel)) {
          const presetModels = AI_PROVIDER_PRESETS[providerId].models;
          const firstAvailable = presetModels.find((m) => ids.has(m.id));
          if (firstAvailable) setSelectedModel(firstAvailable.id);
        }
      }
    } else {
      setVerifyState('error');
      const i18nKey = result.errorCode ? VERIFY_ERROR_I18N[result.errorCode] : 'settings.verifyFailed';
      toast.error(t(i18nKey));
      setProviderVerified(providerId, false);
    }
  }, [providerId, apiKey, apiUrl, selectedModel, setProviderVerified, updateProviderConfig, t]);

  // 验证成功后自动恢复按钮状态
  useEffect(() => {
    if (verifyState !== 'success') return;
    const timer = setTimeout(() => setVerifyState('idle'), 2000);
    return () => clearTimeout(timer);
  }, [verifyState]);

  const handleApiKeyChange = useCallback((value: string) => {
    setApiKey(value);
    setVerifyState('idle');
    setAvailableIds(null);
  }, []);

  const handleApiUrlChange = useCallback((value: string) => {
    setApiUrl(value);
    setVerifyState('idle');
    setAvailableIds(null);
  }, []);

  const handleSave = useCallback(() => {
    if (!providerId || !selectedModel) return;

    updateProviderConfig(providerId, {
      apiKey,
      apiUrl,
      selectedModel,
    });
    setActiveProvider(providerId);
    onOpenChange(false);
  }, [providerId, apiKey, apiUrl, selectedModel, updateProviderConfig, setActiveProvider, onOpenChange]);

  if (!preset || !providerId) return null;

  const providerVerified = providerId ? !!useAIStore.getState().providers[providerId]?.verified : false;
  const canSave = apiKey.trim() && selectedModel && (verifyState === 'success' || providerVerified);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="px-6 pb-0 pt-5">
          <DialogTitle className="flex items-center gap-3">
            {preset.icon ? (
              <img src={preset.icon} alt={t(preset.nameKey)} className="h-10 w-10 rounded-xl" />
            ) : (
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm',
                  preset.brandColor,
                )}
              >
                {preset.abbr}
              </div>
            )}
            <a
              href={preset.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-primary transition-colors"
            >
              {t(preset.nameKey)}
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            </a>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 px-6 py-5">
          {/* API 密钥 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="apiKey">{t('settings.apiKey')}</Label>
              <a
                href={preset.apiKeyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
              >
                {t('settings.getApiKey')}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="apiKey"
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => handleApiKeyChange(e.target.value)}
                  placeholder="sk-..."
                  className={cn(
                    'font-mono transition-colors duration-300',
                    verifyState === 'error' ? 'pr-16 border-amber-500/50 ring-1 ring-amber-500/20' : 'pr-10',
                    verifyState === 'success' && 'border-emerald-500/50 ring-1 ring-emerald-500/20',
                  )}
                />
                {verifyState === 'error' && (
                  <AlertTriangle className="absolute right-8 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-500" />
                )}
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button
                variant="outline"
                onClick={handleVerify}
                disabled={!apiKey.trim() || verifyState === 'verifying'}
                className={cn(
                  'min-w-[72px] transition-colors duration-300',
                  verifyState === 'success' && 'border-emerald-500/50 text-emerald-600',
                )}
              >
                {verifyState === 'verifying' && <Loader2 className="h-4 w-4 animate-spin" />}
                {verifyState === 'success' && <Check className="h-4 w-4" />}
                {(verifyState === 'idle' || verifyState === 'error') && t('settings.verify')}
              </Button>
            </div>
          </div>

          {/* API 地址 */}
          <div className="space-y-2">
            <Label htmlFor="apiUrl">{t('settings.apiUrl')}</Label>
            <Input
              id="apiUrl"
              value={apiUrl}
              onChange={(e) => handleApiUrlChange(e.target.value)}
              className="font-mono"
            />
          </div>

          {/* 模型选择 */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              {t('settings.model')}
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-[11px] font-medium text-muted-foreground">
                {displayModels.length}
              </span>
            </Label>
            {hasModels ? (
              <div className="max-h-[300px] space-y-1.5 overflow-y-auto rounded-lg border p-1.5">
                {groupKeys.map((group) => {
                  const groupIcon = GROUP_ICONS[group];
                  const groupModelsArr = groupedModels[group];
                  return (
                    <Collapsible key={group} defaultOpen>
                      <div className="rounded-md bg-muted/30">
                        <CollapsibleTrigger className="group flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-muted/60">
                          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=closed]:-rotate-90" />
                          <span className="text-sm font-semibold">{group}</span>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="space-y-0.5 px-1 pb-1">
                            {groupModelsArr.map((model) => {
                              const isSelected = selectedModel === model.id;
                              const tags = model.tags ?? [];
                              return (
                                <button
                                  key={model.id}
                                  type="button"
                                  onClick={() => setSelectedModel(model.id)}
                                  className={cn(
                                    'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-all duration-200',
                                    isSelected
                                      ? 'bg-emerald-500/[0.08]'
                                      : 'hover:bg-muted/50',
                                  )}
                                >
                                  {groupIcon && (
                                    <img src={groupIcon} alt="" className="h-4 w-4 shrink-0" />
                                  )}
                                  <div className="flex min-w-0 flex-1 items-center gap-2">
                                    <span
                                      className={cn(
                                        'truncate text-sm',
                                        isSelected ? 'font-medium text-foreground' : 'text-muted-foreground',
                                      )}
                                    >
                                      {model.name}
                                    </span>
                                    {tags.map((tag) => {
                                      const style = TAG_STYLES[tag];
                                      if (!style) return null;
                                      return (
                                        <span
                                          key={tag}
                                          className={cn(
                                            'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium leading-tight',
                                            style.className,
                                          )}
                                        >
                                          {t(style.i18nKey)}
                                        </span>
                                      );
                                    })}
                                  </div>
                                  {isSelected && (
                                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center rounded-xl border border-dashed p-4 text-xs text-muted-foreground">
                {t('settings.noModels')}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="border-t px-6 py-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {t('settings.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
