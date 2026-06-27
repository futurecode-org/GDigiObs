import { Plus, Eye, Wrench, Radio, Activity, Database, AlertTriangle, Globe } from "lucide-react"
import { cn } from "@/shared/utils"
import { Badge, StatusDot, StatCard, Card, Btn } from "@/shared/ui"
import { collectTasks } from "@/shared/mockData"

export function DataCollectionPage() {
  const methodColor: Record<string, string> = {
    API: "text-primary bg-primary/10 border-primary/20",
    RSS: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    爬虫: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  }
  const statusBadge: Record<string, "success" | "info" | "danger" | "muted" | "warning"> = {
    enabled: "success", running: "info", error: "danger", disabled: "muted", draft: "warning"
  }
  const statusLabel: Record<string, string> = { enabled: "启用", running: "运行中", error: "异常", disabled: "停用", draft: "草稿" }

  return (
    <div className="p-6 space-y-5 h-full overflow-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">数据采集</h2>
          <p className="text-xs text-muted-foreground mt-0.5">管理采集平台和采集任务</p>
        </div>
        <Btn size="sm"><Plus className="w-4 h-4" />新建采集任务</Btn>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="运行中任务" value="2" icon={Activity} color="success" />
        <StatCard label="今日采集量" value="2,180" icon={Database} color="primary" />
        <StatCard label="异常任务" value="1" icon={AlertTriangle} color="danger" />
        <StatCard label="公开数据源" value="3" icon={Globe} color="info" />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["任务名称", "平台类型", "采集方式", "是否公开", "状态", "最近运行", "失败次数", "操作"].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs text-muted-foreground font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {collectTasks.map(t => (
                <tr key={t.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4 text-foreground font-medium">{t.name}</td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">{t.platform}</td>
                  <td className="py-3 px-4">
                    <span className={cn("px-2 py-0.5 rounded text-xs font-mono border", methodColor[t.method])}>{t.method}</span>
                  </td>
                  <td className="py-3 px-4">
                    {t.isPublic ? <Badge variant="success">公开</Badge> : <Badge variant="muted">私有</Badge>}
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={statusBadge[t.status]}><StatusDot status={t.status} />{statusLabel[t.status]}</Badge>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground font-mono text-xs">{t.lastRun}</td>
                  <td className="py-3 px-4">
                    {t.failCount > 0 ? <span className="text-red-400 font-mono text-xs">{t.failCount}</span> : <span className="text-muted-foreground text-xs">0</span>}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <Btn variant="ghost" size="xs"><Radio className="w-3.5 h-3.5" /></Btn>
                      <Btn variant="ghost" size="xs"><Eye className="w-3.5 h-3.5" /></Btn>
                      <Btn variant="ghost" size="xs"><Wrench className="w-3.5 h-3.5" /></Btn>
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
