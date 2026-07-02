import { useState, useEffect, useCallback, useRef } from "react"
import {
  Plus, Trash2, Edit, Eye, Loader2, X, Check, Database, Search,
  FileText, Upload, MessageSquare, Activity, ChevronLeft, ChevronRight,
  TestTube, Zap, FolderOpen, Clock, AlertTriangle
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SectionHeader } from "@/shared/components/SectionHeader"
import { knowledgeApi, chromaConfigApi, modelApi, difyApi } from "@/lib/api"
import type {
  KnowledgeBase, KnowledgeFile, KnowledgeChunk, ChromaConfig,
  ModelConfig, DifyProvider, DifyModelProvider, DifyAvailableModel, PaginatedData, RetrieveTestResponse,
  QAResponse, KBRetrievalLog
} from "@/lib/types"
import { toast } from "sonner"

const KB_TYPE_OPTIONS = [
  { value: "personal", label: "个人" },
  { value: "group", label: "群组" },
  { value: "tenant", label: "租户" },
  { value: "public", label: "公共" },
]

const KB_TYPE_LABELS: Record<string, string> = {
  personal: "个人", group: "群组", tenant: "租户", public: "公共",
}

const PROVIDER_OPTIONS = [
  { value: "local", label: "本地向量库" },
  { value: "dify", label: "Dify知识库" },
]

const PROVIDER_LABELS: Record<string, string> = {
  local: "本地", dify: "Dify",
}

const STATUS_LABELS: Record<string, string> = {
  draft: "草稿", indexing: "索引中", ready: "就绪", failed: "失败",
}

const FILE_STATUS_LABELS: Record<string, string> = {
  uploaded: "已上传", parsing: "解析中", chunking: "分片中",
  embedding: "向量化中", ready: "就绪", failed: "失败",
}

interface KBFormData {
  name: string
  description: string
  type: string
  group_id: string
  provider_type: "local" | "dify"
  chroma_config_id: string
  dify_provider_id: string
  embedding_model_id: string
  rerank_model_id: string
  chunk_size: string
  chunk_overlap: string
  dify_embedding_model: string
  dify_embedding_provider: string
  dify_rerank_model: string
  dify_rerank_provider: string
}

const emptyForm: KBFormData = {
  name: "",
  description: "",
  type: "personal",
  group_id: "",
  provider_type: "local",
  chroma_config_id: "",
  dify_provider_id: "",
  embedding_model_id: "",
  rerank_model_id: "",
  chunk_size: "500",
  chunk_overlap: "50",
  dify_embedding_model: "",
  dify_embedding_provider: "",
  dify_rerank_model: "",
  dify_rerank_provider: "",
}

