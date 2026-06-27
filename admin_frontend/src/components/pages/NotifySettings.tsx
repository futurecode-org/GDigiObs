import { useState } from "react"
import { Bell, Mail, Save } from "lucide-react"
import { Card } from "@/components/shared/Card"
import { SectionHeader } from "@/components/shared/SectionHeader"
import { Btn } from "@/components/shared/Btn"
import { Toggle } from "@/components/shared/Toggle"
import { userNotifyScenarios } from "@/lib/mockData"

export function NotifySettings() {
  const [scenarios, setScenarios] = useState(userNotifyScenarios)

  const toggleEmail = (key: string) => {
    setScenarios(prev => prev.map(s => s.key === key ? { ...s, email: !s.email } : s))
  }

  const toggleBrowser = (key: string) => {
    setScenarios(prev => prev.map(s => s.key === key ? { ...s, browser: !s.browser } : s))
  }

  const handleSave = () => {
    alert("通知设置已保存")
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <Card className="p-4 mb-4">
        <SectionHeader title="通知设置" action={<Btn onClick={handleSave}><Save className="w-4 h-4" /> 保存</Btn>} />
      </Card>

      <Card>
        <div className="p-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">通知场景配置</span>
          </div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-foreground">{scenarios.filter(s => s.email).length}</div>
              <div className="text-xs text-muted-foreground mt-1">邮件通知</div>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-foreground">{scenarios.filter(s => s.browser).length}</div>
              <div className="text-xs text-muted-foreground mt-1">浏览器通知</div>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-foreground">{scenarios.length}</div>
              <div className="text-xs text-muted-foreground mt-1">通知场景</div>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-foreground">{scenarios.filter(s => s.email || s.browser).length}</div>
              <div className="text-xs text-muted-foreground mt-1">已启用</div>
            </div>
          </div>

          <div className="space-y-2">
            {scenarios.map(scenario => (
              <div key={scenario.key} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">{scenario.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{scenario.desc}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <Toggle on={scenario.email} onChange={() => toggleEmail(scenario.key)} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-muted-foreground" />
                    <Toggle on={scenario.browser} onChange={() => toggleBrowser(scenario.key)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}