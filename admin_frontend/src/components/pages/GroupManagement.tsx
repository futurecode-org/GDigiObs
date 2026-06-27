import { useState } from "react"
import { Plus, Edit, Trash2, Users, MessageSquare, Calendar, Search } from "lucide-react"
import { Card } from "@/components/shared/Card"
import { SectionHeader } from "@/components/shared/SectionHeader"
import { Badge } from "@/components/shared/Badge"
import { StatusDot } from "@/components/shared/StatusDot"
import { Btn } from "@/components/shared/Btn"
import { adminGroups } from "@/lib/mockData"

export function GroupManagement() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredGroups = adminGroups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="h-full overflow-y-auto p-6">
      <Card className="p-4 mb-4">
        <SectionHeader title="群组管理" action={<Btn onClick={() => alert("创建群组")}><Plus className="w-4 h-4" /> 创建群组</Btn>} />
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索群组名称..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredGroups.map(group => (
          <Card key={group.id} className="p-4 hover:border-primary/30 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-foreground">{group.name}</h3>
                  <Badge variant={group.type === "internal" ? "success" : "info"}>
                    {group.type === "internal" ? "内部群" : "混合群"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <StatusDot status={group.status} />
                  <span className="text-xs text-muted-foreground">{group.status === "normal" ? "正常" : group.status === "muted" ? "已静音" : "已停用"}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Btn variant="ghost" onClick={() => alert(`编辑群组 ${group.name}`)}><Edit className="w-4 h-4" /></Btn>
                <Btn variant="danger" onClick={() => alert(`删除群组 ${group.name}`)}><Trash2 className="w-4 h-4" /></Btn>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-sm font-medium text-foreground">
                  <Users className="w-4 h-4" />
                  {group.members}
                </div>
                <div className="text-[10px] text-muted-foreground">成员数</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-sm font-medium text-foreground">
                  <MessageSquare className="w-4 h-4" />
                  {group.msgs}
                </div>
                <div className="text-[10px] text-muted-foreground">消息数</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-sm font-medium text-foreground">
                  <Calendar className="w-4 h-4" />
                  {group.created}
                </div>
                <div className="text-[10px] text-muted-foreground">创建时间</div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">群主</span>
                <span className="text-foreground">{group.owner}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}