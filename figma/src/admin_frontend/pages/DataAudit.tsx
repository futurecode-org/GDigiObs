import { useState } from "react"
import { Download, Search, ClipboardList, TrendingUp, Activity, AlertTriangle, Eye, Wrench, Siren } from "lucide-react"
import { cn } from "@/shared/utils"
import { Badge, StatCard, Card, Btn } from "@/shared/ui"
import { dataAuditItems } from "@/shared/mockData"

export function DataAuditPage() {
  const [filterSentiment, setFilterSentiment] = useState<string>("all")

  const filtered = filterSentiment === "all" ? dataAuditItems : dataAuditItems.filter(d => d.sentiment === filterSentiment)
  const sentimentConfig: Record<string, { label: string; variant: "success" | "muted" | "danger" }> = {
    positive: { label: "正向", variant: "success" },
    neutral: { label: "中性", variant: "muted" },
    negative: { label: "负向", variant: "danger" },
  }

  return (
    <div className="p-6 space-y-5 h-full overflow-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">数据审计</h2>
          <p className="text-xs text-muted-foreground mt-0.5">对采集数据进行情感审核，支持人工修正</p>
        </div>
        <div className="flex gap-2">
          <Btn variant="outline" size="sm"><Download className="w-4 h-4" />导出审计结果</Btn>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <StatCard label="今日审计" value="2,180" icon={ClipboardList} color="primary" />
        <StatCard label="正向" value="1,264" icon={TrendingUp} color="success" />
        <StatCard label="中性" value="632" icon={Activity} color="muted" />
        <StatCard label="负向" value="284" icon={AlertTriangle} color="danger" />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex gap-1 bg-muted/40 rounded-lg p-1">
          {["all", "positive", "neutral", "negative"].map(f => (
            <button key={f} onClick={() => setFilterSentiment(f)} className={cn("px-3 py-1 text-xs rounded font-medium transition-colors",
              filterSentiment === f ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}>
              {f === "all" ? "全部" : sentimentConfig[f].label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input className="w-full bg-input-background border border-border rounded px-3 py-1.5 pl-8 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none" placeholder="搜索标题或来源..." />
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["标题", "来源平台", "情感标签", "风险标记", "采集时间", "操作"].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs text-muted-foreground font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => (
                <tr key={d.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4 max-w-xs">
                    <div className="text-xs text-foreground line-clamp-2">{d.title}</div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="muted">{d.platform}</Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={sentimentConfig[d.sentiment].variant}>{sentimentConfig[d.sentiment].label}</Badge>
                  </td>
                  <td className="py-3 px-4">
                    {d.risk ? <Badge variant="danger"><Siren className="w-3 h-3" />风险</Badge> : <span className="text-xs text-muted-foreground">-</span>}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground font-mono text-xs">{d.time}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <Btn variant="ghost" size="xs"><Eye className="w-3.5 h-3.5" />查看原文</Btn>
                      <Btn variant="ghost" size="xs"><Wrench className="w-3.5 h-3.5" />修正</Btn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>共 {filtered.length} 条记录</span>
          <div className="flex gap-1">
            <Btn variant="outline" size="xs">上一页</Btn>
            <Btn variant="outline" size="xs">下一页</Btn>
          </div>
        </div>
      </Card>
    </div>
  )
}
