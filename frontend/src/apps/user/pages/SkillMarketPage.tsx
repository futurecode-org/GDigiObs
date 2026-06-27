import { useState } from "react"
import { Search, Download, Star, Tag, FolderOpen, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SectionHeader } from "@/shared/components/SectionHeader"
import { Badge } from "@/components/ui/badge"

const marketSkills = [
  { id: 1, name: "网络数据爬取", type: "function_call", tags: ["爬虫", "数据采集"], downloads: 1240, rating: 4.8, creator: "数智科技", updated: "2026-06-24", installed: true },
  { id: 2, name: "情感分析工具", type: "mcp", tags: ["AI", "NLP"], downloads: 2350, rating: 4.9, creator: "AI实验室", updated: "2026-06-20", installed: false },
  { id: 3, name: "数据格式转换", type: "function_call", tags: ["数据处理"], downloads: 890, rating: 4.5, creator: "数据工具组", updated: "2026-06-22", installed: false },
  { id: 4, name: "企业知识检索", type: "skill", tags: ["知识图谱", "检索"], downloads: 567, rating: 4.6, creator: "知识工程部", updated: "2026-06-15", installed: true },
  { id: 5, name: "风险预警通知", type: "mcp", tags: ["风控", "通知"], downloads: 1230, rating: 4.7, creator: "安全中心", updated: "2026-06-26", installed: false },
]

export function SkillMarketPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("全部")
  const [installedFilter, setInstalledFilter] = useState<"all" | "installed" | "not_installed">("all")

  const categories = ["全部", "函数调用", "MCP", "Skill"]
  const typeMap: Record<string, string> = { 函数调用: "function_call", MCP: "mcp", Skill: "skill" }

  const filteredSkills = marketSkills.filter(skill => {
    const matchSearch = skill.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchCategory = selectedCategory === "全部" || skill.type === typeMap[selectedCategory]
    const matchInstalled = installedFilter === "all" || (installedFilter === "installed" && skill.installed) || (installedFilter === "not_installed" && !skill.installed)
    return matchSearch && matchCategory && matchInstalled
  })

  return (
    <div className="h-full overflow-y-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <SectionHeader title="技能市场" action={<Button size="sm"><Download className="w-4 h-4" /> 发布技能</Button>} />
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
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-muted border border-transparent rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-muted-foreground" />
              <div className="flex gap-1">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className="px-3 py-1.5 rounded-lg text-xs transition-colors bg-muted text-muted-foreground hover:text-foreground"
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
              { key: "not_installed", label: "未安装" }
            ].map(filter => (
              <button
                key={filter.key}
                onClick={() => setInstalledFilter(filter.key as typeof installedFilter)}
                className="px-3 py-1 text-xs rounded-lg transition-colors bg-muted text-muted-foreground hover:text-foreground"
              >
                {filter.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSkills.map(skill => (
          <Card key={skill.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center">
                  <Tag className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span className="text-xs font-medium text-foreground">{skill.rating}</span>
                </div>
              </div>

              <h3 className="text-sm font-medium text-foreground mb-1">{skill.name}</h3>
              <p className="text-xs text-muted-foreground mb-2">by {skill.creator}</p>

              <div className="flex flex-wrap gap-1 mb-3">
                {skill.tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 text-[10px] bg-muted text-muted-foreground rounded">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Download className="w-3 h-3" /> {skill.downloads}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {skill.updated}
                  </span>
                </div>
                {skill.installed ? (
                  <Badge variant="secondary">已安装</Badge>
                ) : (
                  <Button variant="outline" size="xs"><Download className="w-3 h-3" /> 安装</Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
