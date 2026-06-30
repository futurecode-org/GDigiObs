import { useState, useEffect, useCallback } from "react"
import { Search, Plus, RefreshCw, Eye, Loader2, FileText, Sparkles } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SectionHeader } from "@/shared/components/SectionHeader"
import { collectApi } from "@/lib/api"
import type { CollectedItem, PaginatedData } from "@/lib/types"
import { cn } from "@/lib/utils"

export function DataClean() {
  const [items, setItems] = useState<CollectedItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchItems = useCallback(async () => {
    setIsLoading(true)
    try {
      const status = statusFilter === "all" ? undefined : statusFilter
      const result = await collectApi.getItems({ page, page_size: 20, status }) as PaginatedData<CollectedItem>
      setItems(result.items)
      setTotalPages(result.total_pages)
    } catch (error) {
      console.error("获取采集数据失败:", error)
      setItems([])
    } finally {
      setIsLoading(false)
    }
  }, [page, statusFilter])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const handleClean = async (itemId: number) => {
    try {
      await collectApi.cleanItem(itemId)
      fetchItems()
    } catch (error) {
      console.error("清洗数据失败:", error)
    }
  }

  const handleAnalyze = async (itemId: number) => {
    try {
      await collectApi.analyzeItem(itemId)
      fetchItems()
    } catch (error) {
      console.error("分析数据失败:", error)
    }
  }

  const filteredItems = items.filter(item => 
    (item.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.source_url || "").toLowerCase().includes(searchQuery.toLowerCase())
  )

  const statusLabels: Record<string, string> = {
    raw: "原始数据",
    cleaned: "已清洗",
    analyzed: "已分析"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "raw": return "bg-yellow-500/15 text-yellow-400"
      case "cleaned": return "bg-blue-500/15 text-blue-400"
      case "analyzed": return "bg-emerald-500/15 text-emerald-400"
      default: return "bg-gray-500/15 text-gray-400"
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <SectionHeader 
          title="数据清洗" 
          subtitle="管理采集的数据并进行清洗处理"
          action={<Button size="sm"><Plus className="w-4 h-4" /> 添加清洗规则</Button>} 
        />
        <div className="flex flex-wrap items-center gap-3 mt-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜索任务名称、URL..."
              className="w-full pl-9 pr-3 py-2 bg-muted border border-transparent rounded-lg text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div className="flex gap-2">
            {["all", "raw", "cleaned", "analyzed"].map(status => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status)
                  setPage(1)
                }}
                className={cn(
                  "px-3 py-1.5 text-xs rounded-lg transition-colors",
                  statusFilter === status 
                    ? "bg-primary/10 text-primary" 
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {status === "all" ? "全部" : statusLabels[status] || status}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <div className="text-center">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>暂无采集数据</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">任务名称</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">来源URL</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">数据状态</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">采集时间</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map(item => (
                      <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-foreground">{item.title || "-"}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs text-muted-foreground truncate max-w-xs block">
                            {item.source_url}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={`text-xs ${getStatusColor(item.status)}`}>
                            {statusLabels[item.status] || item.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs text-muted-foreground">
                            {item.created_at ? new Date(item.created_at).toLocaleString() : "-"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon-sm" className="h-8 w-8">
                              <Eye className="w-4 h-4" />
                            </Button>
                            {item.status === "raw" && (
                              <Button variant="outline" size="sm" onClick={() => handleClean(item.id)}>
                                <RefreshCw className="w-4 h-4 mr-1" /> 清洗
                              </Button>
                            )}
                            {item.status === "cleaned" && (
                              <Button variant="outline" size="sm" onClick={() => handleAnalyze(item.id)}>
                                <Sparkles className="w-4 h-4 mr-1" /> 分析
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-muted-foreground">共 {totalPages} 页，当前第 {page} 页</span>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                上一页
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                下一页
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}