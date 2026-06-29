import { useCallback, useEffect, useState } from "react"
import type { ReactNode } from "react"
import { Bell, Bot, BrainCircuit, ClipboardCheck, Cog, Database, FileQuestion, KeyRound, Loader2, MessageSquareWarning, Network, Search, ShieldAlert, Sparkles, Workflow } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SectionHeader } from "@/shared/components/SectionHeader"
import { agentApi, askApi, auditApi, difyApi, knowledgeApi, notificationApi, rbacApi, skillApi, tenantApi, userApi, workflowApi } from "@/lib/api"
import type { Agent, AskRecord, AuditLog, DifyApp, DifyProvider, KnowledgeBase, Notification, PaginatedData, Permission, Skill, Tenant, User, Workflow as WorkflowType } from "@/lib/types"

type Column<T> = {
  key: string
  title: string
  render: (item: T) => ReactNode
  className?: string
}

type ListState<T> = {
  items: T[]
  total: number
  page: number
  totalPages: number
}

const emptyList = <T,>(): ListState<T> => ({ items: [], total: 0, page: 1, totalPages: 1 })

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString() : "-"
}

function asItems<T>(data: PaginatedData<T>): ListState<T> {
  return {
    items: data.items,
    total: data.total,
    page: data.page,
    totalPages: Math.max(data.total_pages || Math.ceil(data.total / Math.max(data.page_size, 1)), 1),
  }
}

function statusBadge(status?: string) {
  const normalized = status || "-"
  const active = ["active", "enabled", "success", "read"].includes(normalized)
  const danger = ["disabled", "failed", "high", "banned"].includes(normalized)
  return (
    <Badge variant={active ? "secondary" : danger ? "destructive" : "outline"} className="text-xs">
      {normalized}
    </Badge>
  )
}

function riskBadge(risk?: string) {
  const variant = risk === "high" || risk === "medium" ? "destructive" : risk === "low" ? "secondary" : "outline"
  return <Badge variant={variant} className="text-xs">{risk || "none"}</Badge>
}

