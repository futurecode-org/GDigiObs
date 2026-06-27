import { useState } from "react"
import {
  Bot, GitBranch, ClipboardList, Plus, Activity, CheckCircle,
  AlertTriangle, Eye, Lock, RefreshCw, Radio, AlertCircle
} from "lucide-react"
import { cn } from "@/shared/utils"
import { Badge, StatCard, Card, Btn } from "@/shared/ui"
import { myTasks } from "@/shared/mockData"

export function TasksPage() {
  const [tab, setTab] = useState<"all" | "personal" | "agent" | "workflow">("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filtered = myTasks
    .filter(t => tab === "all" || t.type === tab)
    .filter(t => statusFilter === "all" || t.status === statusFilter)

  const counts = {
    all: myTasks.length,
    personal: myTasks.filter(t => t.type === "personal").length,
    agent: myTasks.filter(t => t.type === "agent").length,
    workflow: myTasks.filter(t => t.type === "workflow").length,
  }

  const statusConfig: Record<string, { label: string; variant: "success" | "info" | "danger" | "muted" | "warning"; dot: string }> = {
    pending:  { label: "待执行", variant: "muted",    dot: "bg-slate-500" },
    running:  { label: "执行中", variant: "info",     dot: "bg-blue-400 animate-pulse" },
    success:  { label: "已完成", variant: "success",  dot: "bg-emerald-400" },
    failed:   { label: "执行失败", variant: "danger", dot: "bg-red-400" },
    canceled: { label: "已取消", variant: "muted",    dot: "bg-slate-500" },
  }

  const priorityConfig: Record<string, { label: string; color: string }> = {
    high:   { label: "高", color: "text-red-400" },
    medium: { label: "中", color: "text-amber-400" },
    low:    { label: "低", color: "text-muted-foreground" },
  }

  const typeIcon: Record<string, React.ElementType> = { personal: ClipboardList, agent: Bot, workflow: GitBranch }
  const typeColor: Record<string, string> = {
    personal: "bg-primary/10 text-primary border-primary/20",
    agent:    "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    workflow: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  }
  const typeLabel: Record<string, string> = { personal: "个人任务", agent: "数字员工", workflow: "工作流" }

  const stats = {
    running: myTasks.filter(t => t.status === "running").length,
    pending: myTasks.filter(t => t.status === "pending").length,
    success: myTasks.filter(t => t.status === "success").length,
    failed:  myTasks.filter(t => t.status === "failed").length,
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 p-6 pb-0 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">我的任务</h2>
            <p className="text-xs text-muted-foreground mt-0.5">个人任务、数字员工执行记录、工作流运行状态</p>
          </div>
          <Btn size="sm"><Plus className="w-4 h-4" />新建任务</Btn>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          <StatCard label="执行中" value={stats.running} icon={Activity} color="info" />
          <StatCard label="待执行" value={stats.pending} icon={ClipboardList} color="muted" />
          <StatCard label="已完成" value={stats.success} icon={CheckCircle} color="success" />
          <StatCard label="执行失败" value={stats.failed} icon={AlertTriangle} color="danger" />
        </div>

        {/* Tabs + Filter */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1 bg-muted/40 rounded-lg p-1">
            {(["all", "personal", "agent", "workflow"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} className={cn(
                "px-3 py-1 text-xs rounded font-medium transition-colors flex items-center gap-1.5",
                tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}>
                {t !== "all" && (() => { const I = typeIcon[t]; return <I className="w-3 h-3" /> })()}
                {t === "all" ? "全部" : typeLabel[t]}
                <span className={cn("text-[10px] px-1 rounded", tab === t ? "bg-primary/15 text-primary" : "text-muted-foreground/60")}>
                  {counts[t]}
                </span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">状态：</span>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="bg-input-background border border-border rounded px-2 py-1 text-xs text-foreground">
              <option value="all">全部</option>
              <option value="running">执行中</option>
              <option value="pending">待执行</option>
              <option value="success">已完成</option>
              <option value="failed">失败</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-2">
        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <ClipboardList className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">暂无任务</p>
          </div>
        )}
        {filtered.map(task => {
          const TypeIcon = typeIcon[task.type]
          const sc = statusConfig[task.status]
          const pc = priorityConfig[task.priority]
          return (
            <Card key={task.id} className="p-4 hover:border-primary/25 transition-colors group">
              <div className="flex items-start gap-4">
                {/* Type icon */}
                <div className={cn("w-9 h-9 rounded-lg border flex items-center justify-center flex-shrink-0 mt-0.5", typeColor[task.type])}>
                  <TypeIcon className="w-4 h-4" />
                </div>

                {/* Main */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-foreground">{task.title}</span>
                        <Badge variant="muted">{typeLabel[task.type]}</Badge>
                        <Badge variant={sc.variant}><span className={cn("w-1.5 h-1.5 rounded-full inline-block mr-0.5", sc.dot)} />{sc.label}</Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className={cn("font-medium", pc.color)}>优先级 {pc.label}</span>
                        <span>截止 {task.due}</span>
                        {task.type === "agent" && <span>执行者：{(task as { agent?: string }).agent}</span>}
                        {task.type === "workflow" && <span>工作流：{(task as { workflow?: string }).workflow}</span>}
                        {(task.type === "agent" || task.type === "workflow") && (
                          <span className="font-mono text-[10px]">{(task as { runId?: string }).runId}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress */}
                  {(task.status === "running" || task.status === "success") && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>进度</span>
                        <span className="font-mono">{task.progress}%</span>
                      </div>
                      <div className="h-1 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all", task.status === "success" ? "bg-emerald-400" : "bg-primary")}
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {task.status === "failed" && (
                    <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/5 border border-red-500/15 rounded px-3 py-1.5">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      执行失败：模型节点调用超时，已记录错误日志
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Btn variant="ghost" size="xs"><Eye className="w-3.5 h-3.5" /></Btn>
                  {task.status === "running" && <Btn variant="ghost" size="xs" className="text-amber-400"><Lock className="w-3.5 h-3.5" /></Btn>}
                  {task.status === "failed" && <Btn variant="ghost" size="xs" className="text-primary"><RefreshCw className="w-3.5 h-3.5" /></Btn>}
                  {task.status === "pending" && <Btn variant="ghost" size="xs" className="text-emerald-400"><Radio className="w-3.5 h-3.5" /></Btn>}
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
