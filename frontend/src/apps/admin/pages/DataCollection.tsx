import { useState, useEffect, useCallback } from "react"
import { Search, Plus, RefreshCw, ChevronLeft, ChevronRight, MoreVertical, Trash2, Edit, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { SectionHeader } from "@/shared/components/SectionHeader"
import { collectApi } from "@/lib/api"
import type { CollectTask, PaginatedData } from "@/lib/types"

export function DataCollection() {
  const [tasks, setTasks] = useState<CollectTask[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchTasks = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await collectApi.getTasks({ page, page_size: 20 }) as PaginatedData<CollectTask>
      setTasks(result.items)
      setTotalPages(result.total_pages)
    } catch (error) {
      console.error("获取采集任务列表失败:", error)
      setTasks([])
    } finally {
      setIsLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const filteredTasks = tasks.filter(task => 
    task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.platform_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <SectionHeader 
          title="数据采集" 
          action={<Button size="sm"><Plus className="w-4 h-4" /> 添加任务</Button>} 
        />
        <div className="flex gap-3 mt-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="搜索任务名称、平台名称..."
              className="pl-9"
            />
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
            ) : filteredTasks.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <div className="text-center">
                  <RefreshCw className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>暂无采集任务</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">任务名称</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">所属平台</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">采集方式</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">来源URL</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">状态</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">采集数量</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">创建时间</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.map(task => (
                      <tr key={task.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <RefreshCw className="w-4 h-4 text-primary" />
                            </div>
                            <span className="text-sm font-medium text-foreground">{task.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-foreground">{task.platform_name}</td>
                        <td className="py-3 px-4 text-sm text-foreground">{task.collect_method}</td>
                        <td className="py-3 px-4 text-xs text-muted-foreground max-w-[200px] truncate">{task.source_url || "-"}</td>
                        <td className="py-3 px-4">
                          <Badge className={`text-xs ${task.status === "active" ? "bg-emerald-500/15 text-emerald-400" : "bg-destructive/15 text-destructive"}`}>
                            {task.status === "active" ? "正常" : "异常"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-foreground">{task.collected_count?.toLocaleString() || 0}</td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">{task.created_at}</td>
                        <td className="py-3 px-4">
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
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="w-4 h-4 mr-2" /> 删除
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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