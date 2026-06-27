import { useState } from "react"
import { RefreshCw, Download, Plus, Search, BarChart3 } from "lucide-react"
import { Card } from "@/components/shared/Card"
import { SectionHeader } from "@/components/shared/SectionHeader"
import { Badge } from "@/components/shared/Badge"
import { StatusDot } from "@/components/shared/StatusDot"
import { Btn } from "@/components/shared/Btn"
import { analysisTasksData, keywordData } from "@/lib/mockData"

export function DataAnalysis() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredTasks = analysisTasksData.filter(task =>
    task.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="h-full overflow-y-auto p-6">
      <Card className="p-4 mb-4">
        <SectionHeader title="数据分析任务" action={<Btn onClick={() => alert("创建任务")}><Plus className="w-4 h-4" /> 新建任务</Btn>} />
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索任务名称..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {filteredTasks.map(task => (
            <Card key={task.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-foreground">{task.name}</h3>
                    <Badge variant="default">{task.type}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">数据源: {task.source}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Btn variant="ghost" onClick={() => alert(`查看结果 ${task.name}`)}><Download className="w-4 h-4" /></Btn>
                  <Btn variant="outline" onClick={() => alert(`重新运行 ${task.name}`)}><RefreshCw className="w-4 h-4" /></Btn>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                <div className="flex items-center gap-2">
                  <StatusDot status={task.status} />
                  <span className={`text-sm ${task.status === "success" ? "text-emerald-400" : task.status === "running" ? "text-blue-400" : "text-red-400"}`}>
                    {task.status === "success" ? "成功" : task.status === "running" ? "运行中" : "失败"}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">上次运行: {task.lastRun}</span>
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-4">
          <SectionHeader title="热词统计" />
          <div className="space-y-3 mt-4">
            {keywordData.map((item, index) => (
              <div key={item.word} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold flex-shrink-0 ${index === 0 ? "bg-amber-500/20 text-amber-400" : index === 1 ? "bg-slate-500/20 text-slate-400" : index === 2 ? "bg-amber-700/20 text-amber-600" : "bg-muted text-muted-foreground"}`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-foreground">{item.word}</span>
                    <span className="text-xs text-muted-foreground">{item.count.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${(item.count / 5000) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-border">
            <Btn variant="outline" className="w-full"><BarChart3 className="w-4 h-4" /> 生成分析报告</Btn>
          </div>
        </Card>
      </div>
    </div>
  )
}