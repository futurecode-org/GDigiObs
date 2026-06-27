export type AppView = "login" | "register" | "user" | "admin"

export type UserPage =
  | "dashboard" | "messages" | "contacts" | "query" | "query-history"
  | "knowledge" | "skills" | "skill-market" | "agents" | "workflow"
  | "tasks" | "notifications" | "settings"

export type AdminPage =
  | "dashboard" | "tenants" | "org" | "users" | "roles" | "permissions"
  | "groups" | "collect" | "clean" | "analysis" | "data-audit"
  | "chat-audit" | "sensitive" | "models" | "skills" | "agents"
  | "workflows" | "knowledge" | "query" | "op-logs" | "audit-logs"
  | "notify-settings" | "platform-config" | "admin-notifications"
