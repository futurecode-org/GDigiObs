import type { ReactNode } from "react"

interface SectionHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
}

export function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {subtitle && <span className="text-xs text-muted-foreground">({subtitle})</span>}
      </div>
      {action}
    </div>
  )
}
