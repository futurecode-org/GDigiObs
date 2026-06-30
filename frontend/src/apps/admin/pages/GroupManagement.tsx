import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useState, useEffect, useCallback, useRef } from "react"
import { Search, Plus, Users, Hash, MoreVertical, Trash2, Edit, Eye, Loader2, X, LayoutGrid, Crown, ChevronDown, Check } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { SectionHeader } from "@/shared/components/SectionHeader"
import { groupApi, userApi } from "@/lib/api"
import type { Group, User, PaginatedData } from "@/lib/types"

interface GroupFormData {
  name: string
  description: string
  max_members: number
  owner_id: number
}

const emptyForm: GroupFormData = {
  name: "",
  description: "",
  max_members: 200,
  owner_id: 0,
}

function isActive(status: string) {
  return status === "active" || status === "normal"
}

function getOwner(group: Group): { nickname?: string; username: string; user_id: number } | null {
  if (group.owner) {
    return {
      nickname: group.owner.nickname,
      username: group.owner.username || `用户#${group.owner.user_id}`,
      user_id: group.owner.user_id,
    }
  }
  const owner = group.members?.find(m => m.role === "owner")
  if (owner) {
    return { nickname: owner.nickname, username: owner.username, user_id: owner.user_id }
  }
  if (group.created_by) {
    return { username: `用户#${group.created_by}`, user_id: group.created_by }
  }
  return null
}

