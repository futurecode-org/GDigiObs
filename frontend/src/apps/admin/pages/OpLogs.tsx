import { useState, useEffect, useCallback } from "react"
import { Search, Clock, User, ChevronLeft, ChevronRight, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SectionHeader } from "@/shared/components/SectionHeader"
import { auditApi } from "@/lib/api"
import type { OperationLog, PaginatedData } from "@/lib/types"

export function OpLogs() {
  const [logs, setLogs] = useState<OperationLog[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [moduleFilter, setModuleFilter] = useState<string>("all")

  const fetchLogs = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await auditApi.getOperationLogs({ page, page_size: 20 }) as PaginatedData<OperationLog>
      setLogs(result.items)
      setTotalPages(result.total_pages)
    } catch (error) {
      console.error("获取操作日志失败:", error)
      setLogs([])
    } finally {
      setIsLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesModule = moduleFilter === "all" || log.module === moduleFilter
    return matchesSearch && matchesModule
  })

  const modules = [...new Set(logs.map(log => log.module))]

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <SectionHeader title="操作日志" />
        <div className="flex gap-3 mt-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="搜索用户名、模块、操作..."
              className="pl-9"
            />
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            <button
              key="all"
              onClick={() => setModuleFilter("all")}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors whitespace-nowrap ${
                moduleFilter === "all" 
                  ? "bg-primary/10 text-primary" 
                  : "bg-muted text-muted-foreground hover:bg-muted/50"
              }`}
            >
              全部
            </button>
            {modules.map(module => (
              <button
                key={module}
                onClick={() => setModuleFilter(module)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors whitespace-nowrap ${
                  moduleFilter === module 
                    ? "bg-primary/10 text-primary" 
                    : "bg-muted text-muted-foreground hover:bg-muted/50"
                }`}
              >
                {module}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <div className="text-center">
                  <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>暂无操作日志</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">操作人</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">模块</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">操作</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">资源</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">详情</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">结果</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">IP</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map(log => (
                      <tr key={log.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="w-4 h-4 text-primary" />
                            </div>
                            <span className="text-sm font-medium text-foreground">{log.username}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-foreground">{log.module}</td>
                        <td className="py-3 px-4 text-sm text-foreground">{log.action}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {log.resource_type && log.resource_id 
                            ? `${log.resource_type} #${log.resource_id}` 
                            : "-"}
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-foreground max-w-[200px] truncate">
                          {log.detail || "-"}
                        </td>
                        <td className="py-3 px-4">
                          <div className={`flex items-center gap-1 text-xs ${log.success ? "text-emerald-400" : "text-destructive"}`}>
                            {log.success ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {log.success ? "成功" : "失败"}
                            {log.error_message && (
                              <span className="ml-1 max-w-[150px] truncate">{log.error_message}</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-foreground font-mono">{log.ip_address || "-"}</td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">{log.created_at}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-muted-foreground">共 {totalPages} 页，当前第 {page} 页</span>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}