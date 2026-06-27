import { Filter, Download, Shield, Lock, AlertTriangle, CheckCircle, Eye } from "lucide-react"
import { cn } from "@/shared/utils"
import { Badge, StatusDot, StatCard, Card, Btn } from "@/shared/ui"
import { chatAuditRecords } from "@/shared/mockData"

export function ChatAuditPage() {
  const riskVariant: Record<string, "danger" | "warning" | "muted"> = { high: "danger", medium: "warning", low: "muted" }
  const riskLabel: Record<string, string> = { high: "高风险", medium: "中风险", low: "低风险" }
  const statusVariant: Record<string, "danger" | "success" | "warning" | "muted"> = {
    blocked: "danger", passed: "success", reviewing: "warning"
  }
  const statusLabel: Record<string, string> = { blocked: "已拦截", passed: "已通过", reviewing: "待复核" }

  return (
    <div className="p-6 space-y-5 h-full overflow-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">聊天审计</h2>
          <p className="text-xs text-muted-foreground mt-0.5">敏感消息识别、人工复核与违规处置</p>
        </div>
        <div className="flex gap-2">
          <Btn variant="outline" size="sm"><Filter className="w-4 h-4" />筛选</Btn>
          <Btn variant="outline" size="sm"><Download className="w-4 h-4" />导出</Btn>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <StatCard label="今日审计" value="847" icon={Shield} color="primary" />
        <StatCard label="已拦截" value="2" icon={Lock} color="danger" />
        <StatCard label="待复核" value="1" icon={AlertTriangle} color="warning" />
        <StatCard label="通过率" value="99.6%" icon={CheckCircle} color="success" />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["发送用户", "消息内容", "违规类别", "风险等级", "处理状态", "时间", "操作"].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs text-muted-foreground font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chatAuditRecords.map(r => (
                <tr key={r.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] text-muted-foreground">{r.user[0]}</div>
                      <span className="text-foreground text-xs">{r.user}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 max-w-48">
                    <span className={cn("text-xs", r.status === "blocked" ? "text-red-400/70 line-through" : "text-foreground")}>{r.content}</span>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={r.risk === "high" ? "danger" : r.risk === "medium" ? "warning" : "muted"}>{r.type}</Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={riskVariant[r.risk]}>{riskLabel[r.risk]}</Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={statusVariant[r.status]}>{statusLabel[r.status]}</Badge>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground font-mono text-xs">{r.time}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <Btn variant="ghost" size="xs"><Eye className="w-3.5 h-3.5" /></Btn>
                      {r.status === "reviewing" && <>
                        <Btn variant="ghost" size="xs" className="text-emerald-400"><CheckCircle className="w-3.5 h-3.5" /></Btn>
                        <Btn variant="ghost" size="xs" className="text-red-400"><Lock className="w-3.5 h-3.5" /></Btn>
                      </>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
