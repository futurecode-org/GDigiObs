import { useState } from "react"
import { Plus, Key, Users, Database, Layers, Download, X, CheckCircle } from "lucide-react"
import { cn } from "@/shared/utils"
import { Badge, StatCard, Card, Btn } from "@/shared/ui"
import { roles, menuTree } from "@/shared/mockData"

export function RoleManagementPage() {
  const [selected, setSelected] = useState<number | null>(null)

  return (
    <div className="h-full flex overflow-hidden">
      {/* Left: Role List */}
      <div className="w-72 border-r border-border flex flex-col flex-shrink-0">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <span className="text-sm font-semibold">角色列表</span>
          <Btn size="xs"><Plus className="w-3.5 h-3.5" />新建角色</Btn>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {roles.map(r => (
            <button key={r.id} onClick={() => setSelected(r.id)} className={cn(
              "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors",
              selected === r.id ? "bg-primary/15 border border-primary/25" : "hover:bg-secondary border border-transparent"
            )}>
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                r.builtin ? "bg-amber-500/10 text-amber-400" : "bg-primary/10 text-primary"
              )}>
                <Key className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-foreground font-medium">{r.name}</span>
                  {r.builtin && <Badge variant="warning">内置</Badge>}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 truncate">{r.desc}</div>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                  <span>{r.users} 名用户</span>
                  <span>{r.menus} 个菜单</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right: Role Detail */}
      <div className="flex-1 overflow-auto p-6">
        {selected ? (
          (() => {
            const role = roles.find(r => r.id === selected)!
            return (
              <div className="space-y-5 max-w-2xl">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold">{role.name}</h3>
                      {role.builtin && <Badge variant="warning">内置角色</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{role.desc}</p>
                  </div>
                  <div className="flex gap-2">
                    <Btn variant="outline" size="sm"><Download className="w-3.5 h-3.5" />导出</Btn>
                    {!role.builtin && <Btn variant="danger" size="sm"><X className="w-3.5 h-3.5" />删除角色</Btn>}
                    <Btn size="sm"><CheckCircle className="w-3.5 h-3.5" />保存权限</Btn>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <StatCard label="关联用户" value={role.users} icon={Users} color="primary" />
                  <StatCard label="菜单权限" value={role.menus} icon={Layers} color="info" />
                  <StatCard label="数据范围" value="本租户" icon={Database} color="success" />
                </div>
                <Card className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">菜单权限配置</h4>
                    <div className="flex gap-2">
                      <Btn variant="ghost" size="xs"><CheckCircle className="w-3.5 h-3.5" />全选</Btn>
                      <Btn variant="ghost" size="xs"><X className="w-3.5 h-3.5" />清空</Btn>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {menuTree.map(m => (
                      <div key={m.key}>
                        <div className="flex items-center gap-3 py-2 px-2 rounded hover:bg-muted/30">
                          <input type="checkbox" defaultChecked={m.checked} className="accent-primary" />
                          <span className="text-sm text-foreground font-medium">{m.label}</span>
                        </div>
                        {m.children?.map((c: { key: string; label: string; checked: boolean }) => (
                          <div key={c.key} className="flex items-center gap-3 py-1.5 px-2 pl-8 rounded hover:bg-muted/30">
                            <input type="checkbox" defaultChecked={c.checked} className="accent-primary" />
                            <span className="text-xs text-muted-foreground">{c.label}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </Card>
                <Card className="p-4 space-y-3">
                  <h4 className="text-sm font-medium">数据权限范围</h4>
                  <div className="space-y-2">
                    {["全平台", "本租户", "本部门及下级", "本部门", "仅本人", "自定义"].map((scope, i) => (
                      <label key={scope} className="flex items-center gap-3 py-1.5 px-2 rounded hover:bg-muted/30 cursor-pointer">
                        <input type="radio" name="data-scope" defaultChecked={i === 1} className="accent-primary" />
                        <span className="text-sm text-foreground">{scope}</span>
                        {i === 0 && <Badge variant="danger">仅超级管理员</Badge>}
                      </label>
                    ))}
                  </div>
                </Card>
              </div>
            )
          })()
        ) : (
          <div className="h-full flex items-center justify-center text-center">
            <div className="space-y-2">
              <Key className="w-10 h-10 text-muted-foreground/30 mx-auto" />
              <p className="text-sm text-muted-foreground">选择左侧角色查看权限配置</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
