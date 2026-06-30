import { useState, useEffect } from "react"
import { AlertTriangle, Search, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { SectionHeader } from "@/shared/components/SectionHeader"
import { auditApi } from "@/lib/api"
import type { AuditLog, PaginatedData } from "@/lib/types"

export function SensitiveWords() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [query, setQuery] = useState("")

  useEffect(() => {
    setIsLoading(true)
    auditApi.getAuditLogs({ audit_type: "message", page: 1, page_size: 50 })
      .then(data => setLogs((data as PaginatedData<AuditLog>).items || []))
      .catch(() => setLogs([]))
      .finally(() => setIsLoading(false))
  }, [])

  const filtered = query
    ? logs.filter(log => [log.audit_type, log.content_summary, ...(log.risk_tags || [])].some(v => v?.toLowerCase().includes(query.toLowerCase())))
    : logs

  return (
    <div className="h-full overflow-y-auto p-6 space-y-4">
      <SectionHeader title="敏感词库" subtitle="基于审计日志展示敏感内容" />
      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="搜索敏感词、风险标签..." className="pl-9" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <AlertTriangle className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">暂无数据</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">类型</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">风险</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">摘要</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">时间</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(log => (
                  <tr key={log.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                    <td className="py-3 px-4 text-xs">{log.audit_type}</td>
                    <td className="py-3 px-4">
                      <Badge variant={log.risk_level === "high" || log.risk_level === "medium" ? "destructive" : log.risk_level === "low" ? "secondary" : "outline"} className="text-xs">
                        {log.risk_level || "none"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-xs">{log.content_summary || "-"}</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">{log.created_at ? new Date(log.created_at).toLocaleString() : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
