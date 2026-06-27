import { useState } from "react"
import { Search, Plus, Play, Pause, MoreVertical, Check, AlertCircle, Clock, ArrowRight, Settings, MessageSquare, Database } from "lucide-react"
import { Card } from "@/components/shared/Card"
import { Badge } from "@/components/shared/Badge"
import { Btn } from "@/components/shared/Btn"
import { SectionHeader } from "@/components/shared/SectionHeader"
import { StatusDot } from "@/components/shared/StatusDot"
import { cn } from "@/lib/utils"

const workflows = [
  { id: 1, name: "舆情风险工作流", status: "running", nodes: 6, runs: 128, successRate: 94.4, lastRun: "运行中" },
  { id: 2, name: "数据清洗工作流", status: "enabled", nodes: 4, runs: 892, successRate: 99.1, lastRun: "2026-06-26 02:00" },
  { id: 3, name: "竞品分析工作流", status: "error", nodes: 5, runs: 45, successRate: 86.7, lastRun: "2026-06-25 15:30" },
  { id: 4, name: "日报自动生成", status: "enabled", nodes: 3, runs: 234, successRate: 98.3, lastRun: "2026-06-26 08:00" },
]

const workflowNodes = [
  { id: 1, name: "数据采集", type: "collect", status: "success", icon: Database },
  { id: 2, name: "数据清洗", type: "clean", status: "success", icon: Settings },
  { id: 3, name: "情感分析", type: "analysis", status: "success", icon: MessageSquare },
  { id: 4, name: "风险检测", type: "model", status: "running", icon: Settings },
  { id: 5, name: "报告生成", type: "model", status: "pending", icon: Check },
]

export function WorkflowPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedWorkflow, setSelectedWorkflow] = useState(1)

  const filteredWorkflows = workflows.filter(wf => wf.name.toLowerCase().includes(searchQuery.toLowerCase()))
  const currentWorkflow = workflows.find(wf => wf.id === selectedWorkflow)

  const statusLabels: Record<string, string> = { running: "运行中", enabled: "已启用", error: "执行失败", disabled: "已禁用" }

  return (
    <div className="h-full flex">
      <div className="w-80 border-r border-border flex flex-col flex-shrink-0">
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">工作流</h2>
            <Btn variant="primary" size="xs"><Plus className="w-4 h-4" /></Btn>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="搜索工作流..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-muted border border-transparent rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {filteredWorkflows.map(wf => (
            <button
              key={wf.id}
              onClick={() => setSelectedWorkflow(wf.id)}
              className={cn("w-full p-3 rounded-lg transition-colors text-left", selectedWorkflow === wf.id ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/50")}
            >
              <div className="flex items-start gap-3">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", wf.status === "running" ? "bg-blue-500/15 text-blue-400" : wf.status === "error" ? "bg-red-500/15 text-red-400" : "bg-primary/15 text-primary")}>
                  {wf.status === "running" ? <Play className="w-5 h-5" /> : wf.status === "error" ? <AlertCircle className="w-5 h-5" /> : <Settings className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{wf.name}</p>
                    <StatusDot status={wf.status} />
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-muted-foreground">{wf.nodes} 个节点</span>
                    <span className="text-[10px] text-muted-foreground">执行 {wf.runs} 次</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-muted-foreground">成功率:</span>
                    <span className={cn("text-[10px] font-mono", wf.successRate >= 95 ? "text-emerald-400" : wf.successRate >= 90 ? "text-amber-400" : "text-red-400")}>
                      {wf.successRate}%
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {currentWorkflow ? (
          <>
            <div className="h-14 border-b border-border flex items-center justify-between px-4">
              <div className="flex items-center gap-3">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", currentWorkflow.status === "running" ? "bg-blue-500/15 text-blue-400" : currentWorkflow.status === "error" ? "bg-red-500/15 text-red-400" : "bg-primary/15 text-primary")}>
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">{currentWorkflow.name}</div>
                  <div className="text-[10px] text-muted-foreground">{statusLabels[currentWorkflow.status]} · 上次执行: {currentWorkflow.lastRun}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Btn variant={currentWorkflow.status === "running" ? "danger" : "primary"} size="sm">
                  {currentWorkflow.status === "running" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {currentWorkflow.status === "running" ? "暂停" : "启动"}
                </Btn>
                <Btn variant="ghost" size="sm"><MoreVertical className="w-4 h-4" /></Btn>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <Card className="p-4">
                <SectionHeader title="工作流节点" />
                <div className="flex items-center gap-2 py-6">
                  {workflowNodes.map((node, index) => {
                    const Icon = node.icon
                    return (
                      <div key={node.id} className="flex items-center">
                        <div className={cn("flex flex-col items-center", index > 0 && "ml-4")}>
                          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center",
                            node.status === "success" ? "bg-emerald-500/15 text-emerald-400" :
                            node.status === "running" ? "bg-blue-500/15 text-blue-400 animate-pulse" :
                            "bg-muted text-muted-foreground"
                          )}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <span className="text-xs text-foreground mt-2">{node.name}</span>
                          <span className={cn("text-[10px] mt-0.5",
                            node.status === "success" ? "text-emerald-400" :
                            node.status === "running" ? "text-blue-400" :
                            "text-muted-foreground"
                          )}>
                            {node.status === "success" ? "已完成" : node.status === "running" ? "执行中" : "待执行"}
                          </span>
                        </div>
                        {index < workflowNodes.length - 1 && (
                          <ArrowRight className={cn("w-4 h-4 mx-3",
                            node.status === "success" ? "text-emerald-400" : "text-muted-foreground"
                          )} />
                        )}
                      </div>
                    )
                  })}
                </div>
              </Card>

              <Card className="p-4">
                <SectionHeader title="执行历史" action={<button className="text-xs text-primary hover:underline">查看全部 →</button>} />
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                      <div className={cn("w-2 h-2 rounded-full", i === 1 ? "bg-blue-400 animate-pulse" : i === 2 ? "bg-emerald-400" : "bg-red-400")} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">执行 #{i}</span>
                          <Badge variant={i === 1 ? "info" : i === 2 ? "success" : "danger"}>
                            {i === 1 ? "运行中" : i === 2 ? "成功" : "失败"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">触发方式: 定时任务</p>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span><Clock className="w-3 h-3 inline mr-1" /> {i === 1 ? "进行中" : i === 2 ? "2026-06-26 02:00" : "2026-06-25 15:30"}</span>
                        <span>{i === 1 ? "--" : i === 2 ? "耗时 12m 30s" : "耗时 5m 15s"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-4">
                <SectionHeader title="配置信息" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <span className="text-xs text-muted-foreground">触发方式</span>
                    <p className="text-sm font-medium text-foreground mt-1">定时任务</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <span className="text-xs text-muted-foreground">执行周期</span>
                    <p className="text-sm font-medium text-foreground mt-1">每小时执行一次</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <span className="text-xs text-muted-foreground">超时时间</span>
                    <p className="text-sm font-medium text-foreground mt-1">30 分钟</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <span className="text-xs text-muted-foreground">重试次数</span>
                    <p className="text-sm font-medium text-foreground mt-1">3 次</p>
                  </div>
                </div>
              </Card>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-muted border border-border flex items-center justify-center mx-auto">
                <Settings className="w-7 h-7 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-base font-medium text-foreground">选择工作流</h3>
                <p className="text-sm text-muted-foreground mt-1">点击左侧列表查看详情</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}