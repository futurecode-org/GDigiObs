import { useState } from "react"
import { Search, Plus, Wand2, ToggleLeft, ToggleRight, MoreVertical, TrendingUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SectionHeader } from "@/shared/components/SectionHeader"
import { StatusDot } from "@/shared/components/StatusDot"
import { skills } from "@/lib/mockData"
import { cn } from "@/lib/utils"

export function SkillsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  const filteredSkills = skills.filter(skill => {
    const matchSearch = skill.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchType = filterType === "all" || skill.type === filterType
    const matchStatus = filterStatus === "all" || skill.status === filterStatus
    return matchSearch && matchType && matchStatus
  })

  const typeLabels: Record<string, string> = { function_call: "函数调用", mcp: "MCP", skill: "Skill" }
  const typeColors: Record<string, string> = { function_call: "default", mcp: "outline", skill: "ghost" }
  const visibilityLabels: Record<string, string> = { tenant: "租户级", personal: "个人", public: "公共" }
  const visibilityColors: Record<string, string> = { tenant: "default", personal: "secondary", public: "ghost" }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-4">
      <SectionHeader title="我的技能" action={<Button size="sm"><Plus className="w-4 h-4" /> 添加技能</Button>} />
      
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="搜索技能..."
                className="w-full pl-9 pr-3 py-2 bg-muted border border-transparent rounded-lg text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex gap-2">
              {["all", "function_call", "mcp", "skill"].map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={cn("px-3 py-1.5 text-xs rounded-lg transition-colors", filterType === type ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}
                >
                  {type === "all" ? "全部" : typeLabels[type]}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              {["all", "enabled", "disabled", "pending_review"].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={cn("px-3 py-1.5 text-xs rounded-lg transition-colors", filterStatus === status ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}
                >
                  {status === "all" ? "全部" : status === "enabled" ? "已启用" : status === "disabled" ? "已禁用" : "待审核"}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSkills.map(skill => (
          <Card key={skill.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center">
                  <Wand2 className="w-5 h-5" />
                </div>
                <button className="p-1.5 rounded hover:bg-muted transition-colors">
                  <MoreVertical className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <h3 className="text-sm font-medium text-foreground mb-2">{skill.name}</h3>

              <div className="flex items-center gap-2 mb-3">
                <Badge variant={typeColors[skill.type] as "default" | "secondary" | "outline" | "ghost"}>{typeLabels[skill.type]}</Badge>
                <Badge variant={visibilityColors[skill.visibility] as "default" | "secondary" | "outline" | "ghost"}>{visibilityLabels[skill.visibility]}</Badge>
              </div>

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">调用次数：</span>
                  <span className="text-xs font-mono text-foreground">{skill.calls.toLocaleString()}</span>
                </div>
                <StatusDot status={skill.status} />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-[10px] text-muted-foreground">更新于 {skill.updated}</span>
                <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  {skill.status === "enabled" ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4" />}
                  {skill.status === "enabled" ? "已启用" : "已禁用"}
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
