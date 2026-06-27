import { cn } from "@/lib/utils"

export function Btn({ children, onClick, variant = "primary", size = "sm", className = "", disabled = false }: {
  children: React.ReactNode; onClick?: () => void; variant?: "primary" | "ghost" | "outline" | "danger" | "muted";
  size?: "xs" | "sm" | "md"; className?: string; disabled?: boolean
}) {
  const variants: Record<string, string> = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    ghost: "text-muted-foreground hover:text-foreground hover:bg-secondary",
    outline: "border border-border text-foreground hover:bg-secondary",
    danger: "bg-red-500/15 text-red-400 border border-red-500/25 hover:bg-red-500/25",
    muted: "bg-muted text-muted-foreground hover:bg-muted/80",
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