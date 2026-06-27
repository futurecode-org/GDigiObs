import { cn } from "@/lib/utils"

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