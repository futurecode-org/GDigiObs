import { useState } from "react"
import { Search, Calendar, Filter } from "lucide-react"
import { Card } from "@/components/shared/Card"
import { SectionHeader } from "@/components/shared/SectionHeader"
import { Badge } from "@/components/shared/Badge"
import { Btn } from "@/components/shared/Btn"
import { auditLogs } from "@/lib/mockData"

export function AuditLogs() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredLogs = auditLogs.filter(log =>
    log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="h-full overflow-y-auto p-6">
      <Card className="p-4 mb-4">
        <SectionHeader title="审计日志" action={<Btn variant="outline"><Filter className="w-4 h-4" /> 筛选</Btn>} />
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="搜索用户、描述或类型..."
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
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">类型</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">用户</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">描述</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">详情</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-muted/30">
                  <td className="py-3 px-4">
                    <Badge variant={log.type === "聊天审计" ? "warning" : log.type === "权限变更" ? "danger" : "default"}>
                      {log.type}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-semibold text-primary">
                        {log.user.includes(":") ? "🤖" : log.user[0]}
                      </div>
                      <span className="text-sm text-foreground">{log.user}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-foreground">{log.desc}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs text-muted-foreground font-mono max-w-xs truncate">{log.detail}</span>
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