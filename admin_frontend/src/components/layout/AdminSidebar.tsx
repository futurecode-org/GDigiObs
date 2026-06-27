import { useState } from "react"
import { LayoutDashboard, Building2, Users, Shield, Users2, Database, Wand2, BarChart3, AlertTriangle, BookOpen, Search, Scroll, Bell, Settings, ChevronRight, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AdminPage } from "@/lib/types"

interface NavItem {
  key: AdminPage
  label: string
  icon: React.ElementType
}

const navItems: NavItem[] = [
  { key: "dashboard", label: "工作台", icon: LayoutDashboard },
  { key: "tenants", label: "租户管理", icon: Building2 },
  { key: "org", label: "组织架构", icon: Users },
  { key: "users", label: "用户管理", icon: Users2 },
  { key: "roles", label: "角色管理", icon: Shield },
  { key: "permissions", label: "权限管理", icon: Shield },
  { key: "groups", label: "群组管理", icon: Users2 },
  { key: "collect", label: "数据采集", icon: Database },
  { key: "clean", label: "数据清洗", icon: Wand2 },
  { key: "analysis", label: "数据分析", icon: BarChart3 },
  { key: "data-audit", label: "数据审计", icon: AlertTriangle },
  { key: "chat-audit", label: "聊天审计", icon: Scroll },
  { key: "sensitive", label: "敏感词库", icon: AlertTriangle },
  { key: "models", label: "模型管理", icon: Settings },
  { key: "skills", label: "技能管理", icon: Wand2 },
  { key: "agents", label: "数字员工", icon: Settings },
  { key: "workflows", label: "工作流管理", icon: Scroll },
  { key: "knowledge", label: "知识库管理", icon: BookOpen },
  { key: "query", label: "查询管理", icon: Search },
  { key: "op-logs", label: "操作日志", icon: Scroll },
  { key: "audit-logs", label: "审计日志", icon: Scroll },
  { key: "notify-settings", label: "通知设置", icon: Bell },
  { key: "platform-config", label: "平台配置", icon: Settings },
  { key: "admin-notifications", label: "通知中心", icon: Bell },
]

export function AdminSidebar({ page, setPage, collapsed, setCollapsed, onLogout }: {
  page: AdminPage
  setPage: (page: AdminPage) => void
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