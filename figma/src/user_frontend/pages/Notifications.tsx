import { useState } from "react"
import {
  Bell, Users, Bot, BookOpen, Shield, UserPlus, CheckCircle,
  AlertTriangle, X, Eye, RefreshCw, Filter
} from "lucide-react"
import { cn } from "@/shared/utils"
import { Badge, Btn } from "@/shared/ui"
import { myNotifications } from "@/shared/mockData"

export function NotificationsPage() {
  const [notifications, setNotifications] = useState(myNotifications)
  const [filter, setFilter] = useState<string>("all")

  const unreadCount = notifications.filter(n => !n.read).length

  const typeConfig: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
    friend_request:  { label: "好友申请",   icon: UserPlus,     color: "text-primary",      bg: "bg-primary/10" },
    friend_accepted: { label: "好友通过",   icon: CheckCircle,  color: "text-emerald-400",  bg: "bg-emerald-500/10" },
    group_invite:    { label: "群邀请",     icon: Users,        color: "text-cyan-400",     bg: "bg-cyan-500/10" },
    agent_done:      { label: "任务完成",   icon: Bot,          color: "text-purple-400",   bg: "bg-purple-500/10" },
    workflow_failed: { label: "工作流失败", icon: AlertTriangle, color: "text-amber-400",   bg: "bg-amber-500/10" },
    system:          { label: "系统通知",   icon: Bell,         color: "text-muted-foreground", bg: "bg-muted" },
    kb_done:         { label: "知识库",     icon: BookOpen,     color: "text-cyan-400",     bg: "bg-cyan-500/10" },
    audit_alert:     { label: "审计告警",   icon: Shield,       color: "text-red-400",      bg: "bg-red-500/10" },
  }

  const filterTabs = [
    { key: "all",      label: "全部",   count: notifications.length },
    { key: "unread",   label: "未读",   count: unreadCount },
    { key: "friend_request", label: "好友申请", count: notifications.filter(n => n.type === "friend_request").length },
    { key: "group_invite",   label: "群邀请",   count: notifications.filter(n => n.type === "group_invite").length },
    { key: "system",         label: "系统",     count: notifications.filter(n => ["system", "kb_done", "audit_alert"].includes(n.type)).length },
  ]

  const filtered = notifications.filter(n => {
    if (filter === "all") return true
    if (filter === "unread") return !n.read
    if (filter === "system") return ["system", "kb_done", "audit_alert"].includes(n.type)
    return n.type === filter
  })

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  const markRead = (id: number) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))

  const handleAccept = (id: number) => markRead(id)
  const handleReject = (id: number) => markRead(id)

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-base font-semibold">通知中心</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{unreadCount > 0 ? `${unreadCount} 条未读通知` : "所有通知已读"}</p>
          </div>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-primary/15 text-primary text-xs rounded-full font-semibold">{unreadCount}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Btn variant="ghost" size="sm" onClick={markAllRead}><CheckCircle className="w-4 h-4" />全部已读</Btn>
          <Btn variant="ghost" size="sm"><Filter className="w-4 h-4" />筛选</Btn>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex-shrink-0 px-6 pt-3 pb-0">
        <div className="flex gap-1 bg-muted/40 rounded-lg p-1 w-fit">
          {filterTabs.map(t => (
            <button key={t.key} onClick={() => setFilter(t.key)} className={cn(
              "px-3 py-1 text-xs rounded font-medium transition-colors flex items-center gap-1.5",
              filter === t.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}>
              {t.label}
              {t.count > 0 && (
                <span className={cn("text-[10px] px-1 rounded", filter === t.key ? "bg-primary/15 text-primary" : "text-muted-foreground/60")}>{t.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Notification List */}
      <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-2">
        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <Bell className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">暂无通知</p>
          </div>
        )}
        {filtered.map(n => {
          const tc = typeConfig[n.type] || typeConfig.system
          const IconComp = tc.icon
          return (
            <div
              key={n.id}
              onClick={() => markRead(n.id)}
              className={cn(
                "flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all",
                n.read
                  ? "bg-card border-border hover:border-primary/20"
                  : "bg-primary/5 border-primary/20 hover:border-primary/40"
              )}
            >
              {/* Icon */}
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-lg", tc.bg)}>
                {typeof n.avatar === "string" && n.avatar.length > 2 ? (
                  <span className="text-base">{n.avatar}</span>
                ) : n.from ? (
                  <span className={cn("text-sm font-semibold", tc.color)}>{n.from[0]}</span>
                ) : (
                  <IconComp className={cn("w-5 h-5", tc.color)} />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">{n.title}</span>
                    <Badge variant="muted">{tc.label}</Badge>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0 font-mono">{n.time}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{n.content}</p>

                {/* Action buttons */}
                {n.action && n.type === "friend_request" && (
                  <div className="flex gap-2 mt-3">
                    <Btn size="xs" onClick={e => { e.stopPropagation(); handleAccept(n.id) }}>
                      <CheckCircle className="w-3 h-3" />接受好友申请
                    </Btn>
                    <Btn size="xs" variant="outline" onClick={e => { e.stopPropagation(); handleReject(n.id) }}>
                      <X className="w-3 h-3" />拒绝
                    </Btn>
                  </div>
                )}
                {n.action && n.type === "group_invite" && (
                  <div className="flex gap-2 mt-3">
                    <Btn size="xs" onClick={e => { e.stopPropagation(); handleAccept(n.id) }}>
                      <CheckCircle className="w-3 h-3" />加入群组
                    </Btn>
                    <Btn size="xs" variant="outline" onClick={e => { e.stopPropagation(); handleReject(n.id) }}>
                      <X className="w-3 h-3" />忽略
                    </Btn>
                  </div>
                )}
                {n.action && n.type === "workflow_failed" && (
                  <div className="flex gap-2 mt-3">
                    <Btn size="xs" variant="outline" onClick={e => { e.stopPropagation(); markRead(n.id) }}>
                      <Eye className="w-3 h-3" />查看详情
                    </Btn>
                    <Btn size="xs" variant="outline" onClick={e => { e.stopPropagation(); markRead(n.id) }}>
                      <RefreshCw className="w-3 h-3" />重新运行
                    </Btn>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
