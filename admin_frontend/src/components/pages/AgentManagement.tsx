import { useState } from "react"
import { Plus, Search, Trash2, Play, Pause, Settings } from "lucide-react"
import { Card } from "@/components/shared/Card"
import { SectionHeader } from "@/components/shared/SectionHeader"
import { Badge } from "@/components/shared/Badge"
import { StatusDot } from "@/components/shared/StatusDot"
import { Btn } from "@/components/shared/Btn"
import { agents } from "@/lib/mockData"

export function AgentManagement() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="h-full overflow-y-auto p-6">
      <Card className="p-4 mb-4">
        <SectionHeader title="数字员工管理" action={<Btn onClick={() => alert("创建数字员工")}><Plus className="w-4 h-4" /> 创建数字员工</Btn>} />
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索数字员工名称..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredAgents.map(agent => (
          <Card key={agent.id} className="p-4 hover:border-primary/30 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-foreground">{agent.name}</h3>
                  <Badge variant="default">{agent.model}</Badge>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <StatusDot status={agent.status} />
                  <span className={`text-xs ${agent.status === "running" ? "text-blue-400" : agent.status === "enabled" ? "text-emerald-400" : "text-muted-foreground"}`}>
                    {agent.status === "running" ? "运行中" : agent.status === "enabled" ? "已启用" : "已停用"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Btn variant="ghost" onClick={() => alert(`配置 ${agent.name}`)}><Settings className="w-4 h-4" /></Btn>
                <Btn variant="danger" onClick={() => alert(`删除 ${agent.name}`)}><Trash2 className="w-4 h-4" /></Btn>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
              <div className="text-center">
                <div className="text-sm font-medium text-foreground">{agent.runs}</div>
                <div className="text-[10px] text-muted-foreground">执行次数</div>
              </div>
              <div className="text-center">
                <div className={`text-sm font-medium ${agent.successRate >= 95 ? "text-emerald-400" : agent.successRate >= 90 ? "text-amber-400" : "text-red-400"}`}>
                  {agent.successRate}%
                </div>
                <div className="text-[10px] text-muted-foreground">成功率</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-foreground">{agent.lastRun}</div>
                <div className="text-[10px] text-muted-foreground">上次执行</div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 mt-3">
              <Btn variant="outline" onClick={() => alert(`立即执行 ${agent.name}`)}><Play className="w-4 h-4" /> 执行</Btn>
              <Btn variant={agent.status === "running" ? "danger" : "success"} onClick={() => alert(`切换状态 ${agent.name}`)}>
                {agent.status === "running" || agent.status === "enabled" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Btn>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}