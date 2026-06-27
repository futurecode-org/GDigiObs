import { useState } from "react"
import { Play, Pause, Settings, Trash2, Plus, Search, Zap } from "lucide-react"
import { Card } from "@/components/shared/Card"
import { SectionHeader } from "@/components/shared/SectionHeader"
import { Badge } from "@/components/shared/Badge"
import { StatusDot } from "@/components/shared/StatusDot"
import { Btn } from "@/components/shared/Btn"
import { cleanRules } from "@/lib/mockData"

export function DataClean() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredRules = cleanRules.filter(rule =>
    rule.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="h-full overflow-y-auto p-6">
      <Card className="p-4 mb-4">
        <SectionHeader title="数据清洗规则" action={<Btn onClick={() => alert("添加规则")}><Plus className="w-4 h-4" /> 新建规则</Btn>} />
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索规则名称..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </Card>

      <div className="space-y-4">
        {filteredRules.map(rule => (
          <Card key={rule.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-foreground">{rule.name}</h3>
                  <StatusDot status={rule.status} />
                  <Badge variant={rule.status === "enabled" ? "success" : "danger"}>
                    {rule.status === "enabled" ? "已启用" : "已停用"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">关联任务:</span>
                  {rule.tasks.map(task => (
                    <Badge key={task} variant="default">{task}</Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Btn variant="ghost" onClick={() => alert(`配置规则 ${rule.name}`)}><Settings className="w-4 h-4" /></Btn>
                <Btn variant="danger" onClick={() => alert(`删除规则 ${rule.name}`)}><Trash2 className="w-4 h-4" /></Btn>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-muted-foreground">清洗能力</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {rule.caps.map(cap => (
                  <Badge key={cap} variant="info">{cap}</Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>上次运行: {rule.lastRun}</span>
                <span>累计清洗: <span className="text-foreground font-medium">{rule.cleaned.toLocaleString()}</span> 条</span>
              </div>
              <div className="flex items-center gap-2">
                <Btn variant="outline" onClick={() => alert(`运行规则 ${rule.name}`)}><Play className="w-4 h-4" /> 运行</Btn>
                <Btn variant={rule.status === "enabled" ? "danger" : "success"} onClick={() => alert(`切换状态 ${rule.name}`)}>
                  {rule.status === "enabled" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Btn>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}