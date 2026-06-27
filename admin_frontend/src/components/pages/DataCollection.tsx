import { useState } from "react"
import { Play, Pause, RefreshCw, Settings, Trash2, Plus, Search, Filter, Calendar } from "lucide-react"
import { Card } from "@/components/shared/Card"
import { SectionHeader } from "@/components/shared/SectionHeader"
import { Badge } from "@/components/shared/Badge"
import { StatusDot } from "@/components/shared/StatusDot"
import { Btn } from "@/components/shared/Btn"
import { collectTasks } from "@/lib/mockData"

export function DataCollection() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredTasks = collectTasks.filter(task =>
    task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.platform.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleRunTask = (taskId: number) => {
    console.log(`Run task ${taskId}`)
  }

  const handleToggleTask = (taskId: number) => {
    console.log(`Toggle task ${taskId}`)
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <Card className="p-4 mb-4">
        <SectionHeader title="数据采集任务" action={<Btn onClick={() => alert("添加采集任务")}><Plus className="w-4 h-4" /> 新建任务</Btn>} />
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="搜索任务名称或平台..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <Btn variant="outline"><Filter className="w-4 h-4" /> 筛选</Btn>
          <Btn variant="outline"><Calendar className="w-4 h-4" /> 时间范围</Btn>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredTasks.map(task => (
          <Card key={task.id} className="p-4 hover:border-primary/30 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-sm font-medium text-foreground">{task.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="default">{task.platform}</Badge>
                  <Badge variant={task.isPublic ? "success" : "muted"}>{task.isPublic ? "公开" : "私有"}</Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Btn variant="ghost" onClick={() => alert(`配置任务 ${task.name}`)}><Settings className="w-4 h-4" /></Btn>
                <Btn variant="danger" onClick={() => alert(`删除任务 ${task.name}`)}><Trash2 className="w-4 h-4" /></Btn>
              </div>
            </div>

            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>采集方式</span>
                <span className="text-foreground">{task.method}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>上次运行</span>
                <span className="text-foreground">{task.lastRun}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>失败次数</span>
                <span className={task.failCount > 0 ? "text-red-400" : "text-foreground"}>{task.failCount} 次</span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
              <div className="flex items-center gap-2">
                <StatusDot status={task.status} />
                <span className="text-sm">
                  {task.status === "running" ? "运行中" : task.status === "enabled" ? "已启用" : task.status === "disabled" ? "已停用" : "出错"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Btn variant="outline" onClick={() => handleRunTask(task.id)}><RefreshCw className="w-4 h-4" /> 运行</Btn>
                <Btn variant={task.status === "enabled" ? "danger" : "success"} onClick={() => handleToggleTask(task.id)}>
                  {task.status === "enabled" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Btn>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-sm text-muted-foreground">暂无采集任务</p>
          <Btn className="mt-4"><Plus className="w-4 h-4" /> 创建任务</Btn>
        </Card>
      )}
    </div>
  )
}