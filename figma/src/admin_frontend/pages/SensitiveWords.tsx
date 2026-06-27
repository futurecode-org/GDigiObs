import { Plus, Download, Filter, Search, Hash, Globe, Building2, Siren, Wrench, X } from "lucide-react"
import { cn } from "@/shared/utils"
import { Badge, StatCard, Card, Btn } from "@/shared/ui"
import { sensitiveWords } from "@/shared/mockData"

export function SensitiveWordsPage() {
  const riskVariant: Record<string, "danger" | "warning" | "muted"> = { high: "danger", medium: "warning", low: "muted" }
  const riskLabel: Record<string, string> = { high: "高风险", medium: "中风险", low: "低风险" }
  const catColors: Record<string, string> = {
    涉政: "text-red-400 bg-red-500/10 border-red-500/20",
    广告: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    商业机密: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    违法违规: "text-red-400 bg-red-500/10 border-red-500/20",
  }

  return (
    <div className="p-6 space-y-5 h-full overflow-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">敏感词库</h2>
          <p className="text-xs text-muted-foreground mt-0.5">管理聊天审计敏感词，配置风险等级和作用范围</p>
        </div>
        <div className="flex gap-2">
          <Btn variant="outline" size="sm"><Download className="w-4 h-4" />批量导入</Btn>
          <Btn size="sm"><Plus className="w-4 h-4" />添加敏感词</Btn>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <StatCard label="词库总量" value="3,842" icon={Hash} color="primary" />
        <StatCard label="平台级" value="2,560" icon={Globe} color="info" />
        <StatCard label="租户级" value="1,282" icon={Building2} color="muted" />
        <StatCard label="今日命中" value="134" icon={Siren} color="danger" />
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input className="w-full bg-input-background border border-border rounded px-3 py-1.5 pl-8 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" placeholder="搜索敏感词..." />
          </div>
          <Btn variant="outline" size="sm"><Filter className="w-3.5 h-3.5" />筛选分类</Btn>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["敏感词", "分类", "风险等级", "作用范围", "今日命中", "状态", "操作"].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs text-muted-foreground font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sensitiveWords.map(w => (
                <tr key={w.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-mono text-sm text-foreground bg-muted/40 px-2 py-0.5 rounded">{w.word}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={cn("px-2 py-0.5 rounded text-xs font-medium border", catColors[w.category] || "text-muted-foreground bg-muted border-border")}>{w.category}</span>
                  </td>
                  <td className="py-3 px-4"><Badge variant={riskVariant[w.risk]}>{riskLabel[w.risk]}</Badge></td>
                  <td className="py-3 px-4">
                    <Badge variant={w.scope === "platform" ? "default" : "muted"}>{w.scope === "platform" ? "平台" : "租户"}</Badge>
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-foreground">{w.hits}</td>
                  <td className="py-3 px-4"><Badge variant={w.status === "enabled" ? "success" : "muted"}>{w.status === "enabled" ? "启用" : "停用"}</Badge></td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1">
                      <Btn variant="ghost" size="xs"><Wrench className="w-3.5 h-3.5" /></Btn>
                      <Btn variant="ghost" size="xs" className="text-red-400"><X className="w-3.5 h-3.5" /></Btn>
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
