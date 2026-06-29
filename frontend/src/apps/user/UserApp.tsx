import { useState } from "react"
import type { UserPage } from "@/lib/types"
import { TopBar } from "@/shared/components/TopBar"
import { UserSidebar } from "@/shared/components/UserSidebar"
import { UserDashboard } from "./pages/UserDashboard"
import { MessagesPage } from "./pages/MessagesPage"
import { ContactsPage } from "./pages/ContactsPage"
import { QueryPage } from "./pages/QueryPage"
import { QueryHistoryPage } from "./pages/QueryHistoryPage"
import { KnowledgePage } from "./pages/KnowledgePage"
import { SkillsPage } from "./pages/SkillsPage"
import { SkillMarketPage } from "./pages/SkillMarketPage"
import { AgentsPage } from "./pages/AgentsPage"
import { WorkflowPage } from "./pages/WorkflowPage"
import { TasksPage } from "./pages/TasksPage"
import { NotificationsPage } from "./pages/NotificationsPage"
import { SettingsPage } from "./pages/SettingsPage"

const pageTitles: Record<UserPage, string> = {
  dashboard: "工作台",
  messages: "消息",
  contacts: "联系人",
  query: "智能问数",
  "query-history": "问数历史",
  knowledge: "知识库",
  skills: "我的技能",
  "skill-market": "技能市场",
  agents: "数字员工",
  workflow: "工作流",
  tasks: "任务中心",
  notifications: "通知中心",
  settings: "设置",
}

interface UserAppProps {
  onSwitch?: () => void
}

export function UserApp({ onSwitch }: UserAppProps) {
  const [currentPage, setCurrentPage] = useState<UserPage>("dashboard")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard": return <UserDashboard />
      case "messages": return <MessagesPage />
      case "contacts": return <ContactsPage />
      case "query": return <QueryPage />
      case "query-history": return <QueryHistoryPage />
      case "knowledge": return <KnowledgePage />
      case "skills": return <SkillsPage />
      case "skill-market": return <SkillMarketPage />
      case "agents": return <AgentsPage />
      case "workflow": return <WorkflowPage />
      case "tasks": return <TasksPage />
      case "notifications": return <NotificationsPage />
      case "settings": return <SettingsPage />
      default: return <div className="p-6 text-muted-foreground">页面开发中</div>
    }
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <TopBar
        title={pageTitles[currentPage]}
        onNotificationClick={() => setCurrentPage("notifications")}
        onSwitch={onSwitch}
        currentMode="user"
      />
      <div className="flex-1 flex overflow-hidden">
        <UserSidebar
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <main className="flex-1 overflow-hidden">
          {renderPage()}
        </main>
      </div>
    </div>
  )
}
