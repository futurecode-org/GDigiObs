import { useState, useEffect, useCallback } from "react"
import { Plus, Trash2, Edit, TestTube, Loader2, X, Check, Server, AppWindow, AlertTriangle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { difyApi } from "@/lib/api"
import type { DifyProvider, DifyApp } from "@/lib/types"
import { toast } from "sonner"
import { SectionHeader } from "@/shared/components/SectionHeader"

export function PlatformConfig() {
  const [activeTab, setActiveTab] = useState("providers")
  const [providers, setProviders] = useState<DifyProvider[]>([])
  const [apps, setApps] = useState<DifyApp[]>([])
  const [loading, setLoading] = useState(false)
  const [providerDialogOpen, setProviderDialogOpen] = useState(false)
  const [appDialogOpen, setAppDialogOpen] = useState(false)
  const [editingProvider, setEditingProvider] = useState<DifyProvider | null>(null)
  const [editingApp, setEditingApp] = useState<DifyApp | null>(null)

  // Provider delete dialog
  const [providerDeleteDialogOpen, setProviderDeleteDialogOpen] = useState(false)
  const [providerToDelete, setProviderToDelete] = useState<DifyProvider | null>(null)
  const [providerDeleteKbs, setProviderDeleteKbs] = useState(false)
  const [providerDeleting, setProviderDeleting] = useState(false)

  const [providerForm, setProviderForm] = useState({
    name: "",
    base_url: "",
    api_key: "",
    visibility: "platform",
    status: "enabled",
    remark: "",
  })

  const [appForm, setAppForm] = useState({
    name: "",
    provider_id: 0,
    app_type: "workflow",
    api_endpoint: "",
    response_mode: "blocking",
    visibility: "personal",
    status: "enabled",
    conversation_enabled: true,
    use_as_digital_employee: false,
  })

  const fetchProviders = useCallback(async () => {
    try {
      const result = await difyApi.getProviders({ page: 1, page_size: 100 })
      setProviders(result.items)
    } catch (error: any) {
      toast.error(error.message || "获取Provider失败")
    }
  }, [])

  const fetchApps = useCallback(async () => {
    try {
      const result = await difyApi.getApps({ page: 1, page_size: 100 })
      setApps(result.items)
    } catch (error: any) {
      toast.error(error.message || "获取App失败")
    }
  }, [])

  useEffect(() => {
    fetchProviders()
    fetchApps()
  }, [fetchProviders, fetchApps])

  const handleOpenProviderCreate = () => {
    setEditingProvider(null)
    setProviderForm({ name: "", base_url: "", api_key: "", visibility: "platform", status: "enabled", remark: "" })
    setProviderDialogOpen(true)
  }

  const handleOpenProviderEdit = (provider: DifyProvider) => {
    setEditingProvider(provider)
    setProviderForm({
      name: provider.name,
      base_url: provider.base_url,
      api_key: "",
      visibility: provider.visibility,
      status: provider.status,
      remark: provider.remark || "",
    })
    setProviderDialogOpen(true)
  }

  const handleProviderSubmit = async () => {
    if (!providerForm.name || !providerForm.base_url) {
      toast.error("请填写必填项")
      return
    }
    setLoading(true)
    try {
      if (editingProvider) {
        const data: any = { ...providerForm }
        if (!data.api_key) delete data.api_key
        await difyApi.updateProvider(editingProvider.id, data)
      } else {
        if (!providerForm.api_key) {
          toast.error("新增Provider需要填写API Key")
          setLoading(false)
          return
        }
        await difyApi.createProvider(providerForm)
      }
      setProviderDialogOpen(false)
      fetchProviders()
      toast.success(editingProvider ? "更新成功" : "创建成功")
    } catch (error: any) {
      toast.error(error.message || "保存失败")
    } finally {
      setLoading(false)
    }
  }

  const handleProviderDelete = async () => {
    if (!providerToDelete) return
    setProviderDeleting(true)
    try {
      const result = await difyApi.deleteProvider(providerToDelete.id, providerDeleteKbs)
      let msg = "删除成功"
      if (result.deleted_kbs_count > 0) {
        msg += `，已清理 ${result.deleted_kbs_count} 个关联知识库`
      }
      fetchProviders()
      toast.success(msg)
    } catch (error: any) {
      toast.error(error.message || "删除失败")
    } finally {
      setProviderDeleting(false)
      setProviderDeleteDialogOpen(false)
      setProviderToDelete(null)
    }
  }

  const openProviderDeleteDialog = (provider: DifyProvider) => {
    setProviderToDelete(provider)
    setProviderDeleteKbs(false)
    setProviderDeleteDialogOpen(true)
  }

  const handleTestProvider = async (id: number) => {
    try {
      const result = await difyApi.testProvider(id)
      toast.success(result.success ? "连接成功" : "连接失败")
    } catch (error: any) {
      toast.error(error.message || "测试失败")
    }
  }

  const handleOpenAppCreate = () => {
    setEditingApp(null)
    setAppForm({ name: "", provider_id: providers[0]?.id || 0, app_type: "workflow", api_endpoint: "/workflows/run", response_mode: "blocking", visibility: "personal", status: "enabled", conversation_enabled: true, use_as_digital_employee: false })
    setAppDialogOpen(true)
  }

  const handleOpenAppEdit = (app: DifyApp) => {
    setEditingApp(app)
    setAppForm({
      name: app.name,
      provider_id: app.provider_id,
      app_type: app.app_type,
      api_endpoint: app.api_endpoint,
      response_mode: app.response_mode,
      visibility: app.visibility,
      status: app.status,
      conversation_enabled: app.conversation_enabled,
      use_as_digital_employee: app.use_as_digital_employee || false,
    })
    setAppDialogOpen(true)
  }

  const handleAppSubmit = async () => {
    if (!appForm.name || !appForm.provider_id || !appForm.api_endpoint) {
      toast.error("请填写必填项")
      return
    }
    setLoading(true)
    try {
      if (editingApp) {
        await difyApi.updateApp(editingApp.id, appForm)
      } else {
        await difyApi.createApp(appForm)
      }
      setAppDialogOpen(false)
      fetchApps()
      toast.success(editingApp ? "更新成功" : "创建成功")
    } catch (error: any) {
      toast.error(error.message || "保存失败")
    } finally {
      setLoading(false)
    }
  }

  const handleAppDelete = async (id: number) => {
    if (!confirm("确定删除此App？")) return
    try {
      await difyApi.deleteApp(id)
      fetchApps()
      toast.success("删除成功")
    } catch (error: any) {
      toast.error(error.message || "删除失败")
    }
  }

  const handleTestApp = async (id: number) => {
    try {
      const result = await difyApi.testApp(id)
      toast.success(result.success ? `测试成功: ${result.message || ""}` : "测试失败")
    } catch (error: any) {
      toast.error(error.message || "测试失败")
    }
  }

  const getProviderName = (id: number) => providers.find(p => p.id === id)?.name || "未知"

  return (
    <div className="h-full overflow-y-auto p-6 space-y-4">
      <SectionHeader title="平台配置" subtitle="管理Dify Provider和应用配置" />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="providers" className="gap-2">
            <Server className="w-4 h-4" />
            Dify Provider
          </TabsTrigger>
          <TabsTrigger value="apps" className="gap-2">
            <AppWindow className="w-4 h-4" />
            Dify App
          </TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Dify Provider 管理</CardTitle>
              <Button size="sm" onClick={handleOpenProviderCreate}>
                <Plus className="w-4 h-4 mr-1" /> 新增Provider
              </Button>
            </CardHeader>
            <CardContent>
              {providers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Server className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">暂无Provider配置</p>
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
                    {providers.map(p => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div className="font-medium">{p.name}</div>
                          <div className="text-xs text-muted-foreground">{p.remark || "-"}</div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{p.base_url}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{p.visibility}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={p.status === "enabled" ? "secondary" : "destructive"} className="text-xs">
                            {p.status === "enabled" ? "启用" : "停用"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleTestProvider(p.id)}>
                              <TestTube className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleOpenProviderEdit(p)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => openProviderDeleteDialog(p)}>
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
        </TabsContent>

        <TabsContent value="apps" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Dify App 管理</CardTitle>
              <Button size="sm" onClick={handleOpenAppCreate}>
                <Plus className="w-4 h-4 mr-1" /> 新增App
              </Button>
            </CardHeader>
            <CardContent>
              {apps.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AppWindow className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">暂无App配置</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>名称</TableHead>
                      <TableHead>类型</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>数字员工</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apps.map(app => (
                      <TableRow key={app.id}>
                        <TableCell>
                          <div className="font-medium">{app.name}</div>
                          <div className="text-xs text-muted-foreground">{app.api_endpoint}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{app.app_type}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{getProviderName(app.provider_id)}</TableCell>
                        <TableCell>
                          <Badge variant={app.use_as_digital_employee ? "secondary" : "outline"} className="text-xs">
                            {app.use_as_digital_employee ? "是" : "否"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={app.status === "enabled" ? "secondary" : "destructive"} className="text-xs">
                            {app.status === "enabled" ? "启用" : "停用"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleTestApp(app.id)}>
                              <TestTube className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleOpenAppEdit(app)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleAppDelete(app.id)}>
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
        </TabsContent>
      </Tabs>

      {/* Provider Dialog */}
      <Dialog open={providerDialogOpen} onOpenChange={setProviderDialogOpen}>
        <DialogContent className="sm:max-w-lg" onPointerDownOutside={e => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{editingProvider ? "编辑Provider" : "新增Provider"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>名称 *</Label>
              <Input value={providerForm.name} onChange={e => setProviderForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Dify服务名称" />
            </div>
            <div className="space-y-2">
              <Label>Base URL *</Label>
              <Input value={providerForm.base_url} onChange={e => setProviderForm(prev => ({ ...prev, base_url: e.target.value }))} placeholder="https://api.dify.ai/v1" />
            </div>
            <div className="space-y-2">
              <Label>API Key {editingProvider ? "（留空则不修改）" : "*"}</Label>
              <Input type="password" value={providerForm.api_key} onChange={e => setProviderForm(prev => ({ ...prev, api_key: e.target.value }))} placeholder="Dify API Key" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>可见性</Label>
                <Select value={providerForm.visibility} onValueChange={v => setProviderForm(prev => ({ ...prev, visibility: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="platform">平台级</SelectItem>
                    <SelectItem value="tenant">租户级</SelectItem>
                    <SelectItem value="personal">个人级</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>状态</Label>
                <Select value={providerForm.status} onValueChange={v => setProviderForm(prev => ({ ...prev, status: v }))}>
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
              <Input value={providerForm.remark} onChange={e => setProviderForm(prev => ({ ...prev, remark: e.target.value }))} placeholder="备注信息" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProviderDialogOpen(false)}><X className="w-4 h-4 mr-1" /> 取消</Button>
            <Button onClick={handleProviderSubmit} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />}
              {editingProvider ? "保存" : "创建"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* App Dialog */}
      <Dialog open={appDialogOpen} onOpenChange={setAppDialogOpen}>
        <DialogContent className="sm:max-w-lg" onPointerDownOutside={e => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{editingApp ? "编辑App" : "新增App"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>名称 *</Label>
              <Input value={appForm.name} onChange={e => setAppForm(prev => ({ ...prev, name: e.target.value }))} placeholder="应用名称" />
            </div>
            <div className="space-y-2">
              <Label>绑定Provider *</Label>
              <Select value={String(appForm.provider_id)} onValueChange={v => setAppForm(prev => ({ ...prev, provider_id: parseInt(v) }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {providers.map(p => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>应用类型</Label>
                <Select value={appForm.app_type} onValueChange={v => setAppForm(prev => ({ ...prev, app_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="workflow">Workflow</SelectItem>
                    <SelectItem value="chatflow">Chatflow</SelectItem>
                    <SelectItem value="chatbot">Chatbot</SelectItem>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="text_generator">Text Generator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>响应模式</Label>
                <Select value={appForm.response_mode} onValueChange={v => setAppForm(prev => ({ ...prev, response_mode: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blocking">Blocking</SelectItem>
                    <SelectItem value="streaming">Streaming</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>API Endpoint *</Label>
              <Input value={appForm.api_endpoint} onChange={e => setAppForm(prev => ({ ...prev, api_endpoint: e.target.value }))} placeholder="/workflows/run 或 /chat-messages" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>可见性</Label>
                <Select value={appForm.visibility} onValueChange={v => setAppForm(prev => ({ ...prev, visibility: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">公开</SelectItem>
                    <SelectItem value="tenant">租户</SelectItem>
                    <SelectItem value="personal">个人</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>状态</Label>
                <Select value={appForm.status} onValueChange={v => setAppForm(prev => ({ ...prev, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="enabled">启用</SelectItem>
                    <SelectItem value="disabled">停用</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>启用会话</Label>
                <p className="text-xs text-muted-foreground">对话类应用需要维护会话</p>
              </div>
              <Switch checked={appForm.conversation_enabled} onCheckedChange={checked => setAppForm(prev => ({ ...prev, conversation_enabled: checked }))} />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>用作数字员工</Label>
                <p className="text-xs text-muted-foreground">开启后显示在数字员工页，可私聊并加入群聊</p>
              </div>
              <Switch checked={appForm.use_as_digital_employee} onCheckedChange={checked => setAppForm(prev => ({ ...prev, use_as_digital_employee: checked }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAppDialogOpen(false)}><X className="w-4 h-4 mr-1" /> 取消</Button>
            <Button onClick={handleAppSubmit} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />}
              {editingApp ? "保存" : "创建"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Provider Delete Dialog */}
      <Dialog open={providerDeleteDialogOpen} onOpenChange={setProviderDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={e => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>删除 Dify Provider</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
              <p>确定要删除 Provider <strong>{providerToDelete?.name}</strong> 吗？</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="admin-delete-kbs"
                  checked={!providerDeleteKbs}
                  onChange={() => setProviderDeleteKbs(false)}
                  className="accent-primary"
                />
                <span>仅删除 Provider 配置，保留关联知识库</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="admin-delete-kbs"
                  checked={providerDeleteKbs}
                  onChange={() => setProviderDeleteKbs(true)}
                  className="accent-destructive"
                />
                <span className="text-destructive">同时删除关联的知识库（仅删除本地记录，不删除云端数据）</span>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProviderDeleteDialogOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={handleProviderDelete} disabled={providerDeleting}>
              {providerDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Trash2 className="w-4 h-4 mr-1" />}
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
