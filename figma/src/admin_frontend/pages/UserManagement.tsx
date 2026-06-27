import { useState } from "react"
import { Search, Filter, Download, UserPlus, Eye, Wrench, Lock, CheckCircle } from "lucide-react"
import { Badge, Card, Btn } from "@/shared/ui"
import { adminUsers } from "@/shared/mockData"

export function UserManagementPage() {
  const [search, setSearch] = useState("")
  const filtered = adminUsers.filter(u =>
    u.name.includes(search) || u.email.includes(search) || u.dept.includes(search)
  )

  const statusVariant: Record<string, "success" | "danger" | "muted" | "warning"> = {
    normal: "success", banned: "danger", disabled: "muted", pending: "warning"
  }
  const statusLabel: Record<string, string> = { normal: "正常", banned: "封禁", disabled: "禁用", pending: "待激活" }

  return (
    <div className="p-6 space-y-5 h-full overflow-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">用户管理</h2>
          <p className="text-xs text-muted-foreground mt-0.5">管理权限范围内的注册用户</p>
        </div>
        <div className="flex gap-2">
          <Btn variant="outline" size="sm"><Download className="w-4 h-4" />导出</Btn>
          <Btn size="sm"><UserPlus className="w-4 h-4" />新增用户</Btn>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-input-background border border-border rounded px-3 py-1.5 pl-8 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" placeholder="搜索用户名、邮箱..." />
        </div>
        <Btn variant="outline" size="sm"><Filter className="w-3.5 h-3.5" />筛选</Btn>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["用户名", "邮箱", "角色", "租户", "部门", "状态", "最后登录", "操作"].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs text-muted-foreground font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-xs font-semibold text-primary">{u.name[0]}</div>
                      <span className="text-foreground">{u.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground font-mono text-xs">{u.email}</td>
                  <td className="py-3 px-4">
                    <Badge variant={u.role.includes("管理") ? "warning" : u.role.includes("外部") ? "info" : "muted"}>{u.role}</Badge>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">{u.tenant}</td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">{u.dept}</td>
                  <td className="py-3 px-4">
                    <Badge variant={statusVariant[u.status]}>{statusLabel[u.status]}</Badge>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground font-mono text-xs">{u.loginAt}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <Btn variant="ghost" size="xs"><Eye className="w-3.5 h-3.5" /></Btn>
                      <Btn variant="ghost" size="xs"><Wrench className="w-3.5 h-3.5" /></Btn>
                      {u.status === "normal"
                        ? <Btn variant="ghost" size="xs" className="text-amber-400 hover:text-amber-300"><Lock className="w-3.5 h-3.5" /></Btn>
                        : <Btn variant="ghost" size="xs" className="text-emerald-400 hover:text-emerald-300"><CheckCircle className="w-3.5 h-3.5" /></Btn>
                      }
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>共 {filtered.length} 条记录</span>
          <div className="flex gap-1">
            <Btn variant="outline" size="xs">上一页</Btn>
            <Btn variant="outline" size="xs">下一页</Btn>
          </div>
        </div>
      </Card>
    </div>
  )
}
