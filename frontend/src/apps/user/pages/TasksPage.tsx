import { useState, useEffect } from "react"
import { Plus, CheckCircle2, Clock, AlertCircle, MoreVertical, Play, Loader2, ChevronRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SectionHeader } from "@/shared/components/SectionHeader"
import { Progress } from "@/components/ui/progress"
import { workflowApi } from "@/lib/api"
import type { WorkflowRun, PaginatedData, Workflow } from "@/lib/types"

export function TasksPage() {
  const [filter, setFilter] = useState<string>("all")
  const [workflowRuns, setWorkflowRuns] = useState<WorkflowRun[]>([])
  const [workflows, setWorkflows] = useState<Map<number, Workflow>>(new Map())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchWorkflowRuns()
    fetchWorkflows()
  }, [])

  const fetchWorkflowRuns = async () => {
    setIsLoading(true)
    try {
      const result = await workflowApi.getTasks({ page: 1, page_size: 100 }) as PaginatedData<WorkflowRun>
      setWorkflowRuns(result.items)
    } catch (error) {
      console.error("获取任务列表失败:", error)
      setWorkflowRuns([])
    } finally {
      setIsLoading(false)
    }
  }

  const fetchWorkflows = async () => {
    try {
      const result = await workflowApi.getList({ page: 1, page_size: 100 }) as PaginatedData<Workflow>
      const workflowMap = new Map<number, Workflow>()
      result.items.forEach(wf => workflowMap.set(wf.id, wf))
      setWorkflows(workflowMap)
    } catch (error) {
      console.error("获取工作流列表失败:", error)
    }
  }

  const filteredTasks = workflowRuns.filter(run => {
    if (filter === "all") return true
    return run.status === filter
  })

  const handleRunWorkflow = async (workflowId: number) => {
    try {
      await workflowApi.run(workflowId)
      await fetchWorkflowRuns()
    } catch (error) {
      console.error("执行工作流失败:", error)
    }
  }

  const statusConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
    success: { icon: <CheckCircle2 className="w-4 h-4" />, label: "已完成", color: "text-emerald-400" },
    running: { icon: <Clock className="w-4 h-4 animate-pulse" />, label: "进行中", color: "text-cyan-400" },
    pending: { icon: <AlertCircle className="w-4 h-4" />, label: "待处理", color: "text-amber-400" },
    failed: { icon: <AlertCircle className="w-4 h-4" />, label: "失败", color: "text-red-400" },
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-4">
      <SectionHeader title="任务中心" action={<Button size="sm"><Plus className="w-4 h-4" /> 新建任务</Button>} />

      <Card>
        <CardContent className="p-2">
          <div className="flex gap-2 px-2">
            {[
              { key: "all", label: "全部" },
              { key: "running", label: "进行中" },
              { key: "pending", label: "待处理" },
              { key: "success", label: "已完成" },
              { key: "failed", label: "失败" }
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${filter === f.key ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredTasks.length > 0 ? (
        <div className="space-y-3">
          {filteredTasks.map(task => {
            const status = statusConfig[task.status] || statusConfig.pending
            const workflow = workflows.get(task.workflow_id)
            return (
              <Card key={task.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-lg p-2 bg-muted ${status.color}`}>
                        {status.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{task.workflow_name || "未知工作流"}</span>
                          {workflow && (
                            <Badge variant="outline" className="text-[10px]">
                              {workflow.trigger_type === "manual" ? "手动触发" : workflow.trigger_type === "schedule" ? "定时触发" : workflow.trigger_type}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>创建于 {task.created_at ? new Date(task.created_at).toLocaleString() : ""}</span>
                          {task.updated_at && (
                            <span>更新于 {new Date(task.updated_at).toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {task.status === "failed" && task.error_message && (
                        <Badge variant="destructive" className="text-[10px]">
                          {task.error_message.substring(0, 30)}...
                        </Badge>
                      )}
                      <Badge className={task.status === "failed" ? "bg-red-50 text-red-600" : task.status === "completed" ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"}>
                        {status.label}
                      </Badge>
                      <button className="p-1 rounded hover:bg-muted transition-colors">
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  </div>

                  {task.status === "running" && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-muted-foreground">执行进度</span>
                        <span className="font-mono text-foreground">50%</span>
                      </div>
                      <Progress value={50} className="h-1.5" />
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                    <button className="text-xs text-primary hover:underline flex items-center gap-1">
                      查看详情 <ChevronRight className="w-3 h-3" />
                    </button>
                    {task.status === "pending" && (
                      <Button variant="outline" size="sm" onClick={() => handleRunWorkflow(task.workflow_id)}>
                        <Play className="w-3 h-3" /> 立即执行
                      </Button>
                    )}
                    {task.status === "failed" && (
                      <Button variant="outline" size="sm" onClick={() => handleRunWorkflow(task.workflow_id)}>
                        <Play className="w-3 h-3" /> 重试
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm">暂无任务</p>
        </div>
      )}
    </div>
  )
}