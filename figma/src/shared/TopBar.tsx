import { useState, useEffect } from "react"
import { Bell, BarChart2, LogOut, UserCircle, FileText, Download } from "lucide-react"
import { cn } from "@/shared/utils"
import { Badge, Btn } from "@/shared/ui"
import { myNotifications } from "@/shared/mockData"

export function TopBar({ title, isAdmin, onSwitch, onNavigate, onLogout }: {
  title: string
  isAdmin: boolean
  onSwitch: () => void
  onNavigate: (page: string) => void
  onLogout: () => void
}) {
  const [bellOpen,   setBellOpen]   = useState(false)
  const [avatarOpen, setAvatarOpen] = useState(false)

  const recentNotifs = myNotifications.slice(0, 5)
  const unread = recentNotifs.filter(n => !n.read).length

  useEffect(() => {
    if (!bellOpen && !avatarOpen) return
    const close = () => { setBellOpen(false); setAvatarOpen(false) }
    window.addEventListener("click", close)
    return () => window.removeEventListener("click", close)
  }, [bellOpen, avatarOpen])

  return (
    <header className="h-14 border-b border-border bg-background/80 backdrop-blur-sm flex items-center justify-between px-4 flex-shrink-0 relative z-30">
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className="flex items-center gap-3">

        {/* Bell */}
        <div className="relative">
          <button
            onClick={e => { e.stopPropagation(); setBellOpen(v => !v); setAvatarOpen(false) }}
            className="relative w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <Bell style={{ width: 18, height: 18 }} />
            {unread > 0 && (
              <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-primary text-primary-foreground text-[8px] rounded-full flex items-center justify-center font-bold leading-none">
                {unread}
              </span>
            )}
          </button>

          {bellOpen && (
            <div
              onClick={e => e.stopPropagation()}
              className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="text-sm font-semibold">通知</span>
                {unread > 0 && <Badge variant="default">{unread} 条未读</Badge>}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {recentNotifs.map(n => (
                  <button
                    key={n.id}
                    onClick={() => { setBellOpen(false); onNavigate(isAdmin ? "admin-notifications" : "notifications") }}
                    className={cn("w-full flex items-start gap-3 px-4 py-3 border-b border-border/50 hover:bg-muted/30 transition-colors text-left", !n.read && "bg-primary/5")}
                  >
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm",
                      n.type === "friend_request" ? "bg-primary/15 text-primary" :
                      n.type === "group_invite"   ? "bg-cyan-500/15 text-cyan-400" :
                      n.type === "workflow_failed"? "bg-amber-500/15 text-amber-400" :
                      n.type === "agent_done"     ? "bg-purple-500/15 text-purple-400" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {n.from ? n.from[0] : n.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground leading-relaxed">{n.content}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">{n.time}</p>
                    </div>
                    {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5" />}
                  </button>
                ))}
              </div>
              <button
                onClick={() => { setBellOpen(false); onNavigate(isAdmin ? "admin-notifications" : "notifications") }}
                className="w-full py-2.5 text-xs text-primary hover:bg-muted/30 transition-colors font-medium text-center"
              >
                查看全部通知 →
              </button>
            </div>
          )}
        </div>

        {/* Avatar */}
        <div className="relative">
          <button
            onClick={e => { e.stopPropagation(); setAvatarOpen(v => !v); setBellOpen(false) }}
            className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-sm font-semibold text-primary hover:bg-primary/30 transition-colors"
          >
            {isAdmin ? "管" : "张"}
          </button>

          {avatarOpen && (
            <div
              onClick={e => e.stopPropagation()}
              className="absolute right-0 top-full mt-2 w-52 bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
            >
              {/* User info */}
              <div className="px-4 py-3 border-b border-border">
                <div className="text-sm font-semibold text-foreground">{isAdmin ? "超级管理员" : "张伟"}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{isAdmin ? "admin@corp.com" : "zhangwei@corp.com"}</div>
                <Badge variant={isAdmin ? "warning" : "muted"} className="mt-1.5">{isAdmin ? "平台超级管理员" : "普通用户"}</Badge>
              </div>

              {/* Menu items */}
              <div className="py-1">
                {!isAdmin ? (
                  <>
                    <button onClick={() => { setAvatarOpen(false); onNavigate("settings") }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors text-left">
                      <UserCircle className="w-4 h-4" /> 个人设置
                    </button>
                    <button onClick={() => { setAvatarOpen(false); onNavigate("notifications") }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors text-left">
                      <Bell className="w-4 h-4" /> 通知中心
                      {unread > 0 && <span className="ml-auto bg-primary text-primary-foreground text-[9px] px-1.5 py-0.5 rounded-full font-bold">{unread}</span>}
                    </button>
                  </>
                ) : (
                  <button onClick={() => { setAvatarOpen(false); onNavigate("admin-notifications") }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors text-left">
                    <Bell className="w-4 h-4" /> 通知中心
                    {unread > 0 && <span className="ml-auto bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">{unread}</span>}
                  </button>
                )}
                <button
                  onClick={() => { setAvatarOpen(false); onSwitch() }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors text-left"
                >
                  <BarChart2 className="w-4 h-4" />
                  {isAdmin ? "切换至用户端" : "切换至管理端"}
                </button>
              </div>

              <div className="border-t border-border py-1">
                <button
                  onClick={() => { setAvatarOpen(false); onLogout() }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" /> 退出登录
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  )
}
