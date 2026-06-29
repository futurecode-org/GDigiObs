import { useState, useEffect, useCallback } from "react"
import { Search, Plus, Play, BarChart3, TrendingUp, Trash2, Eye, Loader2, Activity } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SectionHeader } from "@/shared/components/SectionHeader"
import { analysisApi } from "@/lib/api"
import type { AnalysisTask, PaginatedData } from "@/lib/types"
import { cn } from "@/lib/utils"

export function DataAnalysis() {
  const [tasks, setTasks] = useState<AnalysisTask[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchTasks = useCallback(async () => {
    setIsLoading(true)
    try {
      const analysis_type = typeFilter === "all" ? undefined : typeFilter
      const result = await analysisApi.getTasks({ page, page_size: 20, analysis_type }) as PaginatedData<AnalysisTask>
      setTasks(result.items)
      setTotalPages(result.total_pages)
    } catch (error) {
      console.error("获取分析任务失败:", error)
      setTasks([])
    } finally {
      setIsLoading(false)
    }
  }, [page, typeFilter])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const handleExecute = async (taskId: number) => {
    try {
      await analysisApi.execute(taskId)
      fetchTasks()
    } catch (error) {
      console.error("执行分析任务失败:", error)
    }
  }

  const handleDelete = async (taskId: number, taskName: string) => {
    if (!confirm(`确定要删除分析任务「${taskName}」吗？`)) return
    try {
      await analysisApi.deleteTask(taskId)
      fetchTasks()
    } catch (error) {
      console.error("删除分析任务失败:", error)
    }
  }

  const filteredTasks = tasks.filter(task => 
    task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const typeLabels: Record<string, string> = {
    sentiment: "情感分析",
    trend: "趋势分析",
    classification: "分类分析",
    summary: "摘要分析",
    comparison: "对比分析"
  }

  const statusLabels: Record<string, string> = {
    active: "正常",
    disabled: "禁用",
    running: "运行中",
    completed: "已完成"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-emerald-500/15 text-emerald-400"
      case "running": return "bg-blue-500/15 text-blue-400"
      case "completed": return "bg-purple-500/15 text-purple-400"
      case "disabled": return "bg-gray-500/15 text-gray-400"
      default: return "bg-gray-500/15 text-gray-400"
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <SectionHeader 
          title="数据分析" 
          subtitle="管理和执行数据分析任务"
          action={<Button size="sm"><Plus className="w-4 h-4" /> 创建分析任务</Button>} 
        />
        <div className="flex flex-wrap items-center gap-3 mt-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜索任务名称、描述..."
              className="w-full pl-9 pr-3 py-2 bg-muted border border-transparent rounded-lg text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div className="flex gap-2">
            {["all", "sentiment", "trend", "classification", "summary"].map(type => (
              <button
                key={type}
                onClick={() => {
                  setTypeFilter(type)
                  setPage(1)
                }}
                className={cn(
                  "px-3 py-1.5 text-xs rounded-lg transition-colors",
                  typeFilter === type 
                    ? "bg-primary/10 text-primary" 
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {type === "all" ? "全部" : typeLabels[type] || type}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">总分析任务</p>
                  <p className="text-2xl font-bold text-foreground">{tasks.length}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">运行中</p>
                  <p className="text-2xl font-bold text-foreground">{tasks.filter(t => t.status === "running").length}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">已完成</p>
                  <p className="text-2xl font-bold text-foreground">{tasks.filter(t => t.status === "completed").length}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>暂无分析任务</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">任务名称</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">分析类型</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">描述</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">状态</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">创建时间</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.map(task => (
                      <tr key={task.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-foreground">{task.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="secondary" className="text-xs">
                            {typeLabels[task.analysis_type] || task.analysis_type}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs text-muted-foreground truncate max-w-xs block">
                            {task.description || "-"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={`text-xs ${getStatusColor(task.status)}`}>
                            {statusLabels[task.status] || task.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs text-muted-foreground">
                            {task.created_at ? new Date(task.created_at).toLocaleDateString() : "-"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon-sm" className="h-8 w-8">
                              <Eye className="w-4 h-4" />
                            </Button>
                            {task.status !== "running" && (
                              <Button variant="outline" size="sm" onClick={() => handleExecute(task.id)}>
                                <Play className="w-4 h-4 mr-1" /> 执行
                              </Button>
                            )}
                            <Button variant="ghost" size="icon-sm" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(task.id, task.name)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
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