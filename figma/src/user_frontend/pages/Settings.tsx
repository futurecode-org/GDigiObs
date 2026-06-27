import { useState } from "react"
import { Bell, Inbox, CheckCircle } from "lucide-react"
import { cn } from "@/shared/utils"
import { Card, Btn, Toggle } from "@/shared/ui"
import { userNotifyScenarios } from "@/shared/mockData"

export function SimpleSettings() {
  const [emailOn,   setEmailOn]   = useState(false)
  const [browserOn, setBrowserOn] = useState(true)
  const [scenarios, setScenarios] = useState(userNotifyScenarios)

  const toggleScenario = (key: string, channel: "email" | "browser") => {
    setScenarios(prev => prev.map(s => s.key === key ? { ...s, [channel]: !s[channel] } : s))
  }

  return (
    <div className="p-6 max-w-2xl space-y-6 h-full overflow-auto">
      <h2 className="text-base font-semibold">个人设置</h2>

      {/* Account */}
      <Card className="p-5 space-y-4">
        <h3 className="text-sm font-medium">账号信息</h3>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center text-xl font-semibold text-primary">张</div>
          <div>
            <div className="text-sm font-medium text-foreground">张伟</div>
            <div className="text-xs text-muted-foreground">zhangwei@corp.com · 数智科技 · 数据部</div>
            <Btn variant="outline" size="xs" className="mt-1.5">修改头像</Btn>
          </div>
        </div>
        {[
          { label: "昵称",  value: "张伟" },
          { label: "邮箱",  value: "zhangwei@corp.com" },
          { label: "手机号", value: "138****8888" },
        ].map(f => (
          <div key={f.label} className="space-y-1">
            <label className="text-xs text-muted-foreground">{f.label}</label>
            <div className="flex gap-2">
              <input defaultValue={f.value} className="flex-1 bg-input-background border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary/50" />
              <Btn variant="outline" size="xs">修改</Btn>
            </div>
          </div>
        ))}
      </Card>

      {/* Notification channels */}
      <Card className="p-5 space-y-4">
        <h3 className="text-sm font-medium">通知渠道</h3>
        <div className="space-y-3">
          {[
            { key: "browser", label: "浏览器通知", desc: "通过浏览器 Web Push 实时推送，需要授权通知权限", on: browserOn, set: setBrowserOn },
            { key: "email",   label: "邮件通知",   desc: "将重要事件发送至你的注册邮箱", on: emailOn, set: setEmailOn },
          ].map(ch => (
            <div key={ch.key} className="flex items-center justify-between py-1">
              <div>
                <div className="text-sm text-foreground">{ch.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{ch.desc}</div>
              </div>
              <Toggle on={ch.on} onChange={() => ch.set(v => !v)} />
            </div>
          ))}
        </div>
      </Card>

      {/* Per-scenario config */}
      <Card className="p-5 space-y-3">
        <div>
          <h3 className="text-sm font-medium">通知场景配置</h3>
          <p className="text-xs text-muted-foreground mt-0.5">精细控制每种事件通过哪些渠道通知你</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 text-xs text-muted-foreground font-medium">通知场景</th>
                <th className="text-center py-2 px-3 text-xs font-medium">
                  <div className={cn("flex flex-col items-center gap-0.5", !browserOn && "opacity-40")}>
                    <Bell className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">浏览器</span>
                  </div>
                </th>
                <th className="text-center py-2 px-3 text-xs font-medium">
                  <div className={cn("flex flex-col items-center gap-0.5", !emailOn && "opacity-40")}>
                    <Inbox className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">邮件</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map(s => (
                <tr key={s.key} className="border-b border-border/40 hover:bg-muted/20 transition-colors">
                  <td className="py-2.5 px-2">
                    <div className="text-sm text-foreground">{s.label}</div>
                    <div className="text-[10px] text-muted-foreground">{s.desc}</div>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <div className={cn(!browserOn && "opacity-30 pointer-events-none")}>
                      <input
                        type="checkbox"
                        checked={s.browser}
                        onChange={() => toggleScenario(s.key, "browser")}
                        className="w-4 h-4 accent-primary cursor-pointer"
                      />
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <div className={cn(!emailOn && "opacity-30 pointer-events-none")}>
                      <input
                        type="checkbox"
                        checked={s.email}
                        onChange={() => toggleScenario(s.key, "email")}
                        className="w-4 h-4 accent-primary cursor-pointer"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Btn size="sm" className="mt-1"><CheckCircle className="w-4 h-4" />保存设置</Btn>
      </Card>

      {/* Privacy */}
      <Card className="p-5 space-y-3">
        <h3 className="text-sm font-medium">隐私设置</h3>
        {[
          { label: "允许陌生人查看我的资料", desc: "关闭后仅好友可查看", on: true  },
          { label: "允许通过手机号搜索我",   desc: "关闭后不可被手机号查找", on: true  },
          { label: "允许通过邮箱搜索我",     desc: "关闭后不可被邮箱查找",  on: false },
        ].map((s, i) => {
          const [on, setOn] = useState(s.on)
          return (
            <div key={i} className="flex items-center justify-between py-1">
              <div>
                <div className="text-sm text-foreground">{s.label}</div>
                <div className="text-xs text-muted-foreground">{s.desc}</div>
              </div>
              <Toggle on={on} onChange={() => setOn(v => !v)} />
            </div>
          )
        })}
      </Card>
    </div>
  )
}
