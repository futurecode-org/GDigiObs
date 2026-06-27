import { useState } from "react"
import { CheckCircle } from "lucide-react"
import { cn } from "@/shared/utils"
import { Card, Toggle, Btn } from "@/shared/ui"

export function PlatformConfigPage() {
  const [tab, setTab] = useState<"basic" | "register" | "public" | "security">("basic")

  return (
    <div className="p-6 space-y-5 h-full overflow-auto max-w-3xl">
      <div>
        <h2 className="text-base font-semibold">平台配置</h2>
        <p className="text-xs text-muted-foreground mt-0.5">平台基础参数、注册策略、公开数据规则和安全设置</p>
      </div>

      <div className="flex gap-1 bg-muted/40 rounded-lg p-1 w-fit">
        {(["basic", "register", "public", "security"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn("px-4 py-1.5 text-sm rounded font-medium transition-colors",
            tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}>
            {t === "basic" ? "基础参数" : t === "register" ? "注册策略" : t === "public" ? "公开数据" : "安全设置"}
          </button>
        ))}
      </div>

      {tab === "basic" && (
        <Card className="p-5 space-y-4">
          <h3 className="text-sm font-semibold">基础参数</h3>
          {[
            { label: "平台名称", value: "数智瞭望系统", type: "text" },
            { label: "平台 Logo URL", value: "", placeholder: "https://...", type: "text" },
            { label: "平台域名", value: "lookout.corp.com", type: "text" },
            { label: "管理员邮箱", value: "admin@corp.com", type: "email" },
          ].map(f => (
            <div key={f.label} className="space-y-1">
              <label className="text-xs text-muted-foreground">{f.label}</label>
              <input type={f.type} defaultValue={f.value} placeholder={(f as { placeholder?: string }).placeholder} className="w-full bg-input-background border border-border rounded px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
            </div>
          ))}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">平台介绍</label>
            <textarea rows={3} defaultValue="企业内部协同 + AI 问数平台" className="w-full bg-input-background border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary/50 resize-none" />
          </div>
          <Btn size="sm"><CheckCircle className="w-4 h-4" />保存</Btn>
        </Card>
      )}

      {tab === "register" && (
        <Card className="p-5 space-y-4">
          <h3 className="text-sm font-semibold">注册策略</h3>
          {[
            { label: "允许外部用户注册", desc: "关闭后仅限邀请码注册", on: true },
            { label: "注册后自动创建个人租户", desc: "未绑定企业时自动建立独立租户", on: true },
            { label: "需要邮件验证码", desc: "注册时需要验证邮箱", on: true },
            { label: "需要手机号验证", desc: "注册时需要验证手机", on: false },
            { label: "允许外部用户与内部用户加好友", desc: "关闭后外部用户无法添加内部员工", on: true },
          ].map(s => (
            <div key={s.label} className="flex items-center justify-between py-1">
              <div>
                <div className="text-sm text-foreground">{s.label}</div>
                <div className="text-xs text-muted-foreground">{s.desc}</div>
              </div>
              <Toggle on={s.on} onChange={() => {}} />
            </div>
          ))}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">邀请码有效期（天）</label>
            <input type="number" defaultValue={7} className="w-32 bg-input-background border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary/50" />
          </div>
          <Btn size="sm"><CheckCircle className="w-4 h-4" />保存</Btn>
        </Card>
      )}

      {tab === "public" && (
        <Card className="p-5 space-y-4">
          <h3 className="text-sm font-semibold">公开数据规则</h3>
          <p className="text-xs text-muted-foreground">控制哪些数据可以被外部注册用户访问</p>
          {[
            { label: "允许外部用户查看公开采集数据", desc: "is_public=true 的采集数据对外开放", on: true },
            { label: "允许外部用户查看公开分析结果", desc: "分析结果发布为公开时可被外部访问", on: true },
            { label: "允许外部用户查看公开知识库", desc: "设为公开的知识库对外开放", on: true },
            { label: "允许外部用户使用公开技能", desc: "审核通过的公开技能对外可用", on: false },
            { label: "公开数据需要管理员审核", desc: "采集数据设为公开时需要审核确认", on: true },
          ].map(s => (
            <div key={s.label} className="flex items-center justify-between py-1">
              <div>
                <div className="text-sm text-foreground">{s.label}</div>
                <div className="text-xs text-muted-foreground">{s.desc}</div>
              </div>
              <Toggle on={s.on} onChange={() => {}} />
            </div>
          ))}
          <Btn size="sm"><CheckCircle className="w-4 h-4" />保存</Btn>
        </Card>
      )}

      {tab === "security" && (
        <Card className="p-5 space-y-4">
          <h3 className="text-sm font-semibold">安全设置</h3>
          {[
            { label: "Token 过期时间（小时）", value: "24", type: "number" },
            { label: "最大登录失败次数", value: "5", type: "number" },
            { label: "账号锁定时长（分钟）", value: "30", type: "number" },
            { label: "密码最小长度", value: "8", type: "number" },
          ].map(f => (
            <div key={f.label} className="space-y-1">
              <label className="text-xs text-muted-foreground">{f.label}</label>
              <input type={f.type} defaultValue={f.value} className="w-32 bg-input-background border border-border rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary/50" />
            </div>
          ))}
          {[
            { label: "密码必须包含数字", on: true },
            { label: "密码必须包含字母", on: true },
            { label: "密码必须包含特殊字符", on: false },
            { label: "启用 IP 白名单（管理端）", on: false },
          ].map(s => (
            <div key={s.label} className="flex items-center justify-between py-1">
              <div className="text-sm text-foreground">{s.label}</div>
              <Toggle on={s.on} onChange={() => {}} />
            </div>
          ))}
          <Btn size="sm"><CheckCircle className="w-4 h-4" />保存</Btn>
        </Card>
      )}
    </div>
  )
}
