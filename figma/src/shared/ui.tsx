import { TrendingUp } from "lucide-react"
import { cn } from "@/shared/utils"

export function Badge({ children, variant = "default", className = "" }: {
  children: React.ReactNode; variant?: "default" | "success" | "warning" | "danger" | "muted" | "info"; className?: string
}) {
  const styles: Record<string, string> = {
    default: "bg-primary/15 text-primary border border-primary/25",
    success: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25",
    warning: "bg-amber-500/15 text-amber-400 border border-amber-500/25",
    danger: "bg-red-500/15 text-red-400 border border-red-500/25",
    muted: "bg-muted text-muted-foreground border border-border",
    info: "bg-cyan-500/15 text-cyan-400 border border-cyan-500/25",
  }
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium", styles[variant], className)}>
      {children}
    </span>
  )
}

export function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    normal: "bg-emerald-400", enabled: "bg-emerald-400", ready: "bg-emerald-400",
    running: "bg-blue-400 animate-pulse", online: "bg-emerald-400",
    disabled: "bg-slate-500", banned: "bg-red-400",
    error: "bg-red-400", failed: "bg-red-400",
    pending_review: "bg-amber-400", indexing: "bg-blue-400 animate-pulse",
    reviewing: "bg-amber-400", blocked: "bg-red-400", passed: "bg-emerald-400",
  }
  return <span className={cn("inline-block w-2 h-2 rounded-full", colors[status] || "bg-slate-500")} />
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-card border border-border rounded-lg", className)}>
      {children}
    </div>
  )
}

export function StatCard({ label, value, sub, icon: Icon, trend, color = "primary" }: {
  label: string; value: string | number; sub?: string; icon: React.ElementType; trend?: number; color?: string
}) {
  const colorMap: Record<string, string> = {
    primary: "text-primary bg-primary/10",
    success: "text-emerald-400 bg-emerald-500/10",
    warning: "text-amber-400 bg-amber-500/10",
    danger: "text-red-400 bg-red-500/10",
    info: "text-cyan-400 bg-cyan-500/10",
    purple: "text-purple-400 bg-purple-500/10",
    muted: "text-muted-foreground bg-muted",
  }
  return (
    <Card className="p-4 flex items-start gap-4">
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", colorMap[color] || colorMap.primary)}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground mb-1">{label}</div>
        <div className="text-2xl font-semibold text-foreground font-mono">{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
        {trend !== undefined && (
          <div className={cn("text-xs mt-1 flex items-center gap-1", trend >= 0 ? "text-emerald-400" : "text-red-400")}>
            <TrendingUp className={cn("w-3 h-3", trend < 0 && "rotate-180")} />
            {Math.abs(trend)}% 较昨日
          </div>
        )}
      </div>
    </Card>
  )
}

export function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {action}
    </div>
  )
}

export function Btn({ children, onClick, variant = "primary", size = "sm", className = "", disabled = false }: {
  children: React.ReactNode; onClick?: () => void; variant?: "primary" | "ghost" | "outline" | "danger";
  size?: "xs" | "sm" | "md"; className?: string; disabled?: boolean
}) {
  const variants: Record<string, string> = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    ghost: "text-muted-foreground hover:text-foreground hover:bg-secondary",
    outline: "border border-border text-foreground hover:bg-secondary",
    danger: "bg-red-500/15 text-red-400 border border-red-500/25 hover:bg-red-500/25",
  }
  const sizes: Record<string, string> = { xs: "px-2 py-1 text-xs", sm: "px-3 py-1.5 text-sm", md: "px-4 py-2 text-sm" }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn("inline-flex items-center gap-1.5 rounded font-medium transition-colors disabled:opacity-40", variants[variant], sizes[size], className)}
    >
      {children}
    </button>
  )
}

export function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={e => { e.stopPropagation(); onChange() }}
      className={cn(
        "relative inline-flex flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus:outline-none",
        on ? "bg-primary" : "bg-switch-background"
      )}
      style={{ width: 40, height: 22 }}
    >
      <span
        className="absolute w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200"
        style={{ top: 3, left: on ? 21 : 3 }}
      />
    </button>
  )
}

export function PlaceholderPage({ title, desc, icon: Icon }: { title: string; desc: string; icon: React.ElementType }) {
  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
          <Icon className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h3 className="text-base font-medium text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">{desc}</p>
        </div>
      </div>
    </div>
  )
}
