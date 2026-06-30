import { useState, useEffect } from "react"
import { User, Shield, Bell, Save, Loader2, Eye, EyeOff, Mail, MonitorSmartphone } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { authApi, userApi, notificationSettingApi } from "@/lib/api"
import type { CurrentUserResponse, NotificationSetting } from "@/lib/types"
import { toast } from "sonner"

const SCENE_LABELS: Record<string, { label: string; desc: string }> = {
  friend_application: { label: "好友申请", desc: "收到好友申请时通知" },
  group_invitation: { label: "群邀请", desc: "被邀请加入群组时通知" },
  group_join_approval: { label: "入群审批", desc: "有用户申请加入您管理的群组时通知" },
  audit_alert: { label: "审计告警", desc: "系统检测到高风险内容时通知" },
  agent_completed: { label: "数字员工执行完成", desc: "数字员工任务执行完成时通知" },
  workflow_failed: { label: "工作流失败", desc: "工作流执行失败时通知" },
  query_completed: { label: "问数任务完成", desc: "智能问数任务完成时通知" },
  user_banned: { label: "用户封禁", desc: "账号被封禁或解封时通知" },
}

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile")
  const [user, setUser] = useState<CurrentUserResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [saveLoading, setSaveLoading] = useState(false)
  const [changePwdLoading, setChangePwdLoading] = useState(false)
  const [showOldPwd, setShowOldPwd] = useState(false)
  const [showNewPwd, setShowNewPwd] = useState(false)
  const [showConfirmPwd, setShowConfirmPwd] = useState(false)
  const [notifLoading, setNotifLoading] = useState(false)

  const [profileForm, setProfileForm] = useState({
    nickname: "",
    email: "",
    phone: "",
  })

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [notificationSettings, setNotificationSettings] = useState<NotificationSetting | null>(null)

  const [profileError, setProfileError] = useState("")
  const [profileSuccess, setProfileSuccess] = useState("")
  const [pwdError, setPwdError] = useState("")
  const [pwdSuccess, setPwdSuccess] = useState("")

  useEffect(() => {
    fetchUserInfo()
    fetchNotificationSettings()
  }, [])

  const fetchUserInfo = async () => {
    setIsLoading(true)
    try {
      const userInfo = await authApi.getMe()
      setUser(userInfo)
      setProfileForm({
        nickname: userInfo.nickname || "",
        email: userInfo.email || "",
        phone: userInfo.phone || "",
      })
    } catch (error) {
      console.error("获取用户信息失败:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchNotificationSettings = async () => {
    try {
      const settings = await notificationSettingApi.getSettings()
      setNotificationSettings(settings)
    } catch (error) {
      console.error("获取通知设置失败:", error)
    }
  }

  const handleProfileChange = (field: string, value: string) => {
    setProfileForm(prev => ({ ...prev, [field]: value }))
    setProfileError("")
    setProfileSuccess("")
  }

  const handleProfileSave = async () => {
    if (!profileForm.nickname.trim()) {
      setProfileError("昵称不能为空")
      return
    }

    setSaveLoading(true)
    try {
      await userApi.update(user!.id, {
        nickname: profileForm.nickname,
        email: profileForm.email || null,
        phone: profileForm.phone || null,
      })
      setProfileSuccess("资料修改成功")
      await fetchUserInfo()
      setTimeout(() => setProfileSuccess(""), 3000)
    } catch (error: any) {
      setProfileError(error.message || "修改失败")
    } finally {
      setSaveLoading(false)
    }
  }

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordForm(prev => ({ ...prev, [field]: value }))
    setPwdError("")
    setPwdSuccess("")
  }

  const handlePasswordSave = async () => {
    if (!passwordForm.oldPassword) {
      setPwdError("请输入旧密码")
      return
    }
    if (!passwordForm.newPassword) {
      setPwdError("请输入新密码")
      return
    }
    if (passwordForm.newPassword.length < 8) {
      setPwdError("新密码长度不能少于8位")
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPwdError("两次输入的新密码不一致")
      return
    }

    setChangePwdLoading(true)
    try {
      await authApi.changePassword(passwordForm.oldPassword, passwordForm.newPassword)
      setPwdSuccess("密码修改成功，请重新登录")
      setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" })
      setTimeout(() => {
        window.location.href = "/login"
      }, 2000)
    } catch (error: any) {
      setPwdError(error.message || "修改失败")
    } finally {
      setChangePwdLoading(false)
    }
  }

  const handleGlobalToggle = (field: "browser_enabled" | "email_enabled", checked: boolean) => {
    setNotificationSettings(prev => prev ? { ...prev, [field]: checked } : null)
  }

  const handleSceneToggle = (scene: string, channel: "browser" | "email", checked: boolean) => {
    setNotificationSettings(prev => {
      if (!prev) return prev
      const scenes = { ...(prev.scene_settings || {}) }
      scenes[scene] = { ...scenes[scene], [channel]: checked }
      return { ...prev, scene_settings: scenes }
    })
  }

  const handleNotificationSave = async () => {
    if (!notificationSettings) return
    setNotifLoading(true)
    try {
      await notificationSettingApi.updateSettings({
        browser_enabled: notificationSettings.browser_enabled,
        email_enabled: notificationSettings.email_enabled,
        scene_settings: notificationSettings.scene_settings,
      })
      toast.success("通知设置已保存")
    } catch (error: any) {
      toast.error(error.message || "保存失败")
    } finally {
      setNotifLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto max-w-3xl mx-auto p-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="profile" className="gap-2">
            <User className="w-4 h-4" />
            个人资料
          </TabsTrigger>
          <TabsTrigger value="password" className="gap-2">
            <Shield className="w-4 h-4" />
            修改密码
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            通知设置
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                个人资料
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profileError && (
                <Alert variant="destructive">
                  <AlertTitle>修改失败</AlertTitle>
                  <AlertDescription>{profileError}</AlertDescription>
                </Alert>
              )}
              {profileSuccess && (
                <Alert className="bg-green-50 border-green-200 text-green-800">
                  <AlertTitle className="text-green-800">修改成功</AlertTitle>
                  <AlertDescription className="text-green-700">{profileSuccess}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">用户名</Label>
                  <Input id="username" type="text" value={user?.username || ""} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nickname">昵称 *</Label>
                  <Input id="nickname" type="text" value={profileForm.nickname} onChange={e => handleProfileChange("nickname", e.target.value)} placeholder="请输入昵称" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">邮箱</Label>
                  <Input id="email" type="email" value={profileForm.email} onChange={e => handleProfileChange("email", e.target.value)} placeholder="请输入邮箱" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">手机号</Label>
                  <Input id="phone" type="tel" value={profileForm.phone} onChange={e => handleProfileChange("phone", e.target.value)} placeholder="请输入手机号" />
                </div>
                <div className="space-y-2">
                  <Label>用户类型</Label>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{user?.user_type === "admin" ? "管理员" : user?.user_type === "internal" ? "内部用户" : "外部用户"}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>所属租户</Label>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{user?.tenant_name || "个人租户"}</span>
                    <span className="text-xs px-2 py-0.5 bg-muted rounded">{user?.tenant_type === "enterprise" ? "企业" : "个人"}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>最后登录时间</Label>
                  <div className="text-sm text-muted-foreground">{user?.last_login_at ? new Date(user.last_login_at).toLocaleString() : "从未登录"}</div>
                </div>
              </div>

              <Button onClick={handleProfileSave} disabled={saveLoading} className="mt-4">
                {saveLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                保存修改
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                修改密码
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pwdError && (
                <Alert variant="destructive">
                  <AlertTitle>修改失败</AlertTitle>
                  <AlertDescription>{pwdError}</AlertDescription>
                </Alert>
              )}
              {pwdSuccess && (
                <Alert className="bg-green-50 border-green-200 text-green-800">
                  <AlertTitle className="text-green-800">修改成功</AlertTitle>
                  <AlertDescription className="text-green-700">{pwdSuccess}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="oldPassword">旧密码 *</Label>
                  <div className="relative">
                    <Input id="oldPassword" type={showOldPwd ? "text" : "password"} value={passwordForm.oldPassword} onChange={e => handlePasswordChange("oldPassword", e.target.value)} placeholder="请输入旧密码" className="pr-10" />
                    <Button type="button" variant="ghost" size="icon-sm" className="absolute right-0 top-0 h-full" onClick={() => setShowOldPwd(!showOldPwd)}>
                      {showOldPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">新密码 *</Label>
                  <div className="relative">
                    <Input id="newPassword" type={showNewPwd ? "text" : "password"} value={passwordForm.newPassword} onChange={e => handlePasswordChange("newPassword", e.target.value)} placeholder="请输入新密码（至少8位）" className="pr-10" />
                    <Button type="button" variant="ghost" size="icon-sm" className="absolute right-0 top-0 h-full" onClick={() => setShowNewPwd(!showNewPwd)}>
                      {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">密码长度至少8位，建议包含字母和数字</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">确认新密码 *</Label>
                  <div className="relative">
                    <Input id="confirmPassword" type={showConfirmPwd ? "text" : "password"} value={passwordForm.confirmPassword} onChange={e => handlePasswordChange("confirmPassword", e.target.value)} placeholder="请再次输入新密码" className="pr-10" />
                    <Button type="button" variant="ghost" size="icon-sm" className="absolute right-0 top-0 h-full" onClick={() => setShowConfirmPwd(!showConfirmPwd)}>
                      {showConfirmPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              <Button onClick={handlePasswordSave} disabled={changePwdLoading} className="mt-4">
                {changePwdLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                修改密码
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                通知设置
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-sm font-medium">全局通知开关</h4>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="flex items-center gap-2"><MonitorSmartphone className="w-4 h-4" /> 浏览器通知</Label>
                    <p className="text-xs text-muted-foreground">在浏览器中接收弹窗通知</p>
                  </div>
                  <Switch checked={notificationSettings?.browser_enabled ?? true} onCheckedChange={checked => handleGlobalToggle("browser_enabled", checked)} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="flex items-center gap-2"><Mail className="w-4 h-4" /> 邮件通知</Label>
                    <p className="text-xs text-muted-foreground">通过邮件接收重要通知</p>
                  </div>
                  <Switch checked={notificationSettings?.email_enabled ?? false} onCheckedChange={checked => handleGlobalToggle("email_enabled", checked)} />
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <h4 className="text-sm font-medium mb-4">场景通知偏好</h4>
                <div className="space-y-4">
                  {Object.entries(SCENE_LABELS).map(([scene, { label, desc }]) => {
                    const sceneConfig = notificationSettings?.scene_settings?.[scene] || {}
                    return (
                      <div key={scene} className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
                        <div className="space-y-1">
                          <Label className="text-sm">{label}</Label>
                          <p className="text-xs text-muted-foreground">{desc}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">浏览器</span>
                            <Switch checked={sceneConfig.browser ?? true} onCheckedChange={checked => handleSceneToggle(scene, "browser", checked)} />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">邮件</span>
                            <Switch checked={sceneConfig.email ?? false} onCheckedChange={checked => handleSceneToggle(scene, "email", checked)} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <Button onClick={handleNotificationSave} disabled={notifLoading} className="mt-4">
                {notifLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                保存设置
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
