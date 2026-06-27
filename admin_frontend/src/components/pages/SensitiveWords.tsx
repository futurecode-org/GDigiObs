import { useState } from "react"
import { Plus, Search, Edit, Trash2, AlertTriangle, Eye, EyeOff } from "lucide-react"
import { Card } from "@/components/shared/Card"
import { SectionHeader } from "@/components/shared/SectionHeader"
import { Badge } from "@/components/shared/Badge"
import { StatusDot } from "@/components/shared/StatusDot"
import { Btn } from "@/components/shared/Btn"
import { sensitiveWords } from "@/lib/mockData"

export function SensitiveWords() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredWords = sensitiveWords.filter(word =>
    word.word.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="h-full overflow-y-auto p-6">
      <Card className="p-4 mb-4">
        <SectionHeader title="敏感词库" action={<Btn onClick={() => alert("添加敏感词")}><Plus className="w-4 h-4" /> 添加敏感词</Btn>} />
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索敏感词..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">敏感词</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">分类</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">风险等级</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">生效范围</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">命中次数</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">状态</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredWords.map(word => (
                <tr key={word.id} className="hover:bg-muted/30">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span className="text-sm text-foreground font-mono">{word.word}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={word.category === "涉政" || word.category === "违法违规" ? "danger" : word.category === "商业机密" ? "warning" : "info"}>
                      {word.category}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-sm ${word.risk === "high" ? "text-red-400" : word.risk === "medium" ? "text-amber-400" : "text-emerald-400"}`}>
                      {word.risk === "high" ? "高" : word.risk === "medium" ? "中" : "低"}风险
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={word.scope === "platform" ? "warning" : "muted"}>
                      {word.scope === "platform" ? "平台级" : "租户级"}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-foreground">{word.hits}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <StatusDot status={word.status} />
                      <span className={`text-sm ${word.status === "enabled" ? "text-emerald-400" : "text-muted-foreground"}`}>
                        {word.status === "enabled" ? "生效中" : "已停用"}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <Btn variant="ghost" onClick={() => alert(`编辑 ${word.word}`)}><Edit className="w-4 h-4" /></Btn>
                      <Btn variant={word.status === "enabled" ? "danger" : "success"} onClick={() => alert(`切换状态 ${word.word}`)}>
                        {word.status === "enabled" ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Btn>
                      <Btn variant="danger" onClick={() => alert(`删除 ${word.word}`)}><Trash2 className="w-4 h-4" /></Btn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}