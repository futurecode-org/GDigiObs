import { useState } from "react"
import { Plus, Users, ChevronDown, ChevronRight, Building2 } from "lucide-react"
import { Card } from "@/components/shared/Card"
import { SectionHeader } from "@/components/shared/SectionHeader"
import { Btn } from "@/components/shared/Btn"
import { departments, deptMembers } from "@/lib/mockData"

interface DeptNode {
  id: number; name: string; pid: number | null; members: number; children: DeptNode[]
}

export function OrgStructure() {
  const [expanded, setExpanded] = useState<number[]>([1])

  const toggleExpand = (id: number) => {
    setExpanded(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const renderDeptTree = (nodes: DeptNode[], depth: number = 0) => {
    return nodes.map(node => {
      const hasChildren = node.children.length > 0
      const isExpanded = expanded.includes(node.id)

      return (
        <div key={node.id}>
          <div
            className="flex items-center gap-2 py-2 px-1 hover:bg-muted/30 rounded cursor-pointer transition-colors"
            style={{ paddingLeft: `${depth * 20 + 8}px` }}
            onClick={() => hasChildren && toggleExpand(node.id)}
          >
            {hasChildren ? (
              isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />
            ) : <span className="w-4" />}
            <Building2 className="w-4 h-4 text-primary" />
            <span className="text-sm text-foreground">{node.name}</span>
            <span className="text-xs text-muted-foreground ml-auto">{node.members} 人</span>
          </div>
          {hasChildren && isExpanded && renderDeptTree(node.children, depth + 1)}
        </div>
      )
    })
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <Card className="p-4 mb-4">
        <SectionHeader title="组织架构" action={<Btn onClick={() => alert("添加部门")}><Plus className="w-4 h-4" /> 添加部门</Btn>} />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-medium text-foreground">部门树</h3>
          </div>
          <div className="p-2">
            {renderDeptTree(departments)}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-medium text-foreground">部门成员</h3>
            <div className="flex items-center gap-2 mt-2">
              <Btn variant="outline" size="xs"><Plus className="w-3 h-3" /> 新增成员</Btn>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">成员</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">部门</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">职位</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">状态</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {deptMembers.map(member => (
                  <tr key={member.id} className="hover:bg-muted/30">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-semibold text-primary">
                          {member.name[0]}
                        </div>
                        <div>
                          <div className="text-sm text-foreground">{member.name}</div>
                          <div className="text-xs text-muted-foreground">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-foreground">{member.dept}</td>
                    <td className="py-3 px-4 text-sm text-foreground">{member.post}</td>
                    <td className="py-3 px-4">
                      <span className={member.status === "normal" ? "text-emerald-400" : "text-red-400"}>
                        {member.status === "normal" ? "正常" : "已封禁"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <Btn variant="ghost" size="xs"><Users className="w-4 h-4" /></Btn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}