function DataPage<T>({
  title,
  subtitle,
  icon,
  searchPlaceholder,
  columns,
  fetcher,
  filter,
}: {
  title: string
  subtitle?: string
  icon: ReactNode
  searchPlaceholder: string
  columns: Column<T>[]
  fetcher: (page: number) => Promise<PaginatedData<T> | T[]>
  filter?: (item: T, query: string) => boolean
}) {
  const [data, setData] = useState<ListState<T>>(emptyList)
  const [query, setQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(async (page = 1) => {
    setIsLoading(true)
    try {
      const result = await fetcher(page)
      setData(Array.isArray(result) ? { items: result, total: result.length, page: 1, totalPages: 1 } : asItems(result))
    } catch (error) {
      console.error(`${title}加载失败:`, error)
      setData(emptyList<T>())
    } finally {
      setIsLoading(false)
    }
  }, [fetcher, title])

  useEffect(() => {
    void load(1)
  }, [load])

  const visibleItems = query && filter ? data.items.filter(item => filter(item, query.trim().toLowerCase())) : data.items

  return (
    <div className="h-full overflow-y-auto p-6 space-y-4">
      <SectionHeader title={title} subtitle={subtitle} action={<Button variant="outline" size="sm" onClick={() => void load(data.page)}>刷新</Button>} />

      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={event => setQuery(event.target.value)} placeholder={searchPlaceholder} className="pl-9" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="size-8 animate-spin" />
            </div>
          ) : visibleItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <div className="mb-3 flex size-12 items-center justify-center rounded-md bg-muted">{icon}</div>
              <p className="text-sm">暂无数据</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map(column => <TableHead key={column.key} className={column.className}>{column.title}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleItems.map((item, index) => (
                  <TableRow key={index}>
                    {columns.map(column => <TableCell key={column.key} className={column.className}>{column.render(item)}</TableCell>)}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">共 {data.total} 条，第 {data.page} / {data.totalPages} 页</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={data.page <= 1} onClick={() => void load(data.page - 1)}>上一页</Button>
            <Button variant="outline" size="sm" disabled={data.page >= data.totalPages} onClick={() => void load(data.page + 1)}>下一页</Button>
          </div>
        </div>
      )}
    </div>
  )
}

export function OrgStructure() {
  return (
    <DataPage<User>
      title="组织架构"
      subtitle="按后端用户与租户数据展示组织成员"
      icon={<Network className="size-5" />}
      searchPlaceholder="搜索用户、租户、部门..."
      fetcher={page => userApi.getList({ page, page_size: 20 })}
      filter={(user, query) => [user.username, user.nickname, user.tenant_name, user.department_name].some(value => value?.toLowerCase().includes(query))}
      columns={[
        { key: "user", title: "成员", render: user => <div><div className="font-medium">{user.nickname || user.username}</div><div className="text-xs text-muted-foreground">{user.email || user.phone || "-"}</div></div> },
        { key: "tenant", title: "租户", render: user => user.tenant_name || "-" },
        { key: "department", title: "部门", render: user => user.department_name || "-" },
        { key: "roles", title: "角色", render: user => <div className="flex flex-wrap gap-1">{user.roles.map(role => <Badge key={role} variant="outline" className="text-xs">{role}</Badge>)}</div> },
        { key: "status", title: "状态", render: user => statusBadge(user.status) },
      ]}
    />
  )
}

export function Permissions() {
  return (
    <DataPage<Permission>
      title="权限管理"
      subtitle="展示后端 RBAC 权限点"
      icon={<KeyRound className="size-5" />}
      searchPlaceholder="搜索权限名称、编码、模块..."
      fetcher={() => rbacApi.getPermissions()}
      filter={(permission, query) => [permission.name, permission.code, permission.module].some(value => value?.toLowerCase().includes(query))}
      columns={[
        { key: "name", title: "权限名称", render: permission => <span className="font-medium">{permission.name}</span> },
        { key: "code", title: "权限编码", render: permission => <code className="text-xs text-muted-foreground">{permission.code}</code> },
        { key: "module", title: "模块", render: permission => permission.module || "-" },
        { key: "desc", title: "说明", render: permission => permission.description || "-" },
      ]}
    />
  )
}

export function DataAudit() {
  return <AuditLogPage title="数据审计" auditType="data" icon={<ClipboardCheck className="size-5" />} />
}

export function ChatAudit() {
  return <AuditLogPage title="聊天审计" auditType="message" icon={<MessageSquareWarning className="size-5" />} />
}

export function AuditLogs() {
  return <AuditLogPage title="审计日志" icon={<ShieldAlert className="size-5" />} />
}

function AuditLogPage({ title, auditType, icon }: { title: string; auditType?: string; icon: ReactNode }) {
  return (
    <DataPage<AuditLog>
      title={title}
      subtitle="接入 /audit/logs 审计记录"
      icon={icon}
      searchPlaceholder="搜索审计类型、摘要、风险标签..."
      fetcher={page => auditApi.getAuditLogs({ audit_type: auditType, page, page_size: 20 }) as Promise<PaginatedData<AuditLog>>}
      filter={(log, query) => [log.audit_type, log.content_summary, ...(log.risk_tags || [])].some(value => value?.toLowerCase().includes(query))}
      columns={[
        { key: "type", title: "类型", render: log => <Badge variant="outline" className="text-xs">{log.audit_type}</Badge> },
        { key: "risk", title: "风险", render: log => riskBadge(log.risk_level) },
        { key: "summary", title: "摘要", render: log => <span className="line-clamp-1 whitespace-normal">{log.content_summary || "-"}</span> },
        { key: "tags", title: "标签", render: log => <div className="flex flex-wrap gap-1">{(log.risk_tags || []).map(tag => <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>)}</div> },
        { key: "created", title: "时间", render: log => formatDate(log.created_at) },
      ]}
    />
  )
}

export function SkillManagement() {
  return (
    <DataPage<Skill>
      title="技能管理"
      icon={<Sparkles className="size-5" />}
      searchPlaceholder="搜索技能名称、类型..."
      fetcher={page => skillApi.getList({ page, page_size: 20 })}
      filter={(skill, query) => [skill.name, skill.type, skill.description].some(value => value?.toLowerCase().includes(query))}
      columns={[
        { key: "name", title: "技能", render: skill => <div><div className="font-medium">{skill.name}</div><div className="text-xs text-muted-foreground line-clamp-1 whitespace-normal">{skill.description || "-"}</div></div> },
        { key: "type", title: "类型", render: skill => <Badge variant="outline" className="text-xs">{skill.type}</Badge> },
        { key: "visibility", title: "可见性", render: skill => skill.visibility },
        { key: "status", title: "状态", render: skill => statusBadge(skill.status) },
        { key: "created", title: "创建时间", render: skill => formatDate(skill.created_at) },
      ]}
    />
  )
}

export function AgentManagement() {
  return (
    <DataPage<Agent>
      title="数字员工"
      icon={<Bot className="size-5" />}
      searchPlaceholder="搜索数字员工名称、角色描述..."
      fetcher={page => agentApi.getList({ page, page_size: 20 })}
      filter={(agent, query) => [agent.name, agent.role_description, agent.system_prompt].some(value => value?.toLowerCase().includes(query))}
      columns={[
        { key: "name", title: "名称", render: agent => <span className="font-medium">{agent.name}</span> },
        { key: "role", title: "角色描述", render: agent => <span className="line-clamp-1 whitespace-normal">{agent.role_description || "-"}</span> },
        { key: "assets", title: "关联资源", render: agent => `${agent.skill_ids.length} 技能 / ${agent.knowledge_base_ids.length} 知识库 / ${agent.workflow_ids.length} 工作流` },
        { key: "status", title: "状态", render: agent => statusBadge(agent.status) },
        { key: "created", title: "创建时间", render: agent => formatDate(agent.created_at) },
      ]}
    />
  )
}

export function WorkflowManagement() {
  return (
    <DataPage<WorkflowType>
      title="工作流管理"
      icon={<Workflow className="size-5" />}
      searchPlaceholder="搜索工作流名称、触发类型..."
      fetcher={page => workflowApi.getList({ page, page_size: 20 })}
      filter={(workflow, query) => [workflow.name, workflow.description, workflow.trigger_type].some(value => value?.toLowerCase().includes(query))}
      columns={[
        { key: "name", title: "工作流", render: workflow => <span className="font-medium">{workflow.name}</span> },
        { key: "trigger", title: "触发方式", render: workflow => workflow.trigger_type },
        { key: "graph", title: "节点/连线", render: workflow => `${workflow.nodes.length} / ${workflow.edges.length}` },
        { key: "status", title: "状态", render: workflow => statusBadge(workflow.status) },
        { key: "created", title: "创建时间", render: workflow => formatDate(workflow.created_at) },
      ]}
    />
  )
}

export function KnowledgeManagement() {
  return (
    <DataPage<KnowledgeBase>
      title="知识库管理"
      icon={<Database className="size-5" />}
      searchPlaceholder="搜索知识库名称、类型..."
      fetcher={page => knowledgeApi.getList({ page, page_size: 20 })}
      filter={(kb, query) => [kb.name, kb.type, kb.description].some(value => value?.toLowerCase().includes(query))}
      columns={[
        { key: "name", title: "知识库", render: kb => <span className="font-medium">{kb.name}</span> },
        { key: "type", title: "类型", render: kb => <Badge variant="outline" className="text-xs">{kb.type}</Badge> },
        { key: "files", title: "文件/分片", render: kb => `${kb.file_count} / ${kb.chunk_count}` },
        { key: "status", title: "状态", render: kb => statusBadge(kb.status) },
        { key: "created", title: "创建时间", render: kb => formatDate(kb.created_at) },
      ]}
    />
  )
}

export function QueryManagement() {
  return (
    <DataPage<AskRecord>
      title="智能问数"
      icon={<FileQuestion className="size-5" />}
      searchPlaceholder="搜索问题、答案、数据源..."
      fetcher={page => askApi.getList({ page, page_size: 20 })}
      filter={(record, query) => [record.question, record.answer, record.data_source].some(value => value?.toLowerCase().includes(query))}
      columns={[
        { key: "question", title: "问题", render: record => <span className="line-clamp-1 whitespace-normal font-medium">{record.question}</span> },
        { key: "answer", title: "回答", render: record => <span className="line-clamp-1 whitespace-normal">{record.answer || "-"}</span> },
        { key: "source", title: "数据源", render: record => record.data_source || "-" },
        { key: "saved", title: "收藏", render: record => record.is_saved ? "是" : "否" },
        { key: "created", title: "创建时间", render: record => formatDate(record.created_at) },
      ]}
    />
  )
}

export function AdminNotifications() {
  return (
    <DataPage<Notification>
      title="系统通知"
      icon={<Bell className="size-5" />}
      searchPlaceholder="搜索通知标题、内容..."
      fetcher={page => notificationApi.getList({ page, page_size: 20 })}
      filter={(notice, query) => [notice.title, notice.content, notice.type].some(value => value?.toLowerCase().includes(query))}
      columns={[
        { key: "title", title: "标题", render: notice => <span className="font-medium">{notice.title}</span> },
        { key: "type", title: "类型", render: notice => <Badge variant="outline" className="text-xs">{notice.type}</Badge> },
        { key: "content", title: "内容", render: notice => <span className="line-clamp-1 whitespace-normal">{notice.content || "-"}</span> },
        { key: "read", title: "状态", render: notice => statusBadge(notice.read ? "read" : "unread") },
        { key: "created", title: "创建时间", render: notice => formatDate(notice.created_at) },
      ]}
    />
  )
}

export function PlatformConfig() {
  type ConfigRow = DifyProvider | DifyApp | Tenant

  const fetcher = async () => {
    const [providers, apps, tenants] = await Promise.all([
      difyApi.getProviders({ page: 1, page_size: 50 }),
      difyApi.getApps({ page: 1, page_size: 50 }),
      tenantApi.getList({ page: 1, page_size: 50 }),
    ])
    return [...providers.items, ...apps.items, ...tenants.items] as ConfigRow[]
  }

  return (
    <DataPage<ConfigRow>
      title="平台配置"
      subtitle="展示租户与 Dify 平台集成配置"
      icon={<Cog className="size-5" />}
      searchPlaceholder="搜索配置名称、类型、地址..."
      fetcher={fetcher}
      filter={(row, query) => {
        const values = "base_url" in row ? [row.name, row.base_url, row.status] : [row.name, "tenant_type" in row ? row.tenant_type : row.app_type, row.status]
        return values.some(value => value?.toLowerCase().includes(query))
      }}
      columns={[
        { key: "name", title: "名称", render: row => <span className="font-medium">{row.name}</span> },
        { key: "kind", title: "类型", render: row => "base_url" in row ? "Dify Provider" : "api_endpoint" in row ? "Dify App" : "Tenant" },
        { key: "value", title: "配置", render: row => "base_url" in row ? row.base_url : "api_endpoint" in row ? row.api_endpoint : row.tenant_type },
        { key: "status", title: "状态", render: row => statusBadge(row.status) },
        { key: "created", title: "创建时间", render: row => formatDate(row.created_at) },
      ]}
    />
  )
}

export function NotifySettings() {
  return <AdminNotifications />
}

export function SensitiveWords() {
  return <AuditLogPage title="敏感词库" auditType="message" icon={<BrainCircuit className="size-5" />} />
}
