import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

interface StatCardProps {
  label: string
  value: string
  icon: LucideIcon
  trend?: number
  color?: "primary" | "success" | "info" | "purple"
}

const colorMap: Record<string, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-emerald-500/10 text-emerald-400",
  info: "bg-cyan-500/10 text-cyan-400",
  purple: "bg-purple-500/10 text-purple-400",
}

export function StatCard({ label, value, icon: Icon, trend, color = "primary" }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground">{label}</span>
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", colorMap[color])}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        <div className="flex items-end justify-between">
          <span className="text-2xl font-bold text-foreground">{value}</span>
          {trend !== undefined && (
            <div className={cn("flex items-center gap-0.5 text-xs", trend >= 0 ? "text-emerald-400" : "text-red-400")}>
              {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
