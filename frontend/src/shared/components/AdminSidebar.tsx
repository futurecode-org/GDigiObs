import {
  LayoutDashboard, Users, Database, Bot, Shield,
  FileText, Bell, ChevronLeft, ChevronRight,
  Building2, Network, UserCog, LayoutGrid, Scissors,
  BarChart3, Search, AlertTriangle, Wrench, Workflow,
  BookOpen, Eye, ScrollText, ClipboardCheck,
  Cog, MessageSquare
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { AdminPage } from "@/lib/types"

interface AdminSidebarProps {
  currentPage: AdminPage
  onNavigate: (page: AdminPage) => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}

const menuGroups = [
  {
    label: "概览",
    items: [
      { key: "dashboard" as AdminPage, label: "工作台", icon: LayoutDashboard },
    ]
  },
  {
    label: "租户与权限",
    items: [
      { key: "tenants" as AdminPage, label: "租户管理", icon: Building2 },
      { key: "org" as AdminPage, label: "组织架构", icon: Network },
      { key: "users" as AdminPage, label: "用户管理", icon: Users },
      { key: "roles" as AdminPage, label: "角色管理", icon: UserCog },
      { key: "permissions" as AdminPage, label: "权限管理", icon: Shield },
      { key: "groups" as AdminPage, label: "群组管理", icon: LayoutGrid },
    ]
  },
  {
    label: "数据中心",
    items: [
      { key: "collect" as AdminPage, label: "数据采集", icon: Database },
      { key: "clean" as AdminPage, label: "数据清洗", icon: Scissors },
      { key: "analysis" as AdminPage, label: "数据分析", icon: BarChart3 },
      { key: "data-audit" as AdminPage, label: "数据审计", icon: ClipboardCheck },
    ]
  },
  {
    label: "AI 能力",
    items: [
      { key: "models" as AdminPage, label: "模型管理", icon: Bot },
      { key: "skills" as AdminPage, label: "技能管理", icon: Wrench },
      { key: "agents" as AdminPage, label: "数字员工", icon: Workflow },
      { key: "workflows" as AdminPage, label: "工作流管理", icon: Workflow },
      { key: "knowledge" as AdminPage, label: "知识库管理", icon: BookOpen },
      { key: "query" as AdminPage, label: "智能问数", icon: Search },
    ]
  },
  {
    label: "审计风控",
    items: [
      { key: "chat-audit" as AdminPage, label: "聊天审计", icon: MessageSquare },
      { key: "sensitive" as AdminPage, label: "敏感词库", icon: AlertTriangle },
    ]
  },
  {
    label: "日志中心",
    items: [
      { key: "op-logs" as AdminPage, label: "操作日志", icon: FileText },
      { key: "audit-logs" as AdminPage, label: "审计日志", icon: ScrollText },
    ]
  },
  {
    label: "系统设置",
    items: [
      { key: "notify-settings" as AdminPage, label: "通知设置", icon: Bell },
      { key: "platform-config" as AdminPage, label: "平台配置", icon: Cog },
      { key: "admin-notifications" as AdminPage, label: "系统通知", icon: Eye },
    ]
  },
]

export function AdminSidebar({ currentPage, onNavigate, collapsed = false, onToggleCollapse }: AdminSidebarProps) {
  return (
    <aside className={cn("h-full bg-card border-r border-border flex flex-col transition-all duration-200", collapsed ? "w-16" : "w-56")}>
      <div className="h-14 flex items-center justify-between px-4 border-b border-border">
        {!collapsed && <span className="text-sm font-semibold text-foreground">管理后台</span>}
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
