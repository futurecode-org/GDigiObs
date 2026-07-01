import { useCallback, useEffect, useState } from "react"
import {
  AlertTriangle,
  Ban,
  Bot,
  Eye,
  Loader2,
  MessageSquareWarning,
  MoreHorizontal,
  RefreshCw,
  ScanLine,
  Search,
  ShieldCheck,
  Sparkles,
  UserX,
  VolumeX,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SectionHeader } from "@/shared/components/SectionHeader"
import { auditApi, modelApi, userApi } from "@/lib/api"
import type {
  AiDetectionResult,
  MessageAuditItem,
  ModelConfig,
  PaginatedData,
} from "@/lib/types"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const RISK_LEVELS = [
  { value: "", label: "全部风险" },
  { value: "high", label: "高风险" },
  { value: "medium", label: "中风险" },
  { value: "low", label: "低风险" },
  { value: "none", label: "无风险" },
]

const RISK_CATEGORIES = [
  { value: "", label: "全部类别" },
  { value: "political", label: "涉政" },
  { value: "porn", label: "涉黄" },
  { value: "insult", label: "辱骂" },
  { value: "violence", label: "暴恐" },
  { value: "ad", label: "广告" },
  { value: "privacy", label: "隐私泄露" },
  { value: "secret", label: "商业机密" },
  { value: "illegal", label: "违法违规" },
  { value: "custom", label: "自定义敏感词" },
]

const AUDIT_STATUSES = [
  { value: "", label: "全部状态" },
  { value: "passed", label: "已通过" },
  { value: "reviewing", label: "复核中" },
  { value: "blocked", label: "已拦截" },
]

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString() : "-"
}

function riskBadge(risk?: string) {
  const variant =
    risk === "high"
      ? "destructive"
      : risk === "medium"
      ? "default"
      : risk === "low"
      ? "secondary"
      : "outline"
  return (
    <Badge variant={variant as never} className="text-xs">
      {risk === "none" ? "无风险" : risk || "-"}
    </Badge>
  )
}

function statusBadge(status?: string) {
  const map: Record<string, string> = {
    passed: "已通过",
    reviewing: "复核中",
    blocked: "已拦截",
  }
  const variant =
    status === "blocked" ? "destructive" : status === "reviewing" ? "secondary" : "outline"
  return (
    <Badge variant={variant as never} className="text-xs">
      {map[status || ""] || status || "-"}
    </Badge>
  )
}

