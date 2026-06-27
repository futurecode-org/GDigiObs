import { useState } from "react"
import { Search, Filter, Calendar, Eye } from "lucide-react"
import { Card } from "@/components/shared/Card"
import { SectionHeader } from "@/components/shared/SectionHeader"
import { Badge } from "@/components/shared/Badge"
import { Btn } from "@/components/shared/Btn"
import { dataAuditItems } from "@/lib/mockData"

export function DataAudit() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterPlatform, setFilterPlatform] = useState("")

  const filteredItems = dataAuditItems.filter(item => {
    const matchSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchPlatform = !filterPlatform || item.platform === filterPlatform
    return matchSearch && matchPlatform
  })

  return (
    <div className="h-full overflow-y-auto p-6">
      <Card className="p-4 mb-4">
        <SectionHeader title="数据审计" action={<Btn variant="outline"><Filter className="w-4 h-4" /> 筛选</Btn>} />
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="搜索标题..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <select
            value={filterPlatform}
            onChange={e => setFilterPlatform(e.target.value)}
            className="px-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">全部平台</option>
            <option value="社交媒体">社交媒体</option>
            <option value="新闻网站">新闻网站</option>
            <option value="RSS">RSS</option>
            <option value="行业网站">行业网站</option>
          </select>
          <Btn variant="outline"><Calendar className="w-4 h-4" /> 时间</Btn>
        </div>
      </Card>

      <div className="space-y-4">
        {filteredItems.map(item => (
          <Card key={item.id} className={`p-4 ${item.risk ? "border-red-500/20 bg-red-500/5" : ""}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-foreground">{item.title}</h3>
                  {item.risk && <Badge variant="danger">风险数据</Badge>}
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <Badge variant="default">{item.platform}</Badge>
                  <Badge variant={item.sentiment === "positive" ? "success" : item.sentiment === "negative" ? "danger" : "muted"}>
                    {item.sentiment === "positive" ? "正向" : item.sentiment === "negative" ? "负向" : "中性"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">来源: {item.source}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{item.time}</span>
                <Btn variant="ghost" onClick={() => alert(`查看详情 ${item.title}`)}><Eye className="w-4 h-4" /></Btn>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}