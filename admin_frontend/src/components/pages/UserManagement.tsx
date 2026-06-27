import { useState } from "react"
import { Search, Plus, Edit, Trash2, UserCircle, Mail, Building2, Clock, ChevronDown } from "lucide-react"
import { Card } from "@/components/shared/Card"
import { SectionHeader } from "@/components/shared/SectionHeader"
import { Badge } from "@/components/shared/Badge"
import { StatusDot } from "@/components/shared/StatusDot"
import { Btn } from "@/components/shared/Btn"
import { adminUsers } from "@/lib/mockData"
import { cn } from "@/lib/utils"

export function UserManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRole, setFilterRole] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [showRoleMenu, setShowRoleMenu] = useState(false)
  const [showStatusMenu, setShowStatusMenu] = useState(false)

  const filteredUsers = adminUsers.filter(user => {
    const matchSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchRole = !filterRole || user.role === filterRole
    const matchStatus = !filterStatus || user.status === filterStatus
    return matchSearch && matchRole && matchStatus
  })

  const handleToggleStatus = (userId: number) => {
    console.log(`Toggle status for user ${userId}`)
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <Card className="p-4 mb-4">
        <SectionHeader title="用户管理" action={<Btn onClick={() => alert("添加用户")}><Plus className="w-4 h-4" /> 添加用户</Btn>} />
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="搜索用户名或邮箱..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => { setShowRoleMenu(!showRoleMenu); setShowStatusMenu(false) }}
              className="flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground"
            >
              <UserCircle className="w-4 h-4" />
              {filterRole || "全部角色"}
              <ChevronDown className="w-3 h-3" />
            </button>
            {showRoleMenu && (
              <div className="absolute right-0 top-full mt-1 w-36 bg-card border border-border rounded-lg shadow-xl z-10">
                <button onClick={() => { setFilterRole(""); setShowRoleMenu(false) }} className="w-full px-4 py-2 text-left text-sm hover:bg-muted">全部角色</button>
                {["普通用户", "外部用户", "普通管理员", "平台超级管理员"].map(role => (
                  <button key={role} onClick={() => { setFilterRole(role); setShowRoleMenu(false) }} className="w-full px-4 py-2 text-left text-sm hover:bg-muted">{role}</button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => { setShowStatusMenu(!showStatusMenu); setShowRoleMenu(false) }}
              className="flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground"
            >
              <StatusDot status={filterStatus || "normal"} />
              {filterStatus === "normal" ? "正常" : filterStatus === "banned" ? "已封禁" : "全部状态"}
              <ChevronDown className="w-3 h-3" />
            </button>
            {showStatusMenu && (
              <div className="absolute right-0 top-full mt-1 w-36 bg-card border border-border rounded-lg shadow-xl z-10">
                <button onClick={() => { setFilterStatus(""); setShowStatusMenu(false) }} className="w-full px-4 py-2 text-left text-sm hover:bg-muted">全部状态</button>
                <button onClick={() => { setFilterStatus("normal"); setShowStatusMenu(false) }} className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"><StatusDot status="normal" /> 正常</button>
                <button onClick={() => { setFilterStatus("banned"); setShowStatusMenu(false) }} className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"><StatusDot status="banned" /> 已封禁</button>
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">用户</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">角色</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">租户</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">部门</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">状态</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">最后登录</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-semibold text-primary">
                        {user.name[0]}
                      </div>
                      <div>
                        <div className="text-sm text-foreground">{user.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={user.role.includes("超级管理员") ? "warning" : user.role.includes("管理员") ? "info" : "muted"}>
                      {user.role}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 text-sm text-foreground">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      {user.tenant}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-foreground">{user.dept}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <StatusDot status={user.status} />
                      <span className={cn("text-sm", user.status === "normal" ? "text-emerald-400" : "text-red-400")}>
                        {user.status === "normal" ? "正常" : "已封禁"}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {user.loginAt}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <Btn variant="ghost" onClick={() => alert(`编辑用户 ${user.name}`)}>
                        <Edit className="w-4 h-4" />
                      </Btn>
                      <Btn variant={user.status === "normal" ? "danger" : "success"} onClick={() => handleToggleStatus(user.id)}>
                        {user.status === "normal" ? <Trash2 className="w-4 h-4" /> : "解封"}
                      </Btn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">暂无符合条件的用户</p>
          </div>
        )}

        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
          <span className="text-xs text-muted-foreground">共 {filteredUsers.length} 条记录</span>
          <div className="flex items-center gap-1">
            <Btn variant="outline" size="xs" disabled>上一页</Btn>
            <Btn variant="primary" size="xs">1</Btn>
            <Btn variant="outline" size="xs">2</Btn>
            <Btn variant="outline" size="xs">3</Btn>
            <Btn variant="outline" size="xs">下一页</Btn>
          </div>
        </div>
      </Card>
    </div>
  )
}