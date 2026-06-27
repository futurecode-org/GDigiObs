import { cn } from "@/lib/utils"

export function Card({ children, className = "", onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div className={cn("bg-card border border-border rounded-lg", className)} onClick={onClick}>
      {children}
    </div>
  )
}