import { useState } from "react"
import { Search, Calendar, Filter } from "lucide-react"
import { Card } from "@/components/shared/Card"
import { SectionHeader } from "@/components/shared/SectionHeader"
import { Badge } from "@/components/shared/Badge"
import { Btn } from "@/components/shared/Btn"
import { opLogs } from "@/lib/mockData"

export function OpLogs() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredLogs = opLogs.filter(log =>
    log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.module.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="h-full overflow-y-auto p-6">
      <Card className="p-4 mb-4">
        <SectionHeader title="操作日志" action={<Btn variant="outline"><Filter className="w-4 h-4" /> 筛选</Btn>} />
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="搜索用户、模块或目标..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <Btn variant="outline"><Calendar className="w-4 h-4" /> 时间范围</Btn>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">操作人</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">模块</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">操作</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">目标</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">IP</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">状态</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-muted/30">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-semibold text-primary">
                        {log.user[0]}
                      </div>
                      <span className="text-sm text-foreground">{log.user}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="default">{log.module}</Badge>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-foreground">{log.action}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-foreground">{log.target}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs text-muted-foreground font-mono">{log.ip}</span>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={log.status === "success" ? "success" : "danger"}>
                      {log.status === "success" ? "成功" : "失败"}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs text-muted-foreground font-mono">{log.time}</span>
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