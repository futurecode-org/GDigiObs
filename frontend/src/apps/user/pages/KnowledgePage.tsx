import { useState, useEffect, useCallback } from "react"
import { Search, Plus, Upload, Folder, FileText, RefreshCw, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { knowledgeApi } from "@/lib/api"
import type { KnowledgeBase, PaginatedData } from "@/lib/types"
import { cn } from "@/lib/utils"

export function KnowledgePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedKB, setSelectedKB] = useState<number | null>(null)
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchKnowledgeBases = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await knowledgeApi.getList({ page: 1, page_size: 100 }) as PaginatedData<KnowledgeBase>
      setKnowledgeBases(result.items)
      if (result.items.length > 0 && !selectedKB) {
        setSelectedKB(result.items[0].id)
      }
    } catch (error) {
      console.error("获取知识库列表失败:", error)
      setKnowledgeBases([])
    } finally {
      setIsLoading(false)
    }
  }, [selectedKB])

  useEffect(() => {
    fetchKnowledgeBases()
  }, [fetchKnowledgeBases])

  const filteredKB = knowledgeBases.filter(kb => 
    kb.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const currentKB = knowledgeBases.find(kb => kb.id === selectedKB)

  const kbTypeLabels: Record<string, string> = { 
    personal: "个人", 
    tenant: "租户", 
    group: "群组", 
    public: "公共" 
  }
  const kbTypeColors: Record<string, "default" | "secondary" | "outline" | "ghost"> = { 
    personal: "secondary", 
    tenant: "default", 
    group: "outline", 
    public: "ghost" 
  }

  return (
    <div className="h-full flex">
      {/* 左侧知识库列表 */}
      <div className="w-72 border-r border-border flex flex-col flex-shrink-0">
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">知识库</h2>
            <Button size="icon-xs" title="创建知识库">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜索知识库..."
              className="w-full pl-9 pr-3 py-2 bg-muted border border-transparent rounded-lg text-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredKB.length > 0 ? (
            filteredKB.map(kb => (
              <button
                key={kb.id}
                onClick={() => setSelectedKB(kb.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors mb-1",
                  selectedKB === kb.id ? "bg-primary/10" : "hover:bg-muted/50"
                )}
              >
                <Folder className="w-8 h-8 rounded bg-cyan-500/15 text-cyan-400 p-1.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{kb.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge 
                      variant={kbTypeColors[kb.type] || "secondary"} 
                      className="text-[10px]"
                    >
                      {kbTypeLabels[kb.type] || kb.type}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {kb.chunk_count || 0} 个文件
                    </span>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {searchQuery ? "未找到匹配的知识库" : "暂无知识库"}
            </div>
          )}
        </div>
      </div>

      {/* 右侧知识库详情 */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : currentKB ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{currentKB.name}</h2>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <Badge variant={kbTypeColors[currentKB.type] || "secondary"}>
                    {kbTypeLabels[currentKB.type] || currentKB.type}
                  </Badge>
                  <span>{currentKB.chunk_count || 0} 个分片</span>
                  <span>状态: {currentKB.status}</span>
                  <span>创建于 {new Date(currentKB.created_at).toLocaleDateString()}</span>
                </div>
                {currentKB.description && (
                  <p className="text-sm text-muted-foreground mt-2">{currentKB.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Upload className="w-4 h-4 mr-1" /> 上传
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={fetchKnowledgeBases}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium">知识文件</h3>
                  <Button variant="ghost" size="sm">查看全部</Button>
                </div>
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">暂无知识文件</p>
                  <p className="text-xs mt-1">上传文件以开始构建知识库</p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <Folder className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>选择一个知识库</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}