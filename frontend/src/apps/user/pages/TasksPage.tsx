import { useState } from "react"
import { Plus, CheckCircle2, Clock, AlertCircle, MoreVertical, Play } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SectionHeader } from "@/shared/components/SectionHeader"
import { Progress } from "@/components/ui/progress"
import { myTasks } from "@/lib/mockData"
import { cn } from "@/lib/utils"

export function TasksPage() {
  const [filter, setFilter] = useState<string>("all")

  const filterTasks = myTasks.filter(t => filter === "all" || t.status === filter)

  const statusIcons: Record<string, React.ReactNode> = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
    running: <Clock className="w-4 h-4 text-cyan-400" />,
    pending: <AlertCircle className="w-4 h-4 text-amber-400" />,
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
              { key: "success", label: "已完成" }
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn("px-3 py-1.5 text-xs rounded-lg transition-colors", filter === f.key ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted")}
              >
                {f.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filterTasks.map(task => (
          <Card key={task.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {statusIcons[task.status]}
                  <span className="text-sm font-medium text-foreground">{task.title}</span>
                </div>
                <button className="p-1 rounded hover:bg-muted transition-colors">
                  <MoreVertical className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">任务类型</span>
                  <Badge>{task.type}</Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">优先级</span>
                  <Badge variant={task.priority === "high" ? "destructive" : task.priority === "medium" ? "outline" : "secondary"}>
                    {task.priority === "high" ? "高" : task.priority === "medium" ? "中" : "低"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">创建时间</span>
                  <span className="text-foreground">{task.due}</span>
                </div>
                {task.status !== "success" && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">截止时间</span>
                    <span className="text-foreground">{task.due}</span>
                  </div>
                )}
              </div>

              {task.status !== "success" && (
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">进度</span>
                    <span className="font-mono text-foreground">{task.progress}%</span>
                  </div>
                  <Progress value={task.progress} />
                </div>
              )}

              {task.status === "pending" && (
                <div className="mt-3 pt-3 border-t border-border">
                  <Button variant="outline" size="sm" className="w-full"><Play className="w-3 h-3" /> 立即执行</Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
