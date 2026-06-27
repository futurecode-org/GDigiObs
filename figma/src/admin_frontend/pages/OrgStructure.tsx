import { useState } from "react"
import { Plus, Network, ChevronRight, Eye, Wrench, UserPlus, Cpu, Database, BarChart2 } from "lucide-react"
import { cn } from "@/shared/utils"
import { Badge, Card, Btn } from "@/shared/ui"
import { departments, deptMembers } from "@/shared/mockData"

type DeptNode = { id: number; name: string; pid: number | null; members: number; children: DeptNode[] }

function DeptTree({ nodes, depth = 0, selected, onSelect }: { nodes: DeptNode[]; depth?: number; selected: number | null; onSelect: (id: number) => void }) {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({ 1: true, 2: true, 3: true, 4: true })
  return (
    <div>
      {nodes.map(n => (
        <div key={n.id}>
          <button
            onClick={() => onSelect(n.id)}
            className={cn("w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded transition-colors text-left group", selected === n.id ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary")}
            style={{ paddingLeft: `${12 + depth * 16}px` }}
          >
            {n.children.length > 0 && (
              <button onClick={e => { e.stopPropagation(); setExpanded(prev => ({ ...prev, [n.id]: !prev[n.id] })) }} className="text-current">
                <ChevronRight className={cn("w-3.5 h-3.5 transition-transform", expanded[n.id] && "rotate-90")} />
              </button>
            )}
            {n.children.length === 0 && <span className="w-3.5" />}
            <Network className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="flex-1">{n.name}</span>
            <span className="text-[10px] opacity-60">{n.members}人</span>
          </button>
          {expanded[n.id] && n.children.length > 0 && (
            <DeptTree nodes={n.children} depth={depth + 1} selected={selected} onSelect={onSelect} />
          )}
        </div>
      ))}
    </div>
  )
}

export function OrgStructurePage() {
  const [selectedDept, setSelectedDept] = useState<number | null>(1)

  return (
    <div className="h-full flex overflow-hidden">
      {/* Left: Tree */}
      <div className="w-60 border-r border-border flex flex-col flex-shrink-0">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <span className="text-sm font-medium">组织架构</span>
          <Btn size="xs"><Plus className="w-3.5 h-3.5" />新建部门</Btn>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          <DeptTree nodes={departments} selected={selectedDept} onSelect={setSelectedDept} />
        </div>
      </div>

      {/* Right: Members */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">数智科技有限公司</h3>
            <p className="text-xs text-muted-foreground mt-0.5">共 48 名成员</p>
          </div>
          <div className="flex gap-2">
            <Btn variant="outline" size="sm"><UserPlus className="w-3.5 h-3.5" />添加成员</Btn>
            <Btn variant="outline" size="sm"><Wrench className="w-3.5 h-3.5" />编辑部门</Btn>
          </div>
        </div>
        {/* Dept Info Cards */}
        <div className="p-4 grid grid-cols-3 gap-3 border-b border-border">
          {[
            { label: "技术部", members: 16, icon: Cpu, color: "primary" },
            { label: "数据部", members: 12, icon: Database, color: "info" },
            { label: "产品运营部", members: 20, icon: BarChart2, color: "success" },
          ].map(d => (
            <div key={d.label} className={cn("bg-card border border-border rounded-lg p-3 flex items-center gap-3 cursor-pointer hover:border-primary/30 transition-colors")}>
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center",
                d.color === "primary" ? "bg-primary/10 text-primary" : d.color === "info" ? "bg-cyan-500/10 text-cyan-400" : "bg-emerald-500/10 text-emerald-400"
              )}>
                <d.icon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-medium text-foreground">{d.label}</div>
                <div className="text-[10px] text-muted-foreground">{d.members} 人</div>
              </div>
            </div>
          ))}
        </div>
        {/* Member Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-background">
              <tr className="border-b border-border bg-muted/30">
                {["姓名", "邮箱", "部门", "岗位", "状态", "操作"].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deptMembers.map(m => (
                <tr key={m.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-xs font-semibold text-primary">{m.name[0]}</div>
                      <span className="text-foreground">{m.name}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-4 text-muted-foreground font-mono text-xs">{m.email}</td>
                  <td className="py-2.5 px-4 text-muted-foreground text-xs">{m.dept}</td>
                  <td className="py-2.5 px-4 text-muted-foreground text-xs">{m.post}</td>
                  <td className="py-2.5 px-4"><Badge variant={m.status === "normal" ? "success" : "danger"}>{m.status === "normal" ? "正常" : "封禁"}</Badge></td>
                  <td className="py-2.5 px-4">
                    <div className="flex gap-1">
                      <Btn variant="ghost" size="xs"><Eye className="w-3.5 h-3.5" /></Btn>
                      <Btn variant="ghost" size="xs"><Wrench className="w-3.5 h-3.5" /></Btn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
