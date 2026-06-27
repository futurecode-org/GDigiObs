import { useState } from "react"
import {
  LayoutDashboard, Users, Database, Bot, GitBranch, BookOpen, Settings,
  LogOut, Shield, Building2, Network, Key, Lock, Globe, Wrench, BarChart2,
  Tag, Sparkles, Cpu, Zap, ClipboardList, ScrollText, Inbox, Bell,
  ChevronRight, ChevronLeft, Siren
} from "lucide-react"
import { cn } from "@/shared/utils"
import { TopBar } from "@/shared/TopBar"
import type { AdminPage } from "@/shared/types"
import { AdminDashboard } from "@/admin_frontend/pages/Dashboard"
import { TenantManagementPage } from "@/admin_frontend/pages/TenantManagement"
import { OrgStructurePage } from "@/admin_frontend/pages/OrgStructure"
import { UserManagementPage } from "@/admin_frontend/pages/UserManagement"
import { RoleManagementPage } from "@/admin_frontend/pages/RoleManagement"
import { PermissionsPage } from "@/admin_frontend/pages/Permissions"
import { GroupManagementPage } from "@/admin_frontend/pages/GroupManagement"
import { DataCollectionPage } from "@/admin_frontend/pages/DataCollection"
import { DataCleanPage } from "@/admin_frontend/pages/DataClean"
import { DataAnalysisPage } from "@/admin_frontend/pages/DataAnalysis"
import { DataAuditPage } from "@/admin_frontend/pages/DataAudit"
import { ChatAuditPage } from "@/admin_frontend/pages/ChatAudit"
import { SensitiveWordsPage } from "@/admin_frontend/pages/SensitiveWords"
import { ModelManagementPage } from "@/admin_frontend/pages/ModelManagement"
import { AdminSkillsPage } from "@/admin_frontend/pages/Skills"
import { AdminAgentsPage } from "@/admin_frontend/pages/Agents"
import { AdminWorkflowPage } from "@/admin_frontend/pages/Workflow"
import { AdminKnowledgePage } from "@/admin_frontend/pages/Knowledge"
import { AdminQueryPage } from "@/admin_frontend/pages/Query"
import { AdminNotificationsPage } from "@/admin_frontend/pages/Notifications"
import { OpLogsPage } from "@/admin_frontend/pages/OpLogs"
import { AuditLogsPage } from "@/admin_frontend/pages/AuditLogs"
import { NotifySettingsPage } from "@/admin_frontend/pages/NotifySettings"
import { PlatformConfigPage } from "@/admin_frontend/pages/PlatformConfig"

export const adminNavItems = [
  { page: "dashboard" as AdminPage, icon: LayoutDashboard, label: "管理大屏", group: "main" },
  { page: "tenants" as AdminPage, icon: Building2, label: "租户管理", group: "tenant" },
  { page: "org" as AdminPage, icon: Network, label: "组织架构", group: "tenant" },
  { page: "users" as AdminPage, icon: Users, label: "用户管理", group: "user" },
  { page: "roles" as AdminPage, icon: Key, label: "角色管理", group: "user" },
  { page: "permissions" as AdminPage, icon: Lock, label: "权限管理", group: "user" },
  { page: "groups" as AdminPage, icon: Users, label: "群管理", group: "social" },
  { page: "collect" as AdminPage, icon: Globe, label: "数据采集", group: "data" },
  { page: "clean" as AdminPage, icon: Wrench, label: "数据清洗", group: "data" },
  { page: "analysis" as AdminPage, icon: BarChart2, label: "数据分析", group: "data" },
  { page: "data-audit" as AdminPage, icon: Tag, label: "数据审计", group: "data" },
  { page: "query" as AdminPage, icon: Sparkles, label: "系统问数", group: "ai" },
  { page: "models" as AdminPage, icon: Cpu, label: "模型管理", group: "ai" },
  { page: "skills" as AdminPage, icon: Zap, label: "技能管理", group: "ai" },
  { page: "agents" as AdminPage, icon: Bot, label: "数字员工", group: "ai" },
  { page: "workflows" as AdminPage, icon: GitBranch, label: "工作流", group: "ai" },
  { page: "knowledge" as AdminPage, icon: BookOpen, label: "知识库", group: "ai" },
  { page: "chat-audit" as AdminPage, icon: Shield, label: "聊天审计", group: "audit" },
  { page: "sensitive" as AdminPage, icon: Siren, label: "敏感词库", group: "audit" },
  { page: "op-logs" as AdminPage, icon: ScrollText, label: "操作日志", group: "logs" },
  { page: "audit-logs" as AdminPage, icon: ClipboardList, label: "审计日志", group: "logs" },
  { page: "admin-notifications" as AdminPage, icon: Inbox, label: "通知中心", group: "system" },
  { page: "notify-settings" as AdminPage, icon: Bell, label: "通知设置", group: "system" },
  { page: "platform-config" as AdminPage, icon: Settings, label: "平台配置", group: "system" },
]

