import { useState } from "react"
import { User, Bell, Shield, Palette, Save, Check, Camera, Lock } from "lucide-react"
import { Card } from "@/components/shared/Card"
import { Badge } from "@/components/shared/Badge"
import { Btn } from "@/components/shared/Btn"
import { SectionHeader } from "@/components/shared/SectionHeader"
import { Toggle } from "@/components/shared/Toggle"
import { cn } from "@/lib/utils"
import { userNotifyScenarios } from "@/lib/mockData"

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<string>("profile")
  const [saveSuccess, setSaveSuccess] = useState(false)

  const tabs = [
    { key: "profile", label: "个人信息", icon: User },
    { key: "notifications", label: "通知设置", icon: Bell },
    { key: "security", label: "安全设置", icon: Shield },
    { key: "appearance", label: "外观设置", icon: Palette },
  ]

  const handleSave = () => {
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  return (
    <div className="h-full flex">
      <div className="w-64 border-r border-border flex flex-col flex-shrink-0">
        <div className="p-3 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">设置</h2>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn("w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors text-left", activeTab === tab.key ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === "profile" && (
          <div className="space-y-6">
            <SectionHeader title="个人信息" action={saveSuccess ? <Badge variant="success">保存成功</Badge> : <Btn variant="primary" size="sm" onClick={handleSave}><Save className="w-4 h-4" /> 保存</Btn>} />
            
            <Card className="p-6">
              <div className="flex items-center gap-6 mb-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center text-xl font-semibold text-primary">
                    张
                  </div>
                  <button className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">张伟</h3>
                  <p className="text-sm text-muted-foreground">zhangwei@corp.com</p>
                  <Badge variant="muted" className="mt-2">普通用户</Badge>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">用户名</label>
                    <input type="text" defaultValue="张伟" className="w-full px-3 py-2 bg-muted border border-transparent rounded-lg text-sm focus:outline-none focus:border-primary transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">昵称</label>
                    <input type="text" defaultValue="数据分析师" className="w-full px-3 py-2 bg-muted border border-transparent rounded-lg text-sm focus:outline-none focus:border-primary transition-colors" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">邮箱</label>
                    <div className="flex items-center gap-2">
                      <input type="email" defaultValue="zhangwei@corp.com" className="flex-1 px-3 py-2 bg-muted border border-transparent rounded-lg text-sm focus:outline-none focus:border-primary transition-colors" />
                      <Badge variant="success">已验证</Badge>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">手机号</label>
                    <div className="flex items-center gap-2">
                      <input type="tel" defaultValue="138****8888" className="flex-1 px-3 py-2 bg-muted border border-transparent rounded-lg text-sm focus:outline-none focus:border-primary transition-colors" />
                      <Badge variant="success">已验证</Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-muted-foreground mb-1">所属部门</label>
                  <input type="text" defaultValue="数据部 - 数据分析组" className="w-full px-3 py-2 bg-muted border border-transparent rounded-lg text-sm focus:outline-none focus:border-primary transition-colors" />
                </div>

                <div>
                  <label className="block text-xs text-muted-foreground mb-1">职位</label>
                  <input type="text" defaultValue="高级数据分析师" className="w-full px-3 py-2 bg-muted border border-transparent rounded-lg text-sm focus:outline-none focus:border-primary transition-colors" />
                </div>

                <div>
                  <label className="block text-xs text-muted-foreground mb-1">个人简介</label>
                  <textarea defaultValue="专注于数据分析与舆情监控领域，擅长使用AI工具提升工作效率。" rows={3} className="w-full px-3 py-2 bg-muted border border-transparent rounded-lg text-sm focus:outline-none focus:border-primary transition-colors resize-none" />
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="space-y-6">
            <SectionHeader title="通知设置" action={saveSuccess ? <Badge variant="success">保存成功</Badge> : <Btn variant="primary" size="sm" onClick={handleSave}><Save className="w-4 h-4" /> 保存</Btn>} />
            
            <Card className="p-6">
              <div className="space-y-3">
                {userNotifyScenarios.map(scenario => (
                  <div key={scenario.key} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <div className="text-sm font-medium text-foreground">{scenario.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{scenario.desc}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">邮件</span>
                        <Toggle on={scenario.email} onChange={() => {}} />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">浏览器</span>
                        <Toggle on={scenario.browser} onChange={() => {}} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeTab === "security" && (
          <div className="space-y-6">
            <SectionHeader title="安全设置" />
            
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-foreground">修改密码</div>
                    <div className="text-xs text-muted-foreground mt-0.5">定期更换密码以保障账号安全</div>
                  </div>
                  <Btn variant="outline" size="sm"><Lock className="w-4 h-4" /> 修改</Btn>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-foreground">两步验证</div>
                    <div className="text-xs text-muted-foreground mt-0.5">启用后登录需要验证</div>
                  </div>
                  <Badge variant="success">已启用</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-foreground">登录设备管理</div>
                    <div className="text-xs text-muted-foreground mt-0.5">查看并管理当前登录的设备</div>
                  </div>
                  <Btn variant="outline" size="sm">管理</Btn>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-foreground">API Token</div>
                    <div className="text-xs text-muted-foreground mt-0.5">用于第三方应用调用API</div>
                  </div>
                  <Btn variant="outline" size="sm">管理</Btn>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === "appearance" && (
          <div className="space-y-6">
            <SectionHeader title="外观设置" action={saveSuccess ? <Badge variant="success">保存成功</Badge> : <Btn variant="primary" size="sm" onClick={handleSave}><Save className="w-4 h-4" /> 保存</Btn>} />
            
            <Card className="p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-xs text-muted-foreground mb-3">主题模式</label>
                  <div className="flex gap-3">
                    <button className="flex-1 p-4 bg-primary/10 border-2 border-primary rounded-lg text-center">
                      <div className="text-sm font-medium text-foreground">浅色模式</div>
                      <Check className="w-5 h-5 text-primary mx-auto mt-2" />
                    </button>
                    <button className="flex-1 p-4 bg-muted border-2 border-transparent rounded-lg text-center hover:border-border transition-colors">
                      <div className="text-sm font-medium text-foreground">深色模式</div>
                    </button>
                    <button className="flex-1 p-4 bg-muted border-2 border-transparent rounded-lg text-center hover:border-border transition-colors">
                      <div className="text-sm font-medium text-foreground">跟随系统</div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-muted-foreground mb-3">语言</label>
                  <select className="w-full px-3 py-2 bg-muted border border-transparent rounded-lg text-sm focus:outline-none focus:border-primary transition-colors">
                    <option>中文 (简体)</option>
                    <option>English</option>
                    <option>中文 (繁体)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-muted-foreground mb-3">字体大小</label>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground">小</span>
                    <input type="range" defaultValue={50} min={0} max={100} className="flex-1" />
                    <span className="text-xs text-muted-foreground">大</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-foreground">紧凑布局</div>
                    <div className="text-xs text-muted-foreground mt-0.5">减少间距，显示更多内容</div>
                  </div>
                  <Toggle on={false} onChange={() => {}} />
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-foreground">动画效果</div>
                    <div className="text-xs text-muted-foreground mt-0.5">页面切换和交互动画</div>
                  </div>
                  <Toggle on={true} onChange={() => {}} />
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}