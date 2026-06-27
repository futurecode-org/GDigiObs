import { useState } from "react"
import { Plus, Search, Edit, Trash2, Eye, EyeOff } from "lucide-react"
import { Card } from "@/components/shared/Card"
import { SectionHeader } from "@/components/shared/SectionHeader"
import { Badge } from "@/components/shared/Badge"
import { StatusDot } from "@/components/shared/StatusDot"
import { Btn } from "@/components/shared/Btn"
import { skills } from "@/lib/mockData"

export function SkillManagement() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredSkills = skills.filter(skill =>
    skill.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="h-full overflow-y-auto p-6">
      <Card className="p-4 mb-4">
        <SectionHeader title="技能管理" action={<Btn onClick={() => alert("添加技能")}><Plus className="w-4 h-4" /> 添加技能</Btn>} />
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索技能名称..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredSkills.map(skill => (
          <Card key={skill.id} className="p-4 hover:border-primary/30 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-foreground">{skill.name}</h3>
                  <Badge variant={skill.type === "function_call" ? "info" : skill.type === "mcp" ? "success" : "default"}>
                    {skill.type === "function_call" ? "函数调用" : skill.type === "mcp" ? "MCP" : "内置"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <StatusDot status={skill.status} />
                  <span className="text-xs text-muted-foreground">
                    {skill.status === "enabled" ? "已启用" : skill.status === "disabled" ? "已停用" : "待审核"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Btn variant="ghost" onClick={() => alert(`编辑技能 ${skill.name}`)}><Edit className="w-4 h-4" /></Btn>
                <Btn variant="danger" onClick={() => alert(`删除技能 ${skill.name}`)}><Trash2 className="w-4 h-4" /></Btn>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
              <div className="text-center">
                <div className="text-sm font-medium text-foreground">{skill.calls.toLocaleString()}</div>
                <div className="text-[10px] text-muted-foreground">调用次数</div>
              </div>
              <div className="text-center">
                <Badge variant={skill.visibility === "public" ? "success" : skill.visibility === "tenant" ? "warning" : "muted"}>
                  {skill.visibility === "public" ? "公开" : skill.visibility === "tenant" ? "租户" : "个人"}
                </Badge>
                <div className="text-[10px] text-muted-foreground">可见性</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-foreground">{skill.updated}</div>
                <div className="text-[10px] text-muted-foreground">更新时间</div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 mt-3">
              <Btn variant={skill.status === "enabled" ? "danger" : "success"} onClick={() => alert(`切换状态 ${skill.name}`)}>
                {skill.status === "enabled" ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Btn>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}