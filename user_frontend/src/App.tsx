import { useState } from "react"
import type { UserPage } from "@/lib/types"
import { TopBar } from "@/components/shared/TopBar"
import { UserSidebar } from "@/components/layout/UserSidebar"
import { UserDashboard } from "@/components/pages/Dashboard"
import { MessagesPage } from "@/components/pages/Messages"
import { ContactsPage } from "@/components/pages/Contacts"
import { QueryPage } from "@/components/pages/Query"
import { QueryHistoryPage } from "@/components/pages/QueryHistory"
import { KnowledgePage } from "@/components/pages/Knowledge"
import { SkillsPage } from "@/components/pages/Skills"
import { SkillMarketPage } from "@/components/pages/SkillMarket"
import { AgentsPage } from "@/components/pages/Agents"
import { WorkflowPage } from "@/components/pages/Workflow"
import { TasksPage } from "@/components/pages/Tasks"
import { NotificationsPage } from "@/components/pages/Notifications"
import { SettingsPage } from "@/components/pages/Settings"

function App() {
  const [userPage, setUserPage] = useState<UserPage>("dashboard")
  const [sideCollapsed, setSideCollapsed] = useState(false)

  const navLabel = "用户端"

  const renderUserPage = () => {
    switch (userPage) {
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
      default: return <UserDashboard />
    }
  }

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-background">
      <TopBar title={navLabel} isAdmin={false} onSwitch={() => {}} onNavigate={(p) => setUserPage(p as UserPage)} onLogout={() => {}} />
      <div className="flex-1 flex overflow-hidden">
        <UserSidebar page={userPage} setPage={setUserPage} collapsed={sideCollapsed} setCollapsed={setSideCollapsed} onLogout={() => {}} />
        <main className="flex-1 overflow-hidden">{renderUserPage()}</main>
      </div>
    </div>
  )
}

export default App