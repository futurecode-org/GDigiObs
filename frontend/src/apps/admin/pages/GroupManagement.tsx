import { useState, useEffect, useCallback } from "react"
import { Search, Plus, Users, Hash, MoreVertical, Trash2, Edit, Eye, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { SectionHeader } from "@/shared/components/SectionHeader"
import { groupApi } from "@/lib/api"
import type { Group } from "@/lib/types"


export function GroupManagement() {
  const [groups, setGroups] = useState<Group[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  const fetchGroups = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await groupApi.getList() as Group[]
      setGroups(result)
    } catch (error) {
      console.error("获取群组列表失败:", error)
      setGroups([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

  const handleDissolve = async (groupId: number, groupName: string) => {
    if (!confirm(`确定要解散群组「${groupName}」吗？解散后所有成员将被移除。`)) return
    try {
      await groupApi.dissolve(groupId)
      fetchGroups()
    } catch (error) {
      console.error("解散群组失败:", error)
    }
  }

  const filteredGroups = groups.filter(group => 
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <SectionHeader 
          title="群组管理" 
          action={<Button size="sm"><Plus className="w-4 h-4" /> 创建群组</Button>} 
        />
        <div className="relative flex-1 max-w-md mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="搜索群组名称、描述..."
            className="w-full pl-9 pr-3 py-2 bg-muted border border-transparent rounded-lg text-sm focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <div className="text-center">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>暂无群组数据</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">群组名称</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">描述</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">成员数</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">群主</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">状态</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">创建时间</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGroups.map(group => (
                      <tr key={group.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                              <Hash className="w-4 h-4 text-purple-400" />
                            </div>
                            <span className="text-sm font-medium text-foreground">{group.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-muted-foreground truncate max-w-xs block">
                            {group.description || "-"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 text-sm text-foreground">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            {group.member_count}/{group.max_members}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-foreground">
                            {group.members?.find(m => m.role === "owner")?.nickname || group.members?.find(m => m.role === "owner")?.username || "-"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={`text-xs ${group.status === "active" ? "bg-emerald-500/15 text-emerald-400" : "bg-destructive/15 text-destructive"}`}>
                            {group.status === "active" ? "正常" : "已解散"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">
                          {group.created_at ? new Date(group.created_at).toLocaleDateString() : "-"}
                        </td>
                        <td className="py-3 px-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="w-4 h-4 mr-2" /> 查看详情
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="w-4 h-4 mr-2" /> 编辑
                              </DropdownMenuItem>
                              {group.status === "active" && (
                                <DropdownMenuItem onClick={() => handleDissolve(group.id, group.name)} className="text-destructive">
                                  <Trash2 className="w-4 h-4 mr-2" /> 解散群组
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
      </div>
    </div>
  )
}