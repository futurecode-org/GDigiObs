import { cn } from "@/lib/utils"

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