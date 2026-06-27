import { useState } from "react"
import {
  LayoutDashboard, MessageSquare, Users, Brain, Bot, GitBranch,
  BookOpen, Settings, LogOut, BarChart2, Bell, Sparkles, Zap,
  ClipboardList, ChevronRight, ChevronLeft
} from "lucide-react"
import { cn } from "@/shared/utils"
import { TopBar } from "@/shared/TopBar"
import type { UserPage } from "@/shared/types"
import { Dashboard } from "@/user_frontend/pages/Dashboard"
import { MessagesPage } from "@/user_frontend/pages/Messages"
import { ContactsPage } from "@/user_frontend/pages/Contacts"
import { QueryPage } from "@/user_frontend/pages/Query"
import { KnowledgePage } from "@/user_frontend/pages/Knowledge"
import { SkillsPage } from "@/user_frontend/pages/Skills"
import { AgentsPage } from "@/user_frontend/pages/Agents"
import { WorkflowPage } from "@/user_frontend/pages/Workflow"
import { TasksPage } from "@/user_frontend/pages/Tasks"
import { NotificationsPage } from "@/user_frontend/pages/Notifications"
import { SimpleSettings } from "@/user_frontend/pages/Settings"

export const userNavItems = [
  { page: "dashboard" as UserPage, icon: LayoutDashboard, label: "个人大屏", group: "main" },
  { page: "messages" as UserPage, icon: MessageSquare, label: "消息", group: "social", badge: 4 },
  { page: "contacts" as UserPage, icon: Users, label: "通讯录", group: "social" },
  { page: "query" as UserPage, icon: Sparkles, label: "智能问数", group: "ai" },
  { page: "knowledge" as UserPage, icon: BookOpen, label: "知识库", group: "ai" },
  { page: "skills" as UserPage, icon: Zap, label: "技能", group: "ai" },
  { page: "agents" as UserPage, icon: Bot, label: "数字员工", group: "ai" },
  { page: "workflow" as UserPage, icon: GitBranch, label: "工作流", group: "ai" },
  { page: "tasks" as UserPage, icon: ClipboardList, label: "任务", group: "misc" },
  { page: "notifications" as UserPage, icon: Bell, label: "通知", group: "misc", badge: 2 },
  { page: "settings" as UserPage, icon: Settings, label: "设置", group: "misc" },
]

function UserSidebar({ page, setPage, collapsed, setCollapsed, onLogout }:
  { page: UserPage; setPage: (p: UserPage) => void; collapsed: boolean; setCollapsed: (v: boolean) => void; onLogout: () => void }) {
  return (
    <aside className={cn(
      "h-full flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-200 flex-shrink-0",
      collapsed ? "w-14" : "w-52"
    )}>
      {/* Logo */}
      <div className="h-14 flex items-center px-3 border-b border-sidebar-border gap-3 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/25 flex items-center justify-center flex-shrink-0">
          <BarChart2 className="w-4 h-4 text-primary" />
        </div>
        {!collapsed && <span className="text-sm font-semibold text-foreground truncate">数智瞭望</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 scrollbar-none">
        {userNavItems.map(item => (
          <button
            key={item.page}
            onClick={() => setPage(item.page)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors relative group",
              page === item.page
                ? "text-foreground bg-sidebar-accent"
                : "text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent/60",
            )}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
            {!collapsed && item.badge && (
              <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {item.badge}
              </span>
            )}
            {page === item.page && <span className="absolute left-0 top-1 bottom-1 w-0.5 bg-primary rounded-r" />}
          </button>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-2 border-t border-sidebar-border space-y-1">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center gap-3 px-2 py-2 text-sm text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent/60 rounded transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!collapsed && <span>收起</span>}
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-2 py-2 text-sm text-sidebar-foreground hover:text-red-400 rounded transition-colors"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>退出</span>}
        </button>
      </div>
    </aside>
  )
}

export function UserApp({ onLogout, onSwitchToAdmin }: { onLogout: () => void; onSwitchToAdmin: () => void }) {
  const [userPage, setUserPage] = useState<UserPage>("dashboard")
  const [sideCollapsed, setSideCollapsed] = useState(false)

  const renderPage = () => {
    switch (userPage) {
      case "dashboard": return <Dashboard />
      case "messages": return <MessagesPage />
      case "contacts": return <ContactsPage onStartChat={() => setUserPage("messages")} />
      case "query": return <QueryPage />
      case "knowledge": return <KnowledgePage />
      case "skills": return <SkillsPage />
      case "agents": return <AgentsPage />
      case "workflow": return <WorkflowPage />
      case "tasks": return <TasksPage />
      case "notifications": return <NotificationsPage />
      case "settings": return <SimpleSettings />
      default: return <Dashboard />
    }
  }

  const navLabel = userNavItems.find(i => i.page === userPage)?.label || "首页"

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-background">
      <TopBar
        title={navLabel}
        isAdmin={false}
        onSwitch={onSwitchToAdmin}
        onNavigate={p => setUserPage(p as UserPage)}
        onLogout={onLogout}
      />
      <div className="flex-1 flex overflow-hidden">
        <UserSidebar
          page={userPage}
          setPage={setUserPage}
          collapsed={sideCollapsed}
          setCollapsed={setSideCollapsed}
          onLogout={onLogout}
        />
        <main className="flex-1 overflow-hidden">
          {renderPage()}
        </main>
      </div>
    </div>
  )
}
