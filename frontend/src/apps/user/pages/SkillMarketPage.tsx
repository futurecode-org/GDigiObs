import { useState, useEffect } from "react"
import { Search, Download, Star, Tag, FolderOpen, Clock, Loader2, Check } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SectionHeader } from "@/shared/components/SectionHeader"
import { Badge } from "@/components/ui/badge"
import { skillApi } from "@/lib/api"
import type { Skill, PaginatedData } from "@/lib/types"
import { toast } from "sonner"

export function SkillMarketPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("全部")
  const [installedFilter, setInstalledFilter] = useState<"all" | "installed" | "not_installed">("all")
  const [skills, setSkills] = useState<Skill[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [installedSkills, setInstalledSkills] = useState<Set<number>>(new Set())

  const categories = ["全部", "函数调用", "MCP", "Skill"]
  const typeMap: Record<string, string> = { 函数调用: "function_call", MCP: "mcp", Skill: "skill" }
  const typeLabels: Record<string, string> = { function_call: "函数调用", mcp: "MCP", skill: "Skill" }

  useEffect(() => {
    fetchSkills()
    fetchInstalledSkills()
  }, [selectedCategory])

  const fetchSkills = async () => {
    setIsLoading(true)
    try {
      const result = (await skillApi.getPublicList({
        keyword: searchQuery || undefined,
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
  }

  const fetchInstalledSkills = async () => {
    try {
      const mySkills = (await skillApi.getList({ page: 1, page_size: 100 })) as PaginatedData<Skill>
      // 以原始公开技能 ID 作为已安装判定（创建副本时记录 origin_id 更佳，当前以名称+类型近似）
      const installed = new Set(
        mySkills.items
          .filter((s) => s.visibility === "personal")
          .map((s) => s.id)
      )
      setInstalledSkills(installed)
    } catch (error) {
      console.error("获取已安装技能失败:", error)
    }
  }

  const filteredSkills = skills.filter((skill) => {
    const matchSearch = skill.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchCategory = selectedCategory === "全部" || skill.type === typeMap[selectedCategory]
    const isInstalled = installedSkills.has(skill.id)
    const matchInstalled =
      installedFilter === "all" ||
      (installedFilter === "installed" && isInstalled) ||
      (installedFilter === "not_installed" && !isInstalled)
    return matchSearch && matchCategory && matchInstalled
  })

  const handleInstall = async (skillId: number) => {
    const sourceSkill = skills.find((s) => s.id === skillId)
    if (!sourceSkill) return
    try {
      await skillApi.create({
        name: sourceSkill.name,
        type: sourceSkill.type,
        description: sourceSkill.description,
        config: sourceSkill.config,
        input_schema: sourceSkill.input_schema,
        output_schema: sourceSkill.output_schema,
        visibility: "personal",
        status: "enabled",
      })
      setInstalledSkills((prev) => new Set([...prev, skillId]))
      toast.success("技能已安装到个人空间")
    } catch (error: any) {
      toast.error(error.message || "安装技能失败")
    }
  }

  const handleUninstall = async (skillId: number) => {
    try {
      await skillApi.delete(skillId)
      setInstalledSkills((prev) => {
        const newSet = new Set(prev)
        newSet.delete(skillId)
        return newSet
      })
      toast.success("已卸载技能")
    } catch (error: any) {
      toast.error(error.message || "卸载技能失败")
    }
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <SectionHeader
          title="技能市场"
          action={
            <Button size="sm" onClick={fetchSkills}>
              <Download className="w-4 h-4" /> 刷新
            </Button>
          }
        />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="搜索技能..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchSkills()}
                className="w-full pl-9 pr-3 py-2 bg-muted border border-transparent rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-muted-foreground" />
              <div className="flex gap-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                      selectedCategory === cat
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            {[
              { key: "all", label: "全部" },
              { key: "installed", label: "已安装" },
              { key: "not_installed", label: "未安装" },
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setInstalledFilter(filter.key as typeof installedFilter)}
                className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                  installedFilter === filter.key
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredSkills.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSkills.map((skill) => {
            const isInstalled = installedSkills.has(skill.id)
            return (
              <Card key={skill.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center">
                      <Tag className="w-5 h-5" />
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      {typeLabels[skill.type] || skill.type}
                    </Badge>
                  </div>

                  <h3 className="text-sm font-medium text-foreground mb-1">{skill.name}</h3>
                  {skill.description && (
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {skill.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3 mb-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {skill.created_at ? new Date(skill.created_at).toLocaleDateString() : ""}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded ${
                        skill.review_status === "approved"
                          ? "bg-green-50 text-green-600"
                          : skill.review_status === "pending"
                          ? "bg-yellow-50 text-yellow-600"
                          : "bg-gray-50 text-gray-600"
                      }`}
                    >
                      {skill.review_status === "approved"
                        ? "已审核"
                        : skill.review_status === "pending"
                        ? "审核中"
                        : "已拒绝"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-xs font-medium text-foreground">4.8</span>
                    </div>
                    {isInstalled ? (
                      <Button variant="secondary" size="xs" onClick={() => handleUninstall(skill.id)}>
                        <Check className="w-3 h-3" /> 已安装
                      </Button>
                    ) : (
                      <Button variant="outline" size="xs" onClick={() => handleInstall(skill.id)}>
                        <Download className="w-3 h-3" /> 安装
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Tag className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm">暂无技能</p>
        </div>
      )}
    </div>
  )
}
