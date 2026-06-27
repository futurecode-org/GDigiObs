import { Plus, PackageSearch, MoreHorizontal } from "lucide-react"
import { cn } from "@/shared/utils"
import { Badge, StatusDot, Card, Btn } from "@/shared/ui"
import { skills } from "@/shared/mockData"

export function SkillsPage() {
  const typeColor: Record<string, string> = {
    function_call: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    mcp: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    skill: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  }
  const typeLabel: Record<string, string> = { function_call: "Function", mcp: "MCP", skill: "Skill" }

  return (
    <div className="p-6 space-y-5 h-full overflow-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">技能管理</h2>
          <p className="text-xs text-muted-foreground mt-0.5">创建和管理您的 Function Call、MCP 和 Skill 技能</p>
        </div>
        <div className="flex gap-2">
          <Btn variant="outline" size="sm"><PackageSearch className="w-4 h-4" />技能市场</Btn>
          <Btn size="sm"><Plus className="w-4 h-4" />创建技能</Btn>
        </div>
      </div>
      <div className="space-y-2">
        {skills.map(s => (
          <Card key={s.id} className="px-4 py-3 flex items-center gap-4 hover:border-primary/25 transition-colors">
            <div className={cn("px-2 py-0.5 rounded text-xs font-mono font-medium border", typeColor[s.type])}>
              {typeLabel[s.type]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground">{s.name}</div>
              <div className="text-xs text-muted-foreground">调用 {s.calls.toLocaleString()} 次 · {s.updated}</div>
            </div>
            <Badge variant={s.visibility === "public" ? "success" : s.visibility === "tenant" ? "default" : "muted"}>
              {s.visibility === "public" ? "公开" : s.visibility === "tenant" ? "企业" : "个人"}
            </Badge>
            <div className="flex items-center gap-1.5 text-xs">
              <StatusDot status={s.status} />
              <span className="text-muted-foreground">
                {s.status === "enabled" ? "启用" : s.status === "disabled" ? "停用" : "待审核"}
              </span>
            </div>
            <Btn variant="ghost" size="xs"><MoreHorizontal className="w-4 h-4" /></Btn>
          </Card>
        ))}
      </div>
    </div>
  )
}
