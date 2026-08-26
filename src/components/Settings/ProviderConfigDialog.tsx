import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, ExternalLink, Loader2, Check, AlertTriangle, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useAIStore } from '@/store/ai';
import { getProviderPreset } from '@/config/ai-providers';
import { verifyApiKey, type VerifyErrorCode } from '@/services/ai';
import type { AIProviderId, AIModel } from '@/types';
import qwenIcon from '@/assets/icons/qwen.svg';
import deepseekIcon from '@/assets/icons/deepseek.svg';
import { cn, normalizeApiBaseUrl } from '@/lib/utils';
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
  cors_error: 'settings.verifyCorsError',
};

/** 标签样式配置（i18n 键 → 样式类名） */
const TAG_STYLES: Record<string, { i18nKey: string; className: string }> = {
  free: { i18nKey: 'settings.tagFree', className: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
  reasoning: { i18nKey: 'settings.tagReasoning', className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
  code: { i18nKey: 'settings.tagCode', className: 'bg-blue-500/15 text-blue-600 dark:text-blue-400' },
  chat: { i18nKey: 'settings.tagChat', className: 'bg-violet-500/15 text-violet-600 dark:text-violet-400' },
  local: { i18nKey: 'settings.tagLocal', className: 'bg-slate-500/15 text-slate-600 dark:text-slate-400' },
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
  const { updateProviderConfig, setActiveProvider, setProviderVerified, removeCustomProvider } = useAIStore();
  const customProviders = useAIStore((s) => s.customProviders);

  const [apiKey, setApiKey] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [verifyState, setVerifyState] = useState<VerifyState>('idle');
  /** 验证失败的错误码与详情（用于内联展示，帮助定位连接问题） */
  const [verifyError, setVerifyError] = useState<{ code: VerifyErrorCode; detail: string } | null>(null);
  /** API 确认的可用模型 ID（null 表示未验证，显示预设模型） */
  const [availableIds, setAvailableIds] = useState<Set<string> | null>(null);

  const preset = providerId ? getProviderPreset(providerId, customProviders) : null;
  const customName = providerId
    ? (customProviders.find((c) => c.id === providerId)?.name ?? '')
    : '';
  // 自定义供应商（本地无鉴权网关等）默认不强制要求 API Key
  const requiresKey = preset?.requiresKey ?? !preset?.custom;

  // 渲染期间同步初始化状态，避免 useEffect 导致首帧空状态闪烁
  const [prevKey, setPrevKey] = useState<string | null>(null);
  const currentKey = providerId && open ? providerId : null;
  if (currentKey !== prevKey) {
    setPrevKey(currentKey);
    if (currentKey) {
      const config = useAIStore.getState().getProviderConfig(currentKey);
      // 自定义供应商：创建对话框中已填写的名称/Key/模型直接带出
      const cp = preset?.custom ? customProviders.find((c) => c.id === currentKey) : undefined;
      setApiKey(cp?.apiKey ?? config.apiKey);
      setApiUrl(cp?.apiUrl ?? config.apiUrl);
      setSelectedModel(cp?.model ?? (config.selectedModel || preset?.recommendedModel || ''));
      setShowKey(false);
      setVerifyState('idle');
      setVerifyError(null);
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
    if (preset.custom) {
      // 自定义供应商：直接展示 API 返回的可用模型（可能超出创建时填的单个模型）
      return [...availableIds].sort().map((id) => ({ id, name: id } as AIModel));
    }
    return preset.models.filter((m) => availableIds.has(m.id));
  }, [preset, availableIds]);

  const groupedModels = useMemo(() => groupModels(displayModels), [displayModels]);
  const groupKeys = useMemo(() => Object.keys(groupedModels).sort(), [groupedModels]);
  const hasModels = displayModels.length > 0;

  const handleVerify = useCallback(async () => {
    if (!providerId) return;
    if (requiresKey && !apiKey.trim()) return;

    setVerifyState('verifying');
    setVerifyError(null);

    // 归一化 Base URL（去除结尾 /v1 等），避免 /v1/v1/models 类 404
    const result = await verifyApiKey(providerId, apiKey, normalizeApiBaseUrl(apiUrl), customProviders);

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
          const firstAvailable = [...ids].sort()[0] ?? '';
          if (firstAvailable) setSelectedModel(firstAvailable);
        }
      }
    } else {
      setVerifyState('error');
      const code = result.errorCode ?? 'request_failed';
      setVerifyError({ code, detail: result.errorDetail ?? '' });
      const message = code === 'cors_error' ? t('settings.verifyCorsError') : t(VERIFY_ERROR_I18N[code]);
      toast.error(result.errorDetail ? `${message}（${result.errorDetail}）` : message);
      setProviderVerified(providerId, false);
    }
  }, [providerId, apiKey, apiUrl, selectedModel, requiresKey, customProviders, setProviderVerified, updateProviderConfig, t]);

  // 验证成功后自动恢复按钮状态
  useEffect(() => {
    if (verifyState !== 'success') return;
    const timer = setTimeout(() => setVerifyState('idle'), 2000);
    return () => clearTimeout(timer);
  }, [verifyState]);

  const handleApiKeyChange = useCallback((value: string) => {
    setApiKey(value);
    setVerifyState('idle');
    setVerifyError(null);
    setAvailableIds(null);
  }, []);

  const handleApiUrlChange = useCallback((value: string) => {
    setApiUrl(value);
    setVerifyState('idle');
    setVerifyError(null);
    setAvailableIds(null);
  }, []);

  const handleModelChange = useCallback((value: string) => {
    setSelectedModel(value);
    setVerifyState('idle');
    setVerifyError(null);
  }, []);

  const handleSave = useCallback(() => {
    if (!providerId || !selectedModel) return;

    const wasVerified = !!useAIStore.getState().providers[providerId]?.verified;
    // 归一化后持久化：用户粘贴 https://api.example.com/v1 也不会导致后续请求 404
    const normalizedUrl = normalizeApiBaseUrl(apiUrl);

    updateProviderConfig(providerId, {
      apiKey,
      apiUrl: normalizedUrl,
      selectedModel,
    });
    // 自定义供应商：模型/地址变更同步回自定义列表，保证卡片与注册表一致
    if (preset?.custom) {
      const cp = customProviders.find((c) => c.id === providerId);
      if (cp) {
        useAIStore.getState().upsertCustomProvider({ ...cp, model: selectedModel, apiUrl: normalizedUrl, apiKey });
      }
    }
    setActiveProvider(providerId);
    onOpenChange(false);
    // 连接检测未通过时仍允许保存（可在使用前重新检测），但明确告知用户
    if (!wasVerified) {
      toast.info(t('settings.savedUnverified'));
    }
  }, [providerId, apiKey, apiUrl, selectedModel, preset, customProviders, updateProviderConfig, setActiveProvider, onOpenChange, t]);

  if (!preset || !providerId) return null;

  // 保存不再以“验证成功”为前提：配置完整即可保存，
  // 验证结果仅作为状态徽标与提示（避免浏览器 CORS/网络问题导致永久无法配置）。
  const canSave = !!selectedModel && !!apiUrl.trim() && (!requiresKey || !!apiKey.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="px-6 pb-0 pt-5">
          <DialogTitle className="flex items-center gap-3">
            {preset.icon ? (
              <img src={preset.icon} alt={customName || t(preset.nameKey)} className="h-10 w-10 rounded-xl" />
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
            {preset.custom || !preset.website ? (
              <span className="flex items-center gap-1.5">
                {customName || preset.abbr}
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {t('settings.customProviderTag')}
                </span>
              </span>
            ) : (
              <a
                href={preset.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-primary transition-colors"
              >
                {t(preset.nameKey)}
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
              </a>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 px-6 py-5">
          {/* API 密钥 */}
          {requiresKey ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="apiKey">{t('settings.apiKey')}</Label>
                {preset.apiKeyUrl && (
                  <a
                    href={preset.apiKeyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    {t('settings.getApiKey')}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
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
                  disabled={verifyState === 'verifying'}
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
          ) : (
            <div className="flex items-center justify-between rounded-lg border border-dashed px-3 py-2.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                {t('settings.localNoKey')}
              </span>
              <Button variant="outline" size="sm" onClick={handleVerify} disabled={verifyState === 'verifying'}>
                {verifyState === 'verifying' && <Loader2 className="h-4 w-4 animate-spin" />}
                {verifyState === 'success' && <Check className="h-4 w-4" />}
                {(verifyState === 'idle' || verifyState === 'error') && t('settings.verify')}
              </Button>
            </div>
          )}

          {/* API 地址 */}
          <div className="space-y-2">
            <Label htmlFor="apiUrl">{t('settings.apiUrl')}</Label>
            <Input
              id="apiUrl"
              value={apiUrl}
              onChange={(e) => handleApiUrlChange(e.target.value)}
              className="font-mono"
            />
            {preset.relay ? (
              <p className="text-[11px] leading-snug text-muted-foreground">
                {t('settings.relayHint')}
              </p>
            ) : (
              <p className="text-[11px] leading-snug text-muted-foreground">
                {t('settings.apiUrlHint')}
              </p>
            )}
          </div>

          {/* 验证失败详情：帮助区分 CORS / 网络 / 地址错误 */}
          {verifyState === 'error' && verifyError && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2.5">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
              <div className="min-w-0 text-[11px] leading-snug text-amber-700 dark:text-amber-400">
                <p>{t(VERIFY_ERROR_I18N[verifyError.code] ?? 'settings.verifyFailed')}</p>
                {verifyError.detail && (
                  <p className="mt-1 break-all font-mono text-[10px] opacity-75">{verifyError.detail}</p>
                )}
              </div>
            </div>
          )}

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
                                  onClick={() => handleModelChange(model.id)}
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

            {/* 自定义供应商：允许手动输入任意模型 ID */}
            {preset.custom && (
              <div className="space-y-1.5">
                <Label htmlFor="customModel">{t('settings.customModelInput')}</Label>
                <Input
                  id="customModel"
                  value={selectedModel}
                  onChange={(e) => handleModelChange(e.target.value)}
                  placeholder="gpt-4o-mini"
                  className="font-mono"
                />
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="border-t px-6 py-4">
          <div className="flex w-full items-center justify-between">
            {preset.custom ? (
              <Button
                variant="ghost"
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={() => {
                  removeCustomProvider(providerId);
                  onOpenChange(false);
                }}
              >
                {t('settings.deleteCustomProvider')}
              </Button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleSave} disabled={!canSave}>
                {t('settings.save')}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}