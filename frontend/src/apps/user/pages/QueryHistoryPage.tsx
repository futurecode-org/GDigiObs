import { useState } from "react"
import { Clock, ChevronDown, ChevronUp, Trash2, Copy, Check, FileText } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { SectionHeader } from "@/shared/components/SectionHeader"

const historyItems = [
  { id: 1, query: "过去7天每日采集数据量与清洗数据量对比", time: "2026-06-26 14:25", duration: "3.2s", rows: 7, expanded: false },
  { id: 2, query: "各平台负向情感数据占比统计", time: "2026-06-26 10:15", duration: "5.8s", rows: 4, expanded: false },
  { id: 3, query: "本月活跃用户Top 10及消息数量", time: "2026-06-25 16:40", duration: "2.1s", rows: 10, expanded: false },
  { id: 4, query: "近7天模型调用次数及Token消耗统计", time: "2026-06-25 09:30", duration: "4.5s", rows: 28, expanded: false },
]

export function QueryHistoryPage() {
  const [items, setItems] = useState(historyItems)
  const [copiedId, setCopiedId] = useState<number | null>(null)

  const toggleExpand = (id: number) => {
    setItems(items.map(item => item.id === id ? { ...item, expanded: !item.expanded } : item))
  }

  const handleCopy = (query: string, id: number) => {
    navigator.clipboard.writeText(query)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <SectionHeader title="问数历史" />
      <div className="space-y-3 mt-4">
        {items.map(item => (
          <Card key={item.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{item.query}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {item.time}
                    </span>
                    <span>耗时: {item.duration}</span>
                    <span>返回 {item.rows} 条结果</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleCopy(item.query, item.id)}
                    className="p-1.5 rounded hover:bg-muted transition-colors"
                  >
                    {copiedId === item.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                  </button>
                  <button
                    onClick={() => toggleExpand(item.id)}
                    className="p-1.5 rounded hover:bg-muted transition-colors"
                  >
                    {item.expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>
                  <button className="p-1.5 rounded hover:bg-muted transition-colors text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {item.expanded && (
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">SQL 查询结果预览 (共 {item.rows} 条)</p>
                    <div className="mt-2 space-y-1">
                      {Array(Math.min(item.rows, 3)).fill(0).map((_, i) => (
                        <div key={i} className="flex gap-4 text-xs font-mono text-foreground">
                          <span className="text-muted-foreground">{i + 1}.</span>
                          <span>数据项 {i + 1}</span>
                        </div>
                      ))}
                      {item.rows > 3 && (
                        <p className="text-xs text-muted-foreground">... 还有 {item.rows - 3} 条</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
