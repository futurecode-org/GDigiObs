import { useState } from "react"
import { TopBar } from "@/components/shared/TopBar"
import { AdminSidebar } from "@/components/layout/AdminSidebar"
import { AdminDashboard } from "@/components/pages/Dashboard"
import { TenantManagement } from "@/components/pages/TenantManagement"
import { OrgStructure } from "@/components/pages/OrgStructure"
import { UserManagement } from "@/components/pages/UserManagement"
import { RoleManagement } from "@/components/pages/RoleManagement"
import { PermissionsPage } from "@/components/pages/Permissions"
import { GroupManagement } from "@/components/pages/GroupManagement"
import { DataCollection } from "@/components/pages/DataCollection"
import { DataClean } from "@/components/pages/DataClean"
import { DataAnalysis } from "@/components/pages/DataAnalysis"
import { DataAudit } from "@/components/pages/DataAudit"
import { ChatAudit } from "@/components/pages/ChatAudit"
import { SensitiveWords } from "@/components/pages/SensitiveWords"
import { ModelManagement } from "@/components/pages/ModelManagement"
import { SkillManagement } from "@/components/pages/SkillManagement"
import { AgentManagement } from "@/components/pages/AgentManagement"
import { WorkflowManagement } from "@/components/pages/WorkflowManagement"
import { KnowledgeManagement } from "@/components/pages/KnowledgeManagement"
import { QueryManagement } from "@/components/pages/QueryManagement"
import { OpLogs } from "@/components/pages/OpLogs"
import { AuditLogs } from "@/components/pages/AuditLogs"
import { NotifySettings } from "@/components/pages/NotifySettings"
import { PlatformConfig } from "@/components/pages/PlatformConfig"
import { AdminNotifications } from "@/components/pages/AdminNotifications"
import type { AdminPage } from "@/lib/types"

function App() {
  const [adminPage, setAdminPage] = useState<AdminPage>("dashboard")
  const [sideCollapsed, setSideCollapsed] = useState(false)

  const navLabel = "管理端"

  const renderAdminPage = () => {
    switch (adminPage) {
      case "dashboard": return <AdminDashboard />
      case "tenants": return <TenantManagement />
      case "org": return <OrgStructure />
      case "users": return <UserManagement />
      case "roles": return <RoleManagement />
      case "permissions": return <PermissionsPage />
      case "groups": return <GroupManagement />
      case "collect": return <DataCollection />
      case "clean": return <DataClean />
      case "analysis": return <DataAnalysis />
      case "data-audit": return <DataAudit />
      case "chat-audit": return <ChatAudit />
      case "sensitive": return <SensitiveWords />
      case "models": return <ModelManagement />
      case "skills": return <SkillManagement />
      case "agents": return <AgentManagement />
      case "workflows": return <WorkflowManagement />
      case "knowledge": return <KnowledgeManagement />
      case "query": return <QueryManagement />
      case "op-logs": return <OpLogs />
      case "audit-logs": return <AuditLogs />
      case "notify-settings": return <NotifySettings />
      case "platform-config": return <PlatformConfig />
      case "admin-notifications": return <AdminNotifications />
      default: return <AdminDashboard />
    }
  }

  const handleLogout = () => {
    console.log("Admin logout")
  }

  const handleSwitchToUser = () => {
    console.log("Switch to user view")
  }

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-background">
      <TopBar title={navLabel} isAdmin={true} onSwitch={handleSwitchToUser} onNavigate={(p) => setAdminPage(p as AdminPage)} onLogout={handleLogout} />
      <div className="flex-1 flex overflow-hidden">
        <AdminSidebar page={adminPage} setPage={setAdminPage} collapsed={sideCollapsed} setCollapsed={setSideCollapsed} onLogout={handleLogout} />
        <main className="flex-1 overflow-hidden">{renderAdminPage()}</main>
      </div>
    </div>
  )
}

export default App