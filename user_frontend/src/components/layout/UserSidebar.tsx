import { useState } from "react"
import { LayoutDashboard, MessageSquare, Users, Search, History, BookOpen, Wand2, ShoppingBag, Settings, ListTodo, Bell, ChevronRight, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import type { UserPage } from "@/lib/types"

interface NavItem {
  key: UserPage
  label: string
  icon: React.ElementType
}

const navItems: NavItem[] = [
  { key: "dashboard", label: "工作台", icon: LayoutDashboard },
  { key: "messages", label: "消息", icon: MessageSquare },
  { key: "contacts", label: "联系人", icon: Users },
  { key: "query", label: "智能问数", icon: Search },
  { key: "query-history", label: "问数历史", icon: History },
  { key: "knowledge", label: "知识库", icon: BookOpen },
  { key: "skills", label: "我的技能", icon: Wand2 },
  { key: "skill-market", label: "技能市场", icon: ShoppingBag },
  { key: "agents", label: "数字员工", icon: Settings },
  { key: "workflow", label: "工作流", icon: ListTodo },
  { key: "tasks", label: "任务管理", icon: ListTodo },
  { key: "notifications", label: "通知中心", icon: Bell },
  { key: "settings", label: "设置", icon: Settings },
]

export function UserSidebar({ page, setPage, collapsed, setCollapsed, onLogout }: {
  page: UserPage
  setPage: (page: UserPage) => void
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
  onLogout: () => void
}) {
  const [openGroup, setOpenGroup] = useState<string | null>(null)

  const handleMouseEnter = (key: string) => { if (collapsed) setOpenGroup(key) }
  const handleMouseLeave = () => { setOpenGroup(null) }

  return (
    <>
      <aside className={cn("bg-sidebar border-r border-border flex flex-col flex-shrink-0 transition-all duration-300", collapsed ? "w-16" : "w-56")}>
        <div className={cn("h-14 flex items-center border-b border-border", collapsed ? "justify-center" : "px-4")}>
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5 text-primary" />
          </div>
          {!collapsed && <span className="ml-2.5 font-semibold text-sm text-foreground">数智瞭望</span>}
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          <div className="space-y-0.5">
            {navItems.map(item => {
              const Icon = item.icon
              const isActive = page === item.key
              return (
                <button
                  key={item.key}
                  onClick={() => setPage(item.key)}
                  onMouseEnter={() => handleMouseEnter(item.key)}
                  onMouseLeave={handleMouseLeave}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors relative",
                    collapsed ? "justify-center" : "",
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  <Icon className={cn("w-4 h-4 flex-shrink-0", isActive && "text-primary")} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {!collapsed && isActive && <ChevronRight className="w-3 h-3 ml-auto text-primary" />}
                </button>
              )
            })}
          </div>
        </nav>

        <div className="border-t border-border py-3 px-3">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn("w-full flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors", collapsed ? "justify-center" : "")}
          >
            <ChevronRight className={cn("w-4 h-4", collapsed && "rotate-180")} />
            {!collapsed && <span>{collapsed ? "展开" : "收起"}</span>}
          </button>
          <button
            onClick={onLogout}
            className={cn("w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors mt-1", collapsed ? "justify-center" : "")}
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span>退出登录</span>}
          </button>
        </div>
      </aside>

      {collapsed && openGroup && (
        <div className="fixed left-16 top-14 px-3 py-2 bg-card border border-border rounded-lg shadow-xl z-50">
          <span className="text-sm font-medium text-foreground">
            {navItems.find(n => n.key === openGroup)?.label}
          </span>
        </div>
      )}
    </>
  )
}