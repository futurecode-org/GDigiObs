import { useState } from "react"
import { Search, Clock, AlertTriangle, CheckCircle, Eye, Filter, Calendar } from "lucide-react"
import { Card } from "@/components/shared/Card"
import { SectionHeader } from "@/components/shared/SectionHeader"
import { Badge } from "@/components/shared/Badge"
import { Btn } from "@/components/shared/Btn"
import { chatAuditRecords } from "@/lib/mockData"

export function ChatAudit() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRisk, setFilterRisk] = useState("")
  const [filterStatus, setFilterStatus] = useState("")

  const filteredRecords = chatAuditRecords.filter(record => {
    const matchSearch = record.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       record.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchRisk = !filterRisk || record.risk === filterRisk
    const matchStatus = !filterStatus || record.status === filterStatus
    return matchSearch && matchRisk && matchStatus
  })

  const handleViewDetail = (recordId: number) => {
    console.log(`View detail for record ${recordId}`)
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <Card className="p-4 mb-4">
        <SectionHeader title="聊天审计" action={<Btn variant="outline"><Filter className="w-4 h-4" /> 筛选</Btn>} />
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="搜索用户或内容..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <select
            value={filterRisk}
            onChange={e => setFilterRisk(e.target.value)}
            className="px-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">全部风险等级</option>
            <option value="low">低风险</option>
            <option value="medium">中风险</option>
            <option value="high">高风险</option>
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">全部状态</option>
            <option value="passed">已通过</option>
            <option value="reviewing">复核中</option>
            <option value="blocked">已拦截</option>
          </select>
          <Btn variant="outline"><Calendar className="w-4 h-4" /> 时间</Btn>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">用户</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">内容</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">风险类型</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">风险等级</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">状态</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">时间</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredRecords.map(record => (
                <tr key={record.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-semibold text-primary">
                        {record.user[0]}
                      </div>
                      <span className="text-sm text-foreground">{record.user}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-sm text-foreground max-w-xs truncate">{record.content}</p>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={record.type === "违法违规" ? "danger" : record.type === "涉政" ? "danger" : record.type === "涉黄" ? "warning" : "info"}>
                      {record.type}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className={`w-4 h-4 ${record.risk === "high" ? "text-red-400" : record.risk === "medium" ? "text-amber-400" : "text-emerald-400"}`} />
                      <span className={`text-sm ${record.risk === "high" ? "text-red-400" : record.risk === "medium" ? "text-amber-400" : "text-emerald-400"}`}>
                        {record.risk === "high" ? "高" : record.risk === "medium" ? "中" : "低"}风险
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      {record.status === "blocked" && <span className="w-2 h-2 rounded-full bg-red-400" />}
                      {record.status === "reviewing" && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
                      {record.status === "passed" && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                      <span className={`text-sm ${record.status === "blocked" ? "text-red-400" : record.status === "reviewing" ? "text-amber-400" : "text-emerald-400"}`}>
                        {record.status === "blocked" ? "已拦截" : record.status === "reviewing" ? "复核中" : "已通过"}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {record.time}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <Btn variant="ghost" onClick={() => handleViewDetail(record.id)}>
                        <Eye className="w-4 h-4" />
                      </Btn>
                      {record.status === "reviewing" && (
                        <>
                          <Btn variant="success">通过</Btn>
                          <Btn variant="danger">拦截</Btn>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRecords.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">暂无审计记录</p>
          </div>
        )}

        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
          <span className="text-xs text-muted-foreground">共 {filteredRecords.length} 条记录</span>
          <div className="flex items-center gap-1">
            <Btn variant="outline" size="xs" disabled>上一页</Btn>
            <Btn variant="primary" size="xs">1</Btn>
            <Btn variant="outline" size="xs">2</Btn>
            <Btn variant="outline" size="xs">下一页</Btn>
          </div>
        </div>
      </Card>
    </div>
  )
}