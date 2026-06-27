import { Plus, Search, Filter, Eye, Wrench, Lock, CheckCircle, Building2, UserCircle } from "lucide-react"
import { Badge, StatusDot, StatCard, Card, Btn } from "@/shared/ui"
import { tenants } from "@/shared/mockData"

export function TenantManagementPage() {
  const typeLabel: Record<string, { label: string; variant: "default" | "info" }> = {
    enterprise: { label: "企业租户", variant: "default" },
    personal: { label: "个人租户", variant: "info" },
  }
  const statusVariant: Record<string, "success" | "muted"> = { enabled: "success", disabled: "muted" }

  return (
    <div className="p-6 space-y-5 h-full overflow-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">租户管理</h2>
          <p className="text-xs text-muted-foreground mt-0.5">管理平台所有企业租户和个人租户</p>
        </div>
        <Btn size="sm"><Plus className="w-4 h-4" />新建企业租户</Btn>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <StatCard label="租户总数" value="84" icon={Building2} color="primary" />
        <StatCard label="企业租户" value="72" icon={Building2} color="info" />
        <StatCard label="个人租户" value="12" icon={UserCircle} color="muted" />
        <StatCard label="已停用" value="3" icon={Lock} color="danger" />
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input className="w-full bg-input-background border border-border rounded px-3 py-1.5 pl-8 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" placeholder="搜索租户名称..." />
          </div>
          <Btn variant="outline" size="sm"><Filter className="w-3.5 h-3.5" />筛选</Btn>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["租户名称", "类型", "管理员", "用户数", "数据量", "状态", "创建时间", "操作"].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs text-muted-foreground font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tenants.map(t => (
                <tr key={t.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center text-xs font-semibold text-primary">{t.name[0]}</div>
                      <span className="text-foreground font-medium text-sm">{t.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4"><Badge variant={typeLabel[t.type].variant}>{typeLabel[t.type].label}</Badge></td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">{t.admin}</td>
                  <td className="py-3 px-4 text-foreground font-mono text-xs">{t.users}</td>
                  <td className="py-3 px-4 text-muted-foreground font-mono text-xs">{t.data}</td>
                  <td className="py-3 px-4"><Badge variant={statusVariant[t.status]}><StatusDot status={t.status} />{t.status === "enabled" ? "启用" : "停用"}</Badge></td>
                  <td className="py-3 px-4 text-muted-foreground font-mono text-xs">{t.created}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <Btn variant="ghost" size="xs"><Eye className="w-3.5 h-3.5" /></Btn>
                      <Btn variant="ghost" size="xs"><Wrench className="w-3.5 h-3.5" /></Btn>
                      {t.status === "enabled"
                        ? <Btn variant="ghost" size="xs" className="text-amber-400"><Lock className="w-3.5 h-3.5" /></Btn>
                        : <Btn variant="ghost" size="xs" className="text-emerald-400"><CheckCircle className="w-3.5 h-3.5" /></Btn>
                      }
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>共 {tenants.length} 条记录</span>
          <div className="flex gap-1">
            <Btn variant="outline" size="xs">上一页</Btn>
            <Btn variant="outline" size="xs">下一页</Btn>
          </div>
        </div>
      </Card>
    </div>
  )
}
