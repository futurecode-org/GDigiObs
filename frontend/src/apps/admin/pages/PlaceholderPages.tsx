import { PlaceholderPage } from "@/shared/components/PlaceholderPage"
import { UserManagement } from "./UserManagement"
import { TenantManagement } from "./TenantManagement"
import { RoleManagement } from "./RoleManagement"
import { DataCollection } from "./DataCollection"
import { ModelManagement } from "./ModelManagement"
import { OpLogs } from "./OpLogs"
import { GroupManagement } from "./GroupManagement"
import { DataClean } from "./DataClean"
import { DataAnalysis } from "./DataAnalysis"

export { PlaceholderPage }

export { UserManagement }

export { TenantManagement }

export { RoleManagement }

export { DataCollection }

export { ModelManagement }

export { OpLogs }

export function OrgStructure() {
  return <PlaceholderPage title="组织架构" />
}

export function Permissions() {
  return <PlaceholderPage title="权限管理" />
}

export { GroupManagement }

export { DataClean }

export { DataAnalysis }

export function DataAudit() {
  return <PlaceholderPage title="数据审计" />
}

export function SkillManagement() {
  return <PlaceholderPage title="技能管理" />
}

export function AgentManagement() {
  return <PlaceholderPage title="数字员工" />
}

export function WorkflowManagement() {
  return <PlaceholderPage title="工作流管理" />
}

export function KnowledgeManagement() {
  return <PlaceholderPage title="知识库管理" />
}

export function QueryManagement() {
  return <PlaceholderPage title="智能问数" />
}

export function ChatAudit() {
  return <PlaceholderPage title="聊天审计" />
}

export function SensitiveWords() {
  return <PlaceholderPage title="敏感词库" />
}

export function AuditLogs() {
  return <PlaceholderPage title="审计日志" />
}

export function NotifySettings() {
  return <PlaceholderPage title="通知设置" />
}

export function PlatformConfig() {
  return <PlaceholderPage title="平台配置" />
}

export function AdminNotifications() {
  return <PlaceholderPage title="系统通知" />
}