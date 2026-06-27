import { BookOpen, FileText, Plus, Search } from "lucide-react"
import { Sparkles } from "lucide-react"
import { Badge, StatusDot, Card, Btn } from "@/shared/ui"
import { knowledgeBases } from "@/shared/mockData"

export function KnowledgePage() {
  const typeLabel: Record<string, { label: string; variant: "default" | "success" | "info" | "muted" }> = {
    personal: { label: "个人", variant: "muted" },
    group: { label: "群组", variant: "info" },
    tenant: { label: "企业", variant: "default" },
    public: { label: "公开", variant: "success" },
  }
  const statusLabels: Record<string, { label: string; variant: "success" | "info" | "warning" | "danger" | "muted" }> = {
    ready: { label: "可用", variant: "success" },
    indexing: { label: "索引中", variant: "info" },
    failed: { label: "失败", variant: "danger" },
    draft: { label: "草稿", variant: "muted" },
  }
  return (
    <div className="p-6 space-y-5 h-full overflow-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">知识库</h2>
          <p className="text-xs text-muted-foreground mt-0.5">管理您的个人、群组和企业知识库</p>
        </div>
        <Btn size="sm"><Plus className="w-4 h-4" />新建知识库</Btn>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {knowledgeBases.map(kb => (
          <Card key={kb.id} className="p-4 hover:border-primary/30 transition-colors cursor-pointer group">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{kb.name}</span>
                  <Badge variant={typeLabel[kb.type].variant}>{typeLabel[kb.type].label}</Badge>
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{kb.files} 个文件</span>
                  <span>更新于 {kb.updated}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={statusLabels[kb.status].variant}><StatusDot status={kb.status} />{statusLabels[kb.status].label}</Badge>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-border flex gap-2">
              <Btn variant="ghost" size="xs"><Search className="w-3.5 h-3.5" />检索测试</Btn>
              <Btn variant="ghost" size="xs"><Sparkles className="w-3.5 h-3.5" />知识问答</Btn>
              <Btn variant="ghost" size="xs"><Plus className="w-3.5 h-3.5" />上传文件</Btn>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
