import { useState, useEffect, useCallback } from "react"
import { Search, Plus, Shield, Lock, ChevronLeft, ChevronRight, MoreVertical, Trash2, Edit, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { SectionHeader } from "@/shared/components/SectionHeader"
import { rbacApi } from "@/lib/api"
import type { Role, Permission, PaginatedData } from "@/lib/types"

export function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchRoles = useCallback(async () => {
    setIsLoading(true)
    try {
      const rolesResult = await rbacApi.getRoles({ page, page_size: 20 }) as PaginatedData<Role>
      setRoles(rolesResult.items)
      setTotalPages(rolesResult.total_pages)
    } catch (error) {
      console.error("获取角色列表失败:", error)
      setRoles([])
    } finally {
      setIsLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchRoles()
  }, [fetchRoles])

  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getPermissionNames = (rolePermissions: Permission[]) => {
    return rolePermissions.map(p => p.name).slice(0, 3).join(", ")
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <SectionHeader 
          title="角色管理" 
          action={<Button size="sm"><Plus className="w-4 h-4" /> 创建角色</Button>} 
        />
        <div className="flex gap-3 mt-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="搜索角色名称、编码..."
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : filteredRoles.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <div className="text-center">
                  <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>暂无角色数据</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">角色名称</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">角色编码</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">类型</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">权限数量</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">权限列表</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">描述</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">创建时间</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRoles.map(role => (
                      <tr key={role.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <Shield className="w-4 h-4 text-primary" />
                            </div>
                            <span className="text-sm font-medium text-foreground">{role.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground font-mono">{role.code}</td>
                        <td className="py-3 px-4">
                          <Badge variant="secondary" className="text-xs">
                            {role.is_system ? (
                              <span className="flex items-center gap-1">
                                <Lock className="w-3 h-3" /> 系统内置
                              </span>
                            ) : (
                              "自定义"
                            )}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-foreground">{role.permissions.length}</td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">
                          {getPermissionNames(role.permissions)}
                          {role.permissions.length > 3 && ` 等${role.permissions.length}项`}
                        </td>
                        <td className="py-3 px-4 text-sm text-foreground max-w-[200px] truncate">{role.description || "-"}</td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">{role.created_at}</td>
                        <td className="py-3 px-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Edit className="w-4 h-4 mr-2" /> 编辑权限
                              </DropdownMenuItem>
                              {!role.is_system && (
                                <DropdownMenuItem className="text-destructive">
                                  <Trash2 className="w-4 h-4 mr-2" /> 删除
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-muted-foreground">共 {totalPages} 页，当前第 {page} 页</span>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}