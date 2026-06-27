import { useState, useEffect, useCallback } from "react"
import { GitBranch, Plus, Play, Pause, Loader2, Clock, AlertCircle, CheckCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SectionHeader } from "@/shared/components/SectionHeader"
import { workflowApi } from "@/lib/api"
import type { Workflow, PaginatedData } from "@/lib/types"
import { cn } from "@/lib/utils"

export function WorkflowPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>("all")

  const fetchWorkflows = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await workflowApi.getList({ page: 1, page_size: 100 }) as PaginatedData<Workflow>
      setWorkflows(result.items)
    } catch (error) {
      console.error("获取工作流列表失败:", error)
      setWorkflows([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWorkflows()
  }, [fetchWorkflows])

  const filteredWorkflows = workflows.filter(wf => 
    filterStatus === "all" || wf.status === filterStatus
  )

  const statusLabels: Record<string, string> = {
    enabled: "运行中",
    disabled: "已停止",
    draft: "草稿"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "enabled": return "bg-emerald-500"
      case "disabled": return "bg-gray-500"
      case "draft": return "bg-yellow-500"
      default: return "bg-gray-500"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "enabled": return <CheckCircle className="w-4 h-4 text-emerald-500" />
      case "disabled": return <Pause className="w-4 h-4 text-gray-400" />
      case "draft": return <Clock className="w-4 h-4 text-yellow-500" />
      default: return <AlertCircle className="w-4 h-4 text-gray-400" />
    }
  }

  const triggerTypeLabels: Record<string, string> = {
    manual: "手动触发",
    webhook: "Webhook",
    schedule: "定时任务",
    event: "事件触发"
  }

  const handleToggleStatus = async (wf: Workflow) => {
    try {
      if (wf.status === "enabled") {
        await workflowApi.disable(wf.id)
      } else {
        await workflowApi.enable(wf.id)
      }
      fetchWorkflows()
    } catch (error) {
      console.error("切换工作流状态失败:", error)
    }
  }

  const handleRunWorkflow = async (wfId: number) => {
    try {
      await workflowApi.run(wfId)
      fetchWorkflows()
    } catch (error) {
      console.error("执行工作流失败:", error)
    }
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-4">
      <SectionHeader 
        title="工作流管理" 
        action={
          <Button size="sm" onClick={() => console.log("创建工作流")}>
            <Plus className="w-4 h-4" /> 创建工作流
          </Button>
        } 
      />

      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            {["all", "enabled", "disabled", "draft"].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={cn(
                  "px-3 py-1.5 text-xs rounded-lg transition-colors",
                  filterStatus === status 
                    ? "bg-primary/10 text-primary" 
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {status === "all" ? "全部" : statusLabels[status] || status}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredWorkflows.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWorkflows.map(wf => (
            <Card key={wf.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center">
                    <GitBranch className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(wf.status)}
                    <span className={cn("w-2 h-2 rounded-full", getStatusColor(wf.status))} />
                  </div>
                </div>

                <h3 className="text-sm font-medium text-foreground mb-1">{wf.name}</h3>
                
                {wf.description && (
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{wf.description}</p>
                )}

                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Badge variant="outline">{triggerTypeLabels[wf.trigger_type] || wf.trigger_type}</Badge>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span className={cn("w-2 h-2 rounded-full", getStatusColor(wf.status))} />
                    {statusLabels[wf.status] || wf.status}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-[10px] text-muted-foreground">
                    {wf.nodes?.length || 0} 个节点
                  </span>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon-sm"
                      onClick={() => handleToggleStatus(wf)}
                      title={wf.status === "enabled" ? "停止" : "启动"}
                    >
                      {wf.status === "enabled" ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4 text-emerald-500" />
                      )}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon-sm"
                      onClick={() => handleRunWorkflow(wf.id)}
                      title="执行"
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <GitBranch className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">{filterStatus !== "all" ? "没有匹配的工作流" : "暂无工作流"}</p>
            <Button variant="outline" size="sm" className="mt-4">
              <Plus className="w-4 h-4 mr-1" /> 创建工作流
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}