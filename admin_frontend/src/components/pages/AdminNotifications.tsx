import { useState } from "react"
import { Bell, AlertTriangle, Clock, Filter, Check } from "lucide-react"
import { Card } from "@/components/shared/Card"
import { SectionHeader } from "@/components/shared/SectionHeader"
import { Badge } from "@/components/shared/Badge"
import { Btn } from "@/components/shared/Btn"
import { adminNotifications } from "@/lib/mockData"
import { cn } from "@/lib/utils"

export function AdminNotifications() {
  const [notifications, setNotifications] = useState(adminNotifications)
  const [filterLevel, setFilterLevel] = useState("")

  const filteredNotifs = notifications.filter(notif =>
    !filterLevel || notif.level === filterLevel
  )

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <Card className="p-4 mb-4">
        <SectionHeader title="通知中心" action={
          <div className="flex items-center gap-2">
            <Btn variant="outline" onClick={markAllRead}><Check className="w-4 h-4" /> 全部已读</Btn>
            <Btn variant="outline"><Filter className="w-4 h-4" /> 筛选</Btn>
          </div>
        } />
        <div className="flex items-center gap-3 mt-4">
          <select
            value={filterLevel}
            onChange={e => setFilterLevel(e.target.value)}
            className="px-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">全部级别</option>
            <option value="high">紧急</option>
            <option value="medium">警告</option>
            <option value="info">信息</option>
          </select>
          {unreadCount > 0 && <Badge variant="danger">{unreadCount} 条未读</Badge>}
        </div>
      </Card>

      <div className="space-y-3">
        {filteredNotifs.map(notif => (
          <Card
            key={notif.id}
            className={cn("p-4 cursor-pointer transition-colors", !notif.read && "bg-primary/5")}
            onClick={() => markAsRead(notif.id)}
          >
            <div className="flex items-start gap-3">
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                notif.level === "high" ? "bg-red-500/20 text-red-400" :
                notif.level === "medium" ? "bg-amber-500/20 text-amber-400" :
                "bg-muted text-muted-foreground"
              )}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-foreground">{notif.title}</h3>
                  {notif.level === "high" && <Badge variant="danger">紧急</Badge>}
                  {notif.level === "medium" && <Badge variant="warning">警告</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{notif.content}</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span className="text-[10px] text-muted-foreground font-mono">{notif.time}</span>
                  </div>
                  {notif.action && <Btn variant="ghost" size="xs">查看详情</Btn>}
                </div>
              </div>
              {!notif.read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />}
            </div>
          </Card>
        ))}
      </div>

      {filteredNotifs.length === 0 && (
        <Card className="p-8 text-center">
          <Bell className="w-10 h-10 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground mt-2">暂无通知</p>
        </Card>
      )}
    </div>
  )
}