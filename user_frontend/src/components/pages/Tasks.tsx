import { useState } from "react"
import { Search, Plus, Clock, Settings, ListTodo, Filter } from "lucide-react"
import { Card } from "@/components/shared/Card"
import { Badge } from "@/components/shared/Badge"
import { Btn } from "@/components/shared/Btn"
import { SectionHeader } from "@/components/shared/SectionHeader"
import { cn } from "@/lib/utils"
import { myTasks } from "@/lib/mockData"

export function TasksPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterPriority, setFilterPriority] = useState<string>("all")

  const filteredTasks = myTasks.filter(task => {
    const matchSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchType = filterType === "all" || task.type === filterType
    const matchStatus = filterStatus === "all" || task.status === filterStatus
    const matchPriority = filterPriority === "all" || task.priority === filterPriority
    return matchSearch && matchType && matchStatus && matchPriority
  })

  const typeLabels: Record<string, string> = { personal: "个人任务", agent: "数字员工", workflow: "工作流" }
  const typeColors: Record<string, string> = { personal: "primary", agent: "purple", workflow: "info" }
  const statusLabels: Record<string, string> = { pending: "待执行", running: "执行中", success: "已完成", failed: "失败" }
  const statusColors: Record<string, string> = { pending: "muted", running: "info", success: "success", failed: "danger" }
  const priorityLabels: Record<string, string> = { high: "紧急", medium: "中等", low: "低" }
  const priorityColors: Record<string, string> = { high: "danger", medium: "warning", low: "muted" }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <SectionHeader title="任务管理" action={<Btn variant="primary" size="sm"><Plus className="w-4 h-4" /> 创建任务</Btn>} />
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="搜索任务..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-muted border border-transparent rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="px-3 py-2 bg-muted border border-transparent rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
            >
              <option value="all">全部类型</option>
              <option value="personal">个人任务</option>
              <option value="agent">数字员工</option>
              <option value="workflow">工作流</option>
            </select>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-muted border border-transparent rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
            >
              <option value="all">全部状态</option>
              <option value="pending">待执行</option>
              <option value="running">执行中</option>
              <option value="success">已完成</option>
              <option value="failed">失败</option>
            </select>
            <select
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value)}
              className="px-3 py-2 bg-muted border border-transparent rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
            >
              <option value="all">全部优先级</option>
              <option value="high">紧急</option>
              <option value="medium">中等</option>
              <option value="low">低</option>
            </select>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {filteredTasks.map(task => (
          <Card key={task.id} className="p-4">
            <div className="flex items-start gap-4">
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                task.type === "agent" ? "bg-purple-500/15 text-purple-400" :
                task.type === "workflow" ? "bg-cyan-500/15 text-cyan-400" :
                "bg-primary/15 text-primary"
              )}>
                {task.type === "agent" ? <Settings className="w-5 h-5" /> :
                 task.type === "workflow" ? <ListTodo className="w-5 h-5" /> :
                 <ListTodo className="w-5 h-5" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-sm font-medium text-foreground">{task.title}</h3>
                  <Badge variant={typeColors[task.type] as "default" | "success" | "warning" | "danger" | "muted" | "info" | "primary" | "purple"}>{typeLabels[task.type]}</Badge>
                  <Badge variant={priorityColors[task.priority] as "default" | "success" | "warning" | "danger" | "muted" | "info" | "primary" | "purple"}>{priorityLabels[task.priority]}</Badge>
                  <Badge variant={statusColors[task.status] as "default" | "success" | "warning" | "danger" | "muted" | "info" | "primary" | "purple"}>{statusLabels[task.status]}</Badge>
                </div>

                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    <span>截止日期: {task.due}</span>
                  </div>
                  {task.assignee && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span>负责人: {task.assignee}</span>
                    </div>
                  )}
                  {task.agent && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span>执行: {task.agent}</span>
                    </div>
                  )}
                  {task.workflow && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span>工作流: {task.workflow}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full",
                      task.priority === "high" ? "bg-red-400" :
                      task.priority === "medium" ? "bg-amber-400" :
                      "bg-emerald-400"
                    )} style={{ width: `${task.progress}%` }} />
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">{task.progress}%</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {task.status === "running" && (
                  <Btn variant="danger" size="sm">暂停</Btn>
                )}
                {task.status === "pending" && (
                  <Btn variant="primary" size="sm">执行</Btn>
                )}
                {task.status === "success" && (
                  <Btn variant="ghost" size="sm">查看结果</Btn>
                )}
                {task.status === "failed" && (
                  <Btn variant="danger" size="sm">重试</Btn>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center py-12">
          <ListTodo className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">暂无任务</p>
        </div>
      )}
    </div>
  )
}