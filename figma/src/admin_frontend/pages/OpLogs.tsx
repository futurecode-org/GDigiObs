import { Download, Filter, Search } from "lucide-react"
import { Badge, Card, Btn } from "@/shared/ui"
import { opLogs } from "@/shared/mockData"

export function OpLogsPage() {
  return (
    <div className="p-6 space-y-5 h-full overflow-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">操作日志</h2>
          <p className="text-xs text-muted-foreground mt-0.5">记录管理员全部操作行为，支持溯源审计</p>
        </div>
        <div className="flex gap-2">
          <Btn variant="outline" size="sm"><Download className="w-4 h-4" />导出</Btn>
          <Btn variant="outline" size="sm"><Filter className="w-4 h-4" />筛选</Btn>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input className="w-full bg-input-background border border-border rounded px-3 py-1.5 pl-8 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" placeholder="搜索操作人、模块..." />
        </div>
        <select className="bg-input-background border border-border rounded px-3 py-1.5 text-sm text-foreground">
          <option>全部模块</option>
          <option>用户管理</option>
          <option>租户管理</option>
          <option>权限管理</option>
          <option>数据采集</option>
          <option>模型管理</option>
        </select>
        <input type="date" defaultValue="2026-06-26" className="bg-input-background border border-border rounded px-3 py-1.5 text-sm text-foreground" />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["操作人", "操作模块", "操作类型", "操作对象", "IP 地址", "结果", "操作时间"].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs text-muted-foreground font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {opLogs.map(l => (
                <tr key={l.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center text-[10px] font-semibold text-primary">{l.user[0]}</div>
                      <span className="text-foreground text-xs">{l.user}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4"><Badge variant="muted">{l.module}</Badge></td>
                  <td className="py-3 px-4 text-foreground text-xs">{l.action}</td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">{l.target}</td>
                  <td className="py-3 px-4 text-muted-foreground font-mono text-xs">{l.ip}</td>
                  <td className="py-3 px-4">
                    <Badge variant={l.status === "success" ? "success" : "danger"}>{l.status === "success" ? "成功" : "失败"}</Badge>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground font-mono text-xs">{l.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>共 {opLogs.length} 条记录</span>
          <div className="flex gap-1">
            <Btn variant="outline" size="xs">上一页</Btn>
            <Btn variant="outline" size="xs">下一页</Btn>
          </div>
        </div>
      </Card>
    </div>
  )
}
