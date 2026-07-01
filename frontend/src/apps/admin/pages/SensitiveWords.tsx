import { useCallback, useEffect, useState } from "react"
import { AlertTriangle, Search, Loader2, Plus, Trash2, Edit2, Upload } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SectionHeader } from "@/shared/components/SectionHeader"
import { auditApi } from "@/lib/api"
import type { PaginatedData, SensitiveWord } from "@/lib/types"
import { toast } from "sonner"

const CATEGORIES = [
  { value: "political", label: "涉政" },
  { value: "porn", label: "涉黄" },
  { value: "insult", label: "辱骂" },
  { value: "violence", label: "暴恐" },
  { value: "ad", label: "广告" },
  { value: "privacy", label: "隐私泄露" },
  { value: "secret", label: "商业机密" },
  { value: "illegal", label: "违法违规" },
  { value: "custom", label: "自定义敏感词" },
]

const RISK_LEVELS = [
  { value: "low", label: "低风险" },
  { value: "medium", label: "中风险" },
  { value: "high", label: "高风险" },
]

const SCOPES = [
  { value: "", label: "全部范围" },
  { value: "platform", label: "平台级" },
  { value: "tenant", label: "租户级" },
]

const EMPTY_FORM = {
  word: "",
  category: "custom",
  risk_level: "medium" as "low" | "medium" | "high",
  scope: "tenant" as "platform" | "tenant",
  is_enabled: true,
  is_regex: false,
}

