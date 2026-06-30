import { useState, useEffect, useCallback } from "react"
import { Search, Plus, Building2, Users, Mail, Phone, ChevronLeft, ChevronRight, MoreVertical, Trash2, Edit, Eye, Loader2, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { SectionHeader } from "@/shared/components/SectionHeader"
import { tenantApi } from "@/lib/api"
import type { Tenant, PaginatedData } from "@/lib/types"

interface TenantFormData {
  name: string
  tenant_type: string
  description: string
  contact_name: string
  contact_email: string
  contact_phone: string
}

const emptyForm: TenantFormData = {
  name: "",
  tenant_type: "enterprise",
  description: "",
  contact_name: "",
  contact_email: "",
  contact_phone: "",
}

function isActive(status: string) {
  return status === "active" || status === "enabled" || status === "normal"
}

export function TenantManagement() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null)
  const [formData, setFormData] = useState<TenantFormData>(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  const [detailOpen, setDetailOpen] = useState(false)
  const [detailTenant, setDetailTenant] = useState<Tenant | null>(null)

  const fetchTenants = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await tenantApi.getList({ page, page_size: 20 }) as PaginatedData<Tenant>
      setTenants(result.items)
      setTotalPages(result.total_pages)
    } catch (error) {
      console.error("获取租户列表失败:", error)
      setTenants([])
    } finally {
      setIsLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchTenants()
  }, [fetchTenants])

  const handleOpenCreate = () => {
    setEditingTenant(null)
    setFormData(emptyForm)
    setDialogOpen(true)
  }

  const handleOpenEdit = (tenant: Tenant) => {
    setEditingTenant(tenant)
    setFormData({
      name: tenant.name,
      tenant_type: tenant.tenant_type,
      description: tenant.description || "",
      contact_name: tenant.contact_name || "",
      contact_email: tenant.contact_email || "",
      contact_phone: tenant.contact_phone || "",
    })
    setDialogOpen(true)
  }

  const handleOpenDetail = (tenant: Tenant) => {
    setDetailTenant(tenant)
    setDetailOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) return
    setSubmitting(true)
    try {
      if (editingTenant) {
        await tenantApi.update(editingTenant.id, formData)
      } else {
        await tenantApi.create(formData)
      }
      setDialogOpen(false)
      fetchTenants()
    } catch (error) {
      console.error("保存租户失败:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDisable = async (tenantId: number) => {
    if (!confirm("确定要停用该租户吗？停用后租户下所有用户将无法登录。")) return
    try {
      await tenantApi.disable(tenantId)
      fetchTenants()
    } catch (error) {
      console.error("停用租户失败:", error)
    }
  }

  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.contact_email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? isActive(tenant.status) : !isActive(tenant.status))
    return matchesSearch && matchesStatus
  })

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <SectionHeader
          title="租户管理"
          action={
            <Button size="sm" onClick={handleOpenCreate}>
              <Plus className="w-4 h-4" /> 添加租户
            </Button>
          }
        />
        <div className="flex gap-3 mt-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="搜索租户名称、联系人..."
              className="pl-9"
            />
          </div>
          <div className="flex gap-1">
            {["all", "active", "disabled"].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                  statusFilter === status
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground hover:bg-muted/50"
                }`}
              >
                {status === "all" ? "全部" : status === "active" ? "正常" : "已停用"}
              </button>
            ))}
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
            ) : filteredTenants.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <div className="text-center">
                  <Building2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>暂无租户数据</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">租户名称</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">类型</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">联系人</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">联系方式</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">成员数</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">状态</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">创建时间</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTenants.map(tenant => (
                      <tr key={tenant.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <Building2 className="w-4 h-4 text-primary" />
                            </div>
                            <span className="text-sm font-medium text-foreground">{tenant.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="secondary" className="text-xs">
                            {tenant.tenant_type === "enterprise" ? "企业租户" : "个人租户"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-foreground">{tenant.contact_name || "-"}</td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            {tenant.contact_email && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Mail className="w-3 h-3" /> {tenant.contact_email}
                              </div>
                            )}
                            {tenant.contact_phone && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Phone className="w-3 h-3" /> {tenant.contact_phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 text-sm text-foreground">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            {tenant.member_count}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={`text-xs ${isActive(tenant.status) ? "bg-emerald-500/15 text-emerald-400" : "bg-destructive/15 text-destructive"}`}>
                            {isActive(tenant.status) ? "正常" : "已停用"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">{tenant.created_at}</td>
                        <td className="py-3 px-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOpenDetail(tenant)}>
                                <Eye className="w-4 h-4 mr-2" /> 查看详情
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleOpenEdit(tenant)}>
                                <Edit className="w-4 h-4 mr-2" /> 编辑
                              </DropdownMenuItem>
                              {isActive(tenant.status) && (
                                <DropdownMenuItem onClick={() => handleDisable(tenant.id)} className="text-destructive">
                                  <Trash2 className="w-4 h-4 mr-2" /> 停用
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
            <DialogTitle>{editingTenant ? "编辑租户" : "添加租户"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>租户名称 <span className="text-destructive">*</span></Label>
              <Input
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="请输入租户名称"
              />
            </div>
            <div className="space-y-2">
              <Label>租户类型</Label>
              <Select
                value={formData.tenant_type}
                onValueChange={v => setFormData({ ...formData, tenant_type: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="enterprise">企业租户</SelectItem>
                  <SelectItem value="personal">个人租户</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>描述</Label>
              <Textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="请输入租户描述"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>联系人</Label>
                <Input
                  value={formData.contact_name}
                  onChange={e => setFormData({ ...formData, contact_name: e.target.value })}
                  placeholder="联系人姓名"
                />
              </div>
              <div className="space-y-2">
                <Label>联系邮箱</Label>
                <Input
                  value={formData.contact_email}
                  onChange={e => setFormData({ ...formData, contact_email: e.target.value })}
                  placeholder="邮箱地址"
                />
              </div>
              <div className="space-y-2">
                <Label>联系电话</Label>
                <Input
                  value={formData.contact_phone}
                  onChange={e => setFormData({ ...formData, contact_phone: e.target.value })}
                  placeholder="电话号码"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              <X className="w-4 h-4 mr-1" /> 取消
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || !formData.name.trim()}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
              {editingTenant ? "保存" : "创建"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>租户详情</DialogTitle>
          </DialogHeader>
          {detailTenant && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-medium">{detailTenant.name}</p>
                  <Badge variant="secondary" className="text-xs mt-1">
                    {detailTenant.tenant_type === "enterprise" ? "企业租户" : "个人租户"}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">状态</span>
                  <p className="mt-1">
                    <Badge className={isActive(detailTenant.status) ? "bg-emerald-500/15 text-emerald-400" : "bg-destructive/15 text-destructive"}>
                      {isActive(detailTenant.status) ? "正常" : "已停用"}
                    </Badge>
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">成员数</span>
                  <p className="mt-1 font-medium">{detailTenant.member_count} 人</p>
                </div>
                <div>
                  <span className="text-muted-foreground">联系人</span>
                  <p className="mt-1 font-medium">{detailTenant.contact_name || "-"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">联系邮箱</span>
                  <p className="mt-1 font-medium">{detailTenant.contact_email || "-"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">联系电话</span>
                  <p className="mt-1 font-medium">{detailTenant.contact_phone || "-"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">创建时间</span>
                  <p className="mt-1 font-medium">{detailTenant.created_at}</p>
                </div>
              </div>
              {detailTenant.description && (
                <div>
                  <span className="text-muted-foreground text-sm">描述</span>
                  <p className="mt-1 text-sm">{detailTenant.description}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>关闭</Button>
            {detailTenant && (
              <Button onClick={() => { setDetailOpen(false); handleOpenEdit(detailTenant); }}>
                <Edit className="w-4 h-4 mr-1" /> 编辑
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
