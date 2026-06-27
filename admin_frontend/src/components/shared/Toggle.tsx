import { cn } from "@/lib/utils"

export function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={e => { e.stopPropagation(); onChange() }}
      className={cn(
        "relative inline-flex flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus:outline-none",
        on ? "bg-primary" : "bg-muted"
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