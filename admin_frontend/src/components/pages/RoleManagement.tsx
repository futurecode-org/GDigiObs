import { useState } from "react"
import { Plus, Edit, Trash2, Users, Layout, Lock, Search } from "lucide-react"
import { Card } from "@/components/shared/Card"
import { SectionHeader } from "@/components/shared/SectionHeader"
import { Badge } from "@/components/shared/Badge"
import { Btn } from "@/components/shared/Btn"
import { roles } from "@/lib/mockData"

export function RoleManagement() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.desc.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="h-full overflow-y-auto p-6">
      <Card className="p-4 mb-4">
        <SectionHeader title="角色管理" action={<Btn onClick={() => alert("添加角色")}><Plus className="w-4 h-4" /> 添加角色</Btn>} />
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索角色名称..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredRoles.map(role => (
          <Card key={role.id} className="p-4 hover:border-primary/30 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-foreground">{role.name}</h3>
                  {role.builtin && <Badge variant="warning">内置</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{role.desc}</p>
              </div>
              <div className="flex items-center gap-2">
                <Btn variant="ghost" onClick={() => alert(`编辑角色 ${role.name}`)}><Edit className="w-4 h-4" /></Btn>
                {!role.builtin && <Btn variant="danger" onClick={() => alert(`删除角色 ${role.name}`)}><Trash2 className="w-4 h-4" /></Btn>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-sm font-medium text-foreground">
                  <Users className="w-4 h-4" />
                  {role.users}
                </div>
                <div className="text-[10px] text-muted-foreground">关联用户</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-sm font-medium text-foreground">
                  <Layout className="w-4 h-4" />
                  {role.menus}
                </div>
                <div className="text-[10px] text-muted-foreground">菜单权限</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-sm font-medium text-foreground">
                  <Lock className="w-4 h-4" />
                  配置
                </div>
                <div className="text-[10px] text-muted-foreground">权限管理</div>
              </div>
            </div>

            <div className="mt-3">
              <Btn variant="outline" className="w-full" onClick={() => alert(`配置权限 ${role.name}`)}>
                配置权限
              </Btn>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}