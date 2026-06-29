import { useState, useEffect, useCallback } from "react"
import { Clock, ChevronDown, ChevronUp, Copy, Check, FileText, Star, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SectionHeader } from "@/shared/components/SectionHeader"
import { askApi } from "@/lib/api"
import type { AskRecord, PaginatedData } from "@/lib/types"

export function QueryHistoryPage() {
  const [records, setRecords] = useState<AskRecord[]>([])
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchRecords = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await askApi.getList({ page, page_size: 20 }) as PaginatedData<AskRecord>
      setRecords(result.items)
      setTotalPages(result.total_pages)
    } catch (error) {
      console.error("获取问数历史失败:", error)
      setRecords([])
    } finally {
      setIsLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const handleCopy = (query: string, id: number) => {
    navigator.clipboard.writeText(query)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleSave = async (record: AskRecord) => {
    try {
      await askApi.save(record.id)
      setRecords(records.map(r => r.id === record.id ? { ...r, is_saved: !r.is_saved } : r))
    } catch (error) {
      console.error("收藏失败:", error)
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <SectionHeader title="问数历史" />
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : records.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>暂无问数记录</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map(record => (
              <Card key={record.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground truncate">{record.question}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {record.created_at}
                        </span>
                        <span>状态: {record.status}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleSave(record)}
                        className="p-1.5 rounded hover:bg-muted transition-colors"
                      >
                        <Star className={`w-4 h-4 ${record.is_saved ? "text-amber-400 fill-amber-400" : "text-muted-foreground"}`} />
                      </button>
                      <button
                        onClick={() => handleCopy(record.question, record.id)}
                        className="p-1.5 rounded hover:bg-muted transition-colors"
                      >
                        {copiedId === record.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                      </button>
                      <button
                        onClick={() => toggleExpand(record.id)}
                        className="p-1.5 rounded hover:bg-muted transition-colors"
                      >
                        {expandedId === record.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </button>
                    </div>
                  </div>
                  {expandedId === record.id && (
                    <div className="mt-3 pt-3 border-t border-border space-y-3">
                      {record.answer && (
                        <div className="p-3 bg-muted/30 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">分析结果</p>
                          <p className="text-sm text-foreground">{record.answer}</p>
                        </div>
                      )}
                      {record.data_source && (
                        <div className="p-3 bg-muted/30 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">数据来源</p>
                          <pre className="text-xs text-foreground overflow-x-auto">{record.data_source}</pre>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  上一页
                </Button>
                <span className="text-sm text-muted-foreground">第 {page} / {totalPages} 页</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  下一页
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}