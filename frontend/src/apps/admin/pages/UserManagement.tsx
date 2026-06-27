import { useState, useEffect, useCallback } from "react"
import { Search, Plus, MoreVertical, Loader2, Shield, ShieldCheck } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SectionHeader } from "@/shared/components/SectionHeader"
import { userApi } from "@/lib/api"
import type { User, PaginatedData } from "@/lib/types"
import { cn } from "@/lib/utils"

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filterStatus, setFilterStatus] = useState<string>("all")

  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await userApi.getList({ page, page_size: 20 }) as PaginatedData<User>
      setUsers(result.items)
      setTotalPages(result.total_pages)
    } catch (error) {
      console.error("获取用户列表失败:", error)
      setUsers([])
    } finally {
      setIsLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const filteredUsers = users.filter(user => {
    const matchSearch = user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchStatus = filterStatus === "all" || user.status === filterStatus
    return matchSearch && matchStatus
  })

  const statusLabels: Record<string, string> = {
    active: "正常",
    inactive: "禁用",
    pending: "待激活"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-emerald-500"
      case "inactive": return "bg-gray-500"
      case "pending": return "bg-yellow-500"
      default: return "bg-gray-500"
    }
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-4">
      <SectionHeader 
        title="用户管理" 
        subtitle="管理系统中的所有用户账号"
        action={
          <Button size="sm">
            <Plus className="w-4 h-4" /> 添加用户
          </Button>
        } 
      />

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="搜索用户名或邮箱..."
                className="w-full pl-9 pr-3 py-2 bg-muted border border-transparent rounded-lg text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex gap-2">
              {["all", "active", "inactive", "pending"].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={cn(
                    "px-3 py-1.5 text-xs rounded-lg transition-colors",
                    filterStatus === status 
                      ? "bg-primary/10 text-primary" 
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {status === "all" ? "全部" : statusLabels[status] || status}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">用户</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">角色</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">租户</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">状态</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">最后登录</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-medium text-primary">
                              {user.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{user.username}</p>
                            <p className="text-xs text-muted-foreground">{user.email || "-"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map((role, idx) => (
                            <Badge 
                              key={idx} 
                              variant={role === "super_admin" || role === "admin" ? "default" : "outline"}
                              className="text-[10px]"
                            >
                              {role === "super_admin" ? (
                                <><ShieldCheck className="w-3 h-3 mr-1" /> 超级管理员</>
                              ) : role === "admin" ? (
                                <><Shield className="w-3 h-3 mr-1" /> 管理员</>
                              ) : role}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-foreground">{user.tenant_name || "-"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={cn("w-2 h-2 rounded-full", getStatusColor(user.status))} />
                          <span className="text-sm text-foreground">{statusLabels[user.status] || user.status}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-muted-foreground">
                          {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="icon-sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">{searchQuery ? "未找到匹配的用户" : "暂无用户"}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            第 {page} 页，共 {totalPages} 页
          </span>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              上一页
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              下一页
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}