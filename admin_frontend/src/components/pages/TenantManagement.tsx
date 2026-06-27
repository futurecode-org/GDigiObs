import { useState } from "react"
import { Plus, Edit, Trash2, Building2, Users, Database, Calendar, Search } from "lucide-react"
import { Card } from "@/components/shared/Card"
import { SectionHeader } from "@/components/shared/SectionHeader"
import { Badge } from "@/components/shared/Badge"
import { StatusDot } from "@/components/shared/StatusDot"
import { Btn } from "@/components/shared/Btn"
import { tenants } from "@/lib/mockData"

export function TenantManagement() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredTenants = tenants.filter(tenant =>
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="h-full overflow-y-auto p-6">
      <Card className="p-4 mb-4">
        <SectionHeader title="租户管理" action={<Btn onClick={() => alert("添加租户")}><Plus className="w-4 h-4" /> 添加租户</Btn>} />
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索租户名称..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredTenants.map(tenant => (
          <Card key={tenant.id} className="p-4 hover:border-primary/30 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-foreground">{tenant.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={tenant.type === "enterprise" ? "success" : "info"}>
                      {tenant.type === "enterprise" ? "企业租户" : "个人租户"}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <StatusDot status={tenant.status} />
                      <span className="text-xs text-muted-foreground">{tenant.status === "enabled" ? "启用" : "停用"}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Btn variant="ghost" onClick={() => alert(`编辑租户 ${tenant.name}`)}><Edit className="w-4 h-4" /></Btn>
                <Btn variant="danger" onClick={() => alert(`删除租户 ${tenant.name}`)}><Trash2 className="w-4 h-4" /></Btn>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-sm font-medium text-foreground">
                  <Users className="w-4 h-4" />
                  {tenant.users}
                </div>
                <div className="text-[10px] text-muted-foreground">用户数</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-sm font-medium text-foreground">
                  <Database className="w-4 h-4" />
                  {tenant.data}
                </div>
                <div className="text-[10px] text-muted-foreground">数据量</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-sm font-medium text-foreground">
                  <Calendar className="w-4 h-4" />
                  {tenant.created}
                </div>
                <div className="text-[10px] text-muted-foreground">创建时间</div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">管理员</span>
                <span className="text-foreground">{tenant.admin}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}