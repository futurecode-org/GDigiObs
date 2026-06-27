import { useState } from "react"
import { Search, Clock, ChevronDown, ChevronUp, Trash2, Copy, Check, FileText } from "lucide-react"
import { Card } from "@/components/shared/Card"
import { Badge } from "@/components/shared/Badge"
import { Btn } from "@/components/shared/Btn"
import { SectionHeader } from "@/components/shared/SectionHeader"

const historyItems = [
  { id: 1, query: "过去7天每日采集数据量与清洗数据量对比", time: "2026-06-26 14:25", duration: "3.2s", rows: 7, expanded: false },
  { id: 2, query: "各平台负向情感数据占比统计", time: "2026-06-26 10:15", duration: "5.8s", rows: 4, expanded: false },
  { id: 3, query: "本月活跃用户Top 10及消息数量", time: "2026-06-25 16:40", duration: "2.1s", rows: 10, expanded: false },
  { id: 4, query: "近7天模型调用次数及Token消耗统计", time: "2026-06-25 14:30", duration: "4.5s", rows: 4, expanded: false },
  { id: 5, query: "数据采集任务执行成功率统计", time: "2026-06-24 09:20", duration: "1.8s", rows: 5, expanded: false },
  { id: 6, query: "知识库文档分类统计", time: "2026-06-23 15:10", duration: "2.9s", rows: 4, expanded: false },
]

export function QueryHistoryPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [history, setHistory] = useState(historyItems)
  const [copiedId, setCopiedId] = useState<number | null>(null)

  const toggleExpand = (id: number) => {
    setHistory(prev => prev.map(item => item.id === id ? { ...item, expanded: !item.expanded } : item))
  }

  const copyQuery = (query: string, id: number) => {
    navigator.clipboard.writeText(query)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const filteredHistory = history.filter(item => item.query.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <SectionHeader title="问数历史" action={<Btn variant="danger" size="sm"><Trash2 className="w-4 h-4" /> 清空历史</Btn>} />
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索历史查询..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-muted border border-transparent rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </Card>

      <div className="space-y-3">
        {filteredHistory.map(item => (
          <Card key={item.id} className="overflow-hidden">
            <div className="p-4 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => toggleExpand(item.id)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="max-w-[60%]">
                    <p className="text-sm text-foreground">{item.query}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {item.time}</span>
                    <span>耗时 {item.duration}</span>
                    <Badge variant="muted">{item.rows} 条结果</Badge>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); copyQuery(item.query, item.id) }} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
                    {copiedId === item.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                  </button>
                  {item.expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </div>
            </div>
            {item.expanded && (
              <div className="px-4 pb-4 border-t border-border">
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2">生成的 SQL：</p>
                  <pre className="text-xs font-mono text-foreground overflow-x-auto">
SELECT DATE(created_at) AS date, COUNT(*) AS count FROM collected_data WHERE tenant_id = :tenant_id GROUP BY DATE(created_at) ORDER BY date ASC
                  </pre>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {filteredHistory.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">暂无查询历史</p>
        </div>
      )}
    </div>
  )
}