export const adminGroupLabels: Record<string, string> = {
  main: "工作台", tenant: "租户与组织", user: "用户权限", social: "社交管理",
  data: "数据中心", ai: "AI 能力", audit: "审计风控", logs: "日志中心", system: "系统设置"
}

function AdminSidebar({ page, setPage, collapsed, setCollapsed, onLogout }:
  { page: AdminPage; setPage: (p: AdminPage) => void; collapsed: boolean; setCollapsed: (v: boolean) => void; onLogout: () => void }) {
  const groups = [...new Set(adminNavItems.map(i => i.group))]

  return (
    <aside className={cn(
      "h-full flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-200 flex-shrink-0",
      collapsed ? "w-14" : "w-56"
    )}>
      <div className="h-14 flex items-center px-3 border-b border-sidebar-border gap-3 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
          <Shield className="w-4 h-4 text-amber-400" />
        </div>
        {!collapsed && <span className="text-sm font-semibold text-foreground">管理控制台</span>}
      </div>

      <nav className="flex-1 overflow-y-auto py-2 scrollbar-none">
        {groups.map(g => {
          const items = adminNavItems.filter(i => i.group === g)
          return (
            <div key={g}>
              {!collapsed && (
                <div className="text-[10px] text-muted-foreground/60 uppercase tracking-wider px-3 pt-3 pb-1">
                  {adminGroupLabels[g]}
                </div>
              )}
              {items.map(item => (
                <button
                  key={item.page}
                  onClick={() => setPage(item.page)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-1.5 text-sm transition-colors relative",
                    page === item.page
                      ? "text-foreground bg-sidebar-accent"
                      : "text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent/60",
                  )}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && <span className="flex-1 text-left text-[13px]">{item.label}</span>}
                  {page === item.page && <span className="absolute left-0 top-1 bottom-1 w-0.5 bg-primary rounded-r" />}
                </button>
              ))}
            </div>
          )
        })}
      </nav>

      <div className="p-2 border-t border-sidebar-border space-y-1">
        <button onClick={() => setCollapsed(!collapsed)} className="w-full flex items-center gap-3 px-2 py-2 text-sm text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent/60 rounded transition-colors">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!collapsed && <span>收起</span>}
        </button>
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-2 py-2 text-sm text-sidebar-foreground hover:text-red-400 rounded transition-colors">
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>退出管理端</span>}
        </button>
      </div>
    </aside>
  )
}

export function AdminApp({ onLogout, onSwitchToUser }: { onLogout: () => void; onSwitchToUser: () => void }) {
  const [adminPage, setAdminPage] = useState<AdminPage>("dashboard")
  const [sideCollapsed, setSideCollapsed] = useState(false)

  const renderAdminPage = () => {
    switch (adminPage) {
      case "dashboard": return <AdminDashboard />
      case "users": return <UserManagementPage />
      case "collect": return <DataCollectionPage />
      case "models": return <ModelManagementPage />
      case "chat-audit": return <ChatAuditPage />
      case "query": return <AdminQueryPage />
      case "tenants": return <TenantManagementPage />
      case "org": return <OrgStructurePage />
      case "roles": return <RoleManagementPage />
      case "permissions": return <PermissionsPage />
      case "groups": return <GroupManagementPage />
      case "clean": return <DataCleanPage />
      case "analysis": return <DataAnalysisPage />
      case "data-audit": return <DataAuditPage />
      case "skills": return <AdminSkillsPage />
      case "agents": return <AdminAgentsPage />
      case "workflows": return <AdminWorkflowPage />
      case "knowledge": return <AdminKnowledgePage />
      case "sensitive": return <SensitiveWordsPage />
      case "op-logs": return <OpLogsPage />
      case "audit-logs": return <AuditLogsPage />
      case "notify-settings": return <NotifySettingsPage />
      case "platform-config": return <PlatformConfigPage />
      case "admin-notifications": return <AdminNotificationsPage onNavigate={setAdminPage} />
      default: return <AdminDashboard />
    }
  }

  const navLabel = adminNavItems.find(i => i.page === adminPage)?.label || "管理大屏"

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-background">
      <TopBar
        title={navLabel}
        isAdmin={true}
        onSwitch={onSwitchToUser}
        onNavigate={p => setAdminPage(p as AdminPage)}
        onLogout={onLogout}
      />
      <div className="flex-1 flex overflow-hidden">
        <AdminSidebar
          page={adminPage}
          setPage={setAdminPage}
          collapsed={sideCollapsed}
          setCollapsed={setSideCollapsed}
          onLogout={onLogout}
        />
        <main className="flex-1 overflow-hidden">
          {renderAdminPage()}
        </main>
      </div>
    </div>
  )
}
