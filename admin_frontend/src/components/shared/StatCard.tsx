import { TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

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
    <div className={cn("bg-card border border-border rounded-lg p-4 flex items-start gap-4")}>
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
    </div>
  )
}