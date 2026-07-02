import {
  LayoutDashboard, MessageSquare, Users, Search, History,
  BookOpen, Wand2, Store, Bot, Workflow, ListChecks,
  Bell, Settings, ChevronLeft, ChevronRight, Globe,
  Monitor, Brain
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { UserPage } from "@/lib/types"

interface UserSidebarProps {
  currentPage: UserPage
  onNavigate: (page: UserPage) => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}

const menuGroups = [
  {
    label: "工作台",
    items: [
      { key: "dashboard" as UserPage, label: "工作台", icon: LayoutDashboard },
      { key: "big-screen" as UserPage, label: "数智大屏", icon: Monitor },
      { key: "public-opinion" as UserPage, label: "智能舆情", icon: Brain },
    ]
  },
  {
    label: "沟通",
    items: [
      { key: "messages" as UserPage, label: "消息", icon: MessageSquare },
      { key: "contacts" as UserPage, label: "联系人", icon: Users },
    ]
  },
  {
    label: "AI 能力",
    items: [
      { key: "query" as UserPage, label: "智能问数", icon: Search },
      { key: "query-history" as UserPage, label: "问数历史", icon: History },
      { key: "knowledge" as UserPage, label: "知识库", icon: BookOpen },
      { key: "dify-providers" as UserPage, label: "Dify Provider", icon: Globe },
      { key: "skills" as UserPage, label: "我的技能", icon: Wand2 },
      { key: "skill-market" as UserPage, label: "技能市场", icon: Store },
    ]
  },
  {
    label: "自动化",
    items: [
      { key: "agents" as UserPage, label: "数字员工", icon: Bot },
      { key: "workflow" as UserPage, label: "工作流", icon: Workflow },
      { key: "tasks" as UserPage, label: "任务中心", icon: ListChecks },
    ]
  },
  {
    label: "个人",
    items: [
      { key: "notifications" as UserPage, label: "通知中心", icon: Bell },
      { key: "settings" as UserPage, label: "设置", icon: Settings },
    ]
  },
]

export function UserSidebar({ currentPage, onNavigate, collapsed = false, onToggleCollapse }: UserSidebarProps) {
  return (
    <aside className={cn("h-full bg-card border-r border-border flex flex-col transition-all duration-200", collapsed ? "w-16" : "w-56")}>
      <div className="h-14 flex items-center justify-between px-4 border-b border-border">
        {!collapsed && <span className="text-sm font-semibold text-foreground">数智瞭望</span>}
        <button
          onClick={onToggleCollapse}
          className="p-1 rounded hover:bg-muted transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {menuGroups.map((group, gi) => (
          <div key={gi} className="mb-4">
            {!collapsed && (
              <div className="px-2 mb-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                {group.label}
              </div>
            )}
            {group.items.map(item => (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-2 rounded-lg mb-0.5 text-sm transition-colors",
                  currentPage === item.key
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </button>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  )
}