export function KnowledgeManagement() {
  // Main list state
  const [kbs, setKBs] = useState<KnowledgeBase[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [providerFilter, setProviderFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Reference data for selects
  const [chromaConfigs, setChromaConfigs] = useState<ChromaConfig[]>([])
  const [embeddingModels, setEmbeddingModels] = useState<ModelConfig[]>([])
  const [rerankModels, setRerankModels] = useState<ModelConfig[]>([])
  const [difyProviders, setDifyProviders] = useState<DifyProvider[]>([])
  const [difyEmbeddingModels, setDifyEmbeddingModels] = useState<DifyModelProvider[]>([])
  const [difyRerankModels, setDifyRerankModels] = useState<DifyModelProvider[]>([])
  const [loadingDifyModels, setLoadingDifyModels] = useState(false)

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingKB, setEditingKB] = useState<KnowledgeBase | null>(null)
  const [form, setForm] = useState<KBFormData>(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteKB, setDeleteKB] = useState<KnowledgeBase | null>(null)
  const [deleteRemote, setDeleteRemote] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Delete file dialog
  const [deleteFileDialogOpen, setDeleteFileDialogOpen] = useState(false)
  const [deleteFileId, setDeleteFileId] = useState<number | null>(null)
  const [deletingFile, setDeletingFile] = useState(false)

  // Detail dialog
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [detailKB, setDetailKB] = useState<KnowledgeBase | null>(null)

  // Detail dialog

  // File management dialog
  const [fileDialogOpen, setFileDialogOpen] = useState(false)
  const [fileKB, setFileKB] = useState<KnowledgeBase | null>(null)
  const [files, setFiles] = useState<KnowledgeFile[]>([])
  const [filesLoading, setFilesLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Chunk dialog
  const [chunkDialogOpen, setChunkDialogOpen] = useState(false)
  const [chunks, setChunks] = useState<KnowledgeChunk[]>([])
  const [chunksLoading, setChunksLoading] = useState(false)
  const [, setChunkFileId] = useState<number | null>(null)

  // Retrieve test dialog
  const [retrieveDialogOpen, setRetrieveDialogOpen] = useState(false)
  const [retrieveKB, setRetrieveKB] = useState<KnowledgeBase | null>(null)
  const [retrieveQuery, setRetrieveQuery] = useState("")
  const [retrieveTopK, setRetrieveTopK] = useState("10")
  const [retrieveLoading, setRetrieveLoading] = useState(false)
  const [retrieveResult, setRetrieveResult] = useState<RetrieveTestResponse | null>(null)

  // QA dialog
  const [qaDialogOpen, setQaDialogOpen] = useState(false)
  const [qaKB, setQaKB] = useState<KnowledgeBase | null>(null)
  const [qaQuery, setQaQuery] = useState("")
  const [qaTopK, setQaTopK] = useState("5")
  const [qaLoading, setQaLoading] = useState(false)
  const [qaResult, setQaResult] = useState<QAResponse | null>(null)

  // Logs dialog
  const [logDialogOpen, setLogDialogOpen] = useState(false)
  const [logKB, setLogKB] = useState<KnowledgeBase | null>(null)
  const [logs, setLogs] = useState<KBRetrievalLog[]>([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [logPage, setLogPage] = useState(1)
  const [logTotalPages, setLogTotalPages] = useState(1)

  // Fetch reference data
  const fetchReferenceData = useCallback(async () => {
    try {
      const [chromaResult, modelResult, difyResult] = await Promise.all([
        chromaConfigApi.getList({ page: 1, page_size: 100 }),
        modelApi.getList({ page: 1, page_size: 100 }),
        difyApi.getProviders({ page: 1, page_size: 100 }),
      ])
      setChromaConfigs(chromaResult.items)
      const models = modelResult.items as ModelConfig[]
      setEmbeddingModels(models.filter(m => m.model_type === "embedding"))
      setRerankModels(models.filter(m => m.model_type === "rerank"))
      setDifyProviders(difyResult.items)
    } catch (error) {
      console.error("获取参考数据失败:", error)
    }
  }, [])

  const fetchKBs = useCallback(async () => {
    setIsLoading(true)
    try {
      const params: Record<string, unknown> = { page, page_size: 20 }
      if (providerFilter !== "all") params.provider_type = providerFilter
      const result = await knowledgeApi.getList(params) as PaginatedData<KnowledgeBase>
      setKBs(result.items)
      setTotalPages(result.total_pages || 1)
    } catch (error: any) {
      console.error("获取知识库列表失败:", error)
      toast.error(error.message || "获取知识库列表失败")
      setKBs([])
    } finally {
      setIsLoading(false)
    }
  }, [page, providerFilter])

  useEffect(() => {
    fetchKBs()
  }, [fetchKBs])

  useEffect(() => {
    fetchReferenceData()
  }, [fetchReferenceData])

  const openDeleteDialog = (kb: KnowledgeBase) => {
    setDeleteKB(kb)
    setDeleteRemote(false)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteKB) return
    setDeleting(true)
    try {
      await knowledgeApi.delete(deleteKB.id, deleteRemote)
      toast.success(deleteRemote && deleteKB.provider_type === "dify" 
        ? "知识库已删除（含云端数据）" 
        : "知识库已删除")
      setDeleteDialogOpen(false)
      fetchKBs()
    } catch (error: any) {
      console.error("删除知识库失败:", error)
      toast.error(error.message || "删除知识库失败")
    } finally {
      setDeleting(false)
    }
  }

  const openCreateDialog = () => {
    setEditingKB(null)
    setForm(emptyForm)
    setDifyEmbeddingModels([])
    setDifyRerankModels([])
    setDialogOpen(true)
  }

  const openEditDialog = (kb: KnowledgeBase) => {
    setEditingKB(kb)
    setForm({
      name: kb.name,
      description: kb.description || "",
      type: kb.type,
      group_id: kb.group_id ? String(kb.group_id) : "",
      provider_type: kb.provider_type,
      chroma_config_id: kb.chroma_config_id ? String(kb.chroma_config_id) : "",
      dify_provider_id: kb.dify_provider_id ? String(kb.dify_provider_id) : "",
      embedding_model_id: kb.embedding_model_id ? String(kb.embedding_model_id) : "",
      rerank_model_id: kb.rerank_model_id ? String(kb.rerank_model_id) : "",
      chunk_size: String(kb.chunk_size || 500),
      chunk_overlap: String(kb.chunk_overlap || 50),
      dify_embedding_model: kb.dify_embedding_model || "",
      dify_embedding_provider: kb.dify_embedding_model_provider || "",
      dify_rerank_model: kb.dify_rerank_model || "",
      dify_rerank_provider: kb.dify_rerank_model_provider || "",
    })
    if (kb.dify_provider_id) {
      loadDifyModels(String(kb.dify_provider_id))
    } else {
      setDifyEmbeddingModels([])
      setDifyRerankModels([])
    }
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("请填写知识库名称")
      return
    }

    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      description: form.description || undefined,
      type: form.type,
      provider_type: form.provider_type,
      chunk_size: parseInt(form.chunk_size, 10) || 500,
      chunk_overlap: parseInt(form.chunk_overlap, 10) || 50,
    }

    if (form.group_id) payload.group_id = parseInt(form.group_id, 10)

    if (form.provider_type === "local") {
      if (!form.chroma_config_id) {
        toast.error("请选择Chroma配置")
        return
      }
      if (!form.embedding_model_id) {
        toast.error("请选择Embedding模型")
        return
      }
      payload.chroma_config_id = parseInt(form.chroma_config_id, 10)
      payload.embedding_model_id = parseInt(form.embedding_model_id, 10)
      if (form.rerank_model_id) payload.rerank_model_id = parseInt(form.rerank_model_id, 10)
    } else {
      if (!form.dify_provider_id) {
        toast.error("请选择Dify Provider")
        return
      }
      payload.dify_provider_id = parseInt(form.dify_provider_id, 10)
      if (form.dify_embedding_model) {
        payload.embedding_model = form.dify_embedding_model
        payload.embedding_model_provider = form.dify_embedding_provider
      }
      if (form.dify_rerank_model) {
        payload.rerank_model = form.dify_rerank_model
        payload.rerank_model_provider = form.dify_rerank_provider
      }
    }

    setSubmitting(true)
    try {
      if (editingKB) {
        await knowledgeApi.update(editingKB.id, payload)
        toast.success("知识库更新成功")
      } else {
        await knowledgeApi.create(payload)
        toast.success("知识库创建成功")
      }
      setDialogOpen(false)
      fetchKBs()
    } catch (error: any) {
      console.error("保存知识库失败:", error)
      toast.error(error.message || "保存知识库失败")
    } finally {
      setSubmitting(false)
    }
  }

  const loadDifyModels = async (providerId: string) => {
    if (!providerId) {
      setDifyEmbeddingModels([])
      setDifyRerankModels([])
      return
    }
    setLoadingDifyModels(true)
    try {
      const [embeddingResult, rerankResult] = await Promise.all([
        knowledgeApi.getDifyModels(parseInt(providerId, 10), "text-embedding"),
        knowledgeApi.getDifyModels(parseInt(providerId, 10), "rerank"),
      ])
      setDifyEmbeddingModels(embeddingResult)
      setDifyRerankModels(rerankResult)
    } catch (error: any) {
      console.error("获取Dify模型失败:", error)
      toast.error("获取Dify可用模型失败")
    } finally {
      setLoadingDifyModels(false)
    }
  }

  const openDetailDialog = (kb: KnowledgeBase) => {
    setDetailKB(kb)
    setDetailDialogOpen(true)
  }

  const openFileDialog = async (kb: KnowledgeBase) => {
    setFileKB(kb)
    setFileDialogOpen(true)
    setFilesLoading(true)
    try {
      const result = await knowledgeApi.getFiles(kb.id, { page: 1, page_size: 100 })
      setFiles((result as PaginatedData<KnowledgeFile>).items)
    } catch (error: any) {
      toast.error(error.message || "获取文件列表失败")
      setFiles([])
    } finally {
      setFilesLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !fileKB) return
    setUploading(true)
    try {
      await knowledgeApi.uploadFile(fileKB.id, file)
      toast.success("文件上传成功")
      // Refresh file list
      const result = await knowledgeApi.getFiles(fileKB.id, { page: 1, page_size: 100 })
      setFiles((result as PaginatedData<KnowledgeFile>).items)
      fetchKBs()
    } catch (error: any) {
      toast.error(error.message || "文件上传失败")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const openDeleteFileDialog = (fileId: number) => {
    setDeleteFileId(fileId)
    setDeleteFileDialogOpen(true)
  }

  const handleDeleteFileConfirm = async () => {
    if (!fileKB || !deleteFileId) return
    setDeletingFile(true)
    try {
      await knowledgeApi.deleteFile(fileKB.id, deleteFileId)
      toast.success("文件已删除")
      const result = await knowledgeApi.getFiles(fileKB.id, { page: 1, page_size: 100 })
      setFiles((result as PaginatedData<KnowledgeFile>).items)
      fetchKBs()
    } catch (error: any) {
      toast.error(error.message || "删除文件失败")
    } finally {
      setDeletingFile(false)
      setDeleteFileDialogOpen(false)
    }
  }

  const openChunkDialog = async (kbId: number, fileId: number) => {
    setChunkFileId(fileId)
    setChunkDialogOpen(true)
    setChunksLoading(true)
    try {
      const result = await knowledgeApi.getChunks(kbId, { file_id: fileId, page: 1, page_size: 100 })
      setChunks(result as KnowledgeChunk[])
    } catch (error: any) {
      toast.error(error.message || "获取分片失败")
      setChunks([])
    } finally {
      setChunksLoading(false)
    }
  }

  const openRetrieveDialog = (kb: KnowledgeBase) => {
    setRetrieveKB(kb)
    setRetrieveQuery("")
    setRetrieveTopK("10")
    setRetrieveResult(null)
    setRetrieveDialogOpen(true)
  }

  const handleRetrieveTest = async () => {
    if (!retrieveQuery.trim() || !retrieveKB) return
    setRetrieveLoading(true)
    try {
      const result = await knowledgeApi.retrieveTest(retrieveKB.id, {
        query: retrieveQuery.trim(),
        top_k: parseInt(retrieveTopK, 10) || 10,
      })
      setRetrieveResult(result)
    } catch (error: any) {
      toast.error(error.message || "检索测试失败")
    } finally {
      setRetrieveLoading(false)
    }
  }

  const openQADialog = (kb: KnowledgeBase) => {
    setQaKB(kb)
    setQaQuery("")
    setQaTopK("5")
    setQaResult(null)
    setQaDialogOpen(true)
  }

  const handleQA = async () => {
    if (!qaQuery.trim() || !qaKB) return
    setQaLoading(true)
    try {
      const result = await knowledgeApi.qa(qaKB.id, {
        query: qaQuery.trim(),
        top_k: parseInt(qaTopK, 10) || 5,
      })
      setQaResult(result)
    } catch (error: any) {
      toast.error(error.message || "问答请求失败")
    } finally {
      setQaLoading(false)
    }
  }

  const openLogDialog = async (kb: KnowledgeBase) => {
    setLogKB(kb)
    setLogDialogOpen(true)
    setLogsLoading(true)
    setLogPage(1)
    try {
      const result = await knowledgeApi.getLogs(kb.id, { page: 1, page_size: 20 })
      setLogs((result as PaginatedData<KBRetrievalLog>).items)
      setLogTotalPages((result as PaginatedData<KBRetrievalLog>).total_pages || 1)
    } catch (error: any) {
      toast.error(error.message || "获取日志失败")
      setLogs([])
    } finally {
      setLogsLoading(false)
    }
  }

  const fetchLogs = async (pageNum: number) => {
    if (!logKB) return
    setLogsLoading(true)
    try {
      const result = await knowledgeApi.getLogs(logKB.id, { page: pageNum, page_size: 20 })
      setLogs((result as PaginatedData<KBRetrievalLog>).items)
      setLogTotalPages((result as PaginatedData<KBRetrievalLog>).total_pages || 1)
    } catch (error: any) {
      toast.error(error.message || "获取日志失败")
    } finally {
      setLogsLoading(false)
    }
  }

  const filteredKBs = kbs.filter(kb =>
    [kb.name, kb.description, kb.type].some(v => v?.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <SectionHeader
          title="知识库管理"
          subtitle="管理本地向量库和Dify知识库"
          action={
            <Button size="sm" onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-1" /> 创建知识库
            </Button>
          }
        />
        <div className="flex items-center gap-3 mt-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="搜索知识库名称..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-1">
            {[
              { value: "all", label: "全部" },
              { value: "local", label: "本地" },
              { value: "dify", label: "Dify" },
            ].map(opt => (
              <Button
                key={opt.value}
                variant={providerFilter === opt.value ? "secondary" : "ghost"}
                size="sm"
                onClick={() => { setProviderFilter(opt.value); setPage(1) }}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto p-4">
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredKBs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Database className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">暂无知识库</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>名称</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>文件/分片</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredKBs.map(kb => (
                    <TableRow key={kb.id}>
                      <TableCell>
                        <div className="font-medium">{kb.name}</div>
                        {kb.description && (
                          <div className="text-xs text-muted-foreground truncate max-w-[200px]">{kb.description}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {KB_TYPE_LABELS[kb.type] || kb.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={kb.provider_type === "local" ? "default" : "secondary"} className="text-xs">
                          {PROVIDER_LABELS[kb.provider_type] || kb.provider_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={kb.status === "ready" ? "secondary" : kb.status === "failed" ? "destructive" : "outline"}
                          className="text-xs"
                        >
                          {STATUS_LABELS[kb.status] || kb.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {kb.file_count} / {kb.chunk_count}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openDetailDialog(kb)} title="详情">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openFileDialog(kb)} title="文件">
                            <FolderOpen className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openRetrieveDialog(kb)} title="检索测试">
                            <TestTube className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openQADialog(kb)} title="问答">
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openLogDialog(kb)} title="日志">
                            <Activity className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(kb)} title="编辑">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => openDeleteDialog(kb)} title="删除">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto" onPointerDownOutside={e => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{editingKB ? "编辑知识库" : "创建知识库"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>名称 *</Label>
              <Input value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} placeholder="知识库名称" />
            </div>
            <div className="space-y-2">
              <Label>描述</Label>
              <Input value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))} placeholder="知识库描述" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>类型</Label>
                <Select value={form.type} onValueChange={v => setForm(prev => ({ ...prev, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {KB_TYPE_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Provider类型</Label>
                <Select value={form.provider_type} onValueChange={(v: "local" | "dify") => setForm(prev => ({ ...prev, provider_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROVIDER_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.provider_type === "local" ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Chroma实例 *</Label>
                    <Select value={form.chroma_config_id} onValueChange={v => setForm(prev => ({ ...prev, chroma_config_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="选择ChromaDB实例" /></SelectTrigger>
                      <SelectContent>
                        {chromaConfigs.length === 0 ? (
                          <SelectItem value="" disabled>暂无Chroma配置，请先添加</SelectItem>
                        ) : (
                          chromaConfigs.map(c => (
                            <SelectItem key={c.id} value={String(c.id)}>
                              {c.name} ({c.host}:{c.port})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {chromaConfigs.length === 0 && (
                      <p className="text-xs text-destructive">暂无可用Chroma配置，请先添加Chroma配置</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Embedding模型 *</Label>
                    <Select value={form.embedding_model_id} onValueChange={v => setForm(prev => ({ ...prev, embedding_model_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="选择模型" /></SelectTrigger>
                      <SelectContent>
                        {embeddingModels.map(m => <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Rerank模型</Label>
                    <Select value={form.rerank_model_id} onValueChange={v => setForm(prev => ({ ...prev, rerank_model_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="选择模型（可选）" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">不使用</SelectItem>
                        {rerankModels.map(m => <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>分片大小</Label>
                    <Input value={form.chunk_size} onChange={e => setForm(prev => ({ ...prev, chunk_size: e.target.value }))} placeholder="500" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>分片重叠</Label>
                  <Input value={form.chunk_overlap} onChange={e => setForm(prev => ({ ...prev, chunk_overlap: e.target.value }))} placeholder="50" />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Dify Provider *</Label>
                  <Select value={form.dify_provider_id} onValueChange={v => {
                    setForm(prev => ({ ...prev, dify_provider_id: v }))
                    loadDifyModels(v)
                  }}>
                    <SelectTrigger><SelectValue placeholder="选择Provider" /></SelectTrigger>
                    <SelectContent>
                      {difyProviders.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {loadingDifyModels ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    加载可用模型...
                  </div>
                ) : (difyEmbeddingModels.length > 0 || difyRerankModels.length > 0) ? (
                  <>
                    <div className="space-y-2">
                      <Label>Embedding模型（可选）</Label>
                      <Select value={form.dify_embedding_provider && form.dify_embedding_model ? `${form.dify_embedding_provider}::${form.dify_embedding_model}` : ""} onValueChange={v => {
                        const [provider, model] = v.split("::")
                        setForm(prev => ({ ...prev, dify_embedding_model: model || "", dify_embedding_provider: provider || "" }))
                      }}>
                        <SelectTrigger><SelectValue placeholder="选择Dify Embedding模型" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">使用Dify默认</SelectItem>
                          {difyEmbeddingModels.map(provider => (
                            provider.models.map((model: DifyAvailableModel) => (
                              <SelectItem key={`${provider.provider}::${model.model}`} value={`${provider.provider}::${model.model}`}>
                                {provider.label?.zh_Hans || provider.provider} / {model.label?.zh_Hans || model.model}
                              </SelectItem>
                            ))
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Rerank模型（可选）</Label>
                      <Select value={form.dify_rerank_provider && form.dify_rerank_model ? `${form.dify_rerank_provider}::${form.dify_rerank_model}` : ""} onValueChange={v => {
                        const [provider, model] = v.split("::")
                        setForm(prev => ({ ...prev, dify_rerank_model: model || "", dify_rerank_provider: provider || "" }))
                      }}>
                        <SelectTrigger><SelectValue placeholder="选择Dify Rerank模型" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">不使用</SelectItem>
                          {difyRerankModels.map(provider => (
                            provider.models.map((model: DifyAvailableModel) => (
                              <SelectItem key={`rerank-${provider.provider}::${model.model}`} value={`${provider.provider}::${model.model}`}>
                                {provider.label?.zh_Hans || provider.provider} / {model.label?.zh_Hans || model.model}
                              </SelectItem>
                            ))
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : null}
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}><X className="w-4 h-4 mr-1" /> 取消</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />}
              {editingKB ? "保存" : "创建"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-lg" onPointerDownOutside={e => e.preventDefault()}>
          <DialogHeader><DialogTitle>知识库详情</DialogTitle></DialogHeader>
          {detailKB && (
            <div className="space-y-3 py-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">名称</span><span className="font-medium">{detailKB.name}</span>
                <span className="text-muted-foreground">类型</span><span>{KB_TYPE_LABELS[detailKB.type] || detailKB.type}</span>
                <span className="text-muted-foreground">Provider</span><span>{PROVIDER_LABELS[detailKB.provider_type] || detailKB.provider_type}</span>
                <span className="text-muted-foreground">状态</span><span>{STATUS_LABELS[detailKB.status] || detailKB.status}</span>
                <span className="text-muted-foreground">公开</span><span>{detailKB.is_public ? "是" : "否"}</span>
                <span className="text-muted-foreground">文件/分片</span><span>{detailKB.file_count} / {detailKB.chunk_count}</span>
              </div>
              {detailKB.provider_type === "local" ? (
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Chroma配置</span><span>{detailKB.chroma_config?.name || "-"}</span>
                  <span className="text-muted-foreground">Embedding模型</span><span>{detailKB.embedding_model?.name || "-"}</span>
                  <span className="text-muted-foreground">Rerank模型</span><span>{detailKB.rerank_model?.name || "-"}</span>
                  <span className="text-muted-foreground">分片大小</span><span>{detailKB.chunk_size}</span>
                  <span className="text-muted-foreground">分片重叠</span><span>{detailKB.chunk_overlap}</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Dify Provider</span><span>{detailKB.dify_provider?.name || "-"}</span>
                  <span className="text-muted-foreground">Dataset ID</span><span className="text-xs font-mono">{detailKB.dify_dataset_id || "-"}</span>
                </div>
              )}
              {detailKB.description && (
                <div>
                  <span className="text-muted-foreground">描述</span>
                  <p className="mt-1">{detailKB.description}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* File Management Dialog */}
      <Dialog open={fileDialogOpen} onOpenChange={setFileDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" onPointerDownOutside={e => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>文件管理 — {fileKB?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center justify-between mb-4">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Upload className="w-4 h-4 mr-1" />}
                上传文件
              </Button>
            </div>
            {filesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">暂无文件</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>文件名</TableHead>
                    <TableHead>大小</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>分片</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {files.map(f => (
                    <TableRow key={f.id}>
                      <TableCell>
                        <div className="font-medium text-sm">{f.original_filename || `文件 #${f.file_id}`}</div>
                        {f.dify_document_id && <div className="text-xs text-muted-foreground">Dify: {f.dify_document_id}</div>}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {f.file_size ? `${(f.file_size / 1024).toFixed(1)} KB` : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={f.parse_status === "ready" ? "secondary" : f.parse_status === "failed" ? "destructive" : "outline"} className="text-xs">
                          {FILE_STATUS_LABELS[f.parse_status] || f.parse_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{f.chunk_count}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => fileKB && openChunkDialog(fileKB.id, f.id)} title="查看分片">
                            <Zap className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => openDeleteFileDialog(f.id)} title="删除">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Chunk Dialog */}
      <Dialog open={chunkDialogOpen} onOpenChange={setChunkDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" onPointerDownOutside={e => e.preventDefault()}>
          <DialogHeader><DialogTitle>知识分片</DialogTitle></DialogHeader>
          {chunksLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : chunks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">暂无分片</div>
          ) : (
            <div className="space-y-3 py-4">
              {chunks.map(chunk => (
                <Card key={chunk.id}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-xs">#{chunk.chunk_index}</Badge>
                      <span className="text-xs text-muted-foreground">{chunk.token_count} tokens</span>
                    </div>
                    <p className="text-sm text-foreground line-clamp-4">{chunk.content}</p>
                    {chunk.chroma_doc_id && (
                      <div className="text-xs text-muted-foreground mt-1 font-mono">{chunk.chroma_doc_id}</div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Retrieve Test Dialog */}
      <Dialog open={retrieveDialogOpen} onOpenChange={setRetrieveDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" onPointerDownOutside={e => e.preventDefault()}>
          <DialogHeader><DialogTitle>检索测试 — {retrieveKB?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Input
                value={retrieveQuery}
                onChange={e => setRetrieveQuery(e.target.value)}
                placeholder="输入查询内容..."
                className="flex-1"
                onKeyDown={e => e.key === "Enter" && handleRetrieveTest()}
              />
              <Input
                value={retrieveTopK}
                onChange={e => setRetrieveTopK(e.target.value)}
                placeholder="Top K"
                className="w-20"
                type="number"
                min={1}
                max={50}
              />
              <Button onClick={handleRetrieveTest} disabled={retrieveLoading}>
                {retrieveLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>
            {retrieveResult && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{retrieveResult.latency_ms}ms</span>
                  <span>·</span>
                  <span>{retrieveResult.results_count} 条结果</span>
                </div>
                {retrieveResult.results.map((r, i) => (
                  <Card key={i}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-xs">{r.source}</Badge>
                        <span className="text-xs font-mono">{(r.score as number).toFixed(3)}</span>
                      </div>
                      <p className="text-sm text-foreground">{r.content as string}</p>
                      {r.metadata && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {(r.metadata as Record<string, unknown>).original_filename as string}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* QA Dialog */}
      <Dialog open={qaDialogOpen} onOpenChange={setQaDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" onPointerDownOutside={e => e.preventDefault()}>
          <DialogHeader><DialogTitle>知识问答 — {qaKB?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Input
                value={qaQuery}
                onChange={e => setQaQuery(e.target.value)}
                placeholder="输入问题..."
                className="flex-1"
                onKeyDown={e => e.key === "Enter" && handleQA()}
              />
              <Input
                value={qaTopK}
                onChange={e => setQaTopK(e.target.value)}
                placeholder="Top K"
                className="w-20"
                type="number"
                min={1}
                max={20}
              />
              <Button onClick={handleQA} disabled={qaLoading}>
                {qaLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
              </Button>
            </div>
            {qaResult && (
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm font-medium mb-2">答案</div>
                    <div className="text-sm text-foreground whitespace-pre-wrap">{qaResult.answer}</div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{qaResult.latency_ms}ms</span>
                    </div>
                  </CardContent>
                </Card>
                {qaResult.references && qaResult.references.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-2">引用来源</div>
                    <div className="space-y-2">
                      {qaResult.references.map((r, i) => (
                        <Card key={i}>
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between mb-1">
                              <Badge variant="outline" className="text-xs">{r.source}</Badge>
                              <span className="text-xs font-mono">{(r.score as number).toFixed(3)}</span>
                            </div>
                            <p className="text-sm text-foreground line-clamp-2">{r.content as string}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Logs Dialog */}
      <Dialog open={logDialogOpen} onOpenChange={setLogDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" onPointerDownOutside={e => e.preventDefault()}>
          <DialogHeader><DialogTitle>调用记录 — {logKB?.name}</DialogTitle></DialogHeader>
          {logsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">暂无记录</div>
          ) : (
            <div className="py-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>查询</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>结果数</TableHead>
                    <TableHead>耗时</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm max-w-[200px] truncate">{log.query}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{log.retrieval_type}</Badge></TableCell>
                      <TableCell className="text-xs">{log.results_count}</TableCell>
                      <TableCell className="text-xs">{log.latency_ms}ms</TableCell>
                      <TableCell>
                        <Badge variant={log.status === "success" ? "secondary" : "destructive"} className="text-xs">
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {logTotalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => { setLogPage(p => Math.max(1, p - 1)); fetchLogs(logPage - 1) }} disabled={logPage === 1}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">{logPage} / {logTotalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => { setLogPage(p => Math.min(logTotalPages, p + 1)); fetchLogs(logPage + 1) }} disabled={logPage === logTotalPages}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={e => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>删除知识库</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
              <p>确定要删除知识库 <strong>{deleteKB?.name}</strong> 吗？</p>
            </div>
            {deleteKB?.provider_type === "dify" && (
              <div className="space-y-3 bg-muted p-3 rounded-lg">
                <p className="text-sm font-medium">删除模式</p>
                <div className="space-y-2">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="deleteMode"
                      checked={!deleteRemote}
                      onChange={() => setDeleteRemote(false)}
                      className="mt-1"
                    />
                    <div className="text-sm">
                      <span className="font-medium">仅删除本地记录</span>
                      <p className="text-xs text-muted-foreground">保留 Dify 云端知识库，仅删除系统内的记录。之后可通过同步功能重新导入。</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="deleteMode"
                      checked={deleteRemote}
                      onChange={() => setDeleteRemote(true)}
                      className="mt-1"
                    />
                    <div className="text-sm">
                      <span className="font-medium text-destructive">同时删除云端数据</span>
                      <p className="text-xs text-muted-foreground">同时删除 Dify 云端知识库（Dataset）及所有文档。此操作不可撤销。</p>
                    </div>
                  </label>
                </div>
              </div>
            )}
            {deleteKB?.provider_type === "local" && (
              <p className="text-sm text-muted-foreground">关联的 Chroma Collection 和文件将被清理。</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleting}>
              {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Trash2 className="w-4 h-4 mr-1" />}
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete File Dialog */}
      <Dialog open={deleteFileDialogOpen} onOpenChange={setDeleteFileDialogOpen}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={e => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>删除文件</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-3 text-sm">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
              <p>确定要删除此文件吗？此操作不可恢复。</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteFileDialogOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={handleDeleteFileConfirm} disabled={deletingFile}>
              {deletingFile ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Trash2 className="w-4 h-4 mr-1" />}
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
