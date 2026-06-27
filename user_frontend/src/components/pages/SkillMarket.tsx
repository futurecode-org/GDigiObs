import { useState } from "react"
import { Search, Download, Star, Heart, Tag, FolderOpen, Clock } from "lucide-react"
import { Card } from "@/components/shared/Card"
import { Btn } from "@/components/shared/Btn"
import { SectionHeader } from "@/components/shared/SectionHeader"
import { cn } from "@/lib/utils"

const marketSkills = [
  { id: 1, name: "网络数据爬取", type: "function_call", tags: ["爬虫", "数据采集"], downloads: 1240, rating: 4.8, creator: "数智科技", updated: "2026-06-24", installed: true },
  { id: 2, name: "情感分析工具", type: "mcp", tags: ["NLP", "分析"], downloads: 3870, rating: 4.9, creator: "云数据研究院", updated: "2026-06-20", installed: true },
  { id: 3, name: "数据格式转换", type: "function_call", tags: ["转换", "工具"], downloads: 892, rating: 4.6, creator: "个人开发者", updated: "2026-06-23", installed: false },
  { id: 4, name: "企业知识检索", type: "skill", tags: ["检索", "知识库"], downloads: 256, rating: 4.5, creator: "数智科技", updated: "2026-06-15", installed: false },
  { id: 5, name: "风险预警通知", type: "mcp", tags: ["预警", "通知"], downloads: 189, rating: 4.7, creator: "云数据研究院", updated: "2026-06-26", installed: false },
  { id: 6, name: "图表生成器", type: "function_call", tags: ["可视化", "图表"], downloads: 2150, rating: 4.8, creator: "数智科技", updated: "2026-06-22", installed: true },
]

const categories = ["全部", "数据采集", "数据分析", "工具", "通知", "可视化"]

export function SkillMarketPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("全部")
  const [installedFilter, setInstalledFilter] = useState<"all" | "installed" | "not_installed">("all")

  const filteredSkills = marketSkills.filter(skill => {
    const matchSearch = skill.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchCategory = selectedCategory === "全部" || skill.tags.includes(selectedCategory)
    const matchInstalled = installedFilter === "all" || 
      (installedFilter === "installed" && skill.installed) || 
      (installedFilter === "not_installed" && !skill.installed)
    return matchSearch && matchCategory && matchInstalled
  })

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <SectionHeader title="技能市场" action={<Btn variant="primary" size="sm"><Download className="w-4 h-4" /> 发布技能</Btn>} />
      </div>

      <Card className="p-4">
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
                  className={cn("px-3 py-1.5 rounded-lg text-xs transition-colors", selectedCategory === cat ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground hover:text-foreground")}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setInstalledFilter("all")} className={cn("px-3 py-1.5 rounded-lg text-xs transition-colors", installedFilter === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>全部</button>
            <button onClick={() => setInstalledFilter("installed")} className={cn("px-3 py-1.5 rounded-lg text-xs transition-colors", installedFilter === "installed" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>已安装</button>
            <button onClick={() => setInstalledFilter("not_installed")} className={cn("px-3 py-1.5 rounded-lg text-xs transition-colors", installedFilter === "not_installed" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>未安装</button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        {filteredSkills.map(skill => (
          <Card key={skill.id} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-sm font-medium text-foreground">{skill.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{skill.creator}</p>
              </div>
              <button className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
                <Heart className={cn("w-4 h-4", skill.installed ? "text-red-400 fill-red-400" : "text-muted-foreground")} />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span className="text-xs font-medium text-foreground">{skill.rating}</span>
              </div>
              <div className="flex items-center gap-1">
                <Download className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{skill.downloads}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1 mb-3">
              {skill.tags.map((tag, i) => (
                <span key={i} className="px-2 py-0.5 bg-muted/50 text-[10px] text-muted-foreground rounded-md">
                  <Tag className="w-3 h-3 inline mr-0.5" />{tag}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <Clock className="w-3 h-3" />
                {skill.updated}
              </div>
              <Btn variant={skill.installed ? "muted" : "primary"} size="sm">
                {skill.installed ? "已安装" : "安装"}
              </Btn>
            </div>
          </Card>
        ))}
      </div>

      {filteredSkills.length === 0 && (
        <div className="text-center py-12">
          <Download className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">暂无符合条件的技能</p>
        </div>
      )}
    </div>
  )
}