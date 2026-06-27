import { useState } from "react"
import { Plus, Download, Wrench, ChevronRight, Layers, FileText } from "lucide-react"
import { cn } from "@/shared/utils"
import { Badge, Card, Btn } from "@/shared/ui"
import { menuTree } from "@/shared/mockData"

export function PermissionsPage() {
  const [tab, setTab] = useState<"menu" | "button" | "data">("menu")

  const buttons = [
    { module: "用户管理", perms: ["查看", "新增", "编辑", "禁用", "封禁", "重置密码", "导出"] },
    { module: "数据采集", perms: ["查看", "新增", "编辑", "手动运行", "启用停用", "删除"] },
    { module: "模型管理", perms: ["查看", "新增", "编辑", "测试", "启用停用", "删除"] },
    { module: "聊天审计", perms: ["查看", "复核", "告警", "禁言", "封禁用户", "导出"] },
  ]

  return (
    <div className="p-6 space-y-5 h-full overflow-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">权限管理</h2>
          <p className="text-xs text-muted-foreground mt-0.5">菜单权限、按钮权限和数据范围策略</p>
        </div>
        <Btn size="sm"><Plus className="w-4 h-4" />新增权限项</Btn>
      </div>

      <div className="flex gap-1 bg-muted/40 rounded-lg p-1 w-fit">
        {(["menu", "button", "data"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn("px-4 py-1.5 text-sm rounded font-medium transition-colors",
            tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}>
            {t === "menu" ? "菜单权限" : t === "button" ? "按钮权限" : "数据权限"}
          </button>
        ))}
      </div>

      {tab === "menu" && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">系统菜单树</h3>
            <div className="flex gap-2">
              <Btn variant="ghost" size="xs"><Plus className="w-3.5 h-3.5" />添加菜单</Btn>
              <Btn variant="ghost" size="xs"><Download className="w-3.5 h-3.5" />导出配置</Btn>
            </div>
          </div>
          <div className="space-y-1">
            {menuTree.map(m => (
              <div key={m.key}>
                <div className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/30 group">
                  <ChevronRight className="w-4 h-4 text-muted-foreground rotate-90" />
                  <Layers className="w-4 h-4 text-primary" />
                  <span className="flex-1 text-sm font-medium text-foreground">{m.label}</span>
                  <Badge variant={m.checked ? "success" : "muted"}>{m.checked ? "启用" : "停用"}</Badge>
                  <div className="hidden group-hover:flex gap-1">
                    <Btn variant="ghost" size="xs"><Wrench className="w-3.5 h-3.5" /></Btn>
                    <Btn variant="ghost" size="xs"><Plus className="w-3.5 h-3.5" /></Btn>
                  </div>
                </div>
                {m.children?.map((c: { key: string; label: string; checked: boolean }) => (
                  <div key={c.key} className="flex items-center gap-3 py-1.5 px-3 pl-10 rounded-lg hover:bg-muted/30 group">
                    <span className="w-4" />
                    <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="flex-1 text-xs text-muted-foreground">{c.label}</span>
                    <Badge variant={c.checked ? "success" : "muted"}>{c.checked ? "启用" : "停用"}</Badge>
                    <div className="hidden group-hover:flex gap-1">
                      <Btn variant="ghost" size="xs"><Wrench className="w-3.5 h-3.5" /></Btn>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === "button" && (
        <div className="space-y-3">
          {buttons.map(b => (
            <Card key={b.module} className="p-4">
              <h4 className="text-sm font-medium mb-3 text-foreground">{b.module}</h4>
              <div className="flex flex-wrap gap-2">
                {b.perms.map((p, i) => (
                  <label key={p} className="flex items-center gap-1.5 cursor-pointer bg-muted/40 hover:bg-muted/60 px-2.5 py-1.5 rounded transition-colors">
                    <input type="checkbox" defaultChecked={i < 4} className="accent-primary" />
                    <span className="text-xs text-foreground">{p}</span>
                  </label>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === "data" && (
        <Card className="p-5 space-y-4 max-w-2xl">
          <h3 className="text-sm font-medium">数据权限策略配置</h3>
          <p className="text-xs text-muted-foreground">数据权限控制用户可查询的数据范围，在所有查询接口自动注入过滤条件。</p>
          <div className="space-y-3">
            {[
              { scope: "全平台", desc: "可查询所有租户数据", roles: "平台超级管理员", color: "danger" },
              { scope: "本租户", desc: "仅可查询本租户数据", roles: "租户管理员", color: "warning" },
              { scope: "本部门及下级", desc: "查询本部门及子部门数据", roles: "部门负责人", color: "info" },
              { scope: "本部门", desc: "仅查询本部门数据", roles: "普通管理员", color: "primary" },
              { scope: "仅本人", desc: "只能查询本人相关数据", roles: "普通用户默认", color: "muted" },
            ].map(d => (
              <div key={d.scope} className="flex items-start gap-4 p-3 border border-border rounded-lg hover:border-primary/30 transition-colors">
                <div className={cn("w-2 h-full min-h-[24px] rounded-full flex-shrink-0 self-stretch",
                  d.color === "danger" ? "bg-red-500" : d.color === "warning" ? "bg-amber-500" :
                  d.color === "info" ? "bg-cyan-500" : d.color === "primary" ? "bg-primary" : "bg-muted-foreground"
                )} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{d.scope}</span>
                    <Badge variant="muted">{d.roles}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{d.desc}</p>
                </div>
                <Btn variant="ghost" size="xs"><Wrench className="w-3.5 h-3.5" /></Btn>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
