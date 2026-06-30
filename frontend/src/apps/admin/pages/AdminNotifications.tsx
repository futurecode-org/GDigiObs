import { useState, useEffect } from "react"
import { Bell, Check, CheckCheck, Trash2, Search, Send, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SectionHeader } from "@/shared/components/SectionHeader"
import { notificationApi, adminNotificationApi } from "@/lib/api"
import { toast } from "sonner"
import type { Notification } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function AdminNotifications() {
  const [filter, setFilter] = useState<"all" | "unread">("all")
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page] = useState(1)
  const [sendDialogOpen, setSendDialogOpen] = useState(false)
  const [sendLoading, setSendLoading] = useState(false)
  const [sendForm, setSendForm] = useState({
    title: "",
    content: "",
    target_type: "all",
    target_id: "",
    channel: "in_app",
  })

  useEffect(() => {
    fetchNotifications()
  }, [page])

  const fetchNotifications = async () => {
    setIsLoading(true)
    try {
      const result = await notificationApi.getList({ page, page_size: 50 })
      setNotifications(result.items as Notification[])
    } catch {
      setNotifications([])
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (id: number) => {
    try {
      await notificationApi.markAsRead(id)
      setNotifications(notifications.map(n => n.id === id ? { ...n, status: "read", read: true } : n))
    } catch {}
  }

  const markAllRead = async () => {
    try {
      await notificationApi.markAllAsRead()
      setNotifications(notifications.map(n => ({ ...n, status: "read", read: true })))
    } catch {}
  }

  const deleteNotification = async (id: number) => {
    try {
      await notificationApi.delete(id)
      setNotifications(notifications.filter(n => n.id !== id))
    } catch {}
  }

  const handleSendNotification = async () => {
    if (!sendForm.title.trim()) {
      toast.error("请输入通知标题")
      return
    }
    setSendLoading(true)
    try {
      const result = await adminNotificationApi.send({
        title: sendForm.title,
        content: sendForm.content,
        target_type: sendForm.target_type,
        target_id: sendForm.target_id ? parseInt(sendForm.target_id) : undefined,
        channel: sendForm.channel,
      })
      toast.success(`通知发送成功，共发送 ${result.sent_count} 人`)
      setSendDialogOpen(false)
      setSendForm({ title: "", content: "", target_type: "all", target_id: "", channel: "in_app" })
      fetchNotifications()
    } catch (error: any) {
      toast.error(error.message || "发送失败")
    } finally {
      setSendLoading(false)
    }
  }

  const typeLabels: Record<string, string> = {
    system: "系统", task: "任务", message: "消息", approval: "审批",
    friend_application: "好友申请", group_invitation: "群邀请",
    audit_alert: "审计告警", agent_completed: "数字员工完成",
    workflow_failed: "工作流失败", query_completed: "问数完成", user_banned: "用户封禁"
  }
  const typeColors: Record<string, string> = {
    system: "secondary", task: "default", message: "outline", approval: "outline",
    friend_application: "destructive", group_invitation: "default",
    audit_alert: "destructive", agent_completed: "secondary",
    workflow_failed: "destructive", query_completed: "secondary", user_banned: "destructive"
  }

  const getNotifType = (notif: Notification) => notif.notification_type || notif.type || "system"
  const isUnread = (notif: Notification) => notif.status === "unread" || notif.read === false

  const filteredNotifs = filter === "all" ? notifications : notifications.filter(n => isUnread(n))
  const unreadCount = notifications.filter(n => isUnread(n)).length

  const formatTime = (dateStr: string) => {
    if (!dateStr) return ""
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (minutes < 1) return "刚刚"
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    return date.toLocaleDateString()
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <SectionHeader title="系统通知" subtitle={`${unreadCount} 条未读`} />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setSendDialogOpen(true)}>
            <Send className="w-4 h-4 mr-1" /> 发送通知
          </Button>
          <Button variant="ghost" size="sm" onClick={markAllRead} disabled={unreadCount === 0}>
            <CheckCheck className="w-4 h-4 mr-1" /> 全部已读
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-2">
          <div className="flex items-center gap-2 px-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="搜索通知..."
                className="w-full pl-9 pr-3 py-2 bg-muted border border-transparent rounded-lg text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <button
              onClick={() => setFilter("all")}
              className={cn("px-3 py-1.5 text-xs rounded-lg transition-colors", filter === "all" ? "bg-primary/10 text-primary" : "text-muted-foreground")}
            >
              全部
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={cn("px-3 py-1.5 text-xs rounded-lg transition-colors", filter === "unread" ? "bg-primary/10 text-primary" : "text-muted-foreground")}
            >
              未读 {unreadCount > 0 && `(${unreadCount})`}
            </button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <Card key={i} className="p-4">
              <CardContent>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-3/4 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-1/3 bg-muted animate-pulse rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredNotifs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>暂无通知</p>
            </div>
          ) : (
            filteredNotifs.map(notif => {
              const notifType = getNotifType(notif)
              const unread = isUnread(notif)
              return (
                <Card key={notif.id} className={cn("transition-colors", unread && "bg-primary/5")}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", !unread ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary")}>
                        <Bell className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-foreground">{notif.title}</span>
                          <Badge variant={typeColors[notifType] as any} className="text-[10px]">
                            {typeLabels[notifType] || notifType}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{notif.content}</p>
                        <div className="flex items-center gap-4">
                          <span className="text-[10px] text-muted-foreground">{formatTime(notif.created_at)}</span>
                          <div className="flex gap-3 ml-auto">
                            {unread && (
                              <button onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }} className="text-[10px] text-primary hover:underline flex items-center gap-1">
                                <Check className="w-3 h-3" /> 标记已读
                              </button>
                            )}
                            <button onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }} className="text-[10px] text-red-400 hover:underline flex items-center gap-1">
                              <Trash2 className="w-3 h-3" /> 删除
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      )}

      {/* Send Dialog */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>发送系统通知</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>通知标题 *</Label>
              <Input value={sendForm.title} onChange={e => setSendForm(prev => ({ ...prev, title: e.target.value }))} placeholder="请输入通知标题" />
            </div>
            <div className="space-y-2">
              <Label>通知内容</Label>
              <textarea
                className="w-full min-h-[100px] px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={sendForm.content}
                onChange={e => setSendForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="请输入通知内容"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>发送范围</Label>
                <Select value={sendForm.target_type} onValueChange={v => setSendForm(prev => ({ ...prev, target_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部用户</SelectItem>
                    <SelectItem value="tenant">指定租户</SelectItem>
                    <SelectItem value="user">指定用户</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>目标ID（选填）</Label>
                <Input value={sendForm.target_id} onChange={e => setSendForm(prev => ({ ...prev, target_id: e.target.value }))} placeholder="租户ID或用户ID" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>通知渠道</Label>
              <Select value={sendForm.channel} onValueChange={v => setSendForm(prev => ({ ...prev, channel: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_app">站内通知</SelectItem>
                  <SelectItem value="browser">浏览器通知</SelectItem>
                  <SelectItem value="email">邮件通知</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendDialogOpen(false)}>取消</Button>
            <Button onClick={handleSendNotification} disabled={sendLoading}>
              {sendLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Send className="w-4 h-4 mr-1" />}
              发送
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
