import { useState, useEffect, useCallback } from "react"
import {
  Search,
  Plus,
  Wand2,
  MoreVertical,
  TrendingUp,
  Loader2,
  Play,
  ScrollText,
  Edit,
  Trash2,
  Power,
  PowerOff,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { SectionHeader } from "@/shared/components/SectionHeader"
import { skillApi } from "@/lib/api"
import type { Skill, PaginatedData, SkillType } from "@/lib/types"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { SkillFormDialog } from "@/apps/user/components/SkillFormDialog"
import { SkillTestDialog } from "@/apps/user/components/SkillTestDialog"
import { SkillLogsDialog } from "@/apps/user/components/SkillLogsDialog"

export function SkillsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [skills, setSkills] = useState<Skill[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [formOpen, setFormOpen] = useState(false)
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null)
  const [defaultFormType, setDefaultFormType] = useState<SkillType>("function_call")

  const [testSkill, setTestSkill] = useState<Skill | null>(null)
  const [logsSkill, setLogsSkill] = useState<Skill | null>(null)

  const [deleteSkill, setDeleteSkill] = useState<Skill | null>(null)

  const fetchSkills = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = (await skillApi.getList({
        page: 1,
        page_size: 100,
      })) as PaginatedData<Skill>
      setSkills(result.items)
    } catch (error) {
      console.error("获取技能列表失败:", error)
      setSkills([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSkills()
  }, [fetchSkills])

  const filteredSkills = skills.filter((skill) => {
    const matchSearch = skill.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchType = filterType === "all" || skill.type === filterType
    const matchStatus = filterStatus === "all" || skill.status === filterStatus
    return matchSearch && matchType && matchStatus
  })

  const handleCreate = (type: SkillType) => {
    setEditingSkill(null)
    setDefaultFormType(type)
    setFormOpen(true)
  }

  const handleEdit = (skill: Skill) => {
    setEditingSkill(skill)
    setDefaultFormType(skill.type as SkillType)
    setFormOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteSkill) return
    try {
      await skillApi.delete(deleteSkill.id)
      toast.success("技能已删除")
      fetchSkills()
    } catch (error: any) {
      toast.error(error.message || "删除失败")
    } finally {
      setDeleteSkill(null)
    }
  }

  const handleToggleStatus = async (skill: Skill) => {
    try {
      if (skill.status === "enabled") {
        await skillApi.disable(skill.id)
        toast.success("技能已停用")
      } else {
        await skillApi.enable(skill.id)
        toast.success("技能已启用")
      }
      fetchSkills()
    } catch (error: any) {
      toast.error(error.message || "操作失败")
    }
  }

  const typeLabels: Record<string, string> = {
    function_call: "函数调用",
    mcp: "MCP",
    skill: "Skill",
  }
  const statusLabels: Record<string, string> = {
    enabled: "已启用",
    disabled: "已禁用",
    pending: "待审核",
    approved: "已通过",
    rejected: "已拒绝",
  }
  const visibilityLabels: Record<string, string> = {
    personal: "个人",
    tenant: "租户",
    public: "公开",
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "enabled":
      case "approved":
        return "bg-emerald-500"
      case "disabled":
      case "rejected":
        return "bg-red-500"
      case "pending":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-4">
      <SectionHeader
        title="我的技能"
        action={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4" /> 添加技能
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleCreate("function_call")}>
                <Wand2 className="w-4 h-4 mr-2" /> Function Call
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCreate("mcp")}>
                <Wand2 className="w-4 h-4 mr-2" /> MCP
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCreate("skill")}>
                <Wand2 className="w-4 h-4 mr-2" /> Skill
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索技能..."
                className="w-full pl-9 pr-3 py-2 bg-muted border border-transparent rounded-lg text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex gap-2">
              {["all", "function_call", "mcp", "skill"].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={cn(
                    "px-3 py-1.5 text-xs rounded-lg transition-colors",
                    filterType === type
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {type === "all" ? "全部" : typeLabels[type]}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              {["all", "enabled", "disabled", "pending"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={cn(
                    "px-3 py-1.5 text-xs rounded-lg transition-colors",
                    filterStatus === status
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {status === "all" ? "全部" : statusLabels[status]}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredSkills.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSkills.map((skill) => (
            <Card key={skill.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center">
                    <Wand2 className="w-5 h-5" />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1.5 rounded hover:bg-muted transition-colors">
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(skill)}>
                        <Edit className="w-4 h-4 mr-2" /> 编辑
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setTestSkill(skill)}>
                        <Play className="w-4 h-4 mr-2" /> 测试
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setLogsSkill(skill)}>
                        <ScrollText className="w-4 h-4 mr-2" /> 调用记录
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleStatus(skill)}>
                        {skill.status === "enabled" ? (
                          <>
                            <PowerOff className="w-4 h-4 mr-2" /> 停用
                          </>
                        ) : (
                          <>
                            <Power className="w-4 h-4 mr-2" /> 启用
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setDeleteSkill(skill)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> 删除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <h3 className="text-sm font-medium text-foreground mb-2">{skill.name}</h3>

                {skill.description && (
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                    {skill.description}
                  </p>
                )}

                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="secondary">{typeLabels[skill.type] || skill.type}</Badge>
                  <Badge variant="outline">{visibilityLabels[skill.visibility] || skill.visibility}</Badge>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">类型：</span>
                    <span className="text-xs font-mono text-foreground">{skill.type}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={cn("w-2 h-2 rounded-full", getStatusColor(skill.status))} />
                    <span className="text-xs text-muted-foreground">
                      {statusLabels[skill.status] || skill.status}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-[10px] text-muted-foreground">
                    创建于 {new Date(skill.created_at).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => handleToggleStatus(skill)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {skill.status === "enabled" ? (
                      <Power className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <PowerOff className="w-4 h-4" />
                    )}
                    {skill.status === "enabled" ? "已启用" : "已禁用"}
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Wand2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">{searchQuery ? "未找到匹配的技能" : "暂无技能"}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => handleCreate("function_call")}
            >
              <Plus className="w-4 h-4 mr-1" /> 创建技能
            </Button>
          </CardContent>
        </Card>
      )}

      <SkillFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        skill={editingSkill}
        defaultType={defaultFormType}
        onSuccess={fetchSkills}
      />

      <SkillTestDialog
        open={!!testSkill}
        onOpenChange={(open) => !open && setTestSkill(null)}
        skillId={testSkill?.id || null}
        skillName={testSkill?.name || ""}
      />

      <SkillLogsDialog
        open={!!logsSkill}
        onOpenChange={(open) => !open && setLogsSkill(null)}
        skillId={logsSkill?.id || null}
        skillName={logsSkill?.name || ""}
      />

      <AlertDialog open={!!deleteSkill} onOpenChange={(open) => !open && setDeleteSkill(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除技能「{deleteSkill?.name}」吗？此操作不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteSkill(null)}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
