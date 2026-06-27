import { useState } from "react"
import { Bell, Check, CheckCheck, Trash2, Search } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SectionHeader } from "@/shared/components/SectionHeader"
import { myNotifications } from "@/lib/mockData"
import { cn } from "@/lib/utils"

export function NotificationsPage() {
  const [filter, setFilter] = useState<"all" | "unread">("all")
  const [notifications, setNotifications] = useState(myNotifications)

  const filteredNotifs = filter === "all" ? notifications : notifications.filter(n => !n.read)
  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }

  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id))
  }

  const typeLabels: Record<string, string> = { system: "系统", task: "任务", message: "消息", approval: "审批" }
  const typeColors: Record<string, string> = { system: "secondary", task: "default", message: "outline", approval: "outline" }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <SectionHeader title="通知中心" subtitle={`${unreadCount} 条未读`} />
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={markAllRead} disabled={unreadCount === 0}>
            <CheckCheck className="w-4 h-4" /> 全部已读
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

      <div className="space-y-2">
        {filteredNotifs.map(notif => (
          <Card key={notif.id} className={cn("transition-colors", !notif.read && "bg-primary/5")}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", notif.read ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary")}>
                  <Bell className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground">{notif.title}</span>
                    <Badge variant={typeColors[notif.type] as "default" | "secondary" | "outline" | "destructive" | "ghost"} className="text-[10px]">
                      {typeLabels[notif.type]}
                    </Badge>
                    {!notif.read && <span className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{notif.content}</p>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] text-muted-foreground">{notif.time}</span>
                    <div className="flex gap-3 ml-auto">
                      {!notif.read && (
                        <button onClick={() => markAsRead(notif.id)} className="text-[10px] text-primary hover:underline flex items-center gap-1">
                          <Check className="w-3 h-3" /> 标记已读
                        </button>
                      )}
                      <button onClick={() => deleteNotification(notif.id)} className="text-[10px] text-red-400 hover:underline flex items-center gap-1">
                        <Trash2 className="w-3 h-3" /> 删除
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
