import { useState, useEffect, useCallback } from "react"
import {
  Search, Plus, RefreshCw, ChevronLeft, ChevronRight, MoreVertical,
  Trash2, Edit, Loader2, Play, Power, PowerOff, Database,
  Rss, Globe, Bot, FileText, Eye, Clock, X, AlertTriangle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { collectApi } from "@/lib/api"
import type { CollectPlatform, CollectTask, CollectedItem, CollectedItemDetail, CollectLog, PaginatedData } from "@/lib/types"

// ==================== 常量 ====================

const PLATFORM_TYPES = [
  { value: "news", label: "新闻网站", icon: Globe },
  { value: "rss", label: "RSS", icon: Rss },
  { value: "social", label: "社交媒体", icon: Bot },
  { value: "forum", label: "论坛社区", icon: FileText },
  { value: "video", label: "视频平台", icon: Play },
  { value: "industry", label: "行业网站", icon: Database },
  { value: "other", label: "其他", icon: Globe },
] as const

const COLLECT_METHODS = [
  { value: "api", label: "API" },
  { value: "rss", label: "RSS" },
  { value: "crawler", label: "爬虫" },
] as const

const TASK_STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft: { label: "草稿", color: "bg-zinc-500/15 text-zinc-400" },
  enabled: { label: "已启用", color: "bg-emerald-500/15 text-emerald-400" },
  disabled: { label: "已停用", color: "bg-zinc-500/15 text-zinc-400" },
  error: { label: "异常", color: "bg-destructive/15 text-destructive" },
}

const ITEM_STATUS_MAP: Record<string, { label: string; color: string }> = {
  raw: { label: "原始", color: "bg-blue-500/15 text-blue-400" },
  cleaned: { label: "已清洗", color: "bg-emerald-500/15 text-emerald-400" },
  analyzed: { label: "已分析", color: "bg-purple-500/15 text-purple-400" },
  duplicate: { label: "重复", color: "bg-zinc-500/15 text-zinc-400" },
  error: { label: "异常", color: "bg-destructive/15 text-destructive" },
}

const LOG_STATUS_MAP: Record<string, { label: string; color: string }> = {
  success: { label: "成功", color: "bg-emerald-500/15 text-emerald-400" },
  failed: { label: "失败", color: "bg-destructive/15 text-destructive" },
  partial: { label: "部分成功", color: "bg-amber-500/15 text-amber-400" },
}

function getPlatformTypeLabel(type: string) {
  return PLATFORM_TYPES.find(p => p.value === type)?.label ?? type
}

function getCollectMethodLabel(method: string) {
  return COLLECT_METHODS.find(m => m.value === method)?.label ?? method
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "-"
  try { return new Date(dateStr).toLocaleString("zh-CN") } catch { return dateStr }
}

// ==================== 平台管理 Tab ====================

