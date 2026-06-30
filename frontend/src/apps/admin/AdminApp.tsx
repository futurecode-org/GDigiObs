import { useState } from "react"
import type { AdminPage } from "@/lib/types"
import { TopBar } from "@/shared/components/TopBar"
import { AdminSidebar } from "@/shared/components/AdminSidebar"
import { AdminDashboard } from "./pages/AdminDashboard"
import { TenantManagement, UserManagement, RoleManagement, GroupManagement, DataCollection, DataClean, DataAnalysis, ModelManagement, OpLogs, NotifySettings, PlatformConfig, AdminNotifications } from "./pages/PlaceholderPages"
import { OrgStructure, Permissions, DataAudit, SkillManagement, AgentManagement, WorkflowManagement, KnowledgeManagement, QueryManagement, ChatAudit, AuditLogs } from "./pages/ConnectedAdminPages"
import { SensitiveWords } from "./pages/SensitiveWords"

const pageTitles: Record<AdminPage, string> = {
  dashboard: "工作台",
  tenants: "租户管理",
  org: "组织架构",
  users: "用户管理",
  roles: "角色管理",
  permissions: "权限管理",
  groups: "群组管理",
  collect: "数据采集",
  clean: "数据清洗",
  analysis: "数据分析",
  "data-audit": "数据审计",
  models: "模型管理",
  skills: "技能管理",
  agents: "数字员工",
  workflows: "工作流管理",
  knowledge: "知识库管理",
  query: "智能问数",
  "chat-audit": "聊天审计",
  sensitive: "敏感词库",
  "op-logs": "操作日志",
  "audit-logs": "审计日志",
  "notify-settings": "通知设置",
  "platform-config": "平台配置",
  "admin-notifications": "系统通知",
}

interface AdminAppProps {
  onSwitch?: () => void
}

export function AdminApp({ onSwitch }: AdminAppProps) {
  const [currentPage, setCurrentPage] = useState<AdminPage>("dashboard")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard": return <AdminDashboard />
      case "tenants": return <TenantManagement />
      case "org": return <OrgStructure />
      case "users": return <UserManagement />
      case "roles": return <RoleManagement />
      case "permissions": return <Permissions />
      case "groups": return <GroupManagement />
      case "collect": return <DataCollection />
      case "clean": return <DataClean />
      case "analysis": return <DataAnalysis />
      case "data-audit": return <DataAudit />
      case "models": return <ModelManagement />
      case "skills": return <SkillManagement />
      case "agents": return <AgentManagement />
      case "workflows": return <WorkflowManagement />
      case "knowledge": return <KnowledgeManagement />
      case "query": return <QueryManagement />
      case "chat-audit": return <ChatAudit />
      case "sensitive": return <SensitiveWords />
      case "op-logs": return <OpLogs />
      case "audit-logs": return <AuditLogs />
      case "notify-settings": return <NotifySettings />
      case "platform-config": return <PlatformConfig />
      case "admin-notifications": return <AdminNotifications />
      default: return <div className="p-6 text-muted-foreground">页面开发中</div>
    }
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <TopBar
        title={pageTitles[currentPage]}
        onNotificationClick={() => setCurrentPage("admin-notifications")}
        onSwitch={onSwitch}
        currentMode="admin"
      />
      <div className="flex-1 flex overflow-hidden">
        <AdminSidebar
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
