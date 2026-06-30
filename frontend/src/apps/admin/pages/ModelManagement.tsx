import { useState, useEffect, useCallback } from "react"
import {
  Search, Plus, Cpu, Lock, TestTube, ChevronLeft, ChevronRight,
  MoreVertical, Trash2, Edit, Loader2, Globe, Power, PowerOff,
  BarChart3, Activity, Wifi, WifiOff
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { SectionHeader } from "@/shared/components/SectionHeader"
import { modelApi } from "@/lib/api"
import type { ModelConfig, PaginatedData } from "@/lib/types"
import { toast } from "sonner"

const MODEL_TYPE_OPTIONS = [
  { value: "llm", label: "大语言模型" },
  { value: "embedding", label: "Embedding 模型" },
  { value: "rerank", label: "重排模型" },
]

const API_TYPE_OPTIONS = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "ollama", label: "Ollama" },
  { value: "custom", label: "自定义" },
]

const VISIBILITY_OPTIONS = [
  { value: "platform", label: "平台" },
  { value: "tenant", label: "租户" },
  { value: "personal", label: "个人" },
]

const TYPE_FILTER_OPTIONS = [
  { value: "all", label: "全部" },
  { value: "llm", label: "大语言模型" },
  { value: "embedding", label: "Embedding 模型" },
  { value: "rerank", label: "重排模型" },
]

interface ModelFormData {
  name: string
  model_key: string
  model_type: string
  api_type: string
  base_url: string
  api_key: string
  support_tool_call: boolean
  support_vision: boolean
  support_reasoning: boolean
  context_length: string
  max_tokens: string
  temperature: string
  visibility: string
}

const emptyForm: ModelFormData = {
  name: "",
  model_key: "",
  model_type: "llm",
  api_type: "openai",
  base_url: "",
  api_key: "",
  support_tool_call: false,
  support_vision: false,
  support_reasoning: false,
  context_length: "4096",
  max_tokens: "2048",
  temperature: "0.7",
  visibility: "tenant",
}

