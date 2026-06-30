import { useState, useEffect, useRef, useCallback } from "react"
import { Mail, Send, Loader2, Trash2, Plus, X, Check, Server, Shield, Plug, Search, User } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { systemEmailConfigApi, adminNotificationApi, userApi } from "@/lib/api"
import type { SystemEmailConfig, User as UserType } from "@/lib/types"
import { toast } from "sonner"
import { SectionHeader } from "@/shared/components/SectionHeader"

const PROTOCOL_LABELS: Record<string, string> = {
  none: "无加密",
  ssl: "SSL",
  tls: "TLS",
  starttls: "STARTTLS",
}

const DEFAULT_PORTS: Record<string, number> = {
  none: 25,
  ssl: 465,
  tls: 587,
  starttls: 587,
}

const PROTOCOL_HINTS: Record<string, string> = {
  none: "无加密: 明文传输，不推荐用于生产环境",
  ssl: "SSL: 使用 SSL 加密连接，通常端口为 465",
  tls: "TLS: 使用 TLS 加密连接，通常端口为 587",
  starttls: "STARTTLS: 先建立明文连接，然后升级到 TLS，通常端口为 587",
}

interface SelectedUser {
  id: number
  username: string
  nickname?: string
}

export function NotifySettings() {
  const [activeTab, setActiveTab] = useState("email")
  const [emailConfigs, setEmailConfigs] = useState<SystemEmailConfig[]>([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<SystemEmailConfig | null>(null)
  const [formData, setFormData] = useState({
    smtp_host: "",
    smtp_port: 587,
    smtp_username: "",
    smtp_password: "",
    sender_email: "",
    sender_name: "",
    security_protocol: "tls" as "none" | "ssl" | "tls" | "starttls",
    status: "enabled",
  })
  const portManuallyChanged = useRef(false)
  const [testLoading, setTestLoading] = useState(false)

  // 发送通知表单
  const [sendForm, setSendForm] = useState({
    title: "",
    content: "",
    target_type: "all",
    channel: "in_app" as "in_app" | "browser" | "email",
    email_config_id: "",
    recipient_emails: "",
    target_tenant_id: "",
  })
  const [sendLoading, setSendLoading] = useState(false)

  // 用户搜索相关
  const [userSearchKeyword, setUserSearchKeyword] = useState("")
  const [userSearchResults, setUserSearchResults] = useState<UserType[]>([])
  const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([])
  const [searchingUsers, setSearchingUsers] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const userSearchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchEmailConfigs()
  }, [])

  // 点击外部关闭用户下拉
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userSearchRef.current && !userSearchRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const fetchEmailConfigs = async () => {
    try {
      const data = await systemEmailConfigApi.getList()
      setEmailConfigs(data)
    } catch (error: any) {
      toast.error(error.message || "获取邮件配置失败")
    }
  }

  const handleOpenCreate = () => {
    setEditingConfig(null)
    portManuallyChanged.current = false
    setFormData({
      smtp_host: "",
      smtp_port: DEFAULT_PORTS.tls,
      smtp_username: "",
      smtp_password: "",
      sender_email: "",
      sender_name: "",
      security_protocol: "tls",
      status: "enabled",
    })
    setDialogOpen(true)
  }

  const handleOpenEdit = (config: SystemEmailConfig) => {
    setEditingConfig(config)
    portManuallyChanged.current = true
    setFormData({
      smtp_host: config.smtp_host,
      smtp_port: config.smtp_port,
      smtp_username: config.smtp_username,
      smtp_password: "",
      sender_email: config.sender_email,
      sender_name: config.sender_name || "",
      security_protocol: config.security_protocol as "none" | "ssl" | "tls" | "starttls",
      status: config.status,
    })
    setDialogOpen(true)
  }

  const handleSecurityProtocolChange = (value: "none" | "ssl" | "tls" | "starttls") => {
    setFormData(prev => {
      const next = { ...prev, security_protocol: value }
      if (!portManuallyChanged.current) {
        next.smtp_port = DEFAULT_PORTS[value]
      }
      return next
    })
  }

  const handlePortChange = (value: string) => {
    portManuallyChanged.current = true
    setFormData(prev => ({ ...prev, smtp_port: parseInt(value) || 0 }))
  }

  const handleSubmit = async () => {
    if (!formData.smtp_host || !formData.smtp_username || !formData.sender_email) {
      toast.error("请填写必填项")
      return
    }
    setLoading(true)
    try {
      if (editingConfig) {
        await systemEmailConfigApi.update(editingConfig.id, formData)
      } else {
        await systemEmailConfigApi.create(formData)
      }
      setDialogOpen(false)
      fetchEmailConfigs()
      toast.success(editingConfig ? "更新成功" : "创建成功")
    } catch (error: any) {
      toast.error(error.message || "保存失败")
    } finally {
      setLoading(false)
    }
  }

  const handleTestConnection = async () => {
    if (!formData.smtp_host || !formData.smtp_username || !formData.sender_email) {
      toast.error("请填写 SMTP 服务器、用户名和发件人邮箱后再测试")
      return
    }
    if (!formData.smtp_password && !editingConfig) {
      toast.error("新增配置请输入 SMTP 密码后再测试")
      return
    }
    setTestLoading(true)
    try {
      const result = await systemEmailConfigApi.test({
        smtp_host: formData.smtp_host,
        smtp_port: formData.smtp_port,
        smtp_username: formData.smtp_username,
        smtp_password: formData.smtp_password,
        sender_email: formData.sender_email,
        sender_name: formData.sender_name,
        security_protocol: formData.security_protocol,
      })
      toast.success(result.message || "连接测试成功")
    } catch (error: any) {
      toast.error(error.message || "连接测试失败")
    } finally {
      setTestLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除此邮件配置？")) return
    try {
      await systemEmailConfigApi.delete(id)
      fetchEmailConfigs()
      toast.success("删除成功")
    } catch (error: any) {
      toast.error(error.message || "删除失败")
    }
  }

  // 用户搜索
  const handleUserSearch = useCallback(async () => {
    if (!userSearchKeyword.trim()) return
    setSearchingUsers(true)
    try {
      const result = await userApi.search(userSearchKeyword.trim(), { page_size: 20 })
      setUserSearchResults(result.items)
      setShowUserDropdown(true)
    } catch (error: any) {
      toast.error(error.message || "搜索用户失败")
    } finally {
      setSearchingUsers(false)
    }
  }, [userSearchKeyword])

  const handleSelectUser = (user: UserType) => {
    if (!selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers(prev => [...prev, { id: user.id, username: user.username, nickname: user.nickname }])
    }
    setUserSearchKeyword("")
    setShowUserDropdown(false)
  }

  const handleRemoveUser = (id: number) => {
    setSelectedUsers(prev => prev.filter(u => u.id !== id))
  }

  const handleSendNotification = async () => {
    if (!sendForm.title.trim()) {
      toast.error("请输入通知标题")
      return
    }
    if (sendForm.target_type === "user" && selectedUsers.length === 0) {
      toast.error("请选择至少一个目标用户")
      return
    }
    if (sendForm.channel === "email" && !sendForm.email_config_id) {
      toast.error("请选择邮件配置")
      return
    }
    setSendLoading(true)
    try {
      const payload: any = {
        title: sendForm.title,
        content: sendForm.content,
        target_type: sendForm.target_type,
        channel: sendForm.channel,
      }
      if (sendForm.target_type === "user") {
        payload.target_ids = selectedUsers.map(u => u.id)
      }
      if (sendForm.target_type === "tenant" && sendForm.target_tenant_id) {
        payload.target_ids = [parseInt(sendForm.target_tenant_id)]
      }
      if (sendForm.channel === "email") {
        payload.email_config_id = parseInt(sendForm.email_config_id)
        const emails = sendForm.recipient_emails
          .split(/[,\n]/)
          .map(e => e.trim())
          .filter(e => e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
        if (emails.length > 0) {
          payload.recipient_emails = emails
        }
      }
      const result = await adminNotificationApi.send(payload)
      toast.success(`通知发送成功，共发送 ${result.sent_count} 人`)
      setSendForm({ title: "", content: "", target_type: "all", channel: "in_app", email_config_id: "", recipient_emails: "", target_tenant_id: "" })
      setSelectedUsers([])
    } catch (error: any) {
      toast.error(error.message || "发送失败")
    } finally {
      setSendLoading(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-4">
      <SectionHeader
        title="通知设置"
        subtitle="管理系统邮件配置和发送系统通知"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="email" className="gap-2">
            <Mail className="w-4 h-4" />
            邮件配置
          </TabsTrigger>
          <TabsTrigger value="send" className="gap-2">
            <Send className="w-4 h-4" />
            发送通知
          </TabsTrigger>
        </TabsList>

        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Server className="w-4 h-4" />
                系统邮件配置
              </CardTitle>
              <Button size="sm" onClick={handleOpenCreate}>
                <Plus className="w-4 h-4 mr-1" /> 新增配置
              </Button>
            </CardHeader>
            <CardContent>
              {emailConfigs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">暂无邮件配置</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SMTP服务器</TableHead>
                      <TableHead>发件人</TableHead>
                      <TableHead>加密方式</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {emailConfigs.map(config => (
                      <TableRow key={config.id}>
                        <TableCell>
                          <div className="font-medium">{config.smtp_host}</div>
                          <div className="text-xs text-muted-foreground">{config.smtp_username}</div>
                        </TableCell>
                        <TableCell>
                          <div>{config.sender_name || config.sender_email}</div>
                          <div className="text-xs text-muted-foreground">{config.sender_email}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            <Shield className="w-3 h-3 mr-1" />
                            {PROTOCOL_LABELS[config.security_protocol] || config.security_protocol}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={config.status === "enabled" ? "secondary" : "destructive"} className="text-xs">
                            {config.status === "enabled" ? "启用" : "停用"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(config)}>
                              编辑
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(config.id)}>
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

        <TabsContent value="send" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Send className="w-4 h-4" />
                发送系统通知
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>通知标题 *</Label>
                <Input value={sendForm.title} onChange={e => setSendForm(prev => ({ ...prev, title: e.target.value }))} placeholder="请输入通知标题" />
              </div>
              <div className="space-y-2">
                <Label>通知内容</Label>
                <textarea
                  className="w-full min-h-[100px] px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={sendForm.content}
                  onChange={e => setSendForm(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="请输入通知内容"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>发送范围</Label>
                  <Select value={sendForm.target_type} onValueChange={v => {
                    setSendForm(prev => ({ ...prev, target_type: v }))
                    setSelectedUsers([])
                  }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部用户</SelectItem>
                      <SelectItem value="tenant">指定租户</SelectItem>
                      <SelectItem value="user">指定用户</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {sendForm.target_type === "user" && (
                  <div className="space-y-2" ref={userSearchRef}>
                    <Label>选择用户 *</Label>
                    <div className="relative">
                      <div className="flex gap-2">
                        <Input
                          value={userSearchKeyword}
                          onChange={e => setUserSearchKeyword(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && handleUserSearch()}
                          placeholder="输入用户名/昵称搜索"
                          className="flex-1"
                        />
                        <Button variant="outline" size="icon" onClick={handleUserSearch} disabled={searchingUsers}>
                          {searchingUsers ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        </Button>
                      </div>
                      {showUserDropdown && userSearchResults.length > 0 && (
                        <div className="absolute z-50 mt-1 w-full bg-popover border rounded-md shadow-md max-h-48 overflow-y-auto">
                          {userSearchResults.map(user => (
                            <button
                              key={user.id}
                              className="w-full text-left px-3 py-2 hover:bg-accent text-sm flex items-center gap-2"
                              onClick={() => handleSelectUser(user)}
                            >
                              <User className="w-3 h-3 text-muted-foreground" />
                              <span>{user.nickname || user.username}</span>
                              <span className="text-xs text-muted-foreground">({user.username})</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {selectedUsers.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedUsers.map(u => (
                          <Badge key={u.id} variant="secondary" className="gap-1 text-xs">
                            {u.nickname || u.username}
                            <button onClick={() => handleRemoveUser(u.id)} className="ml-1 hover:text-destructive">
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {sendForm.target_type === "tenant" && (
                  <div className="space-y-2">
                    <Label>租户ID</Label>
                    <Input
                      value={sendForm.target_tenant_id || ""}
                      onChange={e => setSendForm(prev => ({ ...prev, target_tenant_id: e.target.value }))}
                      placeholder="输入租户ID"
                    />
                  </div>
                )}
                {sendForm.target_type === "all" && (
                  <div className="space-y-2">
                    <Label>目标ID</Label>
                    <Input placeholder="发送给全部用户，无需填写" disabled />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>通知渠道</Label>
                <Select value={sendForm.channel} onValueChange={v => setSendForm(prev => ({ ...prev, channel: v as "in_app" | "browser" | "email" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_app">站内通知</SelectItem>
                    <SelectItem value="browser">浏览器通知</SelectItem>
                    <SelectItem value="email">邮件通知</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {sendForm.channel === "email" && (
                <>
                  <div className="space-y-2">
                    <Label>邮件配置 *</Label>
                    <Select value={sendForm.email_config_id} onValueChange={v => setSendForm(prev => ({ ...prev, email_config_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="选择邮件配置" /></SelectTrigger>
                      <SelectContent>
                        {emailConfigs.filter(c => c.status === "enabled").map(config => (
                          <SelectItem key={config.id} value={String(config.id)}>
                            {config.sender_name || config.sender_email} ({config.smtp_host})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>额外收件邮箱（选填，支持多选，用逗号或换行分隔）</Label>
                    <textarea
                      className="w-full min-h-[80px] px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      value={sendForm.recipient_emails}
                      onChange={e => setSendForm(prev => ({ ...prev, recipient_emails: e.target.value }))}
                      placeholder="example1@mail.com, example2@mail.com"
                    />
                  </div>
                </>
              )}
              <Button onClick={handleSendNotification} disabled={sendLoading}>
                {sendLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                发送通知
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Email Config Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg" onPointerDownOutside={e => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{editingConfig ? "编辑邮件配置" : "新增邮件配置"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SMTP服务器 *</Label>
                <Input value={formData.smtp_host} onChange={e => setFormData(prev => ({ ...prev, smtp_host: e.target.value }))} placeholder="smtp.example.com" />
              </div>
              <div className="space-y-2">
                <Label>SMTP端口</Label>
                <Input type="number" value={formData.smtp_port} onChange={e => handlePortChange(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>SMTP用户名 *</Label>
              <Input value={formData.smtp_username} onChange={e => setFormData(prev => ({ ...prev, smtp_username: e.target.value }))} placeholder="username@example.com" />
            </div>
            <div className="space-y-2">
              <Label>SMTP密码 {editingConfig ? "（留空则不修改）" : "*"}</Label>
              <Input type="password" value={formData.smtp_password} onChange={e => setFormData(prev => ({ ...prev, smtp_password: e.target.value }))} placeholder="请输入SMTP密码" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>发件人邮箱 *</Label>
                <Input value={formData.sender_email} onChange={e => setFormData(prev => ({ ...prev, sender_email: e.target.value }))} placeholder="noreply@example.com" />
              </div>
              <div className="space-y-2">
                <Label>发件人名称</Label>
                <Input value={formData.sender_name} onChange={e => setFormData(prev => ({ ...prev, sender_name: e.target.value }))} placeholder="系统通知" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>加密方式</Label>
              <Select value={formData.security_protocol} onValueChange={handleSecurityProtocolChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">无加密</SelectItem>
                  <SelectItem value="ssl">SSL</SelectItem>
                  <SelectItem value="tls">TLS</SelectItem>
                  <SelectItem value="starttls">STARTTLS</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {PROTOCOL_HINTS[formData.security_protocol]}
              </p>
            </div>
            <div className="space-y-2">
              <Label>状态</Label>
              <Select value={formData.status} onValueChange={v => setFormData(prev => ({ ...prev, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="enabled">启用</SelectItem>
                  <SelectItem value="disabled">停用</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              <X className="w-4 h-4 mr-1" /> 取消
            </Button>
            <Button variant="secondary" onClick={handleTestConnection} disabled={testLoading}>
              {testLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plug className="w-4 h-4 mr-1" />}
              测试连接
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />}
              {editingConfig ? "保存" : "创建"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
