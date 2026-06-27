import { useState } from "react"
import { Plus, Search, Edit, Trash2, Upload, BookOpen } from "lucide-react"
import { Card } from "@/components/shared/Card"
import { SectionHeader } from "@/components/shared/SectionHeader"
import { Badge } from "@/components/shared/Badge"
import { StatusDot } from "@/components/shared/StatusDot"
import { Btn } from "@/components/shared/Btn"
import { knowledgeBases } from "@/lib/mockData"

export function KnowledgeManagement() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredKbs = knowledgeBases.filter(kb =>
    kb.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="h-full overflow-y-auto p-6">
      <Card className="p-4 mb-4">
        <SectionHeader title="知识库管理" action={<Btn onClick={() => alert("创建知识库")}><Plus className="w-4 h-4" /> 创建知识库</Btn>} />
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索知识库名称..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredKbs.map(kb => (
          <Card key={kb.id} className="p-4 hover:border-primary/30 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-foreground">{kb.name}</h3>
                    <Badge variant={kb.type === "public" ? "success" : kb.type === "tenant" ? "warning" : kb.type === "group" ? "info" : "muted"}>
                      {kb.type === "public" ? "公开" : kb.type === "tenant" ? "租户" : kb.type === "group" ? "群组" : "个人"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusDot status={kb.status} />
                    <span className={`text-xs ${kb.status === "ready" ? "text-emerald-400" : "text-blue-400"}`}>
                      {kb.status === "ready" ? "已就绪" : "索引中"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Btn variant="ghost" onClick={() => alert(`编辑知识库 ${kb.name}`)}><Edit className="w-4 h-4" /></Btn>
                <Btn variant="danger" onClick={() => alert(`删除知识库 ${kb.name}`)}><Trash2 className="w-4 h-4" /></Btn>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
              <div className="text-center">
                <div className="text-sm font-medium text-foreground">{kb.files}</div>
                <div className="text-[10px] text-muted-foreground">文件数</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-foreground">{kb.updated}</div>
                <div className="text-[10px] text-muted-foreground">更新时间</div>
              </div>
              <div className="text-center">
                <Btn variant="outline" size="xs"><Upload className="w-3 h-3" /> 上传</Btn>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}