export function ModelManagement() {
  const [models, setModels] = useState<ModelConfig[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [typeFilter, setTypeFilter] = useState<string>("all")

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingModel, setEditingModel] = useState<ModelConfig | null>(null)
  const [form, setForm] = useState<ModelFormData>(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  // Log dialog
  const [logDialogOpen, setLogDialogOpen] = useState(false)
  const [logModel, setLogModel] = useState<ModelConfig | null>(null)
  const [logs, setLogs] = useState<unknown[]>([])
  const [logsLoading, setLogsLoading] = useState(false)

  // Token usage dialog
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false)
  const [tokenModel, setTokenModel] = useState<ModelConfig | null>(null)
  const [tokenUsage, setTokenUsage] = useState<unknown>(null)
  const [tokenLoading, setTokenLoading] = useState(false)

  const fetchModels = useCallback(async () => {
    setIsLoading(true)
    try {
      const params: Record<string, unknown> = { page, page_size: 20 }
      if (typeFilter !== "all") params.model_type = typeFilter
      const result = await modelApi.getList(params) as PaginatedData<ModelConfig>
      setModels(result.items)
      setTotalPages(result.total_pages || 1)
    } catch (error) {
      console.error("获取模型列表失败:", error)
      toast.error("获取模型列表失败")
      setModels([])
    } finally {
      setIsLoading(false)
    }
  }, [page, typeFilter])

  useEffect(() => {
    fetchModels()
  }, [fetchModels])

  const handleTest = async (modelId: number) => {
    try {
      await modelApi.test(modelId)
      toast.success("模型测试成功")
      fetchModels()
    } catch (error) {
      console.error("测试模型失败:", error)
      toast.error("测试模型失败")
    }
  }

  const handleToggleStatus = async (model: ModelConfig) => {
    const newStatus = model.status === "enabled" ? "disabled" : "enabled"
    try {
      await modelApi.toggleStatus(model.id, newStatus)
      toast.success(`模型已${newStatus === "enabled" ? "启用" : "停用"}`)
      fetchModels()
    } catch (error) {
      console.error("切换模型状态失败:", error)
      toast.error("切换模型状态失败")
    }
  }

  const handleDelete = async (modelId: number) => {
    if (!confirm("确定要删除此模型配置吗？此操作不可恢复。")) return
    try {
      await modelApi.delete(modelId)
      toast.success("模型已删除")
      fetchModels()
    } catch (error) {
      console.error("删除模型失败:", error)
      toast.error("删除模型失败")
    }
  }

  const openCreateDialog = () => {
    setEditingModel(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEditDialog = (model: ModelConfig) => {
    setEditingModel(model)
    setForm({
      name: model.name,
      model_key: model.model_key,
      model_type: model.model_type,
      api_type: model.api_type,
      base_url: model.base_url || "",
      api_key: "",
      support_tool_call: model.support_tool_call || false,
      support_vision: model.support_vision || false,
      support_reasoning: model.support_reasoning || false,
      context_length: String(model.context_length || 4096),
      max_tokens: String(model.max_tokens || 2048),
      temperature: String(model.temperature ?? 0.7),
      visibility: model.visibility,
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.model_key.trim() || !form.base_url.trim()) {
      toast.error("请填写必填字段")
      return
    }
    const payload = {
      ...form,
      context_length: parseInt(form.context_length, 10) || 4096,
      max_tokens: parseInt(form.max_tokens, 10) || 2048,
      temperature: parseFloat(form.temperature) || 0.7,
    }
    setSubmitting(true)
    try {
      if (editingModel) {
        await modelApi.update(editingModel.id, payload)
        toast.success("模型更新成功")
      } else {
        await modelApi.create(payload)
        toast.success("模型创建成功")
      }
      setDialogOpen(false)
      fetchModels()
    } catch (error) {
      console.error("保存模型失败:", error)
      toast.error("保存模型失败")
    } finally {
      setSubmitting(false)
    }
  }

  // Test connectivity in form dialog
  const [testingConnectivity, setTestingConnectivity] = useState(false)
  const [connectivityResult, setConnectivityResult] = useState<{
    success: boolean;
    message: string;
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  } | null>(null)

  const handleTestConnectivity = async () => {
    if (!form.base_url.trim() || !form.model_key.trim()) {
      toast.error("请先填写 Base URL 和模型标识")
      return
    }
    setTestingConnectivity(true)
    setConnectivityResult(null)
    try {
      const result = await modelApi.testConnectivity({
        base_url: form.base_url,
        api_key: form.api_key || undefined,
        model_key: form.model_key,
        api_type: form.api_type,
        max_tokens: 10,
      })
      setConnectivityResult(result)
      if (result.success) {
        toast.success("连通成功")
      } else {
        toast.error(result.message || "连通失败")
      }
    } catch (error: any) {
      console.error("连通测试失败:", error)
      setConnectivityResult({ success: false, message: error.message || "连通测试失败" })
      toast.error(error.message || "连通测试失败")
    } finally {
      setTestingConnectivity(false)
    }
  }

  const openLogDialog = async (model: ModelConfig) => {
    setLogModel(model)
    setLogDialogOpen(true)
    setLogsLoading(true)
    try {
      const result = await modelApi.getLogs(model.id) as PaginatedData<unknown>
      setLogs(result.items || [])
    } catch (error) {
      console.error("获取调用日志失败:", error)
      toast.error("获取调用日志失败")
      setLogs([])
    } finally {
      setLogsLoading(false)
    }
  }

  const openTokenDialog = async (model: ModelConfig) => {
    setTokenModel(model)
    setTokenDialogOpen(true)
    setTokenLoading(true)
    try {
      const result = await modelApi.getTokenUsage(model.id)
      setTokenUsage(result)
    } catch (error) {
      console.error("获取Token消耗失败:", error)
      toast.error("获取Token消耗失败")
      setTokenUsage(null)
    } finally {
      setTokenLoading(false)
    }
  }

  const filteredModels = models.filter(model => {
    const matchesSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      model.model_key?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === "all" || model.model_type === typeFilter
    return matchesSearch && matchesType
  })

  const getModelTypeLabel = (type: string) => {
    const opt = MODEL_TYPE_OPTIONS.find(o => o.value === type)
    return opt?.label || type
  }

  const getApiTypeLabel = (type: string) => {
    const opt = API_TYPE_OPTIONS.find(o => o.value === type)
    return opt?.label || type
  }

  const getVisibilityLabel = (v: string) => {
    const opt = VISIBILITY_OPTIONS.find(o => o.value === v)
    return opt?.label || v
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <SectionHeader
          title="模型管理"
          action={
            <Button size="sm" onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-1" /> 添加模型
            </Button>
          }
        />
        <div className="flex gap-3 mt-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="搜索模型名称、模型标识..."
              className="pl-9"
            />
          </div>
          <div className="flex gap-1">
            {TYPE_FILTER_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setTypeFilter(opt.value)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                  typeFilter === opt.value
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground hover:bg-muted/50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : filteredModels.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <div className="text-center">
                  <Cpu className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>暂无模型配置</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">模型名称</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">模型标识</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">类型</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">API类型</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">可见性</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">功能支持</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">状态</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredModels.map(model => (
                      <tr key={model.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <Cpu className="w-4 h-4 text-primary" />
                            </div>
                            <span className="text-sm font-medium text-foreground">{model.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground font-mono">{model.model_key}</td>
                        <td className="py-3 px-4">
                          <Badge variant="secondary" className="text-xs">
                            {getModelTypeLabel(model.model_type)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="text-xs">
                            {getApiTypeLabel(model.api_type)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className={`flex items-center gap-1 text-xs ${
                            model.visibility === "platform" ? "text-emerald-400" : "text-amber-400"
                          }`}>
                            {model.visibility === "platform" ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                            {getVisibilityLabel(model.visibility)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {model.support_tool_call && <Badge variant="ghost" className="text-xs">工具调用</Badge>}
                            {model.support_vision && <Badge variant="ghost" className="text-xs">视觉</Badge>}
                            {model.support_reasoning && <Badge variant="ghost" className="text-xs">推理</Badge>}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={`text-xs ${
                            model.status === "enabled" ? "bg-emerald-500/15 text-emerald-400" : "bg-destructive/15 text-destructive"
                          }`}>
                            {model.status === "enabled" ? "正常" : "停用"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 justify-end">
                            <Button variant="outline" size="sm" onClick={() => handleTest(model.id)} title="测试">
                              <TestTube className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleStatus(model)}
                              title={model.status === "enabled" ? "停用" : "启用"}
                            >
                              {model.status === "enabled" ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditDialog(model)}>
                                  <Edit className="w-4 h-4 mr-2" /> 编辑
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openLogDialog(model)}>
                                  <Activity className="w-4 h-4 mr-2" /> 调用日志
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openTokenDialog(model)}>
                                  <BarChart3 className="w-4 h-4 mr-2" /> Token消耗
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDelete(model.id)} className="text-destructive">
                                  <Trash2 className="w-4 h-4 mr-2" /> 删除
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-muted-foreground">共 {totalPages} 页，当前第 {page} 页</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" onPointerDownOutside={e => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{editingModel ? "编辑模型" : "添加模型"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>模型名称 <span className="text-destructive">*</span></Label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="例如：GPT-4"
              />
            </div>
            <div className="space-y-2">
              <Label>模型标识 <span className="text-destructive">*</span></Label>
              <Input
                value={form.model_key}
                onChange={e => setForm(f => ({ ...f, model_key: e.target.value }))}
                placeholder="例如：gpt-4"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>模型类型</Label>
                <Select
                  value={form.model_type}
                  onValueChange={v => setForm(f => ({ ...f, model_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODEL_TYPE_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>API 类型</Label>
                <Select
                  value={form.api_type}
                  onValueChange={v => setForm(f => ({ ...f, api_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {API_TYPE_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Base URL <span className="text-destructive">*</span></Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestConnectivity}
                  disabled={testingConnectivity || !form.base_url.trim() || !form.model_key.trim()}
                  className="h-7 px-2 text-xs"
                >
                  {testingConnectivity ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : connectivityResult?.success ? (
                    <Wifi className="w-3 h-3 mr-1 text-emerald-500" />
                  ) : connectivityResult ? (
                    <WifiOff className="w-3 h-3 mr-1 text-destructive" />
                  ) : (
                    <TestTube className="w-3 h-3 mr-1" />
                  )}
                  测试联通
                </Button>
              </div>
              <Input
                value={form.base_url}
                onChange={e => { setForm(f => ({ ...f, base_url: e.target.value })); setConnectivityResult(null) }}
                placeholder="https://api.openai.com/v1"
              />
              {connectivityResult?.success && (
                <div className="flex flex-wrap gap-2 text-xs">
                  {connectivityResult.prompt_tokens !== undefined && (
                    <span className="bg-muted rounded px-2 py-1">
                      Prompt: {connectivityResult.prompt_tokens} tokens
                    </span>
                  )}
                  {connectivityResult.completion_tokens !== undefined && (
                    <span className="bg-muted rounded px-2 py-1">
                      Completion: {connectivityResult.completion_tokens} tokens
                    </span>
                  )}
                  {connectivityResult.total_tokens !== undefined && (
                    <span className="bg-muted rounded px-2 py-1">
                      Total: {connectivityResult.total_tokens} tokens
                    </span>
                  )}
                </div>
              )}
              {connectivityResult && !connectivityResult.success && (
                <p className="text-xs text-destructive">{connectivityResult.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>API Key</Label>
              <Input
                type="password"
                value={form.api_key}
                onChange={e => setForm(f => ({ ...f, api_key: e.target.value }))}
                placeholder={editingModel ? "留空表示不修改" : "sk-..."}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>上下文长度</Label>
                <Input
                  type="number"
                  value={form.context_length}
                  onChange={e => setForm(f => ({ ...f, context_length: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Max Tokens</Label>
                <Input
                  type="number"
                  value={form.max_tokens}
                  onChange={e => setForm(f => ({ ...f, max_tokens: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>默认温度</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  value={form.temperature}
                  onChange={e => setForm(f => ({ ...f, temperature: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>可见范围</Label>
              <Select
                value={form.visibility}
                onValueChange={v => setForm(f => ({ ...f, visibility: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VISIBILITY_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3 border rounded-lg p-3">
              <Label className="text-sm font-medium">功能支持</Label>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.support_tool_call}
                    onCheckedChange={v => setForm(f => ({ ...f, support_tool_call: v }))}
                  />
                  <span className="text-sm">工具调用</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.support_vision}
                    onCheckedChange={v => setForm(f => ({ ...f, support_vision: v }))}
                  />
                  <span className="text-sm">图像识别</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.support_reasoning}
                    onCheckedChange={v => setForm(f => ({ ...f, support_reasoning: v }))}
                  />
                  <span className="text-sm">深度思考</span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              {editingModel ? "保存" : "创建"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log Dialog */}
      <Dialog open={logDialogOpen} onOpenChange={setLogDialogOpen}>
        <DialogContent className="sm:max-w-2xl" onPointerDownOutside={e => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>调用日志 - {logModel?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            {logsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">暂无调用日志</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">操作</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">状态</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log: any) => (
                      <tr key={log.id} className="border-b border-border last:border-0">
                        <td className="py-2 px-3">{log.action}</td>
                        <td className="py-2 px-3">
                          <Badge variant={log.status === "success" ? "default" : "destructive"} className="text-xs">
                            {log.status === "success" ? "成功" : "失败"}
                          </Badge>
                        </td>
                        <td className="py-2 px-3 text-muted-foreground">{log.created_at}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogDialogOpen(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Token Usage Dialog */}
      <Dialog open={tokenDialogOpen} onOpenChange={setTokenDialogOpen}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={e => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Token 消耗 - {tokenModel?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            {tokenLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : tokenUsage ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold">{(tokenUsage as any).total_calls || 0}</div>
                  <div className="text-xs text-muted-foreground mt-1">总调用次数</div>
                </div>
                <div className="bg-muted rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold">{(tokenUsage as any).total_tokens || 0}</div>
                  <div className="text-xs text-muted-foreground mt-1">总 Token 消耗</div>
                </div>
                <div className="bg-muted rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold">{(tokenUsage as any).prompt_tokens || 0}</div>
                  <div className="text-xs text-muted-foreground mt-1">Prompt Tokens</div>
                </div>
                <div className="bg-muted rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold">{(tokenUsage as any).completion_tokens || 0}</div>
                  <div className="text-xs text-muted-foreground mt-1">Completion Tokens</div>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">暂无 Token 消耗数据</div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTokenDialogOpen(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
