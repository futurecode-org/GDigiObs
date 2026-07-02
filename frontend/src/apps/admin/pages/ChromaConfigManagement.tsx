import { useState, useEffect, useCallback } from "react"
import { Plus, Trash2, Edit, Loader2, X, Check, Server, Search, TestTube } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { chromaConfigApi } from "@/lib/api"
import type { ChromaConfig, PaginatedData } from "@/lib/types"
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

interface ChromaConfigFormData {
  name: string
  host: string
  port: string
  collection_prefix: string
  visibility: string
  status: string
  remark: string
}

const emptyForm: ChromaConfigFormData = {
  name: "",
  host: "",
  port: "8000",
  collection_prefix: "kb",
  visibility: "tenant",
  status: "enabled",
  remark: "",
}

export function ChromaConfigManagement() {
  const [configs, setConfigs] = useState<ChromaConfig[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<ChromaConfig | null>(null)
  const [form, setForm] = useState<ChromaConfigFormData>(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteConfigId, setDeleteConfigId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Test connection inside dialog
  const [testingInDialog, setTestingInDialog] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const fetchConfigs = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await chromaConfigApi.getList({ page, page_size: 20 }) as PaginatedData<ChromaConfig>
      setConfigs(result.items)
      setTotalPages(result.total_pages || 1)
    } catch (error: any) {
      console.error("获取Chroma配置失败:", error)
      toast.error(error.message || "获取Chroma配置失败")
      setConfigs([])
    } finally {
      setIsLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchConfigs()
  }, [fetchConfigs])

  const openDeleteDialog = (configId: number) => {
    setDeleteConfigId(configId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfigId) return
    setDeleting(true)
    try {
      await chromaConfigApi.delete(deleteConfigId)
      toast.success("配置已删除")
      fetchConfigs()
    } catch (error: any) {
      console.error("删除配置失败:", error)
      toast.error(error.message || "删除配置失败")
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  const handleTestInDialog = async () => {
    if (!form.host.trim()) {
      toast.error("请填写Host地址")
      return
    }
    const port = parseInt(form.port, 10)
    if (isNaN(port) || port < 1 || port > 65535) {
      toast.error("端口格式不正确")
      return
    }
    setTestingInDialog(true)
    setTestResult(null)
    try {
      // Create temporary config to test
      const result = await chromaConfigApi.create({
        name: "__test_temp__",
        host: form.host.trim(),
        port,
        collection_prefix: "test",
        visibility: "personal",
        status: "disabled"
      })
      const testId = result.id
      try {
        const testResult = await chromaConfigApi.test(testId)
        setTestResult({ success: testResult.connected, message: testResult.connected ? "连接成功" : "连接失败" })
        if (testResult.connected) toast.success("连接成功")
        else toast.error("连接失败")
      } finally {
        await chromaConfigApi.delete(testId).catch(() => {})
      }
    } catch (error: any) {
      setTestResult({ success: false, message: error.message || "测试失败" })
      toast.error(error.message || "测试失败")
    } finally {
      setTestingInDialog(false)
    }
  }

  const openCreateDialog = () => {
    setEditingConfig(null)
    setForm(emptyForm)
    setTestResult(null)
    setDialogOpen(true)
  }

  const openEditDialog = (config: ChromaConfig) => {
    setEditingConfig(config)
    setForm({
      name: config.name,
      host: config.host,
      port: String(config.port),
      collection_prefix: config.collection_prefix,
      visibility: config.visibility,
      status: config.status,
      remark: config.remark || "",
    })
    setTestResult(null)
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.host.trim()) {
      toast.error("请填写名称和Host地址")
      return
    }
    const port = parseInt(form.port, 10)
    if (isNaN(port) || port < 1 || port > 65535) {
      toast.error("端口格式不正确")
      return
    }

    const payload = {
      ...form,
      port,
    }

    setSubmitting(true)
    try {
      if (editingConfig) {
        await chromaConfigApi.update(editingConfig.id, payload)
        toast.success("配置更新成功")
      } else {
        await chromaConfigApi.create(payload)
        toast.success("配置创建成功")
      }
      setDialogOpen(false)
      fetchConfigs()
    } catch (error: any) {
      console.error("保存配置失败:", error)
      toast.error(error.message || "保存配置失败")
    } finally {
      setSubmitting(false)
    }
  }

  const filteredConfigs = configs.filter(c =>
    [c.name, c.host, c.remark].some(v => v?.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <SectionHeader
          title="Chroma 配置管理"
          subtitle="管理向量数据库连接配置"
          action={
            <Button size="sm" onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-1" /> 新增配置
            </Button>
          }
        />
        <div className="mt-3 relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="搜索名称、Host、备注..."
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
            ) : filteredConfigs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Server className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">暂无Chroma配置</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>名称</TableHead>
                    <TableHead>Host</TableHead>
                    <TableHead>端口</TableHead>
                    <TableHead>前缀</TableHead>
                    <TableHead>可见性</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConfigs.map(config => (
                    <TableRow key={config.id}>
                      <TableCell>
                        <div className="font-medium">{config.name}</div>
                        {config.remark && (
                          <div className="text-xs text-muted-foreground">{config.remark}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{config.host}</TableCell>
                      <TableCell className="text-xs">{config.port}</TableCell>
                      <TableCell className="text-xs">{config.collection_prefix}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {VISIBILITY_LABELS[config.visibility] || config.visibility}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={config.status === "enabled" ? "secondary" : "destructive"} className="text-xs">
                          {config.status === "enabled" ? "启用" : "停用"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(config)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => openDeleteDialog(config.id)}
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

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-sm text-muted-foreground">
            确定要删除该 Chroma 配置吗？此操作不可恢复。
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleting}>
              {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Trash2 className="w-4 h-4 mr-1" />}
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog with Test Connection */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg" onPointerDownOutside={e => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{editingConfig ? "编辑Chroma配置" : "新增Chroma配置"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>名称 *</Label>
              <Input
                value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="配置名称"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Host *</Label>
                <Input
                  value={form.host}
                  onChange={e => setForm(prev => ({ ...prev, host: e.target.value }))}
                  placeholder="localhost 或 IP地址"
                />
              </div>
              <div className="space-y-2">
                <Label>端口</Label>
                <Input
                  value={form.port}
                  onChange={e => setForm(prev => ({ ...prev, port: e.target.value }))}
                  placeholder="8000"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Collection 前缀</Label>
              <Input
                value={form.collection_prefix}
                onChange={e => setForm(prev => ({ ...prev, collection_prefix: e.target.value }))}
                placeholder="kb"
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
              <div className="space-y-2">
                <Label>状态</Label>
                <Select
                  value={form.status}
                  onValueChange={v => setForm(prev => ({ ...prev, status: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="enabled">启用</SelectItem>
                    <SelectItem value="disabled">停用</SelectItem>
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

            {/* Test Connection Section inside dialog */}
            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">连接测试</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleTestInDialog}
                  disabled={testingInDialog}
                >
                  {testingInDialog ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  ) : (
                    <TestTube className="w-4 h-4 mr-1" />
                  )}
                  测试连接
                </Button>
              </div>
              {testResult && (
                <div className={`p-3 rounded-lg text-sm ${testResult.success ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}`}>
                  {testResult.message}
                </div>
              )}
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
              {editingConfig ? "保存" : "创建"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
