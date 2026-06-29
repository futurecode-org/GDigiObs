import { useState, useEffect } from "react"
import { User, Shield, Bell, Save, Loader2, Eye, EyeOff } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { authApi, userApi } from "@/lib/api"
import type { CurrentUserResponse } from "@/lib/types"

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile")
  const [user, setUser] = useState<CurrentUserResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [saveLoading, setSaveLoading] = useState(false)
  const [changePwdLoading, setChangePwdLoading] = useState(false)
  const [showOldPwd, setShowOldPwd] = useState(false)
  const [showNewPwd, setShowNewPwd] = useState(false)
  const [showConfirmPwd, setShowConfirmPwd] = useState(false)

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

  const [notificationSettings, setNotificationSettings] = useState({
    system: true,
    task: true,
    message: true,
    approval: true,
    email: false,
    sms: false,
  })

  const [profileError, setProfileError] = useState("")
  const [profileSuccess, setProfileSuccess] = useState("")
  const [pwdError, setPwdError] = useState("")
  const [pwdSuccess, setPwdSuccess] = useState("")

  useEffect(() => {
    fetchUserInfo()
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

  const handleNotificationToggle = (setting: string, checked: boolean) => {
    setNotificationSettings(prev => ({ ...prev, [setting]: checked }))
  }

  const handleNotificationSave = async () => {
    console.log("保存通知设置:", notificationSettings)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
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
                  <Input
                    id="username"
                    type="text"
                    value={user?.username || ""}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nickname">昵称 *</Label>
                  <Input
                    id="nickname"
                    type="text"
                    value={profileForm.nickname}
                    onChange={e => handleProfileChange("nickname", e.target.value)}
                    placeholder="请输入昵称"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">邮箱</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileForm.email}
                    onChange={e => handleProfileChange("email", e.target.value)}
                    placeholder="请输入邮箱"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">手机号</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={profileForm.phone}
                    onChange={e => handleProfileChange("phone", e.target.value)}
                    placeholder="请输入手机号"
                  />
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
                    <span className="text-xs px-2 py-0.5 bg-muted rounded">
                      {user?.tenant_type === "enterprise" ? "企业" : "个人"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>最后登录时间</Label>
                  <div className="text-sm text-muted-foreground">
                    {user?.last_login_at ? new Date(user.last_login_at).toLocaleString() : "从未登录"}
                  </div>
                </div>
              </div>

              <Button onClick={handleProfileSave} disabled={saveLoading} className="mt-4">
                {saveLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
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
                    <Input
                      id="oldPassword"
                      type={showOldPwd ? "text" : "password"}
                      value={passwordForm.oldPassword}
                      onChange={e => handlePasswordChange("oldPassword", e.target.value)}
                      placeholder="请输入旧密码"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowOldPwd(!showOldPwd)}
                    >
                      {showOldPwd ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">新密码 *</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPwd ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={e => handlePasswordChange("newPassword", e.target.value)}
                      placeholder="请输入新密码（至少8位）"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowNewPwd(!showNewPwd)}
                    >
                      {showNewPwd ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">密码长度至少8位，建议包含字母和数字</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">确认新密码 *</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPwd ? "text" : "password"}
                      value={passwordForm.confirmPassword}
                      onChange={e => handlePasswordChange("confirmPassword", e.target.value)}
                      placeholder="请再次输入新密码"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                    >
                      {showConfirmPwd ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <Button onClick={handlePasswordSave} disabled={changePwdLoading} className="mt-4">
                {changePwdLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
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
              <div>
                <h4 className="text-sm font-medium mb-4">消息通知</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>系统通知</Label>
                      <p className="text-xs text-muted-foreground">接收系统公告和重要更新</p>
                    </div>
                    <Switch
                      checked={notificationSettings.system}
                      onCheckedChange={checked => handleNotificationToggle("system", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>任务通知</Label>
                      <p className="text-xs text-muted-foreground">接收任务分配和进度更新</p>
                    </div>
                    <Switch
                      checked={notificationSettings.task}
                      onCheckedChange={checked => handleNotificationToggle("task", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>消息通知</Label>
                      <p className="text-xs text-muted-foreground">接收好友消息和群组消息</p>
                    </div>
                    <Switch
                      checked={notificationSettings.message}
                      onCheckedChange={checked => handleNotificationToggle("message", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>审批通知</Label>
                      <p className="text-xs text-muted-foreground">接收审批申请和结果通知</p>
                    </div>
                    <Switch
                      checked={notificationSettings.approval}
                      onCheckedChange={checked => handleNotificationToggle("approval", checked)}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <h4 className="text-sm font-medium mb-4">外部通知</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>邮件通知</Label>
                      <p className="text-xs text-muted-foreground">通过邮件接收重要通知</p>
                    </div>
                    <Switch
                      checked={notificationSettings.email}
                      onCheckedChange={checked => handleNotificationToggle("email", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>短信通知</Label>
                      <p className="text-xs text-muted-foreground">通过短信接收紧急通知</p>
                    </div>
                    <Switch
                      checked={notificationSettings.sms}
                      onCheckedChange={checked => handleNotificationToggle("sms", checked)}
                    />
                  </div>
                </div>
              </div>

              <Button onClick={handleNotificationSave} className="mt-4">
                <Save className="w-4 h-4 mr-2" />
                保存设置
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}