import { useState } from "react"
import { Search, Bell, Check, X, User, Users, Settings, FileText, AlertTriangle, Shield, Clock } from "lucide-react"
import { Card } from "@/components/shared/Card"
import { Badge } from "@/components/shared/Badge"
import { Btn } from "@/components/shared/Btn"
import { SectionHeader } from "@/components/shared/SectionHeader"
import { cn } from "@/lib/utils"
import { myNotifications } from "@/lib/mockData"

export function NotificationsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [notifications, setNotifications] = useState(myNotifications)

  const filteredNotifications = notifications.filter(notif => {
    const matchSearch = notif.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchType = filterType === "all" || notif.type === filterType
    return matchSearch && matchType
  })

  const markAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "friend_request": return User
      case "friend_accepted": return User
      case "group_invite": return Users
      case "agent_done": return Settings
      case "agent_failed": return AlertTriangle
      case "workflow_failed": return AlertTriangle
      case "kb_done": return FileText
      case "system": return Bell
      case "audit_alert": return Shield
      default: return Bell
    }
  }

  const getIconColor = (type: string) => {
    switch (type) {
      case "friend_request": return "bg-primary/15 text-primary"
      case "friend_accepted": return "bg-emerald-500/15 text-emerald-400"
      case "group_invite": return "bg-cyan-500/15 text-cyan-400"
      case "agent_done": return "bg-purple-500/15 text-purple-400"
      case "agent_failed": return "bg-red-500/15 text-red-400"
      case "workflow_failed": return "bg-amber-500/15 text-amber-400"
      case "kb_done": return "bg-blue-500/15 text-blue-400"
      case "system": return "bg-muted text-muted-foreground"
      case "audit_alert": return "bg-orange-500/15 text-orange-400"
      default: return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <SectionHeader title="通知中心" action={<Btn variant="primary" size="sm" onClick={markAllRead}>全部标为已读</Btn>} />
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="搜索通知..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-muted border border-transparent rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="px-3 py-2 bg-muted border border-transparent rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
          >
            <option value="all">全部类型</option>
            <option value="friend_request">好友申请</option>
            <option value="friend_accepted">好友通过</option>
            <option value="group_invite">群聊邀请</option>
            <option value="agent_done">数字员工</option>
            <option value="workflow_failed">工作流</option>
            <option value="system">系统通知</option>
          </select>
        </div>
      </Card>

      <div className="space-y-3">
        {filteredNotifications.map(notif => {
          const Icon = getIcon(notif.type)
          return (
            <Card key={notif.id} className={cn("p-4 transition-colors", !notif.read && "bg-primary/5")}>
              <div className="flex items-start gap-4">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", getIconColor(notif.type))}>
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground">{notif.title}</span>
                    {notif.from && <Badge variant="muted">{notif.from}</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{notif.content}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{notif.time}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {!notif.read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                  {notif.action && (
                    <>
                      <Btn variant="primary" size="sm"><Check className="w-3.5 h-3.5" /> 确认</Btn>
                      <Btn variant="ghost" size="sm"><X className="w-3.5 h-3.5" /> 忽略</Btn>
                    </>
                  )}
                  <button onClick={() => markAsRead(notif.id)} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                    {notif.read ? "已读" : "标为已读"}
                  </button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {filteredNotifications.length === 0 && (
        <div className="text-center py-12">
          <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">暂无通知</p>
        </div>
      )}
    </div>
  )
}