export function GroupManagement() {
  const [groups, setGroups] = useState<Group[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  const [allUsers, setAllUsers] = useState<User[]>([])

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [formData, setFormData] = useState<GroupFormData>(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  const [detailOpen, setDetailOpen] = useState(false)
  const [detailGroup, setDetailGroup] = useState<Group | null>(null)

  const [confirm, setConfirm] = useState<{
    open: boolean
    title: string
    description: string
    onConfirm: () => void
  }>({ open: false, title: "", description: "", onConfirm: () => {} })

  const [ownerSearch, setOwnerSearch] = useState("")

  const [ownerDropdownOpen, setOwnerDropdownOpen] = useState(false)
  const ownerSearchRef = useRef<HTMLInputElement>(null)
  const ownerDropdownRef = useRef<HTMLDivElement>(null)

  const filteredOwners = allUsers.filter(user => {
    const q = ownerSearch.toLowerCase()
    return !q ||
      user.username.toLowerCase().includes(q) ||
      user.nickname?.toLowerCase().includes(q)
  })

  const selectedOwner = allUsers.find(u => u.id === formData.owner_id)

  // 点击外部关闭群主下拉
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ownerDropdownRef.current && !ownerDropdownRef.current.contains(e.target as Node)) {
        setOwnerDropdownOpen(false)
      }
    }
    if (ownerDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [ownerDropdownOpen])

  // 打开下拉时自动聚焦搜索框
  useEffect(() => {
    if (ownerDropdownOpen) {
      setTimeout(() => ownerSearchRef.current?.focus(), 50)
    }
  }, [ownerDropdownOpen])

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

  const fetchUsers = useCallback(async () => {
    try {
      const result = await userApi.getList({ page: 1, page_size: 100 }) as PaginatedData<User>
      setAllUsers(result.items)
    } catch (error) {
      console.error("获取用户列表失败:", error)
      setAllUsers([])
    }
  }, [])

  useEffect(() => {
    fetchGroups()
    fetchUsers()
  }, [fetchGroups, fetchUsers])

  const handleOpenCreate = () => {
    setEditingGroup(null)
    setFormData({ ...emptyForm, owner_id: allUsers[0]?.id || 0 })
    setOwnerSearch("")
    setDialogOpen(true)
  }

  const handleOpenEdit = (group: Group) => {
    setEditingGroup(group)
    const owner = getOwner(group)
    setFormData({
      name: group.name,
      description: group.description || "",
      max_members: group.max_members || 200,
      owner_id: owner?.user_id || group.created_by || 0,
    })
    setOwnerSearch("")
    setDialogOpen(true)
  }

  const handleOpenDetail = (group: Group) => {
    setDetailGroup(group)
    setDetailOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) return
    setSubmitting(true)
    try {
      if (editingGroup) {
        await groupApi.update(editingGroup.id, { name: formData.name, description: formData.description })
        const currentOwner = getOwner(editingGroup)
        if (currentOwner && formData.owner_id !== currentOwner.user_id && formData.owner_id > 0) {
          try {
            await groupApi.setAdmin(editingGroup.id, formData.owner_id, true)
          } catch (e) {
            console.warn("转移群主失败:", e)
          }
        }
      } else {
        const newGroup = await groupApi.create(formData.name, formData.description, formData.max_members)
        if (formData.owner_id > 0 && newGroup?.id) {
          try {
            await groupApi.addMembers(newGroup.id, [formData.owner_id])
            await groupApi.setAdmin(newGroup.id, formData.owner_id, true)
          } catch (e) {
            console.warn("设置群主失败:", e)
          }
        }
      }
      setDialogOpen(false)
      fetchGroups()
    } catch (error) {
      console.error("保存群组失败:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDissolve = (groupId: number, groupName: string) => {
    setConfirm({
      open: true,
      title: "解散群组",
      description: `确定要解散群组「${groupName}」吗？解散后所有成员将被移除。`,
      onConfirm: async () => {
        try {
          await groupApi.dissolve(groupId)
          fetchGroups()
        } catch (error) {
          console.error("解散群组失败:", error)
        }
      },
    })
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
          action={
            <Button size="sm" onClick={handleOpenCreate}>
              <Plus className="w-4 h-4" /> 创建群组
            </Button>
          }
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
                    {filteredGroups.map(group => {
                      const owner = getOwner(group)
                      return (
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
                            <div className="flex items-center gap-1">
                              <Crown className="w-3 h-3 text-yellow-500" />
                              <span className="text-sm text-foreground">
                                {owner?.nickname || owner?.username || "-"}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={`text-xs ${isActive(group.status) ? "bg-emerald-500/15 text-emerald-400" : "bg-destructive/15 text-destructive"}`}>
                              {isActive(group.status) ? "正常" : "已解散"}
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
                                <DropdownMenuItem onClick={() => handleOpenDetail(group)}>
                                  <Eye className="w-4 h-4 mr-2" /> 查看详情
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleOpenEdit(group)}>
                                  <Edit className="w-4 h-4 mr-2" /> 编辑
                                </DropdownMenuItem>
                                {isActive(group.status) && (
                                  <DropdownMenuItem onClick={() => handleDissolve(group.id, group.name)} className="text-destructive">
                                    <Trash2 className="w-4 h-4 mr-2" /> 解散群组
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg" onPointerDownOutside={e => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{editingGroup ? "编辑群组" : "创建群组"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>群组名称 <span className="text-destructive">*</span></Label>
              <Input
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="请输入群组名称"
              />
            </div>
            <div className="space-y-2">
              <Label>描述</Label>
              <Textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="请输入群组描述"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>最大成员数</Label>
                <Input
                  type="number"
                  value={formData.max_members}
                  onChange={e => setFormData({ ...formData, max_members: parseInt(e.target.value) || 200 })}
                  placeholder="最大成员数"
                />
              </div>
              <div className="space-y-2">
                <Label>群主 <span className="text-destructive">*</span></Label>
                <div className="relative" ref={ownerDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setOwnerDropdownOpen(prev => !prev)}
                    className="flex w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 h-8"
                  >
                    <span className={selectedOwner ? "text-foreground" : "text-muted-foreground"}>
                      {selectedOwner
                        ? `${selectedOwner.nickname || selectedOwner.username} (${selectedOwner.username})`
                        : "选择群主"}
                    </span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                  </button>
                  {ownerDropdownOpen && (
                    <div className="absolute z-50 mt-1 w-full rounded-lg border border-input bg-popover shadow-md ring-1 ring-foreground/10 overflow-hidden">
                      <div className="px-2 py-1.5 border-b border-border">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                          <input
                            ref={ownerSearchRef}
                            type="text"
                            value={ownerSearch}
                            onChange={e => setOwnerSearch(e.target.value)}
                            placeholder="搜索用户名或昵称..."
                            className="w-full pl-7 pr-2 py-1 text-sm bg-muted rounded border border-transparent focus:outline-none focus:border-primary"
                          />
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {filteredOwners.map(user => (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, owner_id: user.id })
                              setOwnerDropdownOpen(false)
                              setOwnerSearch("")
                            }}
                            className="flex w-full items-center justify-between px-2.5 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                          >
                            <span>{user.nickname || user.username} ({user.username})</span>
                            {formData.owner_id === user.id && (
                              <Check className="w-4 h-4 text-primary" />
                            )}
                          </button>
                        ))}
                        {filteredOwners.length === 0 && (
                          <div className="px-2 py-3 text-sm text-muted-foreground text-center">未找到匹配用户</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              <X className="w-4 h-4 mr-1" /> 取消
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || !formData.name.trim() || formData.owner_id <= 0}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
              {editingGroup ? "保存" : "创建"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg" onPointerDownOutside={e => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>群组详情</DialogTitle>
          </DialogHeader>
          {detailGroup && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <LayoutGrid className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-lg font-medium">{detailGroup.name}</p>
                  <Badge className={`text-xs mt-1 ${isActive(detailGroup.status) ? "bg-emerald-500/15 text-emerald-400" : "bg-destructive/15 text-destructive"}`}>
                    {isActive(detailGroup.status) ? "正常" : "已解散"}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">描述</span><p className="mt-1 font-medium">{detailGroup.description || "-"}</p></div>
                <div><span className="text-muted-foreground">成员数</span><p className="mt-1 font-medium">{detailGroup.member_count}/{detailGroup.max_members}</p></div>
                <div>
                  <span className="text-muted-foreground">群主</span>
                  <p className="mt-1 font-medium flex items-center gap-1">
                    <Crown className="w-3 h-3 text-yellow-500" />
                    {(() => {
                      const o = getOwner(detailGroup)
                      return o?.nickname || o?.username || "-"
                    })()}
                  </p>
                </div>
                <div><span className="text-muted-foreground">创建时间</span><p className="mt-1 font-medium">{detailGroup.created_at ? new Date(detailGroup.created_at).toLocaleString() : "-"}</p></div>
              </div>
              {detailGroup.members && detailGroup.members.length > 0 && (
                <div>
                  <span className="text-muted-foreground text-sm">成员列表 ({detailGroup.members.length}人)</span>
                  <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                    {detailGroup.members.map(member => (
                      <div key={member.id} className="flex items-center justify-between py-1.5 px-2 bg-muted rounded">
                        <span className="text-sm">{member.nickname || member.username}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {member.role === "owner" ? "群主" : member.role === "admin" ? "管理员" : "成员"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>关闭</Button>
            {detailGroup && (
              <Button onClick={() => { setDetailOpen(false); handleOpenEdit(detailGroup); }}>
                <Edit className="w-4 h-4 mr-1" /> 编辑
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm AlertDialog */}
      <AlertDialog open={confirm.open} onOpenChange={open => setConfirm(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirm.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirm(prev => ({ ...prev, open: false }))}>取消</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                confirm.onConfirm()
                setConfirm(prev => ({ ...prev, open: false }))
              }}
            >
              确认
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
