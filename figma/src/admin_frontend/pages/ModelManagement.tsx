import { Plus, Cpu, CheckCircle, Radio, Wrench } from "lucide-react"
import { cn } from "@/shared/utils"
import { Badge, StatusDot, Card, Btn } from "@/shared/ui"
import { modelList } from "@/shared/mockData"

export function ModelManagementPage() {
  const typeColors: Record<string, string> = {
    llm: "text-primary bg-primary/10 border-primary/20",
    embedding: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    rerank: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  }
  const apiColors: Record<string, string> = {
    openai: "text-emerald-400", anthropic: "text-amber-400", ollama: "text-blue-400", custom: "text-muted-foreground"
  }

  return (
    <div className="p-6 space-y-5 h-full overflow-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">模型管理</h2>
          <p className="text-xs text-muted-foreground mt-0.5">管理 LLM、Embedding、Rerank 模型</p>
        </div>
        <Btn size="sm"><Plus className="w-4 h-4" />添加模型</Btn>
      </div>

      <div className="space-y-3">
        {modelList.map(m => (
          <Card key={m.id} className="p-4 hover:border-primary/30 transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center flex-shrink-0">
                <Cpu className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-foreground">{m.name}</span>
                  <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-mono font-medium border", typeColors[m.type])}>
                    {m.type.toUpperCase()}
                  </span>
                  <span className={cn("text-xs font-mono", apiColors[m.api])}>{m.api}</span>
                </div>
                <div className="font-mono text-xs text-muted-foreground mt-1">{m.key}</div>
                <div className="flex items-center gap-4 mt-2 text-xs">
                  {m.vision && <span className="text-emerald-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" />视觉</span>}
                  {m.tools && <span className="text-emerald-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" />工具调用</span>}
                  <span className="text-muted-foreground font-mono">ctx: {(m.context / 1000).toFixed(0)}k</span>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <Badge variant={m.visibility === "platform" ? "default" : "muted"}>
                  {m.visibility === "platform" ? "平台" : m.visibility === "tenant" ? "租户" : "个人"}
                </Badge>
                <Badge variant="success"><StatusDot status={m.status} />启用</Badge>
                <div className="flex gap-1">
                  <Btn variant="ghost" size="xs"><Radio className="w-3.5 h-3.5" />测试</Btn>
                  <Btn variant="ghost" size="xs"><Wrench className="w-3.5 h-3.5" /></Btn>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
