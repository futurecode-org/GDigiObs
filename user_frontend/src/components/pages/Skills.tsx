import { useState } from "react"
import { Search, Plus, Wand2, ToggleLeft, ToggleRight, MoreVertical, TrendingUp } from "lucide-react"
import { Card } from "@/components/shared/Card"
import { Badge } from "@/components/shared/Badge"
import { Btn } from "@/components/shared/Btn"
import { SectionHeader } from "@/components/shared/SectionHeader"
import { StatusDot } from "@/components/shared/StatusDot"
import { cn } from "@/lib/utils"
import { skills } from "@/lib/mockData"

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
  const typeColors: Record<string, string> = { function_call: "primary", mcp: "info", skill: "purple" }
  const visibilityLabels: Record<string, string> = { tenant: "租户级", personal: "个人", public: "公共" }
  const visibilityColors: Record<string, string> = { tenant: "primary", personal: "success", public: "muted" }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <SectionHeader title="我的技能" action={<Btn variant="primary" size="sm"><Plus className="w-4 h-4" /> 添加技能</Btn>} />
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="搜索技能..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-muted border border-transparent rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="px-3 py-2 bg-muted border border-transparent rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
          >
            <option value="all">全部类型</option>
            <option value="function_call">函数调用</option>
            <option value="mcp">MCP</option>
            <option value="skill">Skill</option>
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-muted border border-transparent rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
          >
            <option value="all">全部状态</option>
            <option value="enabled">已启用</option>
            <option value="disabled">已禁用</option>
            <option value="pending_review">待审核</option>
          </select>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        {filteredSkills.map(skill => (
          <Card key={skill.id} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", skill.status === "enabled" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}>
                  <Wand2 className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-foreground">{skill.name}</span>
              </div>
              <button className="p-1 rounded-lg hover:bg-muted/50 transition-colors">
                <MoreVertical className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <Badge variant={typeColors[skill.type] as "default" | "success" | "warning" | "danger" | "muted" | "info" | "primary" | "purple"}>{typeLabels[skill.type]}</Badge>
              <Badge variant={visibilityColors[skill.visibility] as "default" | "success" | "warning" | "danger" | "muted" | "info" | "primary" | "purple"}>{visibilityLabels[skill.visibility]}</Badge>
            </div>

            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">调用次数：</span>
                <span className="text-xs font-mono text-foreground">{skill.calls.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <StatusDot status={skill.status} />
                <span className="text-xs text-muted-foreground">
                  {skill.status === "enabled" ? "已启用" : skill.status === "disabled" ? "已禁用" : "待审核"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <span className="text-[10px] text-muted-foreground">更新于 {skill.updated}</span>
              <button className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
                {skill.status === "enabled" ? <ToggleRight className="w-4 h-4 text-primary" /> : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
              </button>
            </div>
          </Card>
        ))}
      </div>

      {filteredSkills.length === 0 && (
        <div className="text-center py-12">
          <Wand2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">暂无技能</p>
        </div>
      )}
    </div>
  )
}