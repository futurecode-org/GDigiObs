import { Users, Download, Filter, Eye, Lock, MessageSquare, Siren } from "lucide-react"
import { Badge, StatusDot, StatCard, Card, Btn } from "@/shared/ui"
import { adminGroups } from "@/shared/mockData"

export function GroupManagementPage() {
  const typeVariant: Record<string, "default" | "info"> = { internal: "default", mixed: "info" }
  const statusVariant: Record<string, "success" | "warning" | "muted" | "danger"> = {
    normal: "success", muted: "warning", disabled: "muted", dissolved: "danger"
  }
  const statusLabel: Record<string, string> = { normal: "正常", muted: "全员禁言", disabled: "已停用", dissolved: "已解散" }

  return (
    <div className="p-6 space-y-5 h-full overflow-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">群管理</h2>
          <p className="text-xs text-muted-foreground mt-0.5">管理平台所有群组，处理违规群</p>
        </div>
        <div className="flex gap-2">
          <Btn variant="outline" size="sm"><Download className="w-4 h-4" />导出</Btn>
          <Btn variant="outline" size="sm"><Filter className="w-4 h-4" />筛选</Btn>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <StatCard label="群总数" value="142" icon={Users} color="primary" />
        <StatCard label="今日消息" value="4,821" icon={MessageSquare} color="info" />
        <StatCard label="全员禁言" value="1" icon={Lock} color="warning" />
        <StatCard label="已停用" value="2" icon={Siren} color="danger" />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["群名称", "类型", "群主", "成员数", "消息总数", "状态", "创建时间", "操作"].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs text-muted-foreground font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {adminGroups.map(g => (
                <tr key={g.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center text-xs font-semibold text-cyan-400">群</div>
                      <span className="text-foreground font-medium">{g.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4"><Badge variant={typeVariant[g.type]}>{g.type === "internal" ? "内部群" : "混合群"}</Badge></td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">{g.owner}</td>
                  <td className="py-3 px-4 text-foreground font-mono text-xs">{g.members}</td>
                  <td className="py-3 px-4 text-foreground font-mono text-xs">{g.msgs.toLocaleString()}</td>
                  <td className="py-3 px-4"><Badge variant={statusVariant[g.status]}><StatusDot status={g.status} />{statusLabel[g.status]}</Badge></td>
                  <td className="py-3 px-4 text-muted-foreground font-mono text-xs">{g.created}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1">
                      <Btn variant="ghost" size="xs"><Eye className="w-3.5 h-3.5" /></Btn>
                      <Btn variant="ghost" size="xs"><Users className="w-3.5 h-3.5" /></Btn>
                      {g.status === "normal" && <Btn variant="ghost" size="xs" className="text-amber-400"><Lock className="w-3.5 h-3.5" /></Btn>}
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
