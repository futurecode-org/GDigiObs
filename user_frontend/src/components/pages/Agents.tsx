import { useState } from "react"
import { Search, Plus, Settings, Play, Pause, MoreVertical, Clock } from "lucide-react"
import { Card } from "@/components/shared/Card"
import { Badge } from "@/components/shared/Badge"
import { Btn } from "@/components/shared/Btn"
import { SectionHeader } from "@/components/shared/SectionHeader"
import { StatusDot } from "@/components/shared/StatusDot"
import { cn } from "@/lib/utils"
import { agents } from "@/lib/mockData"

export function AgentsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedAgent, setSelectedAgent] = useState(1)

  const filteredAgents = agents.filter(agent => agent.name.toLowerCase().includes(searchQuery.toLowerCase()))
  const currentAgent = agents.find(agent => agent.id === selectedAgent)

  const statusLabels: Record<string, string> = { enabled: "已启用", running: "运行中", disabled: "已禁用" }

  return (
    <div className="h-full flex">
      <div className="w-80 border-r border-border flex flex-col flex-shrink-0">
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">数字员工</h2>
            <Btn variant="primary" size="xs"><Plus className="w-4 h-4" /></Btn>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="搜索数字员工..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-muted border border-transparent rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {filteredAgents.map(agent => (
            <button
              key={agent.id}
              onClick={() => setSelectedAgent(agent.id)}
              className={cn("w-full p-3 rounded-lg transition-colors text-left", selectedAgent === agent.id ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/50")}
            >
              <div className="flex items-start gap-3">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", agent.status === "running" ? "bg-blue-500/15 text-blue-400" : agent.status === "enabled" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}>
                  {agent.status === "running" ? <Play className="w-5 h-5" /> : <Settings className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{agent.name}</p>
                    <StatusDot status={agent.status} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{agent.model}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[10px] text-muted-foreground">执行 {agent.runs} 次</span>
                    <span className={cn("text-[10px] font-mono", agent.successRate >= 95 ? "text-emerald-400" : agent.successRate >= 90 ? "text-amber-400" : "text-red-400")}>
                      {agent.successRate}% 成功率
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {currentAgent ? (
          <>
            <div className="h-14 border-b border-border flex items-center justify-between px-4">
              <div className="flex items-center gap-3">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", currentAgent.status === "running" ? "bg-blue-500/15 text-blue-400" : "bg-primary/15 text-primary")}>
                  {currentAgent.status === "running" ? <Play className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">{currentAgent.name}</div>
                  <div className="text-[10px] text-muted-foreground">{currentAgent.model} · {statusLabels[currentAgent.status]}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Btn variant={currentAgent.status === "running" ? "danger" : "primary"} size="sm">
                  {currentAgent.status === "running" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {currentAgent.status === "running" ? "暂停" : "启动"}
                </Btn>
                <Btn variant="ghost" size="sm"><MoreVertical className="w-4 h-4" /></Btn>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-4 gap-4">
                <Card className="p-4">
                  <div className="text-xs text-muted-foreground mb-1">执行次数</div>
                  <div className="text-2xl font-semibold text-foreground font-mono">{currentAgent.runs}</div>
                </Card>
                <Card className="p-4">
                  <div className="text-xs text-muted-foreground mb-1">成功率</div>
                  <div className={cn("text-2xl font-semibold font-mono", currentAgent.successRate >= 95 ? "text-emerald-400" : currentAgent.successRate >= 90 ? "text-amber-400" : "text-red-400")}>
                    {currentAgent.successRate}%
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-xs text-muted-foreground mb-1">上次执行</div>
                  <div className="text-lg font-semibold text-foreground">{currentAgent.lastRun}</div>
                </Card>
                <Card className="p-4">
                  <div className="text-xs text-muted-foreground mb-1">当前状态</div>
                  <div className="flex items-center gap-2">
                    <StatusDot status={currentAgent.status} />
                    <span className="text-lg font-semibold text-foreground">{statusLabels[currentAgent.status]}</span>
                  </div>
                </Card>
              </div>

              <Card className="p-4">
                <SectionHeader title="模型配置" />
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <span className="text-sm text-muted-foreground">模型名称</span>
                    <Badge variant="primary">{currentAgent.model}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <span className="text-sm text-muted-foreground">角色描述</span>
                    <span className="text-sm text-foreground max-w-[60%] truncate">您是一个专业的数据分析师，负责监控舆情数据并生成分析报告...</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <span className="text-sm text-muted-foreground">可用技能</span>
                    <span className="text-sm text-foreground">网络数据爬取、情感分析工具、图表生成器</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <span className="text-sm text-muted-foreground">输出格式</span>
                    <span className="text-sm text-foreground">Markdown 报告</span>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <SectionHeader title="执行历史" action={<button className="text-xs text-primary hover:underline">查看全部 →</button>} />
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                      <div className={cn("w-2 h-2 rounded-full", i === 1 ? "bg-emerald-400" : i === 2 ? "bg-emerald-400" : "bg-red-400")} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">执行任务 #{i}</span>
                          <Badge variant={i === 1 ? "success" : i === 2 ? "success" : "danger"}>
                            {i === 1 ? "成功" : i === 2 ? "成功" : "失败"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">舆情周报生成任务</p>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span><Clock className="w-3 h-3 inline mr-1" /> 2026-06-26 09:00</span>
                        <span>耗时 3m 24s</span>
                      </div>
                    </div>
                  ))}
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
                <h3 className="text-base font-medium text-foreground">选择数字员工</h3>
                <p className="text-sm text-muted-foreground mt-1">点击左侧列表查看详情</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}