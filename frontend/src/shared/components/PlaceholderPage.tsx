import { FileQuestion } from "lucide-react"

export function PlaceholderPage({ title = "页面开发中" }: { title?: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
      <FileQuestion className="w-16 h-16 mb-4" />
      <p className="text-lg">{title}</p>
    </div>
  )
}
