import { useState } from "react"
import { Search, Plus, Upload, Folder, FileText, Clock, MoreVertical, RefreshCw } from "lucide-react"
import { Card } from "@/components/shared/Card"
import { Badge } from "@/components/shared/Badge"
import { Btn } from "@/components/shared/Btn"
import { StatusDot } from "@/components/shared/StatusDot"
import { cn } from "@/lib/utils"
import { knowledgeBases } from "@/lib/mockData"

export function KnowledgePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedKB, setSelectedKB] = useState(1)

  const filteredKB = knowledgeBases.filter(kb => kb.name.toLowerCase().includes(searchQuery.toLowerCase()))
  const currentKB = knowledgeBases.find(kb => kb.id === selectedKB)

  const kbTypeLabels: Record<string, string> = { tenant: "租户级", personal: "个人", group: "群组", public: "公共" }
  const kbTypeColors: Record<string, string> = { tenant: "primary", personal: "success", group: "info", public: "muted" }

  return (
    <div className="h-full flex">
      <div className="w-72 border-r border-border flex flex-col flex-shrink-0">
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">知识库</h2>
            <Btn variant="primary" size="xs"><Plus className="w-4 h-4" /></Btn>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="搜索知识库..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-muted border border-transparent rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {filteredKB.map(kb => (
            <button
              key={kb.id}
              onClick={() => setSelectedKB(kb.id)}
              className={cn("w-full p-3 rounded-lg transition-colors text-left", selectedKB === kb.id ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/50")}
            >
              <div className="flex items-start gap-2.5">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", kb.status === "indexing" ? "bg-blue-500/15 text-blue-400" : "bg-primary/15 text-primary")}>
                  {kb.status === "indexing" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Folder className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{kb.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={kbTypeColors[kb.type] as "default" | "success" | "warning" | "danger" | "muted" | "info" | "primary" | "purple"} className="text-[10px]">{kbTypeLabels[kb.type]}</Badge>
                    <span className="text-[10px] text-muted-foreground">{kb.files} 个文件</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <StatusDot status={kb.status} />
                    <span className="text-[10px] text-muted-foreground">
                      {kb.status === "ready" ? "已就绪" : kb.status === "indexing" ? "索引中" : kb.status}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {currentKB ? (
          <>
            <div className="h-14 border-b border-border flex items-center justify-between px-4">
              <div>
                <div className="text-sm font-medium text-foreground">{currentKB.name}</div>
                <div className="text-[10px] text-muted-foreground">{kbTypeLabels[currentKB.type]} · {currentKB.files} 个文件 · 更新于 {currentKB.updated}</div>
              </div>
              <div className="flex items-center gap-2">
                <Btn variant="outline" size="sm"><Upload className="w-4 h-4" /> 上传文件</Btn>
                <Btn variant="ghost" size="sm"><MoreVertical className="w-4 h-4" /></Btn>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <Card className="p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-foreground">文件列表</span>
                  <Badge variant="muted">{currentKB.files} 个文件</Badge>
                </div>
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors">
                      <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">知识库文档_{i}.md</p>
                        <p className="text-[10px] text-muted-foreground">2026-06-20 · 约 2.3 KB</p>
                      </div>
                      <button className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">索引状态</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">已索引文件</span>
                    <span className="text-xs font-mono text-foreground">{currentKB.files} / {currentKB.files}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: "100%" }} />
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <StatusDot status="ready" />
                    索引完成，可正常检索
                  </div>
                </div>
              </Card>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-muted border border-border flex items-center justify-center mx-auto">
                <Folder className="w-7 h-7 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-base font-medium text-foreground">选择知识库</h3>
                <p className="text-sm text-muted-foreground mt-1">点击左侧列表中的知识库查看详情</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}