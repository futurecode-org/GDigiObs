import { cn } from "@/lib/utils"

export function StatusDot({ status, className = "" }: { status: string; className?: string }) {
  const colors: Record<string, string> = {
    enabled: "bg-emerald-400",
    disabled: "bg-gray-400",
    running: "bg-cyan-400 animate-pulse",
    pending: "bg-amber-400",
    error: "bg-red-400",
    ready: "bg-emerald-400",
    indexing: "bg-cyan-400 animate-pulse",
    normal: "bg-emerald-400",
    banned: "bg-red-400",
    muted: "bg-gray-400",
    success: "bg-emerald-400",
    failed: "bg-red-400",
  }
  return (
    <span className={cn("w-2 h-2 rounded-full", colors[status] || "bg-gray-400", className)} />
  )
}
