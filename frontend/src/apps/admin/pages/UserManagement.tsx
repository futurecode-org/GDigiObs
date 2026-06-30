import { useState, useEffect, useCallback } from "react"
import { Search, Plus, MoreVertical, Loader2, Shield, ShieldCheck, X, Edit, Eye, Ban, UserCheck, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { SectionHeader } from "@/shared/components/SectionHeader"
import { userApi, rbacApi } from "@/lib/api"
import type { User, PaginatedData, Role } from "@/lib/types"
import { cn } from "@/lib/utils"

interface UserFormData {
  username: string
  email: string
  phone: string
  nickname: string
  user_type: string
  status: string
  role_id: number
  password: string
}

const emptyForm: UserFormData = {
  username: "",
  email: "",
  phone: "",
  nickname: "",
  user_type: "internal",
  status: "active",
  role_id: 4,
  password: "",
}

function isActiveStatus(status: string) {
  return status === "active" || status === "normal"
}

function isBannedStatus(status: string) {
  return status === "banned"
}

function isInactiveStatus(status: string) {
  return status === "inactive" || status === "disabled"
}

interface ConfirmState {
  open: boolean
  title: string
  description: string
  onConfirm: () => void
  variant: "default" | "destructive"
}

const emptyConfirm: ConfirmState = {
  open: false,
  title: "",
  description: "",
  onConfirm: () => {},
  variant: "default",
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filterStatus, setFilterStatus] = useState<string>("all")

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState<UserFormData>(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  const [detailOpen, setDetailOpen] = useState(false)
  const [detailUser, setDetailUser] = useState<User | null>(null)

  const [confirm, setConfirm] = useState<ConfirmState>(emptyConfirm)

  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await userApi.getList({ page, page_size: 20 }) as PaginatedData<User>
      setUsers(result.items)
      setTotalPages(result.total_pages)
    } catch (error) {
      console.error("获取用户列表失败:", error)
      setUsers([])
    } finally {
      setIsLoading(false)
    }
  }, [page])

  const [allRoles, setAllRoles] = useState<{id: number; name: string; code: string}[]>([])

  const fetchRoles = useCallback(async () => {
    try {
      const result = await rbacApi.getRoles({ page: 1, page_size: 100 }) as PaginatedData<Role>
      setAllRoles(result.items.map(r => ({ id: r.id, name: r.name, code: r.code })))
    } catch (error) {
      console.error("获取角色列表失败:", error)
      setAllRoles([])
    }
  }, [])

  useEffect(() => {
    fetchUsers()
    fetchRoles()
  }, [fetchUsers, fetchRoles])

  const handleOpenCreate = () => {
    setEditingUser(null)
    setFormData({ ...emptyForm, role_id: allRoles.find(r => r.code === "user")?.id || 4 })
    setDialogOpen(true)
  }

  const handleOpenEdit = (user: User) => {
    setEditingUser(user)
    const roleCode = user.roles?.[0]
    let roleId = 4
    if (roleCode === "super_admin") roleId = 1
    else if (roleCode === "tenant_admin") roleId = 2
    else if (roleCode === "admin") roleId = 3
    else if (roleCode === "external_user") roleId = 5
    else if (roleCode === "user") roleId = 4
    else if (user.is_super_admin) roleId = 1
    else if (user.is_tenant_admin) roleId = 2
    else if (user.user_type === "internal") roleId = 4

    setFormData({
      username: user.username,
      email: user.email || "",
      phone: user.phone || "",
      nickname: user.nickname || "",
      user_type: user.user_type,
      status: user.status === "normal" ? "active" : user.status,
      role_id: roleId,
    })
    setDialogOpen(true)
  }

  const handleOpenDetail = (user: User) => {
    setDetailUser(user)
    setDetailOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.username.trim()) return
    setSubmitting(true)
    try {
      if (editingUser) {
        // 1. 更新基本信息
        await userApi.update(editingUser.id, {
          nickname: formData.nickname,
          email: formData.email,
          phone: formData.phone,
        })
        // 2. 更新角色
        await userApi.assignRoles(editingUser.id, [formData.role_id])
        // 3. 检测并处理状态变更
        const originalStatus = editingUser.status === "normal" ? "active" : editingUser.status
        if (formData.status !== originalStatus) {
          // 前端状态 -> 后端状态映射
          const statusMap: Record<string, string> = {
            active: "normal",
            inactive: "disabled",
            banned: "banned",
            pending: "pending",
          }
          const targetBackendStatus = statusMap[formData.status] || formData.status
          const currentBackendStatus = editingUser.status
          // 根据当前状态和目标状态调用对应的 API
          if (targetBackendStatus === "normal") {
            if (currentBackendStatus === "disabled") {
              await userApi.enable(editingUser.id)
            } else if (currentBackendStatus === "banned") {
              await userApi.unban(editingUser.id)
            }
          } else if (targetBackendStatus === "disabled") {
            await userApi.disable(editingUser.id)
          } else if (targetBackendStatus === "banned") {
            await userApi.ban(editingUser.id)
          } else if (targetBackendStatus === "pending") {
            // pending 状态没有专门的 API，通过 PUT 更新（虽然后端目前忽略 status，但保留逻辑）
            // 如果后端后续支持，这里可以改为直接 PUT
            await userApi.update(editingUser.id, { status: "pending" })
          }
        }
      } else {
        // 创建新用户
        const newUser = await userApi.create({
          username: formData.username,
          password: formData.password,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          nickname: formData.nickname || undefined,
          user_type: formData.user_type,
        })
        // 分配角色
        await userApi.assignRoles(newUser.id, [formData.role_id])
      }
      setDialogOpen(false)
      fetchUsers()
    } catch (error) {
      console.error("保存用户失败:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const showConfirm = (title: string, description: string, onConfirm: () => void, variant: "default" | "destructive" = "default") => {
    setConfirm({ open: true, title, description, onConfirm, variant })
  }

  const handleDelete = (userId: number, username: string) => {
    showConfirm(
      "删除用户",
      `确定要删除用户「${username}」吗？此操作不可恢复。`,
      () => {
        userApi.delete(userId).then(() => fetchUsers()).catch(err => console.error("删除用户失败:", err))
      },
      "destructive"
    )
  }

  const handleDisable = (userId: number) => {
    showConfirm(
      "禁用用户",
      "确定要禁用该用户吗？禁用后用户将无法登录。",
      () => {
        userApi.disable(userId).then(() => fetchUsers()).catch(err => console.error("禁用用户失败:", err))
      }
    )
  }

  const handleEnable = (userId: number) => {
    showConfirm(
      "启用用户",
      "确定要启用该用户吗？",
      () => {
        userApi.enable(userId).then(() => fetchUsers()).catch(err => console.error("启用用户失败:", err))
      }
    )
  }

  const handleBan = (userId: number) => {
    showConfirm(
      "封禁用户",
      "确定要封禁该用户吗？封禁后用户将无法登录。",
      () => {
        userApi.ban(userId).then(() => fetchUsers()).catch(err => console.error("封禁用户失败:", err))
      },
      "destructive"
    )
  }

  const handleUnban = (userId: number) => {
    showConfirm(
      "解封用户",
      "确定要解封该用户吗？",
      () => {
        userApi.unban(userId).then(() => fetchUsers()).catch(err => console.error("解封用户失败:", err))
      }
    )
  }

  const filteredUsers = users.filter(user => {
    const matchSearch = user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.nickname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchStatus = filterStatus === "all" || user.status === filterStatus
    return matchSearch && matchStatus
  })

  const statusLabels: Record<string, string> = {
    normal: "正常",
    active: "正常",
    inactive: "禁用",
    disabled: "禁用",
    pending: "待激活",
    banned: "已封禁",
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "normal":
      case "active": return "bg-emerald-500"
      case "inactive":
      case "disabled": return "bg-gray-500"
      case "pending": return "bg-yellow-500"
      case "banned": return "bg-destructive"
      default: return "bg-gray-500"
    }
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-4">
      <SectionHeader
        title="用户管理"
        subtitle="管理系统中的所有用户账号"
        action={
          <Button size="sm" onClick={handleOpenCreate}>
            <Plus className="w-4 h-4" /> 添加用户
          </Button>
        }
      />

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="搜索用户名、昵称、邮箱或手机号..."
                className="w-full pl-9 pr-3 py-2 bg-muted border border-transparent rounded-lg text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex gap-2">
              {["all", "normal", "inactive", "pending", "banned"].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={cn(
                    "px-3 py-1.5 text-xs rounded-lg transition-colors",
                    filterStatus === status
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {status === "all" ? "全部" : statusLabels[status] || status}
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
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">用户</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">角色</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">租户</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">状态</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">最后登录</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-medium text-primary">
                              {(user.nickname || user.username).charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{user.nickname || user.username}</p>
                            <p className="text-xs text-muted-foreground">{user.email || user.phone || "-"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {user.roles?.map((role, idx) => (
                            <Badge
                              key={idx}
                              variant={role === "super_admin" || role === "admin" ? "default" : "outline"}
                              className="text-[10px]"
                            >
                              {role === "super_admin" ? (
                                <><ShieldCheck className="w-3 h-3 mr-1" /> 超级管理员</>
                              ) : role === "admin" ? (
                                <><Shield className="w-3 h-3 mr-1" /> 管理员</>
                              ) : role}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-foreground">{user.tenant_name || "-"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={cn("w-2 h-2 rounded-full", getStatusColor(user.status))} />
                          <span className="text-sm text-foreground">{statusLabels[user.status] || user.status}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-muted-foreground">
                          {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenDetail(user)}>
                              <Eye className="w-4 h-4 mr-2" /> 查看详情
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenEdit(user)}>
                              <Edit className="w-4 h-4 mr-2" /> 编辑
                            </DropdownMenuItem>
                            {isActiveStatus(user.status) && (
                              <>
                                <DropdownMenuItem onClick={() => handleDisable(user.id)}>
                                  <Ban className="w-4 h-4 mr-2" /> 禁用
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleBan(user.id)} className="text-destructive">
                                  <Ban className="w-4 h-4 mr-2" /> 封禁
                                </DropdownMenuItem>
                              </>
                            )}
                            {isInactiveStatus(user.status) && (
                              <DropdownMenuItem onClick={() => handleEnable(user.id)}>
                                <UserCheck className="w-4 h-4 mr-2" /> 启用
                              </DropdownMenuItem>
                            )}
                            {isBannedStatus(user.status) && (
                              <DropdownMenuItem onClick={() => handleUnban(user.id)}>
                                <UserCheck className="w-4 h-4 mr-2" /> 解封
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleDelete(user.id, user.username)} className="text-destructive">
                              <Trash2 className="w-4 h-4 mr-2" /> 删除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">{searchQuery ? "未找到匹配的用户" : "暂无用户"}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            第 {page} 页，共 {totalPages} 页
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              下一页
            </Button>
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg" onPointerDownOutside={e => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{editingUser ? "编辑用户" : "添加用户"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>用户名 <span className="text-destructive">*</span></Label>
                <Input
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                  placeholder="请输入用户名"
                  disabled={!!editingUser}
                />
              </div>
              <div className="space-y-2">
                <Label>昵称</Label>
                <Input
                  value={formData.nickname}
                  onChange={e => setFormData({ ...formData, nickname: e.target.value })}
                  placeholder="请输入昵称"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>邮箱</Label>
                <Input
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="请输入邮箱"
                />
              </div>
              <div className="space-y-2">
                <Label>手机号</Label>
                <Input
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="请输入手机号"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>用户角色</Label>
                <Select value={String(formData.role_id)} onValueChange={v => setFormData({ ...formData, role_id: parseInt(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {allRoles.map(role => (
                      <SelectItem key={role.id} value={String(role.id)}>{role.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {!editingUser && (
                <div className="space-y-2">
                  <Label>密码 <span className="text-destructive">*</span></Label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    placeholder="请输入密码（至少8位）"
                  />
                </div>
              )}
              {editingUser && (
                <div className="space-y-2">
                  <Label>状态</Label>
                  <Select value={formData.status} onValueChange={v => setFormData({ ...formData, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">正常</SelectItem>
                      <SelectItem value="inactive">禁用</SelectItem>
                      <SelectItem value="banned">封禁</SelectItem>
                      <SelectItem value="pending">待激活</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              <X className="w-4 h-4 mr-1" /> 取消
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || !formData.username.trim() || (!editingUser && !formData.password.trim())}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
              {editingUser ? "保存" : "创建"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>用户详情</DialogTitle>
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
                <div>
                  <span className="text-muted-foreground">状态</span>
                  <p className="mt-1">
                    <Badge variant={isActiveStatus(detailUser.status) ? "default" : "secondary"}>
                      {statusLabels[detailUser.status] || detailUser.status}
                    </Badge>
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">用户类型</span>
                  <p className="mt-1 font-medium">{detailUser.user_type}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">邮箱</span>
                  <p className="mt-1 font-medium">{detailUser.email || "-"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">手机号</span>
                  <p className="mt-1 font-medium">{detailUser.phone || "-"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">租户</span>
                  <p className="mt-1 font-medium">{detailUser.tenant_name || "-"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">部门</span>
                  <p className="mt-1 font-medium">{detailUser.department_name || "-"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">角色</span>
                  <p className="mt-1 flex flex-wrap gap-1">
                    {detailUser.roles?.map((role, idx) => (
                      <Badge key={idx} variant="outline" className="text-[10px]">{role}</Badge>
                    ))}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">最后登录</span>
                  <p className="mt-1 font-medium">
                    {detailUser.last_login_at ? new Date(detailUser.last_login_at).toLocaleString() : "-"}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>关闭</Button>
            {detailUser && (
              <Button onClick={() => { setDetailOpen(false); handleOpenEdit(detailUser); }}>
                <Edit className="w-4 h-4 mr-1" /> 编辑
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm AlertDialog */}
      <AlertDialog open={confirm.open} onOpenChange={open => setConfirm(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirm.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirm(emptyConfirm)}>取消</AlertDialogCancel>
            <AlertDialogAction
              variant={confirm.variant}
              onClick={() => {
                confirm.onConfirm()
                setConfirm(emptyConfirm)
              }}
            >
              确认
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
