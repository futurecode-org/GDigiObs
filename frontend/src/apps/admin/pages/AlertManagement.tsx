import { useCallback, useEffect, useState } from "react"
import { Bell, Loader2, CheckCircle2, ShieldAlert, Settings2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SectionHeader } from "@/shared/components/SectionHeader"
import { auditApi } from "@/lib/api"
import type { AlertRecord, AlertRule, PaginatedData } from "@/lib/types"
import { toast } from "sonner"

const STATUSES = [
  { value: "", label: "全部状态" },
  { value: "unresolved", label: "未处理" },
  { value: "resolved", label: "已处理" },
  { value: "ignored", label: "已忽略" },
]

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString() : "-"
}

export function AlertManagement() {
  const [activeTab, setActiveTab] = useState("records")

  const [records, setRecords] = useState<PaginatedData<AlertRecord>>({ items: [], total: 0, page: 1, page_size: 20, total_pages: 1 })
  const [recordsLoading, setRecordsLoading] = useState(false)
  const [recordFilters, setRecordFilters] = useState({ status: "", alert_type: "", risk_level: "" })

  const [rules, setRules] = useState<AlertRule[]>([])
  const [rulesLoading, setRulesLoading] = useState(false)

  const fetchRecords = useCallback(async (page = 1) => {
    setRecordsLoading(true)
    try {
      const params: Record<string, unknown> = { page, page_size: 20 }
      if (recordFilters.status) params.status = recordFilters.status
      if (recordFilters.alert_type) params.alert_type = recordFilters.alert_type
      if (recordFilters.risk_level) params.risk_level = recordFilters.risk_level
      const result = await auditApi.getAlerts(params)
      setRecords(result)
    } catch (error) {
      console.error("加载告警记录失败:", error)
      toast.error("加载告警记录失败")
    } finally {
      setRecordsLoading(false)
    }
  }, [recordFilters])

  const fetchRules = useCallback(async () => {
    setRulesLoading(true)
    try {
      const result = await auditApi.getAlertRules()
      setRules(result)
    } catch (error) {
      console.error("加载告警规则失败:", error)
      toast.error("加载告警规则失败")
    } finally {
      setRulesLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === "records") void fetchRecords(1)
    if (activeTab === "rules") void fetchRules()
  }, [activeTab, fetchRecords, fetchRules])

  const handleResolve = async (alert: AlertRecord) => {
    try {
      await auditApi.resolveAlert(alert.id)
      toast.success("已标记为已处理")
      void fetchRecords(records.page)
    } catch {
      toast.error("处理失败")
    }
  }

  const toggleRule = async (rule: AlertRule) => {
    try {
      await auditApi.updateAlertRule(rule.id, { enabled: !rule.enabled })
      toast.success("规则状态已更新")
      void fetchRules()
    } catch {
      toast.error("更新失败")
    }
  }

  const toggleChannel = async (rule: AlertRule, channel: string) => {
    try {
      const channels = { ...(rule.channels || {}), [channel]: !(rule.channels || {})[channel] }
      await auditApi.updateAlertRule(rule.id, { channels })
      toast.success("通知渠道已更新")
      void fetchRules()
    } catch {
      toast.error("更新失败")
    }
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-4">
      <SectionHeader title="告警管理" subtitle="告警记录与告警规则配置" />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="records"><Bell className="size-4 mr-1" /> 告警记录</TabsTrigger>
          <TabsTrigger value="rules"><Settings2 className="size-4 mr-1" /> 告警规则</TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="space-y-4 mt-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-3">
                <Select value={recordFilters.status} onValueChange={v => setRecordFilters(prev => ({ ...prev, status: v }))}>
                  <SelectTrigger className="w-[140px]"><SelectValue placeholder="状态" /></SelectTrigger>
                  <SelectContent>{STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={recordFilters.risk_level} onValueChange={v => setRecordFilters(prev => ({ ...prev, risk_level: v }))}>
                  <SelectTrigger className="w-[140px]"><SelectValue placeholder="风险等级" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">全部风险</SelectItem>
                    <SelectItem value="high">高风险</SelectItem>
                    <SelectItem value="medium">中风险</SelectItem>
                    <SelectItem value="low">低风险</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              {recordsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="size-8 animate-spin text-muted-foreground" />
                </div>
              ) : records.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <ShieldAlert className="size-10 mb-2 opacity-50" />
                  <p className="text-sm">暂无告警记录</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>标题</TableHead>
                      <TableHead>类型</TableHead>
                      <TableHead>风险</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>时间</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.items.map(alert => (
                      <TableRow key={alert.id}>
                        <TableCell>
                          <p className="text-sm font-medium">{alert.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{alert.content || "-"}</p>
                        </TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{alert.alert_type}</Badge></TableCell>
                        <TableCell>
                          <Badge variant={alert.risk_level === "high" ? "destructive" : alert.risk_level === "medium" ? "default" : "secondary"} className="text-xs">
                            {alert.risk_level || "-"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={alert.status === "unresolved" ? "destructive" : "secondary"} className="text-xs">
                            {alert.status === "unresolved" ? "未处理" : alert.status === "resolved" ? "已处理" : "已忽略"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(alert.created_at)}</TableCell>
                        <TableCell className="text-right">
                          {alert.status === "unresolved" && (
                            <Button variant="ghost" size="sm" onClick={() => handleResolve(alert)}>
                              <CheckCircle2 className="size-4 mr-1" /> 处理
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {records.total_pages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">共 {records.total} 条，第 {records.page} / {records.total_pages} 页</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={records.page <= 1} onClick={() => void fetchRecords(records.page - 1)}>上一页</Button>
                <Button variant="outline" size="sm" disabled={records.page >= records.total_pages} onClick={() => void fetchRecords(records.page + 1)}>下一页</Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="rules" className="space-y-4 mt-4">
          <Card>
            <CardContent className="p-0">
              {rulesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="size-8 animate-spin text-muted-foreground" />
                </div>
              ) : rules.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Settings2 className="size-10 mb-2 opacity-50" />
                  <p className="text-sm">暂无告警规则</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>规则名称</TableHead>
                      <TableHead>类型</TableHead>
                      <TableHead>范围</TableHead>
                      <TableHead>站内通知</TableHead>
                      <TableHead>浏览器通知</TableHead>
                      <TableHead>邮件通知</TableHead>
                      <TableHead>启用</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rules.map(rule => (
                      <TableRow key={rule.id}>
                        <TableCell className="font-medium">{rule.rule_name}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{rule.alert_type}</Badge></TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{rule.scope === "platform" ? "平台级" : "租户级"}</Badge></TableCell>
                        <TableCell>
                          <Switch checked={!!rule.channels?.in_app} onCheckedChange={() => toggleChannel(rule, "in_app")} />
                        </TableCell>
                        <TableCell>
                          <Switch checked={!!rule.channels?.browser} onCheckedChange={() => toggleChannel(rule, "browser")} />
                        </TableCell>
                        <TableCell>
                          <Switch checked={!!rule.channels?.email} onCheckedChange={() => toggleChannel(rule, "email")} />
                        </TableCell>
                        <TableCell>
                          <Switch checked={rule.enabled} onCheckedChange={() => toggleRule(rule)} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
