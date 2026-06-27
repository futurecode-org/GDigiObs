import { Download, Filter, ClipboardList, MessageSquare, Terminal, Key } from "lucide-react"
import { cn } from "@/shared/utils"
import { StatCard, Card, Btn } from "@/shared/ui"
import { auditLogs } from "@/shared/mockData"

export function AuditLogsPage() {
  const typeColor: Record<string, string> = {
    "聊天审计": "text-red-400 bg-red-500/10 border-red-500/20",
    "SQL问数": "text-primary bg-primary/10 border-primary/20",
    "模型调用": "text-purple-400 bg-purple-500/10 border-purple-500/20",
    "技能调用": "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    "权限变更": "text-amber-400 bg-amber-500/10 border-amber-500/20",
    "数字员工": "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  }

  return (
    <div className="p-6 space-y-5 h-full overflow-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">审计日志</h2>
          <p className="text-xs text-muted-foreground mt-0.5">聊天消息、SQL查询、模型调用、权限变更等全链路审计</p>
        </div>
        <div className="flex gap-2">
          <Btn variant="outline" size="sm"><Download className="w-4 h-4" />导出</Btn>
          <Btn variant="outline" size="sm"><Filter className="w-4 h-4" />筛选</Btn>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <StatCard label="今日审计总数" value="18,432" icon={ClipboardList} color="primary" />
        <StatCard label="聊天审计" value="847" icon={MessageSquare} color="info" />
        <StatCard label="SQL问数" value="234" icon={Terminal} color="purple" />
        <StatCard label="权限变更" value="12" icon={Key} color="warning" />
      </div>

      <div className="flex items-center gap-3">
        <div className="flex gap-1 bg-muted/40 rounded-lg p-1">
          {["全部", "聊天审计", "SQL问数", "模型调用", "权限变更"].map(t => (
            <button key={t} className={cn("px-3 py-1 text-xs rounded font-medium transition-colors",
              t === "全部" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}>{t}</button>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["审计类型", "操作用户", "描述", "详情摘要", "时间"].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs text-muted-foreground font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {auditLogs.map(l => (
                <tr key={l.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4">
                    <span className={cn("px-2 py-0.5 rounded text-xs font-medium border", typeColor[l.type] || "text-muted-foreground bg-muted border-border")}>{l.type}</span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">{l.user}</td>
                  <td className="py-3 px-4 text-foreground text-xs">{l.desc}</td>
                  <td className="py-3 px-4 max-w-xs">
                    <code className="text-[10px] font-mono text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded truncate block">{l.detail}</code>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground font-mono text-xs whitespace-nowrap">{l.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>共 {auditLogs.length} 条记录（今日 18,432 条）</span>
          <div className="flex gap-1">
            <Btn variant="outline" size="xs">上一页</Btn>
            <Btn variant="outline" size="xs">下一页</Btn>
          </div>
        </div>
      </Card>
    </div>
  )
}
