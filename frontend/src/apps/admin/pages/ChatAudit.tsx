import { useCallback, useEffect, useState } from "react"
import { MessageSquareWarning, Search, Loader2, MoreHorizontal, Eye, AlertTriangle, ShieldCheck, VolumeX, Ban, UserX } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SectionHeader } from "@/shared/components/SectionHeader"
import { auditApi, userApi } from "@/lib/api"
import type { MessageAuditItem, PaginatedData } from "@/lib/types"
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
  const variant = risk === "high" ? "destructive" : risk === "medium" ? "default" : risk === "low" ? "secondary" : "outline"
  return <Badge variant={variant as any} className="text-xs">{risk === "none" ? "无风险" : risk || "-"}</Badge>
}

function statusBadge(status?: string) {
  const map: Record<string, string> = { passed: "已通过", reviewing: "复核中", blocked: "已拦截" }
  const variant = status === "blocked" ? "destructive" : status === "reviewing" ? "secondary" : "outline"
  return <Badge variant={variant as any} className="text-xs">{map[status || ""] || status || "-"}</Badge>
}

export function ChatAudit() {
  const [data, setData] = useState<PaginatedData<MessageAuditItem>>({ items: [], total: 0, page: 1, page_size: 20, total_pages: 1 })
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    risk_level: "",
    risk_category: "",
    audit_status: "",
    keyword: "",
  })

  const [contextOpen, setContextOpen] = useState(false)
  const [contextData, setContextData] = useState<{ current: MessageAuditItem; before: MessageAuditItem[]; after: MessageAuditItem[] } | null>(null)
  const [contextLoading, setContextLoading] = useState(false)

  const [muteOpen, setMuteOpen] = useState(false)
  const [muteUserId, setMuteUserId] = useState<number | null>(null)
  const [muteMinutes, setMuteMinutes] = useState("60")

  const fetchData = useCallback(async (page = 1) => {
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
  }, [filters])

  useEffect(() => {
    void fetchData(1)
  }, [fetchData])

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

  return (
    <div className="h-full overflow-y-auto p-6 space-y-4">
      <SectionHeader title="聊天审计" subtitle="敏感消息审计与人工复核" action={
        <Button variant="outline" size="sm" onClick={() => void fetchData(data.page)}>刷新</Button>
      } />

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={filters.keyword}
                onChange={e => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
                placeholder="搜索发送者、内容..."
                className="pl-9"
              />
            </div>
            <Select value={filters.risk_level} onValueChange={v => setFilters(prev => ({ ...prev, risk_level: v }))}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="风险等级" /></SelectTrigger>
              <SelectContent>
                {RISK_LEVELS.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.risk_category} onValueChange={v => setFilters(prev => ({ ...prev, risk_category: v }))}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="风险类别" /></SelectTrigger>
              <SelectContent>
                {RISK_CATEGORIES.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.audit_status} onValueChange={v => setFilters(prev => ({ ...prev, audit_status: v }))}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="审计状态" /></SelectTrigger>
              <SelectContent>
                {AUDIT_STATUSES.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : data.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <MessageSquareWarning className="size-10 mb-2 opacity-50" />
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
                  <TableHead>类别</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{item.sender_name}</p>
                        <p className="text-xs text-muted-foreground">ID: {item.sender_id}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{item.conversation_type === "group" ? "群聊" : "单聊"}</Badge>
                      <p className="text-xs text-muted-foreground mt-0.5">#{item.conversation_id}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm line-clamp-2 max-w-xs">{item.content || "-"}</p>
                    </TableCell>
                    <TableCell>{riskBadge(item.risk_level)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(item.risk_categories || []).map(cat => (
                          <Badge key={cat} variant="secondary" className="text-xs">{RISK_CATEGORIES.find(c => c.value === cat)?.label || cat}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{statusBadge(item.audit_status)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(item.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm"><MoreHorizontal className="size-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openContext(item)}>
                            <Eye className="size-4 mr-2" /> 查看上下文
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleReview(item, "passed")}>
                            <ShieldCheck className="size-4 mr-2" /> 复核通过
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleReview(item, "blocked")}>
                            <Ban className="size-4 mr-2" /> 复核拦截
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAlert(item)}>
                            <AlertTriangle className="size-4 mr-2" /> 生成告警
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openMute(item.sender_id)}>
                            <VolumeX className="size-4 mr-2" /> 禁言用户
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={async () => {
                            try { await userApi.ban(item.sender_id); toast.success("用户已封禁"); } catch { toast.error("封禁失败"); }
                          }}>
                            <UserX className="size-4 mr-2" /> 封禁用户
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
          <span className="text-xs text-muted-foreground">共 {data.total} 条，第 {data.page} / {data.total_pages} 页</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={data.page <= 1} onClick={() => void fetchData(data.page - 1)}>上一页</Button>
            <Button variant="outline" size="sm" disabled={data.page >= data.total_pages} onClick={() => void fetchData(data.page + 1)}>下一页</Button>
          </div>
        </div>
      )}

      {/* 上下文弹窗 */}
      <Dialog open={contextOpen} onOpenChange={setContextOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>消息上下文</DialogTitle></DialogHeader>
          {contextLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
          ) : contextData ? (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto py-2">
              {contextData.before.map(m => (
                <div key={m.id} className={cn("p-2 rounded text-sm", m.sender_id === contextData.current.sender_id ? "bg-muted/50" : "bg-transparent")}>
                  <span className="font-medium">{m.sender_name}:</span> <span className="text-muted-foreground">{m.content || "[无内容]"}</span>
                </div>
              ))}
              <div className="p-2 rounded border border-primary/30 bg-primary/5 text-sm">
                <span className="font-medium">{contextData.current.sender_name}:</span> {contextData.current.content || "[无内容]"}
              </div>
              {contextData.after.map(m => (
                <div key={m.id} className={cn("p-2 rounded text-sm", m.sender_id === contextData.current.sender_id ? "bg-muted/50" : "bg-transparent")}>
                  <span className="font-medium">{m.sender_name}:</span> <span className="text-muted-foreground">{m.content || "[无内容]"}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">无法加载上下文</p>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setContextOpen(false)}>关闭</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 禁言弹窗 */}
      <Dialog open={muteOpen} onOpenChange={setMuteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>全局禁言用户</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">设置禁言时长（分钟）</p>
            <Input type="number" min={1} value={muteMinutes} onChange={e => setMuteMinutes(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMuteOpen(false)}>取消</Button>
            <Button onClick={handleMute}>确认禁言</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
