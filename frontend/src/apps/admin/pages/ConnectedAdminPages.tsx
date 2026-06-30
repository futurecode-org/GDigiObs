import { useCallback, useEffect, useState } from "react"
import type { ReactNode } from "react"
import { Bell, Bot, BrainCircuit, ClipboardCheck, Cog, Database, FileQuestion, KeyRound, Loader2, MessageSquareWarning, Network, Search, ShieldAlert, Sparkles, Workflow, Building2, Users, UserCog, Shield, LayoutGrid, ChevronLeft, ChevronRight, MoreVertical, Eye, Edit, Ban, UserCheck, Trash2, Plus, X, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SectionHeader } from "@/shared/components/SectionHeader"
import { agentApi, askApi, auditApi, difyApi, groupApi, knowledgeApi, notificationApi, rbacApi, skillApi, tenantApi, userApi, workflowApi } from "@/lib/api"
import type { Agent, AskRecord, AuditLog, DifyApp, DifyProvider, Group, KnowledgeBase, Notification, PaginatedData, Permission, Role, Skill, Tenant, User, Workflow as WorkflowType } from "@/lib/types"
import { cn } from "@/lib/utils"

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

/* ==================== 组织架构 ==================== */

export function OrgStructure() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [tenantFilter, setTenantFilter] = useState<string>("all")
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailUser, setDetailUser] = useState<User | null>(null)

  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await userApi.getList({ page, page_size: 20 }) as PaginatedData<User>
      setUsers(result.items)
      setTotalPages(result.total_pages)
    } catch (error) {
      console.error("获取组织架构失败:", error)
      setUsers([])
    } finally {
      setIsLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const tenantNames = Array.from(new Set(users.map(u => u.tenant_name).filter(Boolean) as string[]))

  const filteredUsers = users.filter(user => {
    const matchSearch = [user.username, user.nickname, user.department_name, user.email].some(v => v?.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchTenant = tenantFilter === "all" || user.tenant_name === tenantFilter
    return matchSearch && matchTenant
  })

  const handleOpenDetail = (user: User) => {
    setDetailUser(user)
    setDetailOpen(true)
  }

  const statusLabels: Record<string, string> = { active: "正常", inactive: "禁用", pending: "待激活", banned: "已封禁" }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-4">
      <SectionHeader title="组织架构" subtitle="按后端用户与租户数据展示组织成员" />

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="搜索用户、租户、部门..."
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setTenantFilter("all")}
                className={cn(
                  "px-3 py-1.5 text-xs rounded-lg transition-colors",
                  tenantFilter === "all" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                全部租户
              </button>
              {tenantNames.map(tenant => (
                <button
                  key={tenant}
                  onClick={() => setTenantFilter(tenant)}
                  className={cn(
                    "px-3 py-1.5 text-xs rounded-lg transition-colors",
                    tenantFilter === tenant ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {tenant}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <div className="mb-3 flex size-12 items-center justify-center rounded-md bg-muted">
                <Network className="size-5" />
              </div>
              <p className="text-sm">暂无数据</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-left">成员</TableHead>
                  <TableHead className="text-left">租户</TableHead>
                  <TableHead className="text-left">部门</TableHead>
                  <TableHead className="text-left">角色</TableHead>
                  <TableHead className="text-left">状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map(user => (
                  <TableRow key={user.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-medium text-primary">
                            {(user.nickname || user.username).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{user.nickname || user.username}</p>
                          <p className="text-xs text-muted-foreground">{user.email || user.phone || "-"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.tenant_name || "-"}</TableCell>
                    <TableCell>{user.department_name || "-"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.roles?.map(role => (
                          <Badge key={role} variant="outline" className="text-xs">{role}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{statusBadge(user.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon-sm" onClick={() => handleOpenDetail(user)}>
                        <Eye className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">共 {totalPages} 页，当前第 {page} 页</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>上一页</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>下一页</Button>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>成员详情</DialogTitle>
          </DialogHeader>
          {detailUser && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-lg font-medium text-primary">
                    {(detailUser.nickname || detailUser.username).charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-lg font-medium">{detailUser.nickname || detailUser.username}</p>
                  <p className="text-sm text-muted-foreground">@{detailUser.username}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">状态</span><p className="mt-1">{statusBadge(detailUser.status)}</p></div>
                <div><span className="text-muted-foreground">租户</span><p className="mt-1 font-medium">{detailUser.tenant_name || "-"}</p></div>
                <div><span className="text-muted-foreground">部门</span><p className="mt-1 font-medium">{detailUser.department_name || "-"}</p></div>
                <div><span className="text-muted-foreground">邮箱</span><p className="mt-1 font-medium">{detailUser.email || "-"}</p></div>
                <div><span className="text-muted-foreground">手机号</span><p className="mt-1 font-medium">{detailUser.phone || "-"}</p></div>
                <div><span className="text-muted-foreground">最后登录</span><p className="mt-1 font-medium">{detailUser.last_login_at ? new Date(detailUser.last_login_at).toLocaleString() : "-"}</p></div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">角色</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {detailUser.roles.map(role => (
                      <Badge key={role} variant="outline" className="text-xs">{role}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ==================== 权限管理 ==================== */

export function Permissions() {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [moduleFilter, setModuleFilter] = useState<string>("all")

  useEffect(() => {
    setIsLoading(true)
    rbacApi.getPermissions()
      .then(data => setPermissions(data))
      .catch(err => { console.error("获取权限列表失败:", err); setPermissions([]) })
      .finally(() => setIsLoading(false))
  }, [])

  const modules = Array.from(new Set(permissions.map(p => p.module).filter(Boolean) as string[]))

  const filteredPermissions = permissions.filter(permission => {
    const matchSearch = [permission.name, permission.code, permission.description].some(v => v?.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchModule = moduleFilter === "all" || permission.module === moduleFilter
    return matchSearch && matchModule
  })

  const permissionsByModule = filteredPermissions.reduce((acc, perm) => {
    const module = perm.module || "其他"
    if (!acc[module]) acc[module] = []
    acc[module].push(perm)
    return acc
  }, {} as Record<string, Permission[]>)

  return (
    <div className="h-full overflow-y-auto p-6 space-y-4">
      <SectionHeader title="权限管理" subtitle="展示后端 RBAC 权限点" />

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="搜索权限名称、编码、模块..."
                className="pl-9"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setModuleFilter("all")}
                className={cn(
                  "px-3 py-1.5 text-xs rounded-lg transition-colors",
                  moduleFilter === "all" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                全部模块
              </button>
              {modules.map(module => (
                <button
                  key={module}
                  onClick={() => setModuleFilter(module)}
                  className={cn(
                    "px-3 py-1.5 text-xs rounded-lg transition-colors",
                    moduleFilter === module ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {module}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredPermissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <div className="mb-3 flex size-12 items-center justify-center rounded-md bg-muted">
                <KeyRound className="size-5" />
              </div>
              <p className="text-sm">暂无权限数据</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">权限名称</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">权限编码</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">模块</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">说明</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPermissions.map(permission => (
                    <tr key={permission.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <span className="font-medium text-sm">{permission.name}</span>
                      </td>
                      <td className="py-3 px-4">
                        <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{permission.code}</code>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-xs">{permission.module || "-"}</Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{permission.description || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 统计卡片 */}
      {!isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">权限总数</p>
              <p className="text-2xl font-semibold mt-1">{permissions.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">模块数</p>
              <p className="text-2xl font-semibold mt-1">{modules.length}</p>
            </CardContent>
          </Card>
          {modules.slice(0, 2).map(module => {
            const count = permissions.filter(p => p.module === module).length
            return (
              <Card key={module}>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{module}</p>
                  <p className="text-2xl font-semibold mt-1">{count}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ==================== 群组管理 ==================== */

export function GroupManagement() {
  const [groups, setGroups] = useState<Group[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [formData, setFormData] = useState({ name: "", description: "", max_members: 200 })
  const [submitting, setSubmitting] = useState(false)

  const [detailOpen, setDetailOpen] = useState(false)
  const [detailGroup, setDetailGroup] = useState<Group | null>(null)

  const fetchGroups = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await groupApi.getList() as Group[]
      setGroups(result)
      setTotalPages(1)
    } catch (error) {
      console.error("获取群组列表失败:", error)
      setGroups([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

  const handleOpenCreate = () => {
    setEditingGroup(null)
    setFormData({ name: "", description: "", max_members: 200 })
    setDialogOpen(true)
  }

  const handleOpenEdit = (group: Group) => {
    setEditingGroup(group)
    setFormData({ name: group.name, description: group.description || "", max_members: group.max_members || 200 })
    setDialogOpen(true)
  }

  const handleOpenDetail = (group: Group) => {
    setDetailGroup(group)
    setDetailOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) return
    setSubmitting(true)
    try {
      if (editingGroup) {
        await groupApi.update(editingGroup.id, { name: formData.name, description: formData.description })
      } else {
        await groupApi.create(formData.name, formData.description, formData.max_members)
      }
      setDialogOpen(false)
      fetchGroups()
    } catch (error) {
      console.error("保存群组失败:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDissolve = async (groupId: number, groupName: string) => {
    if (!confirm(`确定要解散群组「${groupName}」吗？解散后所有成员将被移除。`)) return
    try {
      await groupApi.dissolve(groupId)
      fetchGroups()
    } catch (error) {
      console.error("解散群组失败:", error)
    }
  }

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <SectionHeader
          title="群组管理"
          action={
            <Button size="sm" onClick={handleOpenCreate}>
              <Plus className="w-4 h-4" /> 创建群组
            </Button>
          }
        />
        <div className="relative flex-1 max-w-md mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="搜索群组名称、描述..."
            className="w-full pl-9 pr-3 py-2 bg-muted border border-transparent rounded-lg text-sm focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <div className="text-center">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>暂无群组数据</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">群组名称</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">描述</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">成员数</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">群主</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">状态</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">创建时间</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGroups.map(group => (
                      <tr key={group.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                              <LayoutGrid className="w-4 h-4 text-purple-400" />
                            </div>
                            <span className="text-sm font-medium text-foreground">{group.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-muted-foreground truncate max-w-xs block">
                            {group.description || "-"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 text-sm text-foreground">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            {group.member_count}/{group.max_members}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-foreground">
                            {group.members?.find(m => m.role === "owner")?.nickname || group.members?.find(m => m.role === "owner")?.username || "-"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={`text-xs ${group.status === "active" ? "bg-emerald-500/15 text-emerald-400" : "bg-destructive/15 text-destructive"}`}>
                            {group.status === "active" ? "正常" : "已解散"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">
                          {group.created_at ? new Date(group.created_at).toLocaleDateString() : "-"}
                        </td>
                        <td className="py-3 px-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOpenDetail(group)}>
                                <Eye className="w-4 h-4 mr-2" /> 查看详情
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenEdit(group)}>
                                <Edit className="w-4 h-4 mr-2" /> 编辑
                              </DropdownMenuItem>
                              {group.status === "active" && (
                                <DropdownMenuItem onClick={() => handleDissolve(group.id, group.name)} className="text-destructive">
                                  <Trash2 className="w-4 h-4 mr-2" /> 解散群组
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-muted-foreground">共 {totalPages} 页，当前第 {page} 页</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingGroup ? "编辑群组" : "创建群组"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>群组名称 <span className="text-destructive">*</span></Label>
              <Input
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="请输入群组名称"
              />
            </div>
            <div className="space-y-2">
              <Label>描述</Label>
              <Textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="请输入群组描述"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>最大成员数</Label>
              <Input
                type="number"
                value={formData.max_members}
                onChange={e => setFormData({ ...formData, max_members: parseInt(e.target.value) || 200 })}
                placeholder="最大成员数"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              <X className="w-4 h-4 mr-1" /> 取消
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || !formData.name.trim()}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
              {editingGroup ? "保存" : "创建"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>群组详情</DialogTitle>
          </DialogHeader>
          {detailGroup && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <LayoutGrid className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-lg font-medium">{detailGroup.name}</p>
                  <Badge className={`text-xs mt-1 ${detailGroup.status === "active" ? "bg-emerald-500/15 text-emerald-400" : "bg-destructive/15 text-destructive"}`}>
                    {detailGroup.status === "active" ? "正常" : "已解散"}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">描述</span><p className="mt-1 font-medium">{detailGroup.description || "-"}</p></div>
                <div><span className="text-muted-foreground">成员数</span><p className="mt-1 font-medium">{detailGroup.member_count}/{detailGroup.max_members}</p></div>
                <div><span className="text-muted-foreground">群主</span><p className="mt-1 font-medium">{detailGroup.members?.find(m => m.role === "owner")?.nickname || "-"}</p></div>
                <div><span className="text-muted-foreground">创建时间</span><p className="mt-1 font-medium">{detailGroup.created_at ? new Date(detailGroup.created_at).toLocaleString() : "-"}</p></div>
              </div>
              {detailGroup.members && detailGroup.members.length > 0 && (
                <div>
                  <span className="text-muted-foreground text-sm">成员列表</span>
                  <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                    {detailGroup.members.map(member => (
                      <div key={member.id} className="flex items-center justify-between py-1.5 px-2 bg-muted rounded">
                        <span className="text-sm">{member.nickname || member.username}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {member.role === "owner" ? "群主" : member.role === "admin" ? "管理员" : "成员"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>关闭</Button>
            {detailGroup && (
              <Button onClick={() => { setDetailOpen(false); handleOpenEdit(detailGroup); }}>
                <Edit className="w-4 h-4 mr-1" /> 编辑
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ==================== 其他已有页面 ==================== */

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
