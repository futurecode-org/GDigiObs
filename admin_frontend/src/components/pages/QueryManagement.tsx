import { useState } from "react"
import { Search, Calendar, Eye, Trash2 } from "lucide-react"
import { Card } from "@/components/shared/Card"
import { SectionHeader } from "@/components/shared/SectionHeader"
import { Badge } from "@/components/shared/Badge"
import { Btn } from "@/components/shared/Btn"
import { queryResult } from "@/lib/mockData"

export function QueryManagement() {
  const [searchTerm, setSearchTerm] = useState("")

  const queries = [
    { id: 1, question: queryResult.question, user: "张伟", time: "2026-06-26 14:25", status: "success", type: "sql" },
    { id: 2, question: "过去30天每日采集数据量趋势", user: "李娜", time: "2026-06-26 11:30", status: "success", type: "sql" },
    { id: 3, question: "各平台负向情感数据占比", user: "张伟", time: "2026-06-25 16:45", status: "success", type: "sql" },
    { id: 4, question: "本月活跃用户Top 10及消息数量", user: "王强", time: "2026-06-25 10:20", status: "failed", type: "sql" },
    { id: 5, question: "近7天模型调用次数及Token消耗统计", user: "陈磊", time: "2026-06-24 15:10", status: "success", type: "sql" },
  ]

  const filteredQueries = queries.filter(q =>
    q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.user.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="h-full overflow-y-auto p-6">
      <Card className="p-4 mb-4">
        <SectionHeader title="查询管理" />
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="搜索查询内容或用户..."
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
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">查询内容</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">用户</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">类型</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">状态</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">时间</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredQueries.map(query => (
                <tr key={query.id} className="hover:bg-muted/30">
                  <td className="py-3 px-4">
                    <p className="text-sm text-foreground max-w-xs truncate">{query.question}</p>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-semibold text-primary">
                        {query.user[0]}
                      </div>
                      <span className="text-sm text-foreground">{query.user}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="default">SQL查询</Badge>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-sm ${query.status === "success" ? "text-emerald-400" : "text-red-400"}`}>
                      {query.status === "success" ? "成功" : "失败"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs text-muted-foreground">{query.time}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <Btn variant="ghost" onClick={() => alert(`查看查询 ${query.id}`)}><Eye className="w-4 h-4" /></Btn>
                      <Btn variant="danger" onClick={() => alert(`删除查询 ${query.id}`)}><Trash2 className="w-4 h-4" /></Btn>
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