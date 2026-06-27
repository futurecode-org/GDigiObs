import { useState } from "react"
import { BarChart2, Eye, EyeOff, Lock, Shield, ChevronLeft, UserPlus, CheckCircle } from "lucide-react"
import { cn } from "@/shared/utils"
import { Card, Btn } from "@/shared/ui"
import type { AppView } from "@/shared/types"
import { UserApp } from "@/user_frontend/UserApp"
import { AdminApp } from "@/admin_frontend/AdminApp"

function LoginPage({ onLogin, onGoRegister }: { onLogin: (isAdmin: boolean) => void; onGoRegister: () => void }) {
  const [showPw, setShowPw] = useState(false)
  const [email, setEmail] = useState("admin@corp.com")
  const [pw, setPw] = useState("password123")

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(79,132,245,0.08)_0%,transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_30%,rgba(14,116,144,0.06)_0%,transparent_60%)] pointer-events-none" />

      <div className="w-full max-w-sm space-y-8 relative">
        {/* Logo */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
              <BarChart2 className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight">数智瞭望系统</h1>
          </div>
          <p className="text-sm text-muted-foreground">企业智能数据分析与协同平台</p>
        </div>

        {/* Card */}
        <Card className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">邮箱 / 手机号</label>
            <input
              value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-input-background border border-border rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
              placeholder="请输入邮箱或手机号"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">密码</label>
            <div className="relative">
              <input
                value={pw} onChange={e => setPw(e.target.value)}
                type={showPw ? "text" : "password"}
                className="w-full bg-input-background border border-border rounded px-3 py-2 pr-9 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                placeholder="请输入密码"
              />
              <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Btn className="w-full justify-center" size="md" onClick={() => onLogin(email.includes("admin"))}>
              <Lock className="w-4 h-4" /> 登录
            </Btn>
            <Btn variant="outline" className="w-full justify-center" size="md" onClick={() => onLogin(true)}>
              <Shield className="w-4 h-4" /> 进入管理端演示
            </Btn>
          </div>
          <div className="text-center text-xs text-muted-foreground">
            还没有账号？
            <button onClick={onGoRegister} className="text-primary hover:underline ml-1">立即注册</button>
          </div>
        </Card>

        <div className="text-center text-xs text-muted-foreground/50 font-mono">
          SHUZHI LOOKOUT PLATFORM v1.0
        </div>
      </div>
    </div>
  )
}

function RegisterPage({ onBack }: { onBack: () => void }) {
  const [showPw, setShowPw] = useState(false)
  const [step, setStep] = useState<"form" | "success">("form")

  if (step === "success") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 max-w-sm w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-lg font-semibold">注册成功！</h2>
          <p className="text-sm text-muted-foreground">已为您创建个人租户，即将跳转至用户端</p>
          <Btn size="md" className="w-full justify-center" onClick={onBack}>返回登录</Btn>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,rgba(14,116,144,0.06)_0%,transparent_60%)] pointer-events-none" />
      <div className="w-full max-w-sm space-y-6 relative">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold">创建账号</h2>
        </div>
        <Card className="p-6 space-y-4">
          {[
            { label: "邮箱 / 手机号", placeholder: "请输入邮箱或手机号", type: "text" },
            { label: "昵称", placeholder: "2-30个字符", type: "text" },
            { label: "企业邀请码（可选）", placeholder: "如有邀请码请填写", type: "text" },
            { label: "验证码", placeholder: "请输入验证码", type: "text" },
          ].map(f => (
            <div key={f.label} className="space-y-1.5">
              <label className="text-xs text-muted-foreground">{f.label}</label>
              <input type={f.type} className="w-full bg-input-background border border-border rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" placeholder={f.placeholder} />
            </div>
          ))}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">密码</label>
            <div className="relative">
              <input type={showPw ? "text" : "password"} className="w-full bg-input-background border border-border rounded px-3 py-2 pr-9 text-sm text-foreground focus:outline-none focus:border-primary/50" placeholder="至少8位，包含字母和数字" />
              <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <Btn size="md" className="w-full justify-center mt-2" onClick={() => setStep("success")}>
            <UserPlus className="w-4 h-4" /> 注册
          </Btn>
        </Card>
      </div>
    </div>
  )
}

export default function App() {
  const [view, setView] = useState<AppView>("login")

  if (view === "login") {
    return <LoginPage onLogin={(isAdmin) => setView(isAdmin ? "admin" : "user")} onGoRegister={() => setView("register")} />
  }
  if (view === "register") {
    return <RegisterPage onBack={() => setView("login")} />
  }
  if (view === "user") {
    return <UserApp onLogout={() => setView("login")} onSwitchToAdmin={() => setView("admin")} />
  }
  if (view === "admin") {
    return <AdminApp onLogout={() => setView("login")} onSwitchToUser={() => setView("user")} />
  }

  return null
}
