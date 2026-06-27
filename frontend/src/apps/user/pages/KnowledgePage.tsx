import { useState } from "react"
import { Search, Plus, Upload, Folder, FileText, MoreVertical, RefreshCw } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { knowledgeBases } from "@/lib/mockData"
import { cn } from "@/lib/utils"

export function KnowledgePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedKB, setSelectedKB] = useState(1)

  const filteredKB = knowledgeBases.filter(kb => kb.name.toLowerCase().includes(searchQuery.toLowerCase()))
  const currentKB = knowledgeBases.find(kb => kb.id === selectedKB)

  const kbTypeLabels: Record<string, string> = { tenant: "租户级", personal: "个人", group: "群组", public: "公共" }
  const kbTypeColors: Record<string, string> = { tenant: "default", personal: "secondary", group: "outline", public: "ghost" }

  return (
    <div className="h-full flex">
      <div className="w-72 border-r border-border flex flex-col flex-shrink-0">
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">知识库</h2>
            <Button size="icon-xs"><Plus className="w-4 h-4" /></Button>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜索知识库..."
              className="w-full pl-9 pr-3 py-2 bg-muted border border-transparent rounded-lg text-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {filteredKB.map(kb => (
            <button
              key={kb.id}
              onClick={() => setSelectedKB(kb.id)}
              className={cn("w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors mb-1", selectedKB === kb.id ? "bg-primary/10" : "hover:bg-muted/50")}
            >
              <Folder className="w-8 h-8 rounded bg-cyan-500/15 text-cyan-400 p-1.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{kb.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant={kbTypeColors[kb.type] as "default" | "secondary" | "outline" | "ghost"} className="text-[10px]">{kbTypeLabels[kb.type]}</Badge>
                  <span className="text-[10px] text-muted-foreground">{kb.files} 个文件</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {currentKB ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{currentKB.name}</h2>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <Badge variant={kbTypeColors[currentKB.type] as "default" | "secondary" | "outline" | "ghost"}>{kbTypeLabels[currentKB.type]}</Badge>
                  <span>{currentKB.files} 个文件</span>
                  <span>更新于 {currentKB.updated}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm"><Upload className="w-4 h-4" /> 上传</Button>
                <Button variant="ghost" size="icon-sm"><RefreshCw className="w-4 h-4" /></Button>
              </div>
            </div>

            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  {Array(5).fill(0).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer">
                      <FileText className="w-8 h-8 rounded bg-muted text-muted-foreground p-1.5" />
                      <div className="flex-1">
                        <p className="text-sm text-foreground">文档 {i + 1}.pdf</p>
                        <p className="text-[10px] text-muted-foreground">更新于 2026-06-{20 + i}</p>
                      </div>
                      <button className="p-1.5 rounded hover:bg-muted transition-colors">
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <Folder className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>选择一个知识库</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