export function SensitiveWords() {
  const [data, setData] = useState<PaginatedData<SensitiveWord>>({ items: [], total: 0, page: 1, page_size: 20, total_pages: 1 })
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ scope: "", category: "", risk_level: "", keyword: "" })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<SensitiveWord | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const [batchOpen, setBatchOpen] = useState(false)
  const [batchText, setBatchText] = useState("")
  const [batchCategory, setBatchCategory] = useState("custom")
  const [batchRisk, setBatchRisk] = useState("medium")
  const [batchScope, setBatchScope] = useState("tenant")

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = { page, page_size: 20 }
      if (filters.scope) params.scope = filters.scope
      if (filters.category) params.category = filters.category
      if (filters.risk_level) params.risk_level = filters.risk_level
      if (filters.keyword) params.keyword = filters.keyword
      const result = await auditApi.getSensitiveWords(params)
      setData(result)
    } catch (error) {
      console.error("加载敏感词失败:", error)
      toast.error("加载敏感词失败")
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    void fetchData(1)
  }, [fetchData])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  const openEdit = (word: SensitiveWord) => {
    setEditing(word)
    setForm({
      word: word.word,
      category: word.category,
      risk_level: word.risk_level,
      scope: word.scope,
      is_enabled: word.is_enabled,
      is_regex: word.is_regex,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      if (editing) {
        await auditApi.updateSensitiveWord(editing.id, { ...form, scope: form.scope })
        toast.success("敏感词已更新")
      } else {
        await auditApi.createSensitiveWord(form)
        toast.success("敏感词已创建")
      }
      setDialogOpen(false)
      void fetchData(data.page)
    } catch {
      toast.error("保存失败")
    }
  }

  const handleDelete = async (word: SensitiveWord) => {
    if (!confirm(`确定删除敏感词「${word.word}」吗？`)) return
    try {
      await auditApi.deleteSensitiveWord(word.id)
      toast.success("已删除")
      void fetchData(data.page)
    } catch {
      toast.error("删除失败")
    }
  }

  const handleBatchImport = async () => {
    if (!batchText.trim()) return
    try {
      const result = await auditApi.batchImportSensitiveWords({
        words: batchText,
        category: batchCategory,
        risk_level: batchRisk,
        scope: batchScope,
      })
      toast.success(`成功导入 ${result.created} 个敏感词`)
      setBatchOpen(false)
      setBatchText("")
      void fetchData(1)
    } catch {
      toast.error("批量导入失败")
    }
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-4">
      <SectionHeader title="敏感词库" subtitle="自定义平台级与租户级敏感词" action={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void fetchData(data.page)}>刷新</Button>
          <Button size="sm" onClick={openCreate}><Plus className="size-4 mr-1" /> 新增</Button>
          <Button variant="secondary" size="sm" onClick={() => setBatchOpen(true)}><Upload className="size-4 mr-1" /> 批量导入</Button>
        </div>
      } />

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={filters.keyword}
                onChange={e => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
                placeholder="搜索敏感词..."
                className="pl-9"
              />
            </div>
            <Select value={filters.scope} onValueChange={v => setFilters(prev => ({ ...prev, scope: v }))}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="范围" /></SelectTrigger>
              <SelectContent>{SCOPES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={filters.category} onValueChange={v => setFilters(prev => ({ ...prev, category: v }))}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="类别" /></SelectTrigger>
              <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={filters.risk_level} onValueChange={v => setFilters(prev => ({ ...prev, risk_level: v }))}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="风险等级" /></SelectTrigger>
              <SelectContent>{RISK_LEVELS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : data.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <AlertTriangle className="size-10 mb-2 opacity-50" />
              <p className="text-sm">暂无敏感词</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>敏感词</TableHead>
                  <TableHead>类别</TableHead>
                  <TableHead>风险等级</TableHead>
                  <TableHead>范围</TableHead>
                  <TableHead>启用</TableHead>
                  <TableHead>正则</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map(word => (
                  <TableRow key={word.id}>
                    <TableCell className="font-medium">{word.word}</TableCell>
                    <TableCell>{CATEGORIES.find(c => c.value === word.category)?.label || word.category}</TableCell>
                    <TableCell>
                      <Badge variant={word.risk_level === "high" ? "destructive" : word.risk_level === "medium" ? "default" : "secondary"} className="text-xs">
                        {RISK_LEVELS.find(r => r.value === word.risk_level)?.label || word.risk_level}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{word.scope === "platform" ? "平台级" : "租户级"}</Badge>
                    </TableCell>
                    <TableCell>{word.is_enabled ? "是" : "否"}</TableCell>
                    <TableCell>{word.is_regex ? "是" : "否"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(word)}><Edit2 className="size-4" /></Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(word)}><Trash2 className="size-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {data.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">共 {data.total} 条，第 {data.page} / {data.total_pages} 页</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={data.page <= 1} onClick={() => void fetchData(data.page - 1)}>上一页</Button>
            <Button variant="outline" size="sm" disabled={data.page >= data.total_pages} onClick={() => void fetchData(data.page + 1)}>下一页</Button>
          </div>
        </div>
      )}

      {/* 新增/编辑弹窗 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editing ? "编辑敏感词" : "新增敏感词"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>敏感词</Label>
              <Input value={form.word} onChange={e => setForm(prev => ({ ...prev, word: e.target.value }))} placeholder="输入敏感词" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>类别</Label>
                <Select value={form.category} onValueChange={v => setForm(prev => ({ ...prev, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>风险等级</Label>
                <Select value={form.risk_level} onValueChange={v => setForm(prev => ({ ...prev, risk_level: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{RISK_LEVELS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>适用范围</Label>
              <Select value={form.scope} onValueChange={v => setForm(prev => ({ ...prev, scope: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="platform">平台级</SelectItem>
                  <SelectItem value="tenant">租户级</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>启用</Label>
              <Switch checked={form.is_enabled} onCheckedChange={v => setForm(prev => ({ ...prev, is_enabled: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <Label>正则表达式</Label>
              <Switch checked={form.is_regex} onCheckedChange={v => setForm(prev => ({ ...prev, is_regex: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSave}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 批量导入弹窗 */}
      <Dialog open={batchOpen} onOpenChange={setBatchOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>批量导入敏感词</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-xs text-muted-foreground">支持换行、逗号、分号分隔</p>
            <textarea
              className="w-full h-32 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={batchText}
              onChange={e => setBatchText(e.target.value)}
              placeholder="例如：反动, 色情, 赌博"
            />
            <div className="grid grid-cols-3 gap-3">
              <Select value={batchCategory} onValueChange={setBatchCategory}>
                <SelectTrigger><SelectValue placeholder="类别" /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={batchRisk} onValueChange={setBatchRisk}>
                <SelectTrigger><SelectValue placeholder="风险" /></SelectTrigger>
                <SelectContent>{RISK_LEVELS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={batchScope} onValueChange={setBatchScope}>
                <SelectTrigger><SelectValue placeholder="范围" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="platform">平台级</SelectItem>
                  <SelectItem value="tenant">租户级</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBatchOpen(false)}>取消</Button>
            <Button onClick={handleBatchImport}>导入</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
