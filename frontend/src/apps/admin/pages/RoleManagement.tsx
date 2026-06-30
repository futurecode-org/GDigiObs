import { useState, useEffect, useCallback } from "react"
import { Search, Plus, Shield, Lock, ChevronLeft, ChevronRight, MoreVertical, Trash2, Edit, Eye, Loader2, X, Check } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { SectionHeader } from "@/shared/components/SectionHeader"
import { rbacApi } from "@/lib/api"
import type { Role, Permission, PaginatedData } from "@/lib/types"

interface RoleFormData {
  name: string
  code: string
  description: string
  permission_ids: number[]
}

const emptyForm: RoleFormData = {
  name: "",
  code: "",
  description: "",
  permission_ids: [],
}

export function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [allPermissions, setAllPermissions] = useState<Permission[]>([])

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [formData, setFormData] = useState<RoleFormData>(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  const [permDialogOpen, setPermDialogOpen] = useState(false)
  const [permRole, setPermRole] = useState<Role | null>(null)
  const [selectedPerms, setSelectedPerms] = useState<number[]>([])
  const [permSubmitting, setPermSubmitting] = useState(false)

  const [detailOpen, setDetailOpen] = useState(false)
  const [detailRole, setDetailRole] = useState<Role | null>(null)

  const normalizeRole = (role: Role) => ({
    ...role,
    permissions: Array.isArray(role.permissions) ? role.permissions : [],
  })

  const fetchRoles = useCallback(async () => {
    setIsLoading(true)
    try {
      const [rolesResult, perms] = await Promise.all([
        rbacApi.getRoles({ page, page_size: 20 }) as Promise<PaginatedData<Role>>,
        rbacApi.getPermissions(),
      ])
      setRoles(Array.isArray(rolesResult.items) ? rolesResult.items.map(normalizeRole) : [])
      setTotalPages(rolesResult.total_pages)
      setAllPermissions(perms)
    } catch (error) {
      console.error("获取角色列表失败:", error)
      setRoles([])
    } finally {
      setIsLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchRoles()
  }, [fetchRoles])

  const handleOpenCreate = () => {
    setEditingRole(null)
    setFormData(emptyForm)
    setDialogOpen(true)
  }

  const handleOpenEdit = (role: Role) => {
    setEditingRole(role)
    const rolePerms = Array.isArray(role.permissions) ? role.permissions : []
    setFormData({
      name: role.name,
      code: role.code,
      description: role.description || "",
      permission_ids: rolePerms.map(p => p.id),
    })
    setDialogOpen(true)
  }

  const handleOpenDetail = (role: Role) => {
    setDetailRole(role)
    setDetailOpen(true)
  }

  const handleOpenPermissions = (role: Role) => {
    setPermRole(role)
    const rolePerms = Array.isArray(role.permissions) ? role.permissions : []
    setSelectedPerms(rolePerms.map(p => p.id))
    setPermDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.code.trim()) return
    setSubmitting(true)
    try {
      if (editingRole) {
        await rbacApi.updateRole(editingRole.id, formData)
        if (formData.permission_ids.length > 0) {
          await rbacApi.assignPermissions(editingRole.id, formData.permission_ids)
        }
      } else {
        const newRole = await rbacApi.createRole(formData)
        if (formData.permission_ids.length > 0 && newRole?.id) {
          await rbacApi.assignPermissions(newRole.id, formData.permission_ids)
        }
      }
      setDialogOpen(false)
      fetchRoles()
    } catch (error) {
      console.error("保存角色失败:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSavePermissions = async () => {
    if (!permRole) return
    setPermSubmitting(true)
    try {
      await rbacApi.assignPermissions(permRole.id, selectedPerms)
      setPermDialogOpen(false)
      fetchRoles()
    } catch (error) {
      console.error("保存权限失败:", error)
    } finally {
      setPermSubmitting(false)
    }
  }

  const handleDelete = async (role: Role) => {
    if (!confirm(`确定要删除角色「${role.name}」吗？`)) return
    // 后端暂无删除API，预留
  }

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getPermissionNames = (rolePermissions: Permission[]) => {
    return rolePermissions.map(p => p.name).slice(0, 3).join(", ")
  }

  const permissionsByModule = allPermissions.reduce((acc, perm) => {
    const module = perm.module || "其他"
    if (!acc[module]) acc[module] = []
    acc[module].push(perm)
    return acc
  }, {} as Record<string, Permission[]>)

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <SectionHeader
          title="角色管理"
          action={
            <Button size="sm" onClick={handleOpenCreate}>
              <Plus className="w-4 h-4" /> 创建角色
            </Button>
          }
        />
        <div className="flex gap-3 mt-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="搜索角色名称、编码..."
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : filteredRoles.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <div className="text-center">
                  <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>暂无角色数据</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">角色名称</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">角色编码</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">类型</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">权限数量</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">权限列表</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">描述</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">创建时间</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRoles.map(role => {
                      const rolePermissions = Array.isArray(role.permissions) ? role.permissions : []

                      return (
                        <tr key={role.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <Shield className="w-4 h-4 text-primary" />
                              </div>
                              <span className="text-sm font-medium text-foreground">{role.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground font-mono">{role.code}</td>
                          <td className="py-3 px-4">
                            <Badge variant="secondary" className="text-xs">
                              {role.is_system ? (
                                <span className="flex items-center gap-1">
                                  <Lock className="w-3 h-3" /> 系统内置
                                </span>
                              ) : (
                                "自定义"
                              )}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-foreground">{rolePermissions.length}</td>
                          <td className="py-3 px-4 text-xs text-muted-foreground">
                            {getPermissionNames(rolePermissions)}
                            {rolePermissions.length > 3 && ` 等${rolePermissions.length}项`}
                          </td>
                          <td className="py-3 px-4 text-sm text-foreground max-w-[200px] truncate">{role.description || "-"}</td>
                          <td className="py-3 px-4 text-xs text-muted-foreground">{role.created_at}</td>
                          <td className="py-3 px-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleOpenDetail(role)}>
                                  <Eye className="w-4 h-4 mr-2" /> 查看详情
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleOpenEdit(role)}>
                                  <Edit className="w-4 h-4 mr-2" /> 编辑
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleOpenPermissions(role)}>
                                  <Shield className="w-4 h-4 mr-2" /> 分配权限
                                </DropdownMenuItem>
                                {!role.is_system && (
                                  <DropdownMenuItem onClick={() => handleDelete(role)} className="text-destructive">
                                    <Trash2 className="w-4 h-4 mr-2" /> 删除
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      )
                    })}
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg" onPointerDownOutside={e => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{editingRole ? "编辑角色" : "创建角色"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>角色名称 <span className="text-destructive">*</span></Label>
                <Input
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入角色名称"
                />
              </div>
              <div className="space-y-2">
                <Label>角色编码 <span className="text-destructive">*</span></Label>
                <Input
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value })}
                  placeholder="请输入角色编码"
                  disabled={!!editingRole?.is_system}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>描述</Label>
              <Textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="请输入角色描述"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>权限分配</Label>
              <div className="border rounded-lg p-3 max-h-60 overflow-y-auto space-y-3">
                {Object.entries(permissionsByModule).map(([module, perms]) => (
                  <div key={module}>
                    <p className="text-xs font-medium text-muted-foreground mb-2">{module}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {perms.map(perm => (
                        <label key={perm.id} className="flex items-center gap-2 text-sm cursor-pointer">
                          <Checkbox
                            checked={formData.permission_ids.includes(perm.id)}
                            onCheckedChange={(checked) => {
                              setFormData(prev => ({
                                ...prev,
                                permission_ids: checked
                                  ? [...prev.permission_ids, perm.id]
                                  : prev.permission_ids.filter(id => id !== perm.id),
                              }))
                            }}
                          />
                          <span className="truncate">{perm.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                {allPermissions.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-2">暂无权限数据</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              <X className="w-4 h-4 mr-1" /> 取消
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || !formData.name.trim() || !formData.code.trim()}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
              {editingRole ? "保存" : "创建"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permission Dialog */}
      <Dialog open={permDialogOpen} onOpenChange={setPermDialogOpen}>
        <DialogContent className="sm:max-w-lg" onPointerDownOutside={e => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>分配权限 - {permRole?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-4 max-h-96 overflow-y-auto space-y-4">
            {Object.entries(permissionsByModule).map(([module, perms]) => (
              <div key={module}>
                <p className="text-xs font-medium text-muted-foreground mb-2">{module}</p>
                <div className="grid grid-cols-2 gap-2">
                  {perms.map(perm => (
                    <label key={perm.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={selectedPerms.includes(perm.id)}
                        onCheckedChange={(checked) => {
                          setSelectedPerms(prev => checked
                            ? [...prev, perm.id]
                            : prev.filter(id => id !== perm.id)
                          )
                        }}
                      />
                      <span className="truncate">{perm.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
            {allPermissions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-2">暂无权限数据</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPermDialogOpen(false)}>
              <X className="w-4 h-4 mr-1" /> 取消
            </Button>
            <Button onClick={handleSavePermissions} disabled={permSubmitting}>
              {permSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />}
              保存权限
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg" onPointerDownOutside={e => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>角色详情</DialogTitle>
          </DialogHeader>
          {detailRole && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-medium">{detailRole.name}</p>
                  <p className="text-sm text-muted-foreground font-mono">{detailRole.code}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">类型</span>
                  <p className="mt-1">
                    <Badge variant="secondary">
                      {detailRole.is_system ? "系统内置" : "自定义"}
                    </Badge>
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">权限数量</span>
                  <p className="mt-1 font-medium">
                    {Array.isArray(detailRole.permissions) ? detailRole.permissions.length : 0} 项
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">描述</span>
                  <p className="mt-1">{detailRole.description || "-"}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">权限列表</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {Array.isArray(detailRole.permissions) && detailRole.permissions.map(perm => (
                      <Badge key={perm.id} variant="outline" className="text-xs">{perm.name}</Badge>
                    ))}
                    {(!Array.isArray(detailRole.permissions) || detailRole.permissions.length === 0) && (
                      <span className="text-muted-foreground">暂无权限</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>关闭</Button>
            {detailRole && (
              <Button onClick={() => { setDetailOpen(false); handleOpenEdit(detailRole); }}>
                <Edit className="w-4 h-4 mr-1" /> 编辑
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
