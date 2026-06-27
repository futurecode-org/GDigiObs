import { Bot, Plus, Activity, Settings, Radio } from "lucide-react"
import { cn } from "@/shared/utils"
import { StatusDot, Card, Btn } from "@/shared/ui"
import { agents } from "@/shared/mockData"

export function AgentsPage() {
  return (
    <div className="p-6 space-y-5 h-full overflow-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">数字员工</h2>
          <p className="text-xs text-muted-foreground mt-0.5">创建可自动执行任务的 AI 智能体</p>
        </div>
        <Btn size="sm"><Plus className="w-4 h-4" />创建数字员工</Btn>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {agents.map(a => (
          <Card key={a.id} className="p-4 hover:border-primary/30 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">{a.name}</div>
                  <div className="text-xs text-muted-foreground">{a.model}</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <StatusDot status={a.status} />
                <span className={cn(a.status === "running" ? "text-blue-400" : "text-muted-foreground")}>
                  {a.status === "running" ? "运行中" : a.status === "enabled" ? "启用" : "停用"}
                </span>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-base font-semibold font-mono text-foreground">{a.runs}</div>
                <div className="text-[10px] text-muted-foreground">执行次数</div>
              </div>
              <div>
                <div className="text-base font-semibold font-mono text-emerald-400">{a.successRate}%</div>
                <div className="text-[10px] text-muted-foreground">成功率</div>
              </div>
              <div>
                <div className="text-xs text-foreground mt-1">{a.lastRun}</div>
                <div className="text-[10px] text-muted-foreground">最后运行</div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-border flex gap-2">
              <Btn variant="ghost" size="xs"><Activity className="w-3.5 h-3.5" />执行记录</Btn>
              <Btn variant="ghost" size="xs"><Settings className="w-3.5 h-3.5" />配置</Btn>
              <Btn variant="primary" size="xs" className="ml-auto">
                <Radio className="w-3.5 h-3.5" />运行
              </Btn>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
