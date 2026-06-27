import { useState } from "react"
import {
  Bell, Siren, AlertTriangle, Download, CheckCircle, Inbox, ArrowRight
} from "lucide-react"
import { cn } from "@/shared/utils"
import { Badge, StatCard, Btn } from "@/shared/ui"
import { adminNotifications } from "@/shared/mockData"
import type { AdminPage } from "@/shared/types"

export function AdminNotificationsPage({ onNavigate }: { onNavigate: (page: AdminPage) => void }) {
  const [notifications, setNotifications] = useState(adminNotifications)
  const [filter, setFilter] = useState<"all" | "unread" | "high" | "medium" | "info">("all")

  const unreadCount = notifications.filter(n => !n.read).length
  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  const markRead   = (id: number) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))

  const filtered = notifications.filter(n => {
    if (filter === "unread")  return !n.read
    if (filter === "high")    return n.level === "high"
    if (filter === "medium")  return n.level === "medium"
    if (filter === "info")    return n.level === "info"
    return true
  })

  const levelConfig: Record<string, {
    label: string; icon: React.ElementType
    iconColor: string; iconBg: string; badgeVariant: "danger" | "warning" | "info" | "muted"
  }> = {
    high:   { label: "高风险",  icon: Siren,         iconColor: "text-red-400",             iconBg: "bg-red-500/10",    badgeVariant: "danger"  },
    medium: { label: "中风险",  icon: AlertTriangle,  iconColor: "text-amber-400",           iconBg: "bg-amber-500/10",  badgeVariant: "warning" },
    info:   { label: "信息",    icon: Bell,           iconColor: "text-primary",             iconBg: "bg-primary/10",    badgeVariant: "info"    },
  }

  const typeLabel: Record<string, string> = {
    audit_high:      "审计告警",
    audit_medium:    "审计告警",
    collect_fail:    "采集异常",
    model_error:     "模型异常",
    workflow_fail:   "工作流",
    user_banned:     "用户管理",
    analysis_done:   "分析任务",
    tenant_disabled: "租户管理",
    kb_ready:        "知识库",
  }

  const filterTabs = [
    { key: "all",    label: "全部",   count: notifications.length },
    { key: "unread", label: "未读",   count: unreadCount },
    { key: "high",   label: "高风险", count: notifications.filter(n => n.level === "high").length },
    { key: "medium", label: "中风险", count: notifications.filter(n => n.level === "medium").length },
    { key: "info",   label: "信息",   count: notifications.filter(n => n.level === "info").length },
  ]

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-base font-semibold">通知中心</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {unreadCount > 0 ? `${unreadCount} 条未读通知` : "所有通知已读"}
              </p>
            </div>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-red-500/15 text-red-400 text-xs rounded-full font-semibold border border-red-500/25">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Btn variant="ghost" size="sm" onClick={markAllRead}>
              <CheckCircle className="w-4 h-4" />全部已读
            </Btn>
            <Btn variant="outline" size="sm">
              <Download className="w-4 h-4" />导出
            </Btn>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          <StatCard label="高风险告警" value={notifications.filter(n => n.level === "high").length}   icon={Siren}         color="danger"  />
          <StatCard label="中风险告警" value={notifications.filter(n => n.level === "medium").length} icon={AlertTriangle}  color="warning" />
          <StatCard label="信息通知"   value={notifications.filter(n => n.level === "info").length}   icon={Bell}          color="primary" />
          <StatCard label="未读总数"   value={unreadCount}                                             icon={Inbox}         color="info"    />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex-shrink-0 px-6 pt-3 pb-0">
        <div className="flex gap-1 bg-muted/40 rounded-lg p-1 w-fit">
          {filterTabs.map(t => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key as typeof filter)}
              className={cn(
                "px-3 py-1 text-xs rounded font-medium transition-colors flex items-center gap-1.5",
                filter === t.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
              {t.count > 0 && (
                <span className={cn("text-[10px] px-1 rounded",
                  filter === t.key ? "bg-primary/15 text-primary" : "text-muted-foreground/60"
                )}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-2">
        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <Bell className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">暂无通知</p>
          </div>
        )}
        {filtered.map(n => {
          const lc = levelConfig[n.level]
          const IconComp = lc.icon
          return (
            <div
              key={n.id}
              onClick={() => markRead(n.id)}
              className={cn(
                "flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all group",
                n.read
                  ? "bg-card border-border hover:border-primary/25"
                  : "bg-primary/5 border-primary/20 hover:border-primary/40"
              )}
            >
              {/* Level icon */}
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0", lc.iconBg)}>
                <IconComp className={cn("w-5 h-5", lc.iconColor)} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">{n.title}</span>
                    <Badge variant={lc.badgeVariant}>{lc.label}</Badge>
                    <Badge variant="muted">{typeLabel[n.type] ?? n.type}</Badge>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0 font-mono">{n.time}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{n.content}</p>

                {/* Actions */}
                {n.action && (
                  <div className="flex gap-2 mt-3">
                    <Btn
                      size="xs"
                      onClick={e => { e.stopPropagation(); markRead(n.id); onNavigate(n.link) }}
                    >
                      <ArrowRight className="w-3 h-3" />前往处理
                    </Btn>
                    <Btn
                      size="xs"
                      variant="ghost"
                      onClick={e => { e.stopPropagation(); markRead(n.id) }}
                    >
                      忽略
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
