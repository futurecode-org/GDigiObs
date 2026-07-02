import { useEffect, useState } from "react"
import { ScrollText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { skillApi } from "@/lib/api"
import type { SkillCallLog, PaginatedData } from "@/lib/types"

interface SkillLogsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  skillId: number | null
  skillName: string
}

export function SkillLogsDialog({
  open,
  onOpenChange,
  skillId,
  skillName,
}: SkillLogsDialogProps) {
  const [logs, setLogs] = useState<SkillCallLog[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open && skillId) {
      setIsLoading(true)
      skillApi
        .getLogs(skillId, { page: 1, page_size: 50 })
        .then((res: PaginatedData<SkillCallLog>) => setLogs(res.items))
        .catch(() => setLogs([]))
        .finally(() => setIsLoading(false))
    }
  }, [open, skillId])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScrollText className="w-4 h-4" />
            调用记录：{skillName}
          </DialogTitle>
          <DialogDescription>展示该技能的测试与调用历史</DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">暂无调用记录</div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="rounded-lg border p-3 text-sm space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        log.status === "success"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {log.status === "success" ? "成功" : "失败"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {log.source || "-"} · {log.duration_ms !== undefined ? `${log.duration_ms}ms` : "-"}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
                {log.input_data && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">入参</div>
                    <pre className="rounded bg-muted p-2 text-xs font-mono overflow-auto max-h-32">
                      {JSON.stringify(log.input_data, null, 2)}
                    </pre>
                  </div>
                )}
                {log.output_data && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">出参</div>
                    <pre className="rounded bg-muted p-2 text-xs font-mono overflow-auto max-h-32">
                      {JSON.stringify(log.output_data, null, 2)}
                    </pre>
                  </div>
                )}
                {log.error_message && (
                  <div className="text-xs text-red-600">错误：{log.error_message}</div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
