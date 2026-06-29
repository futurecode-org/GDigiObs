import { useState, useEffect, useCallback } from "react"
import { Search, Plus, Cpu, Lock, TestTube, ChevronLeft, ChevronRight, MoreVertical, Trash2, Edit, Loader2, Globe } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { SectionHeader } from "@/shared/components/SectionHeader"
import { modelApi } from "@/lib/api"
import type { ModelConfig, PaginatedData } from "@/lib/types"

export function ModelManagement() {
  const [models, setModels] = useState<ModelConfig[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [typeFilter, setTypeFilter] = useState<string>("all")

  const fetchModels = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await modelApi.getList({ page, page_size: 20 }) as PaginatedData<ModelConfig>
      setModels(result.items)
      setTotalPages(result.total_pages)
    } catch (error) {
      console.error("获取模型列表失败:", error)
      setModels([])
    } finally {
      setIsLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchModels()
  }, [fetchModels])

  const handleTest = async (modelId: number) => {
    try {
      await modelApi.test(modelId)
      fetchModels()
    } catch (error) {
      console.error("测试模型失败:", error)
    }
  }

  const filteredModels = models.filter(model => {
    const matchesSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      model.model_key?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === "all" || model.model_type === typeFilter
    return matchesSearch && matchesType
  })

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <SectionHeader 
          title="模型管理" 
          action={<Button size="sm"><Plus className="w-4 h-4" /> 添加模型</Button>} 
        />
        <div className="flex gap-3 mt-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="搜索模型名称、模型标识..."
              className="pl-9"
            />
          </div>
          <div className="flex gap-1">
            {["all", "chat", "embedding"].map(type => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                  typeFilter === type 
                    ? "bg-primary/10 text-primary" 
                    : "bg-muted text-muted-foreground hover:bg-muted/50"
                }`}
              >
                {type === "all" ? "全部" : type === "chat" ? "对话模型" : "嵌入模型"}
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
            ) : filteredModels.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <div className="text-center">
                  <Cpu className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>暂无模型配置</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">模型名称</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">模型标识</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">类型</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">API类型</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">可见性</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">功能支持</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">状态</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredModels.map(model => (
                      <tr key={model.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <Cpu className="w-4 h-4 text-primary" />
                            </div>
                            <span className="text-sm font-medium text-foreground">{model.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground font-mono">{model.model_key}</td>
                        <td className="py-3 px-4">
                          <Badge variant="secondary" className="text-xs">
                            {model.model_type === "chat" ? "对话" : "嵌入"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="text-xs">
                            {model.api_type === "openai" ? "OpenAI" : model.api_type === "dify" ? "Dify" : "自定义"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className={`flex items-center gap-1 text-xs ${model.visibility === "public" ? "text-emerald-400" : "text-amber-400"}`}>
                            {model.visibility === "public" ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                            {model.visibility === "public" ? "公开" : "私有"}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {model.support_tool_call && <Badge variant="ghost" className="text-xs">工具调用</Badge>}
                            {model.support_vision && <Badge variant="ghost" className="text-xs">视觉</Badge>}
                            {model.support_reasoning && <Badge variant="ghost" className="text-xs">推理</Badge>}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={`text-xs ${model.status === "active" ? "bg-emerald-500/15 text-emerald-400" : "bg-destructive/15 text-destructive"}`}>
                            {model.status === "active" ? "正常" : "异常"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <Button variant="outline" size="sm" onClick={() => handleTest(model.id)}>
                              <TestTube className="w-4 h-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Edit className="w-4 h-4 mr-2" /> 编辑
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Trash2 className="w-4 h-4 mr-2" /> 删除
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}