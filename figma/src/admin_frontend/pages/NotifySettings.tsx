import { useState } from "react"
import { Radio, CheckCircle } from "lucide-react"
import { Card, Toggle, Btn } from "@/shared/ui"

export function NotifySettingsPage() {
  const [emailEnabled, setEmailEnabled] = useState(true)
  const [browserEnabled, setBrowserEnabled] = useState(true)

  const notifyScenarios = [
    { label: "好友申请通知", email: true, browser: true },
    { label: "群邀请通知", email: false, browser: true },
    { label: "入群审批通知", email: true, browser: true },
    { label: "审计告警通知", email: true, browser: true },
    { label: "数字员工执行完成", email: false, browser: true },
    { label: "工作流执行失败", email: true, browser: true },
    { label: "问数任务完成", email: false, browser: true },
    { label: "用户封禁通知", email: true, browser: true },
  ]

  return (
    <div className="p-6 space-y-5 h-full overflow-auto max-w-3xl">
      <div>
        <h2 className="text-base font-semibold">通知设置</h2>
        <p className="text-xs text-muted-foreground mt-0.5">配置邮件服务、浏览器通知和各场景通知策略</p>
      </div>

      {/* Email Config */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">邮件服务配置</h3>
            <p className="text-xs text-muted-foreground mt-0.5">用于发送系统邮件通知</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">全局启用</span>
            <Toggle on={emailEnabled} onChange={() => setEmailEnabled(v => !v)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "SMTP 服务器", placeholder: "smtp.example.com" },
            { label: "端口", placeholder: "465" },
            { label: "发件人邮箱", placeholder: "noreply@corp.com" },
            { label: "发件人名称", placeholder: "数智瞭望系统" },
          ].map(f => (
            <div key={f.label} className="space-y-1">
              <label className="text-xs text-muted-foreground">{f.label}</label>
              <input className="w-full bg-input-background border border-border rounded px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" placeholder={f.placeholder} />
            </div>
          ))}
          <div className="space-y-1 col-span-2">
            <label className="text-xs text-muted-foreground">SMTP 密码</label>
            <div className="flex gap-2">
              <input type="password" className="flex-1 bg-input-background border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary/50" placeholder="••••••••••••" />
              <Btn variant="outline" size="sm"><Radio className="w-3.5 h-3.5" />测试连接</Btn>
            </div>
          </div>
        </div>
      </Card>

      {/* Browser Notify */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">浏览器通知</h3>
            <p className="text-xs text-muted-foreground mt-0.5">通过浏览器推送实时通知</p>
          </div>
          <Toggle on={browserEnabled} onChange={() => setBrowserEnabled(v => !v)} />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">通知图标 URL（可选）</label>
          <input className="w-full bg-input-background border border-border rounded px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" placeholder="https://..." />
        </div>
      </Card>

      {/* Scenario Config */}
      <Card className="p-5 space-y-4">
        <h3 className="text-sm font-semibold">通知场景配置</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["通知场景", "邮件通知", "浏览器通知"].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-xs text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {notifyScenarios.map(s => (
                <tr key={s.label} className="border-b border-border/50">
                  <td className="py-2.5 px-3 text-sm text-foreground">{s.label}</td>
                  <td className="py-2.5 px-3">
                    <input type="checkbox" defaultChecked={s.email} className="accent-primary" />
                  </td>
                  <td className="py-2.5 px-3">
                    <input type="checkbox" defaultChecked={s.browser} className="accent-primary" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Btn size="sm"><CheckCircle className="w-4 h-4" />保存配置</Btn>
      </Card>
    </div>
  )
}