export function ChatAudit() {
  const [data, setData] = useState<PaginatedData<MessageAuditItem>>({
    items: [],
    total: 0,
    page: 1,
    page_size: 20,
    total_pages: 1,
  })
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    risk_level: "",
    risk_category: "",
    audit_status: "",
    keyword: "",
  })

  const [models, setModels] = useState<ModelConfig[]>([])
  const [selectedModelId, setSelectedModelId] = useState<string>("")
  const [detectOpen, setDetectOpen] = useState(false)
  const [detectContent, setDetectContent] = useState("")
  const [detecting, setDetecting] = useState(false)
  const [detectResult, setDetectResult] = useState<AiDetectionResult | null>(null)
  const [batchDetecting, setBatchDetecting] = useState(false)

  const [contextOpen, setContextOpen] = useState(false)
  const [contextData, setContextData] = useState<{
    current: MessageAuditItem
    before: MessageAuditItem[]
    after: MessageAuditItem[]
  } | null>(null)
  const [contextLoading, setContextLoading] = useState(false)

  const [muteOpen, setMuteOpen] = useState(false)
  const [muteUserId, setMuteUserId] = useState<number | null>(null)
  const [muteMinutes, setMuteMinutes] = useState("60")

  const fetchData = useCallback(
    async (page = 1) => {
      setLoading(true)
      try {
        const params: Record<string, unknown> = { page, page_size: 20 }
        if (filters.risk_level) params.risk_level = filters.risk_level
        if (filters.risk_category) params.risk_category = filters.risk_category
        if (filters.audit_status) params.audit_status = filters.audit_status
        if (filters.keyword) params.keyword = filters.keyword
        const result = await auditApi.getMessageAudits(params)
        setData(result)
      } catch (error) {
        console.error("加载聊天审计失败:", error)
        toast.error("加载聊天审计失败")
      } finally {
        setLoading(false)
      }
    },
    [filters]
  )

  const fetchModels = useCallback(async () => {
    try {
      const result = await modelApi.getList({
        model_type: "llm",
        page_size: 100,
      })
      const enabled = (result.items || []).filter((m) => m.status === "enabled")
      setModels(enabled)
      if (enabled.length > 0 && !selectedModelId) {
        setSelectedModelId(String(enabled[0].id))
      }
    } catch (error) {
      console.error("获取模型列表失败:", error)
    }
  }, [selectedModelId])

  useEffect(() => {
    void fetchData(1)
  }, [fetchData])

  useEffect(() => {
    void fetchModels()
  }, [fetchModels])

  const handleReview = async (item: MessageAuditItem, status: "passed" | "blocked") => {
    try {
      await auditApi.reviewMessageAudit(item.id, { audit_status: status })
      toast.success(`已复核为${status === "passed" ? "通过" : "拦截"}`)
      void fetchData(data.page)
    } catch {
      toast.error("复核失败")
    }
  }

  const handleAlert = async (item: MessageAuditItem) => {
    try {
      await auditApi.triggerMessageAlert(item.id)
      toast.success("已生成告警")
      void fetchData(data.page)
    } catch {
      toast.error("生成告警失败")
    }
  }

  const openContext = async (item: MessageAuditItem) => {
    setContextOpen(true)
    setContextLoading(true)
    try {
      const result = await auditApi.getMessageContext(item.id, 5)
      setContextData(result)
    } catch {
      toast.error("加载上下文失败")
      setContextData(null)
    } finally {
      setContextLoading(false)
    }
  }

  const openMute = (userId: number) => {
    setMuteUserId(userId)
    setMuteMinutes("60")
    setMuteOpen(true)
  }

  const handleMute = async () => {
    if (!muteUserId) return
    try {
      await userApi.mute(muteUserId, parseInt(muteMinutes, 10))
      toast.success("已禁言用户")
      setMuteOpen(false)
    } catch {
      toast.error("禁言失败")
    }
  }

  const handleDetectContent = async () => {
    if (!detectContent.trim()) {
      toast.error("请输入待检测内容")
      return
    }
    setDetecting(true)
    setDetectResult(null)
    try {
      const modelId = selectedModelId ? Number(selectedModelId) : undefined
      const result = await auditApi.detectChatContent(detectContent, modelId)
      setDetectResult(result)
      toast.success("AI 检测完成")
    } catch (error) {
      console.error("AI 检测失败:", error)
      toast.error("AI 检测失败")
    } finally {
      setDetecting(false)
    }
  }

  const handleDetectMessage = async (item: MessageAuditItem) => {
    try {
      const modelId = selectedModelId ? Number(selectedModelId) : undefined
      await auditApi.detectChatMessage(item.id, modelId)
      toast.success("消息 AI 检测完成")
      void fetchData(data.page)
    } catch (error) {
      console.error("消息 AI 检测失败:", error)
      toast.error("消息 AI 检测失败")
    }
  }

  const handleBatchDetect = async () => {
    setBatchDetecting(true)
    try {
      const modelId = selectedModelId ? Number(selectedModelId) : undefined
      const result = await auditApi.detectChatBatch(modelId, 50)
      toast.success(
        `批量扫描完成：处理 ${result.processed} 条，高危 ${result.high_risk} 条，中危 ${result.medium_risk} 条`
      )
      void fetchData(data.page)
    } catch (error) {
      console.error("批量检测失败:", error)
      toast.error("批量检测失败")
    } finally {
      setBatchDetecting(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-4">
      <SectionHeader
        title="聊天审计"
        subtitle="敏感消息审计、人工复核与 AI 风险检测"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void fetchData(data.page)}
              disabled={loading}
            >
              <RefreshCw
                className={cn("mr-1 h-3.5 w-3.5", loading && "animate-spin")}
              />
              刷新
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDetectContent("")
                setDetectResult(null)
                setDetectOpen(true)
              }}
            >
              <Sparkles className="mr-1 h-3.5 w-3.5" />
              AI 检测
            </Button>
            <Button
              size="sm"
              onClick={() => void handleBatchDetect()}
              disabled={batchDetecting}
            >
              {batchDetecting ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <ScanLine className="mr-1 h-3.5 w-3.5" />
              )}
              扫描近期消息
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={filters.keyword}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, keyword: e.target.value }))
                }
                placeholder="搜索发送者、内容..."
                className="pl-9"
              />
            </div>
            <Select
              value={filters.risk_level}
              onValueChange={(v) =>
                setFilters((prev) => ({ ...prev, risk_level: v }))
              }
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="风险等级" />
              </SelectTrigger>
              <SelectContent>
                {RISK_LEVELS.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.risk_category}
              onValueChange={(v) =>
                setFilters((prev) => ({ ...prev, risk_category: v }))
              }
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="风险类别" />
              </SelectTrigger>
              <SelectContent>
                {RISK_CATEGORIES.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.audit_status}
              onValueChange={(v) =>
                setFilters((prev) => ({ ...prev, audit_status: v }))
              }
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="审计状态" />
              </SelectTrigger>
              <SelectContent>
                {AUDIT_STATUSES.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="w-[220px]">
              <Select
                value={selectedModelId}
                onValueChange={setSelectedModelId}
              >
                <SelectTrigger>
                  <Bot className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="选择检测模型" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem key={model.id} value={String(model.id)}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : data.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-md bg-muted">
                <MessageSquareWarning className="h-5 w-5" />
              </div>
              <p className="text-sm">暂无审计消息</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>发送者</TableHead>
                  <TableHead>会话</TableHead>
                  <TableHead>内容</TableHead>
                  <TableHead>风险</TableHead>
                  <TableHead>AI 风险</TableHead>
                  <TableHead>类别</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{item.sender_name}</p>
                        <p className="text-xs text-muted-foreground">
                          ID: {item.sender_id}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {item.conversation_type === "group" ? "群聊" : "单聊"}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        #{item.conversation_id}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm line-clamp-2 max-w-xs">
                        {item.content || "-"}
                      </p>
                    </TableCell>
                    <TableCell>{riskBadge(item.risk_level)}</TableCell>
                    <TableCell>
                      {item.ai_risk_level ? (
                        <div className="space-y-1">
                          {riskBadge(item.ai_risk_level)}
                          <div className="flex flex-wrap gap-1">
                            {(item.ai_risk_tags || []).map((tag) => (
                              <Badge
                                key={tag}
                                variant="outline"
                                className="text-[10px]"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">未检测</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(item.risk_categories || []).map((cat) => (
                          <Badge
                            key={cat}
                            variant="secondary"
                            className="text-xs"
                          >
                            {RISK_CATEGORIES.find((c) => c.value === cat)
                              ?.label || cat}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{statusBadge(item.audit_status)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(item.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openContext(item)}>
                            <Eye className="h-4 w-4 mr-2" /> 查看上下文
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => void handleDetectMessage(item)}
                          >
                            <Sparkles className="h-4 w-4 mr-2" /> AI 重检
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleReview(item, "passed")}
                          >
                            <ShieldCheck className="h-4 w-4 mr-2" /> 复核通过
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleReview(item, "blocked")}
                          >
                            <Ban className="h-4 w-4 mr-2" /> 复核拦截
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAlert(item)}>
                            <AlertTriangle className="h-4 w-4 mr-2" /> 生成告警
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openMute(item.sender_id)}>
                            <VolumeX className="h-4 w-4 mr-2" /> 禁言用户
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={async () => {
                              try {
                                await userApi.ban(item.sender_id)
                                toast.success("用户已封禁")
                              } catch {
                                toast.error("封禁失败")
                              }
                            }}
                          >
                            <UserX className="h-4 w-4 mr-2" /> 封禁用户
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {data.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            共 {data.total} 条，第 {data.page} / {data.total_pages} 页
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={data.page <= 1}
              onClick={() => void fetchData(data.page - 1)}
            >
              上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={data.page >= data.total_pages}
              onClick={() => void fetchData(data.page + 1)}
            >
              下一页
            </Button>
          </div>
        </div>
      )}

      {/* 上下文弹窗 */}
      <Dialog open={contextOpen} onOpenChange={setContextOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>消息上下文</DialogTitle>
          </DialogHeader>
          {contextLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : contextData ? (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto py-2">
              {contextData.before.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "p-2 rounded text-sm",
                    m.sender_id === contextData.current.sender_id
                      ? "bg-muted/50"
                      : "bg-transparent"
                  )}
                >
                  <span className="font-medium">{m.sender_name}:</span>{" "}
                  <span className="text-muted-foreground">
                    {m.content || "[无内容]"}
                  </span>
                </div>
              ))}
              <div className="p-2 rounded border border-primary/30 bg-primary/5 text-sm">
                <span className="font-medium">
                  {contextData.current.sender_name}:
                </span>{" "}
                {contextData.current.content || "[无内容]"}
              </div>
              {contextData.after.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "p-2 rounded text-sm",
                    m.sender_id === contextData.current.sender_id
                      ? "bg-muted/50"
                      : "bg-transparent"
                  )}
                >
                  <span className="font-medium">{m.sender_name}:</span>{" "}
                  <span className="text-muted-foreground">
                    {m.content || "[无内容]"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">无法加载上下文</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setContextOpen(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 禁言弹窗 */}
      <Dialog open={muteOpen} onOpenChange={setMuteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>全局禁言用户</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">设置禁言时长（分钟）</p>
            <Input
              type="number"
              min={1}
              value={muteMinutes}
              onChange={(e) => setMuteMinutes(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMuteOpen(false)}>
              取消
            </Button>
            <Button onClick={handleMute}>确认禁言</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI 检测对话框 */}
      <Dialog open={detectOpen} onOpenChange={setDetectOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>AI 聊天内容检测</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                检测模型
              </label>
              <Select
                value={selectedModelId}
                onValueChange={setSelectedModelId}
              >
                <SelectTrigger>
                  <Bot className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="选择模型" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem key={model.id} value={String(model.id)}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                待检测内容
              </label>
              <textarea
                value={detectContent}
                onChange={(e) => setDetectContent(e.target.value)}
                placeholder="输入要检测的聊天内容..."
                rows={5}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            {detectResult && (
              <div className="rounded-md border border-border bg-muted/50 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">风险等级</span>
                  {riskBadge(detectResult.risk_level)}
                </div>
                <div className="flex flex-wrap gap-1">
                  {detectResult.risk_tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {detectResult.reason}
                </p>
                {!detectResult.success && detectResult.error && (
                  <p className="text-xs text-destructive">
                    错误：{detectResult.error}
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetectOpen(false)}>
              关闭
            </Button>
            <Button
              onClick={() => void handleDetectContent()}
              disabled={detecting}
            >
              {detecting ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-1 h-4 w-4" />
              )}
              开始检测
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
