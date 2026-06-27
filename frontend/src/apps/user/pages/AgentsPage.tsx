import { useState } from "react"
import { Search, Plus, Settings, Play, Pause } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SectionHeader } from "@/shared/components/SectionHeader"
import { StatusDot } from "@/shared/components/StatusDot"
import { agents } from "@/lib/mockData"
import { cn } from "@/lib/utils"

export function AgentsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedAgent, setSelectedAgent] = useState<number | null>(null)

  const filteredAgents = agents.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()))
  const currentAgent = agents.find(a => a.id === selectedAgent)

  const statusLabels: Record<string, string> = { enabled: "已启用", disabled: "已禁用", running: "运行中" }

  return (
    <div className="h-full flex">
      <div className="w-80 border-r border-border flex flex-col flex-shrink-0">
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">数字员工</h2>
            <Button size="icon-xs"><Plus className="w-4 h-4" /></Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜索数字员工..."
              className="w-full pl-9 pr-3 py-2 bg-muted border border-transparent rounded-lg text-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {filteredAgents.map(agent => (
            <button
              key={agent.id}
              onClick={() => setSelectedAgent(agent.id)}
              className={cn("w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors mb-1", selectedAgent === agent.id ? "bg-primary/10" : "hover:bg-muted/50")}
            >
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", agent.status === "running" ? "bg-emerald-500/15 text-emerald-400" : agent.status === "enabled" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                <Settings className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{agent.name}</p>
                  <StatusDot status={agent.status} />
                </div>
                <p className="text-xs text-muted-foreground">{agent.model}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {currentAgent ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{currentAgent.name}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <Badge variant={currentAgent.status === "running" ? "outline" : currentAgent.status === "enabled" ? "secondary" : "ghost"}>
                    {statusLabels[currentAgent.status]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">模型: {currentAgent.model}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  {currentAgent.status === "running" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {currentAgent.status === "running" ? "暂停" : "启动"}
                </Button>
                <Button variant="ghost" size="sm"><Settings className="w-4 h-4" /> 配置</Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">运行次数</p>
                  <p className="text-xl font-bold text-foreground">{currentAgent.runs}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">成功率</p>
                  <p className="text-xl font-bold text-emerald-400">{currentAgent.successRate}%</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">最近运行</p>
                  <p className="text-sm font-medium text-foreground">{currentAgent.lastRun}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-4">
                <SectionHeader title="模型配置" />
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <span className="text-sm text-muted-foreground">模型名称</span>
                    <Badge>{currentAgent.model}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <span className="text-sm text-muted-foreground">角色描述</span>
                    <span className="text-sm text-foreground max-w-[60%] truncate">您是一个专业的数据分析师，负责监控舆情数据并生成分析报告...</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <span className="text-sm text-muted-foreground">可用技能</span>
                    <span className="text-sm text-foreground">情感分析、数据爬取、报告生成</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <Settings className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>选择一个数字员工</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
