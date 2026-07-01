import { useState, useEffect, useCallback } from "react"
import { Plus, Trash2, Edit, Loader2, X, Check, Globe, Search, AlertTriangle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { difyApi } from "@/lib/api"
import type { DifyProvider, PaginatedData } from "@/lib/types"
import { toast } from "sonner"
import { SectionHeader } from "@/shared/components/SectionHeader"

const VISIBILITY_OPTIONS = [
  { value: "platform", label: "平台" },
  { value: "tenant", label: "租户" },
  { value: "personal", label: "个人" },
]

const VISIBILITY_LABELS: Record<string, string> = {
  platform: "平台",
  tenant: "租户",
  personal: "个人",
}

interface DifyProviderFormData {
  name: string
  base_url: string
  api_key: string
  visibility: string
  remark: string
}

const emptyForm: DifyProviderFormData = {
  name: "",
  base_url: "",
  api_key: "",
  visibility: "tenant",
  remark: "",
}

export function DifyProviderPage() {
  const [providers, setProviders] = useState<DifyProvider[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProvider, setEditingProvider] = useState<DifyProvider | null>(null)
  const [form, setForm] = useState<DifyProviderFormData>(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteProvider, setDeleteProvider] = useState<DifyProvider | null>(null)
  const [deleteKbs, setDeleteKbs] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Test connection
  const [testingId, setTestingId] = useState<number | null>(null)

  const fetchProviders = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await difyApi.getProviders({ page, page_size: 20 }) as PaginatedData<DifyProvider>
      setProviders(result.items)
      setTotalPages(result.total_pages || 1)
    } catch (error: any) {
      console.error("获取Dify Provider失败:", error)
      toast.error(error.message || "获取Dify Provider失败")
      setProviders([])
    } finally {
      setIsLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchProviders()
  }, [fetchProviders])

  const handleTest = async (providerId: number) => {
    setTestingId(providerId)
    try {
      const result = await difyApi.testProvider(providerId)
      toast.success(result.success ? "连接成功" : "连接失败")
    } catch (error: any) {
      console.error("测试连接失败:", error)
      toast.error(error.message || "测试连接失败")
    } finally {
      setTestingId(null)
    }
  }

  const openDeleteDialog = (provider: DifyProvider) => {
    setDeleteProvider(provider)
    setDeleteKbs(false)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteProvider) return
    setDeleting(true)
    try {
      const result = await difyApi.deleteProvider(deleteProvider.id, deleteKbs)
      let msg = "Provider已删除"
      if (result.deleted_kbs_count > 0) {
        msg += `，已清理 ${result.deleted_kbs_count} 个关联知识库`
      }
      toast.success(msg)
      fetchProviders()
    } catch (error: any) {
      console.error("删除Provider失败:", error)
      toast.error(error.message || "删除Provider失败")
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  const openCreateDialog = () => {
    setEditingProvider(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEditDialog = (provider: DifyProvider) => {
    setEditingProvider(provider)
    setForm({
      name: provider.name,
      base_url: provider.base_url,
      api_key: "",
      visibility: provider.visibility,
      remark: provider.remark || "",
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.base_url.trim()) {
      toast.error("请填写名称和Base URL")
      return
    }

    setSubmitting(true)
    try {
      if (editingProvider) {
        const payload: Record<string, unknown> = {
          name: form.name.trim(),
          base_url: form.base_url.trim(),
          visibility: form.visibility,
        }
        if (form.api_key) payload.api_key = form.api_key
        if (form.remark) payload.remark = form.remark
        await difyApi.updateProvider(editingProvider.id, payload)
        toast.success("Provider更新成功")
      } else {
        if (!form.api_key.trim()) {
          toast.error("请填写API Key")
          setSubmitting(false)
          return
        }
        await difyApi.createProvider({
          name: form.name.trim(),
          base_url: form.base_url.trim(),
          api_key: form.api_key.trim(),
          visibility: form.visibility,
          remark: form.remark,
        })
        toast.success("Provider创建成功")
      }
      setDialogOpen(false)
      fetchProviders()
    } catch (error: any) {
      console.error("保存Provider失败:", error)
      toast.error(error.message || "保存Provider失败")
    } finally {
      setSubmitting(false)
    }
  }

  const filteredProviders = providers.filter(p =>
    [p.name, p.base_url, p.remark].some(v => v?.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <SectionHeader
          title="Dify Provider 管理"
          subtitle="管理Dify知识库提供方连接配置"
          action={
            <Button size="sm" onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-1" /> 新增Provider
            </Button>
          }
        />
        <div className="mt-3 relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="搜索名称、URL、备注..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9 max-w-md"
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto p-4">
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredProviders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Globe className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">暂无Dify Provider配置</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>名称</TableHead>
                    <TableHead>Base URL</TableHead>
                    <TableHead>可见性</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProviders.map(provider => (
                    <TableRow key={provider.id}>
                      <TableCell>
                        <div className="font-medium">{provider.name}</div>
                        {provider.remark && (
                          <div className="text-xs text-muted-foreground">{provider.remark}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{provider.base_url}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {VISIBILITY_LABELS[provider.visibility] || provider.visibility}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={provider.status === "enabled" ? "secondary" : "destructive"} className="text-xs">
                          {provider.status === "enabled" ? "启用" : "停用"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTest(provider.id)}
                            disabled={testingId === provider.id}
                            title="测试连接"
                          >
                            {testingId === provider.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Globe className="w-4 h-4" />
                            )}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(provider)} title="编辑">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => openDeleteDialog(provider)}
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              上一页
            </Button>
            <span className="text-sm text-muted-foreground">
              第 {page} / {totalPages} 页
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              下一页
            </Button>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg" onPointerDownOutside={e => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{editingProvider ? "编辑Dify Provider" : "新增Dify Provider"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>名称 *</Label>
              <Input
                value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Provider名称"
              />
            </div>
            <div className="space-y-2">
              <Label>Base URL *</Label>
              <Input
                value={form.base_url}
                onChange={e => setForm(prev => ({ ...prev, base_url: e.target.value }))}
                placeholder="https://api.dify.ai/v1"
              />
            </div>
            <div className="space-y-2">
              <Label>API Key {editingProvider ? "（留空表示不修改）" : "*"}</Label>
              <Input
                type="password"
                value={form.api_key}
                onChange={e => setForm(prev => ({ ...prev, api_key: e.target.value }))}
                placeholder={editingProvider ? "留空表示不修改" : "Dify API Key"}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>可见性</Label>
                <Select
                  value={form.visibility}
                  onValueChange={v => setForm(prev => ({ ...prev, visibility: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {VISIBILITY_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>备注</Label>
              <Input
                value={form.remark}
                onChange={e => setForm(prev => ({ ...prev, remark: e.target.value }))}
                placeholder="备注信息"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              <X className="w-4 h-4 mr-1" /> 取消
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <Check className="w-4 h-4 mr-1" />
              )}
              {editingProvider ? "保存" : "创建"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={e => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>删除Dify Provider</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
              <p>确定要删除 Provider <strong>{deleteProvider?.name}</strong> 吗？</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="delete-kbs"
                  checked={!deleteKbs}
                  onChange={() => setDeleteKbs(false)}
                  className="accent-primary"
                />
                <span>仅删除 Provider 配置，保留关联知识库</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="delete-kbs"
                  checked={deleteKbs}
                  onChange={() => setDeleteKbs(true)}
                  className="accent-destructive"
                />
                <span className="text-destructive">同时删除关联的知识库（仅删除本地记录，不删除云端数据）</span>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleting}>
              {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Trash2 className="w-4 h-4 mr-1" />}
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