function PlatformsTab() {
  const [platforms, setPlatforms] = useState<CollectPlatform[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPlatform, setEditingPlatform] = useState<CollectPlatform | null>(null)
  const [form, setForm] = useState({ name: "", platform_type: "news", default_method: "api", description: "" })

  const fetchPlatforms = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await collectApi.getPlatforms()
      setPlatforms(result.items || [])
    } catch { setPlatforms([]) }
    finally { setIsLoading(false) }
  }, [])

  useEffect(() => { fetchPlatforms() }, [fetchPlatforms])

  const openCreate = () => {
    setEditingPlatform(null)
    setForm({ name: "", platform_type: "news", default_method: "api", description: "" })
    setDialogOpen(true)
  }

  const openEdit = (p: CollectPlatform) => {
    setEditingPlatform(p)
    setForm({ name: p.name, platform_type: p.platform_type, default_method: p.default_method, description: p.description || "" })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) return
    try {
      if (editingPlatform) {
        await collectApi.updatePlatform(editingPlatform.id, form)
      } else {
        await collectApi.createPlatform(form)
      }
      setDialogOpen(false)
      fetchPlatforms()
    } catch (e) { console.error("保存平台失败:", e) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除此平台？")) return
    try { await collectApi.deletePlatform(id); fetchPlatforms() }
    catch (e) { console.error("删除失败:", e) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="搜索平台名称..." className="pl-9" />
        </div>
        <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> 添加平台</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
      ) : platforms.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Database className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>暂无采集平台，请添加</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {platforms.map(p => (
            <Card key={p.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{p.name}</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><MoreVertical className="w-4 h-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(p)}><Edit className="w-4 h-4 mr-2" /> 编辑</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(p.id)}><Trash2 className="w-4 h-4 mr-2" /> 删除</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="text-xs">{getPlatformTypeLabel(p.platform_type)}</Badge>
                  <Badge variant="outline" className="text-xs">{getCollectMethodLabel(p.default_method)}</Badge>
                </div>
                {p.description && <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={e => e.preventDefault()}>
          <DialogHeader><DialogTitle>{editingPlatform ? "编辑平台" : "添加平台"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>平台名称 *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="如：新浪新闻" />
            </div>
            <div className="space-y-2">
              <Label>平台类型</Label>
              <Select value={form.platform_type} onValueChange={v => setForm(f => ({ ...f, platform_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLATFORM_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>默认采集方式</Label>
              <Select value={form.default_method} onValueChange={v => setForm(f => ({ ...f, default_method: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COLLECT_METHODS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>描述</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="平台描述（可选）" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSubmit} disabled={!form.name.trim()}>确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ==================== 采集任务 Tab ====================

function TasksTab({ platforms }: { platforms: CollectPlatform[] }) {
  const [tasks, setTasks] = useState<CollectTask[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<CollectTask | null>(null)
  const [form, setForm] = useState({
    name: "", platform_id: 0, collect_method: "crawler", source_url: "",
    request_config: "", parse_rule: "", schedule_cron: "", schedule_interval: "daily" as "daily" | "weekly" | "monthly",
    schedule_hour: 8, schedule_minute: 0, is_public: false,
  })

  const fetchTasks = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await collectApi.getTasks({ page, page_size: 20 }) as PaginatedData<CollectTask>
      setTasks(result.items || [])
      setTotal(result.total)
      setTotalPages(result.total_pages)
    } catch { setTasks([]) }
    finally { setIsLoading(false) }
  }, [page])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const openCreate = () => {
    if (!platforms.length) {
      toast.error("请先创建采集平台")
      return
    }
    setEditingTask(null)
    setForm({ name: "", platform_id: platforms[0]!.id, collect_method: "crawler", source_url: "", request_config: "", parse_rule: "", schedule_cron: "", schedule_interval: "daily", schedule_hour: 8, schedule_minute: 0, is_public: false })
    setDialogOpen(true)
  }

  const openEdit = (t: CollectTask) => {
    setEditingTask(t)
    const sc = t.schedule_config || {}
    setForm({
      name: t.name, platform_id: t.platform_id, collect_method: t.collect_method,
      source_url: t.source_url || "",
      request_config: t.request_config ? JSON.stringify(t.request_config, null, 2) : "",
      parse_rule: t.parse_rule ? JSON.stringify(t.parse_rule, null, 2) : "",
      schedule_cron: (sc as Record<string, unknown>).cron as string || "",
      schedule_interval: (sc as Record<string, unknown>).interval as "daily" | "weekly" | "monthly" || "daily",
      schedule_hour: (sc as Record<string, unknown>).hour as number ?? 8,
      schedule_minute: (sc as Record<string, unknown>).minute as number ?? 0,
      is_public: t.is_public,
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.platform_id) return
    try {
      const schedule_config = form.schedule_cron
        ? { cron: form.schedule_cron }
        : (form.schedule_interval ? { interval: form.schedule_interval, hour: form.schedule_hour, minute: form.schedule_minute } : null)
      const data: Record<string, unknown> = {
        name: form.name,
        platform_id: form.platform_id,
        collect_method: form.collect_method,
        source_url: form.source_url || null,
        schedule_config,
        is_public: form.is_public,
      }
      if (form.request_config.trim()) {
        try { data.request_config = JSON.parse(form.request_config) } catch { /* ignore */ }
      }
      if (form.parse_rule.trim()) {
        try { data.parse_rule = JSON.parse(form.parse_rule) } catch { /* ignore */ }
      }
      if (editingTask) {
        await collectApi.updateTask(editingTask.id, data)
      } else {
        await collectApi.createTask(data)
      }
      setDialogOpen(false)
      fetchTasks()
    } catch (e) { console.error("保存任务失败:", e) }
  }

  const handleToggle = async (t: CollectTask) => {
    try {
      if (t.status === "enabled") await collectApi.disableTask(t.id)
      else await collectApi.enableTask(t.id)
      fetchTasks()
    } catch (e) { console.error("操作失败:", e) }
  }

  const handleRun = async (t: CollectTask) => {
    try {
      await collectApi.runTask(t.id)
      toast.success("采集任务已触发")
      fetchTasks()
    } catch (e) { console.error("触发失败:", e) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除此任务？")) return
    try { await collectApi.deleteTask(id); fetchTasks() }
    catch (e) { console.error("删除失败:", e) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">共 {total} 个任务</div>
        <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> 创建任务</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <RefreshCw className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>暂无采集任务</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">任务名称</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">平台</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">采集方式</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">采集地址</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">定时规则</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">公开</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">状态</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">最近运行</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">失败</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map(t => {
                    const sc = t.schedule_config as Record<string, unknown> | undefined
                    const scheduleText = sc?.cron ? `Cron: ${sc.cron}` : sc?.interval ? `${sc.interval} ${(sc.hour ?? 8)}:${String(sc.minute ?? 0).padStart(2, "0")}` : "-"
                    const statusInfo = TASK_STATUS_MAP[t.status] || TASK_STATUS_MAP.draft
                    return (
                      <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                        <td className="py-3 px-4 text-sm font-medium">{t.name}</td>
                        <td className="py-3 px-4 text-sm">{t.platform_name || "-"}</td>
                        <td className="py-3 px-4 text-sm">{getCollectMethodLabel(t.collect_method)}</td>
                        <td className="py-3 px-4 text-xs text-muted-foreground max-w-[180px] truncate">{t.source_url || "-"}</td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">{scheduleText}</td>
                        <td className="py-3 px-4 text-sm">{t.is_public ? "是" : "否"}</td>
                        <td className="py-3 px-4"><Badge className={`text-xs ${statusInfo.color}`}>{statusInfo.label}</Badge></td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">{formatDate(t.last_run_at)}</td>
                        <td className="py-3 px-4 text-sm">
                          {t.fail_count > 0 ? (
                            <TooltipProvider><Tooltip><TooltipTrigger><span className="text-destructive font-medium">{t.fail_count}</span></TooltipTrigger><TooltipContent>连续失败次数</TooltipContent></Tooltip></TooltipProvider>
                          ) : <span className="text-muted-foreground">0</span>}
                        </td>
                        <td className="py-3 px-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><MoreVertical className="w-4 h-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(t)}><Edit className="w-4 h-4 mr-2" /> 编辑</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleRun(t)}><Play className="w-4 h-4 mr-2" /> 手动采集</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggle(t)}>
                                {t.status === "enabled" ? <><PowerOff className="w-4 h-4 mr-2" /> 停用</> : <><Power className="w-4 h-4 mr-2" /> 启用</>}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(t.id)}><Trash2 className="w-4 h-4 mr-2" /> 删除</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">第 {page}/{totalPages} 页</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft className="w-4 h-4" /></Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto" onPointerDownOutside={e => e.preventDefault()}>
          <DialogHeader><DialogTitle>{editingTask ? "编辑采集任务" : "创建采集任务"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>任务名称 *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="输入任务名称" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>采集平台 *</Label>
                <Select value={String(form.platform_id)} onValueChange={v => setForm(f => ({ ...f, platform_id: Number(v) }))}>
                  <SelectTrigger><SelectValue placeholder="选择平台" /></SelectTrigger>
                  <SelectContent>
                    {platforms.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>采集方式</Label>
                <Select value={form.collect_method} onValueChange={v => setForm(f => ({ ...f, collect_method: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COLLECT_METHODS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>采集地址</Label>
              <Input value={form.source_url} onChange={e => setForm(f => ({ ...f, source_url: e.target.value }))} placeholder="URL / API地址 / RSS地址" />
            </div>
            <div className="space-y-2">
              <Label>请求配置 (JSON)</Label>
              <Textarea value={form.request_config} onChange={e => setForm(f => ({ ...f, request_config: e.target.value }))} placeholder='{"headers": {}, "params": {}, "auth": {}}' rows={3} className="font-mono text-xs" />
            </div>
            <div className="space-y-2">
              <Label>解析规则 (JSON)</Label>
              <Textarea value={form.parse_rule} onChange={e => setForm(f => ({ ...f, parse_rule: e.target.value }))} placeholder='{"title_selector": "h1", "content_selector": ".article-body"}' rows={3} className="font-mono text-xs" />
            </div>
            <div className="space-y-2 border rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm font-medium"><Clock className="w-4 h-4" /> 定时配置</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Cron 表达式</Label>
                  <Input value={form.schedule_cron} onChange={e => setForm(f => ({ ...f, schedule_cron: e.target.value }))} placeholder="0 8 * * *" className="font-mono text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">或选择周期</Label>
                  <Select value={form.schedule_interval} onValueChange={v => setForm(f => ({ ...f, schedule_interval: v as "daily" | "weekly" | "monthly" }))}>
                    <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">每天</SelectItem>
                      <SelectItem value="weekly">每周</SelectItem>
                      <SelectItem value="monthly">每月</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">时</Label>
                  <Input type="number" min={0} max={23} value={form.schedule_hour} onChange={e => setForm(f => ({ ...f, schedule_hour: Number(e.target.value) }))} className="text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">分</Label>
                  <Input type="number" min={0} max={59} value={form.schedule_minute} onChange={e => setForm(f => ({ ...f, schedule_minute: Number(e.target.value) }))} className="text-xs" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_public} onCheckedChange={v => setForm(f => ({ ...f, is_public: v }))} />
              <Label>是否公开（数据可被外部用户查看）</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSubmit} disabled={!form.name.trim() || !form.platform_id}>确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ==================== 采集数据 Tab ====================

function ItemsTab() {
  const [items, setItems] = useState<CollectedItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [detailItem, setDetailItem] = useState<CollectedItemDetail | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)

  const fetchItems = useCallback(async () => {
    setIsLoading(true)
    try {
      const params: Record<string, unknown> = { page, page_size: 20 }
      if (statusFilter) params.status = statusFilter
      const result = await collectApi.getItems(params) as PaginatedData<CollectedItem>
      setItems(result.items || [])
      setTotal(result.total)
      setTotalPages(result.total_pages)
    } catch { setItems([]) }
    finally { setIsLoading(false) }
  }, [page, statusFilter])

  useEffect(() => { fetchItems() }, [fetchItems])

  const viewDetail = async (id: number) => {
    setDetailLoading(true)
    setDetailOpen(true)
    try {
      const detail = await collectApi.getItemDetail(id)
      setDetailItem(detail)
    } catch { setDetailItem(null) }
    finally { setDetailLoading(false) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">共 {total} 条数据</div>
          <Select value={statusFilter} onValueChange={v => { setStatusFilter(v === "all" ? "" : v); setPage(1) }}>
            <SelectTrigger className="w-28 h-8 text-xs"><SelectValue placeholder="状态筛选" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="raw">原始</SelectItem>
              <SelectItem value="cleaned">已清洗</SelectItem>
              <SelectItem value="analyzed">已分析</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>暂无采集数据</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">标题</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">作者</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">来源平台</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">发布时间</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">状态</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">采集时间</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => {
                    const statusInfo = ITEM_STATUS_MAP[item.status] || ITEM_STATUS_MAP.raw
                    return (
                      <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                        <td className="py-3 px-4 text-sm font-medium max-w-[300px] truncate">{item.title || "(无标题)"}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{item.author || "-"}</td>
                        <td className="py-3 px-4 text-sm">{item.source_platform || "-"}</td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">{formatDate(item.publish_at)}</td>
                        <td className="py-3 px-4"><Badge className={`text-xs ${statusInfo.color}`}>{statusInfo.label}</Badge></td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">{formatDate(item.created_at)}</td>
                        <td className="py-3 px-4 text-right">
                          <Button variant="ghost" size="sm" className="h-7" onClick={() => viewDetail(item.id)}>
                            <Eye className="w-4 h-4 mr-1" /> 详情
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">第 {page}/{totalPages} 页</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft className="w-4 h-4" /></Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
      )}

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto" onPointerDownOutside={e => e.preventDefault()}>
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>数据详情</DialogTitle>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setDetailOpen(false)}><X className="w-4 h-4" /></Button>
            </div>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : detailItem ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">标题：</span>{detailItem.title || "-"}</div>
                <div><span className="text-muted-foreground">作者：</span>{detailItem.author || "-"}</div>
                <div><span className="text-muted-foreground">来源平台：</span>{detailItem.source_platform || "-"}</div>
                <div><span className="text-muted-foreground">来源URL：</span>{detailItem.source_url ? <a href={detailItem.source_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate block">{detailItem.source_url}</a> : "-"}</div>
                <div><span className="text-muted-foreground">发布时间：</span>{formatDate(detailItem.publish_at)}</div>
                <div><span className="text-muted-foreground">状态：</span><Badge className={`text-xs ${ITEM_STATUS_MAP[detailItem.status]?.color || ""}`}>{ITEM_STATUS_MAP[detailItem.status]?.label || detailItem.status}</Badge></div>
              </div>
              {detailItem.attachments && detailItem.attachments.length > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground">附件：</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {detailItem.attachments.map((a, i) => (
                      <a key={i} href={a.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                        {a.type === "image" ? "图片" : "文件"} {i + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <span className="text-sm text-muted-foreground">正文内容：</span>
                <div className="mt-1 p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap max-h-[300px] overflow-y-auto">{detailItem.content || "(无内容)"}</div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">原文存档 ({detailItem.raw_content_type || "html"})：</span>
                <div className="mt-1 p-3 bg-muted rounded-lg text-xs font-mono whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                  {detailItem.raw_content ? (detailItem.raw_content.length > 5000 ? detailItem.raw_content.slice(0, 5000) + "\n...(已截断)" : detailItem.raw_content) : "(无原文存档)"}
                </div>
              </div>
            </div>
          ) : <div className="text-center py-8 text-muted-foreground">加载失败</div>}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ==================== 采集日志 Tab ====================

function LogsTab() {
  const [logs, setLogs] = useState<CollectLog[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchLogs = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await collectApi.getLogs({ page, page_size: 20 }) as PaginatedData<CollectLog>
      setLogs(result.items || [])
      setTotal(result.total)
      setTotalPages(result.total_pages)
    } catch { setLogs([]) }
    finally { setIsLoading(false) }
  }, [page])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">共 {total} 条日志</div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>暂无采集日志</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">任务ID</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">运行时间</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">状态</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">采集条数</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">耗时(秒)</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">错误信息</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => {
                    const statusInfo = LOG_STATUS_MAP[log.status] || LOG_STATUS_MAP.failed
                    return (
                      <tr key={log.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                        <td className="py-3 px-4 text-sm font-medium">#{log.task_id}</td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">{formatDate(log.run_at)}</td>
                        <td className="py-3 px-4"><Badge className={`text-xs ${statusInfo.color}`}>{statusInfo.label}</Badge></td>
                        <td className="py-3 px-4 text-sm">{log.items_count}</td>
                        <td className="py-3 px-4 text-sm">{log.duration_seconds ?? "-"}</td>
                        <td className="py-3 px-4 text-xs text-destructive max-w-[300px] truncate">
                          {log.error_message ? (
                            <TooltipProvider><Tooltip><TooltipTrigger><span className="cursor-help"><AlertTriangle className="w-3 h-3 inline mr-1" />{log.error_message.slice(0, 60)}{log.error_message.length > 60 ? "..." : ""}</span></TooltipTrigger><TooltipContent className="max-w-sm"><p className="text-xs">{log.error_message}</p></TooltipContent></Tooltip></TooltipProvider>
                          ) : "-"}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">第 {page}/{totalPages} 页</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft className="w-4 h-4" /></Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ==================== 主页面 ====================

export function DataCollection() {
  const [activeTab, setActiveTab] = useState("tasks")
  const [platforms, setPlatforms] = useState<CollectPlatform[]>([])

  useEffect(() => {
    collectApi.getPlatforms().then(r => setPlatforms(r.items || [])).catch(() => {})
  }, [])

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 pb-0">
        <h2 className="text-lg font-semibold">数据采集管理</h2>
        <p className="text-sm text-muted-foreground mt-1">配置采集平台与任务，支持API/RSS/爬虫采集，定时自动执行与手动触发</p>
      </div>
      <div className="flex-1 overflow-hidden px-4 pt-3">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="w-fit">
            <TabsTrigger value="tasks">采集任务</TabsTrigger>
            <TabsTrigger value="platforms">平台管理</TabsTrigger>
            <TabsTrigger value="items">采集数据</TabsTrigger>
            <TabsTrigger value="logs">采集日志</TabsTrigger>
          </TabsList>
          <div className="flex-1 overflow-y-auto mt-4 pb-4">
            <TabsContent value="platforms" className="mt-0"><PlatformsTab /></TabsContent>
            <TabsContent value="tasks" className="mt-0"><TasksTab platforms={platforms} /></TabsContent>
            <TabsContent value="items" className="mt-0"><ItemsTab /></TabsContent>
            <TabsContent value="logs" className="mt-0"><LogsTab /></TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
