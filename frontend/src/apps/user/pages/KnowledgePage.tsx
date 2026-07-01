import { useState, useEffect, useCallback, useRef } from "react"
import {
  Search, Plus, Upload, Folder, FileText, RefreshCw, Loader2,
  TestTube, MessageSquare, Activity, Clock, Zap, Trash2, X, ChevronLeft, ChevronRight,
  Edit, Settings, Database, Globe, Cpu, AlertTriangle, Check, Wrench, Trash
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { knowledgeApi, modelApi, difyApi, chromaConfigApi } from "@/lib/api"
import type {
  KnowledgeBase, KnowledgeFile, KnowledgeChunk, PaginatedData,
  RetrieveTestResponse, QAResponse, KBRetrievalLog, ModelConfig,
  DifyProvider, DifyModelProvider, DifyAvailableModel, ChromaConfig
} from "@/lib/types"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const KB_TYPE_LABELS: Record<string, string> = {
  personal: "个人", tenant: "租户", group: "群组", public: "公共",
}

const KB_TYPE_COLORS: Record<string, "default" | "secondary" | "outline" | "ghost"> = {
  personal: "secondary", tenant: "default", group: "outline", public: "ghost",
}

const STATUS_LABELS: Record<string, string> = {
  draft: "草稿", indexing: "索引中", ready: "就绪", failed: "失败",
}

const FILE_STATUS_LABELS: Record<string, string> = {
  uploaded: "已上传", parsing: "解析中", chunking: "分片中",
  embedding: "向量化中", ready: "就绪", failed: "失败",
}

const PROVIDER_LABELS: Record<string, string> = {
  local: "本地", dify: "Dify",
}

const PROVIDER_OPTIONS = [
  { value: "local", label: "本地向量库" },
  { value: "dify", label: "Dify知识库" },
]

const KB_TYPE_OPTIONS = [
  { value: "personal", label: "个人" },
  { value: "tenant", label: "租户" },
  { value: "public", label: "公共" },
]

interface KBFormData {
  name: string
  description: string
  type: string
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

export function KnowledgePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedKB, setSelectedKB] = useState<number | null>(null)
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  // Reference data
  const [chromaConfigs, setChromaConfigs] = useState<ChromaConfig[]>([])
  const [embeddingModels, setEmbeddingModels] = useState<ModelConfig[]>([])
  const [rerankModels, setRerankModels] = useState<ModelConfig[]>([])
  const [difyProviders, setDifyProviders] = useState<DifyProvider[]>([])
  const [llmModels, setLlmModels] = useState<ModelConfig[]>([])
  const [difyEmbeddingModels, setDifyEmbeddingModels] = useState<DifyModelProvider[]>([])
  const [difyRerankModels, setDifyRerankModels] = useState<DifyModelProvider[]>([])

  // Create/Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingKB, setEditingKB] = useState<KnowledgeBase | null>(null)
  const [form, setForm] = useState<KBFormData>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [loadingDifyModels, setLoadingDifyModels] = useState(false)

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteKB, setDeleteKB] = useState<KnowledgeBase | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Delete file dialog
  const [deleteFileDialogOpen, setDeleteFileDialogOpen] = useState(false)
  const [deleteFileId, setDeleteFileId] = useState<number | null>(null)
  const [deletingFile, setDeletingFile] = useState(false)

  // Sync dialog
  const [syncDialogOpen, setSyncDialogOpen] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{ synced_count: number; total_datasets: number } | null>(null)

  // File management
  const [files, setFiles] = useState<KnowledgeFile[]>([])
  const [filesLoading, setFilesLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Retrieve test
  const [retrieveQuery, setRetrieveQuery] = useState("")
  const [retrieveTopK, setRetrieveTopK] = useState("10")
  const [retrieveLoading, setRetrieveLoading] = useState(false)
  const [retrieveResult, setRetrieveResult] = useState<RetrieveTestResponse | null>(null)

  // QA
  const [qaQuery, setQaQuery] = useState("")
  const [qaTopK, setQaTopK] = useState("5")
  const [qaLoading, setQaLoading] = useState(false)
  const [qaResult, setQaResult] = useState<QAResponse | null>(null)
  const [selectedLLMModel, setSelectedLLMModel] = useState<string>("")

  // Logs
  const [logs, setLogs] = useState<KBRetrievalLog[]>([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [logPage, setLogPage] = useState(1)
  const [logTotalPages, setLogTotalPages] = useState(1)

  // Chunk dialog
  const [chunkDialogOpen, setChunkDialogOpen] = useState(false)
  const [chunks, setChunks] = useState<KnowledgeChunk[]>([])
  const [chunksLoading, setChunksLoading] = useState(false)

  const fetchKnowledgeBases = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await knowledgeApi.getList({ page: 1, page_size: 100 }) as PaginatedData<KnowledgeBase>
      setKnowledgeBases(result.items)
      if (result.items.length > 0 && !selectedKB) {
        setSelectedKB(result.items[0].id)
      }
    } catch (error) {
      console.error("获取知识库列表失败:", error)
      setKnowledgeBases([])
    } finally {
      setIsLoading(false)
    }
  }, [selectedKB])

  useEffect(() => {
    fetchKnowledgeBases()
  }, [fetchKnowledgeBases])

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
      setLlmModels(models.filter(m => m.model_type === "llm"))
      setDifyProviders(difyResult.items)
    } catch (error) {
      console.error("获取参考数据失败:", error)
    }
  }, [])

  useEffect(() => {
    fetchReferenceData()
  }, [fetchReferenceData])

  const currentKB = knowledgeBases.find(kb => kb.id === selectedKB)

  const fetchFiles = useCallback(async (kbId: number) => {
    setFilesLoading(true)
    try {
      const result = await knowledgeApi.getFiles(kbId, { page: 1, page_size: 100 })
      setFiles((result as PaginatedData<KnowledgeFile>).items)
    } catch (error: any) {
      toast.error(error.message || "获取文件列表失败")
      setFiles([])
    } finally {
      setFilesLoading(false)
    }
  }, [])

  const fetchLogs = useCallback(async (kbId: number, pageNum: number = 1) => {
    setLogsLoading(true)
    try {
      const result = await knowledgeApi.getLogs(kbId, { page: pageNum, page_size: 20 })
      setLogs((result as PaginatedData<KBRetrievalLog>).items)
      setLogTotalPages((result as PaginatedData<KBRetrievalLog>).total_pages || 1)
      setLogPage(pageNum)
    } catch (error: any) {
      toast.error(error.message || "获取日志失败")
      setLogs([])
    } finally {
      setLogsLoading(false)
    }
  }, [])

  // Auto-fetch when tab changes
  useEffect(() => {
    if (!currentKB) return
    if (activeTab === "files") {
      fetchFiles(currentKB.id)
    } else if (activeTab === "logs") {
      fetchLogs(currentKB.id, 1)
    }
  }, [activeTab, currentKB, fetchFiles, fetchLogs])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentKB) return
    setUploading(true)
    try {
      await knowledgeApi.uploadFile(currentKB.id, file)
      toast.success("文件上传成功")
      fetchFiles(currentKB.id)
      fetchKnowledgeBases()
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
    if (!currentKB || !deleteFileId) return
    setDeletingFile(true)
    try {
      await knowledgeApi.deleteFile(currentKB.id, deleteFileId)
      toast.success("文件已删除")
      fetchFiles(currentKB.id)
      fetchKnowledgeBases()
    } catch (error: any) {
      toast.error(error.message || "删除文件失败")
    } finally {
      setDeletingFile(false)
      setDeleteFileDialogOpen(false)
    }
  }

  const handleRetrieveTest = async () => {
    if (!retrieveQuery.trim() || !currentKB) return
    setRetrieveLoading(true)
    try {
      const result = await knowledgeApi.retrieveTest(currentKB.id, {
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

  const handleQA = async () => {
    if (!qaQuery.trim() || !currentKB) return
    setQaLoading(true)
    try {
      const payload: { query: string; top_k?: number; llm_model_id?: number } = {
        query: qaQuery.trim(),
        top_k: parseInt(qaTopK, 10) || 5,
      }
      if (selectedLLMModel) {
        payload.llm_model_id = parseInt(selectedLLMModel, 10)
      }
      const result = await knowledgeApi.qa(currentKB.id, payload)
      setQaResult(result)
    } catch (error: any) {
      toast.error(error.message || "问答请求失败")
    } finally {
      setQaLoading(false)
    }
  }

  const openChunkDialog = async (fileId: number) => {
    if (!currentKB) return
    setChunkDialogOpen(true)
    setChunksLoading(true)
    try {
      const result = await knowledgeApi.getChunks(currentKB.id, { file_id: fileId, page: 1, page_size: 100 })
      setChunks(result as KnowledgeChunk[])
    } catch (error: any) {
      toast.error(error.message || "获取分片失败")
      setChunks([])
    } finally {
      setChunksLoading(false)
    }
  }

  // ---- Create/Edit Dialog ----
  const openCreateDialog = () => {
    setEditingKB(null)
    setForm(emptyForm)
    setDifyAvailableModels([])
    setDialogOpen(true)
  }

  const openEditDialog = (kb: KnowledgeBase) => {
    setEditingKB(kb)
    setForm({
      name: kb.name,
      description: kb.description || "",
      type: kb.type,
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
      chunk_size: parseInt(form.chunk_size, 10) || 500,
      chunk_overlap: parseInt(form.chunk_overlap, 10) || 50,
    }

    if (form.provider_type === "local") {
      if (!form.chroma_config_id) {
        toast.error("请选择Chroma配置")
        return
      }
      if (!form.embedding_model_id) {
        toast.error("请选择Embedding模型")
        return
      }
      payload.provider_type = "local"
      payload.chroma_config_id = parseInt(form.chroma_config_id, 10)
      payload.embedding_model_id = parseInt(form.embedding_model_id, 10)
      if (form.rerank_model_id) payload.rerank_model_id = parseInt(form.rerank_model_id, 10)
    } else {
      if (!form.dify_provider_id) {
        toast.error("请选择Dify Provider")
        return
      }
      payload.provider_type = "dify"
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
      fetchKnowledgeBases()
    } catch (error: any) {
      console.error("保存知识库失败:", error)
      toast.error(error.message || "保存知识库失败")
    } finally {
      setSubmitting(false)
    }
  }

  // Load Dify models when provider changes
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

  // ---- Delete ----
  const [deleteRemote, setDeleteRemote] = useState(false)

  const openDeleteDialog = (kb: KnowledgeBase) => {
    setDeleteKB(kb)
    setDeleteRemote(false)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteKB) return
    setDeleting(true)
    try {
      await knowledgeApi.delete(deleteKB.id, deleteRemote)
      toast.success(deleteRemote && deleteKB.provider_type === "dify" 
        ? "知识库已删除（含云端数据）" 
        : "知识库已删除")
      setDeleteDialogOpen(false)
      if (selectedKB === deleteKB.id) setSelectedKB(null)
      fetchKnowledgeBases()
    } catch (error: any) {
      toast.error(error.message || "删除知识库失败")
    } finally {
      setDeleting(false)
    }
  }

  // ---- Sync ----
  const openSyncDialog = () => {
    setSyncResult(null)
    setSyncDialogOpen(true)
  }

  const handleSync = async () => {
    if (!form.dify_provider_id) {
      toast.error("请先选择Dify Provider")
      return
    }
    setSyncing(true)
    try {
      const result = await knowledgeApi.syncDifyDatasets(parseInt(form.dify_provider_id, 10))
      setSyncResult(result)
      toast.success(`同步完成，新增 ${result.synced_count} 个知识库`)
      fetchKnowledgeBases()
    } catch (error: any) {
      toast.error(error.message || "同步失败")
    } finally {
      setSyncing(false)
    }
  }

  const filteredKB = knowledgeBases.filter(kb =>
    kb.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="h-full flex">
      {/* 左侧知识库列表 */}
      <div className="w-72 border-r border-border flex flex-col flex-shrink-0">
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">知识库</h2>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" className="h-8 w-8" title="同步Dify知识库" onClick={openSyncDialog}>
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" title="创建知识库" onClick={openCreateDialog}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
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
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredKB.length > 0 ? (
            filteredKB.map(kb => (
              <div
                key={kb.id}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors mb-1 group",
                  selectedKB === kb.id ? "bg-primary/10" : "hover:bg-muted/50"
                )}
              >
                <button
                  className="flex items-center gap-3 flex-1 min-w-0"
                  onClick={() => { setSelectedKB(kb.id); setActiveTab("overview") }}
                >
                  <Folder className={cn(
                    "w-8 h-8 rounded p-1.5 shrink-0",
                    kb.provider_type === "local" ? "bg-cyan-500/15 text-cyan-400" : "bg-violet-500/15 text-violet-400"
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{kb.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant={KB_TYPE_COLORS[kb.type] || "secondary"} className="text-[10px]">
                        {KB_TYPE_LABELS[kb.type] || kb.type}
                      </Badge>
                      <Badge variant={kb.provider_type === "local" ? "default" : "secondary"} className="text-[10px]">
                        {PROVIDER_LABELS[kb.provider_type] || kb.provider_type}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {kb.file_count || 0} 文件
                      </span>
                    </div>
                  </div>
                </button>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="ghost" className="h-7 w-7" title="编辑" onClick={() => openEditDialog(kb)}>
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" title="删除" onClick={() => openDeleteDialog(kb)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {searchQuery ? "未找到匹配的知识库" : "暂无知识库"}
            </div>
          )}
        </div>
      </div>

      {/* 右侧内容区 */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : currentKB ? (
          <>
            {/* 头部信息 */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{currentKB.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={KB_TYPE_COLORS[currentKB.type] || "secondary"} className="text-xs">
                      {KB_TYPE_LABELS[currentKB.type] || currentKB.type}
                    </Badge>
                    <Badge variant={currentKB.provider_type === "local" ? "default" : "secondary"} className="text-xs">
                      {PROVIDER_LABELS[currentKB.provider_type] || currentKB.provider_type}
                    </Badge>
                    <Badge variant={currentKB.status === "ready" ? "secondary" : currentKB.status === "failed" ? "destructive" : "outline"} className="text-xs">
                      {STATUS_LABELS[currentKB.status] || currentKB.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {currentKB.file_count} 文件 · {currentKB.chunk_count} 分片
                    </span>
                  </div>
                  {currentKB.description && (
                    <p className="text-sm text-muted-foreground mt-1">{currentKB.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(currentKB)}>
                    <Edit className="w-4 h-4 mr-1" /> 编辑
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(currentKB)} className="text-destructive">
                    <Trash2 className="w-4 h-4 mr-1" /> 删除
                  </Button>
                  <Button variant="ghost" size="icon" onClick={fetchKnowledgeBases}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList className="mx-4 mt-2 w-auto justify-start">
                <TabsTrigger value="overview" className="gap-1"><Folder className="w-3.5 h-3.5" /> 概览</TabsTrigger>
                <TabsTrigger value="files" className="gap-1"><FileText className="w-3.5 h-3.5" /> 文件</TabsTrigger>
                <TabsTrigger value="retrieve" className="gap-1"><TestTube className="w-3.5 h-3.5" /> 检索测试</TabsTrigger>
                <TabsTrigger value="qa" className="gap-1"><MessageSquare className="w-3.5 h-3.5" /> 知识问答</TabsTrigger>
                <TabsTrigger value="logs" className="gap-1"><Activity className="w-3.5 h-3.5" /> 调用记录</TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto p-4">
                {/* Overview Tab */}
                <TabsContent value="overview" className="mt-0 h-full">
                  <div className="grid grid-cols-2 gap-4 max-w-lg">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-xs text-muted-foreground mb-1">文件数量</div>
                        <div className="text-2xl font-semibold">{currentKB.file_count}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-xs text-muted-foreground mb-1">分片数量</div>
                        <div className="text-2xl font-semibold">{currentKB.chunk_count}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-xs text-muted-foreground mb-1">Provider类型</div>
                        <div className="text-lg font-semibold">{PROVIDER_LABELS[currentKB.provider_type] || currentKB.provider_type}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-xs text-muted-foreground mb-1">状态</div>
                        <div className="text-lg font-semibold">{STATUS_LABELS[currentKB.status] || currentKB.status}</div>
                      </CardContent>
                    </Card>
                  </div>
                  {currentKB.provider_type === "local" ? (
                    <div className="mt-4 space-y-2 text-sm max-w-lg">
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="text-muted-foreground">Chroma配置</span>
                        <span>{currentKB.chroma_config?.name || "-"}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="text-muted-foreground">Embedding模型</span>
                        <span>{currentKB.embedding_model?.name || "-"}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="text-muted-foreground">Rerank模型</span>
                        <span>{currentKB.rerank_model?.name || "-"}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="text-muted-foreground">分片大小</span>
                        <span>{currentKB.chunk_size}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="text-muted-foreground">分片重叠</span>
                        <span>{currentKB.chunk_overlap}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-2 text-sm max-w-lg">
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="text-muted-foreground">Dify Provider</span>
                        <span>{currentKB.dify_provider?.name || "-"}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-border">
                        <span className="text-muted-foreground">Dataset ID</span>
                        <span className="font-mono text-xs">{currentKB.dify_dataset_id || "-"}</span>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Files Tab */}
                <TabsContent value="files" className="mt-0">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium">知识文件</h3>
                    <div>
                      <input ref={fileInputRef} type="file" onChange={handleFileUpload} className="hidden" />
                      <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Upload className="w-4 h-4 mr-1" />}
                        上传文件
                      </Button>
                    </div>
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
                    <div className="space-y-2">
                      {files.map(f => (
                        <Card key={f.id}>
                          <CardContent className="p-3 flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">{f.original_filename || `文件 #${f.file_id}`}</div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant={f.parse_status === "ready" ? "secondary" : f.parse_status === "failed" ? "destructive" : "outline"} className="text-[10px]">
                                  {FILE_STATUS_LABELS[f.parse_status] || f.parse_status}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground">
                                  {f.file_size ? `${(f.file_size / 1024).toFixed(1)} KB` : ""}
                                </span>
                                <span className="text-[10px] text-muted-foreground">{f.chunk_count} 分片</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 ml-2">
                              <Button variant="ghost" size="sm" onClick={() => openChunkDialog(f.id)} title="查看分片">
                                <Zap className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => openDeleteFileDialog(f.id)} title="删除">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Retrieve Test Tab */}
                <TabsContent value="retrieve" className="mt-0 h-full">
                  <div className="max-w-2xl h-full flex flex-col">
                    <div className="flex gap-2 mb-4 shrink-0">
                      <Input
                        value={retrieveQuery}
                        onChange={e => setRetrieveQuery(e.target.value)}
                        placeholder="输入查询内容..."
                        className="flex-1"
                        onKeyDown={e => e.key === "Enter" && handleRetrieveTest()}
                      />
                      <Input value={retrieveTopK} onChange={e => setRetrieveTopK(e.target.value)} placeholder="Top K" className="w-20" type="number" min={1} max={50} />
                      <Button onClick={handleRetrieveTest} disabled={retrieveLoading}>
                        {retrieveLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
                      </Button>
                    </div>
                    {retrieveResult && (
                      <div className="space-y-3 overflow-y-auto flex-1 min-h-0">
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
                </TabsContent>

                {/* QA Tab */}
                <TabsContent value="qa" className="mt-0 h-full">
                  <div className="max-w-2xl h-full flex flex-col">
                    <div className="flex gap-2 mb-4 shrink-0">
                      <Input
                        value={qaQuery}
                        onChange={e => setQaQuery(e.target.value)}
                        placeholder="输入问题..."
                        className="flex-1"
                        onKeyDown={e => e.key === "Enter" && handleQA()}
                      />
                      <Input value={qaTopK} onChange={e => setQaTopK(e.target.value)} placeholder="Top K" className="w-20" type="number" min={1} max={20} />
                      <Select value={selectedLLMModel} onValueChange={setSelectedLLMModel}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="选择LLM模型" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">自动选择</SelectItem>
                          {llmModels.map(m => (
                            <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button onClick={handleQA} disabled={qaLoading}>
                        {qaLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                      </Button>
                    </div>
                    {qaResult && (
                      <div className="space-y-4 overflow-y-auto flex-1 min-h-0">
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
                </TabsContent>

                {/* Logs Tab */}
                <TabsContent value="logs" className="mt-0">
                  {logsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : logs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">暂无调用记录</div>
                  ) : (
                    <div className="space-y-2">
                      {logs.map(log => (
                        <Card key={log.id}>
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium truncate flex-1">{log.query}</span>
                              <Badge variant={log.status === "success" ? "secondary" : "destructive"} className="text-[10px] ml-2">
                                {log.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span>{log.retrieval_type}</span>
                              <span>{log.results_count} 结果</span>
                              <span>{log.latency_ms}ms</span>
                              <span>{new Date(log.created_at).toLocaleString()}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {logTotalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-4">
                          <Button variant="outline" size="sm" onClick={() => currentKB && fetchLogs(currentKB.id, logPage - 1)} disabled={logPage === 1}>
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          <span className="text-sm text-muted-foreground">{logPage} / {logTotalPages}</span>
                          <Button variant="outline" size="sm" onClick={() => currentKB && fetchLogs(currentKB.id, logPage + 1)} disabled={logPage === logTotalPages}>
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <Folder className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>选择一个知识库</p>
            </div>
          </div>
        )}
      </div>

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
                <Select value={form.provider_type} onValueChange={(v: "local" | "dify") => {
                  setForm(prev => ({ ...prev, provider_type: v, chroma_config_id: "", dify_provider_id: "", embedding_model_id: "", rerank_model_id: "" }))
                  setDifyAvailableModels([])
                }}>
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
                      <p className="text-xs text-destructive">暂无可用Chroma配置，请联系管理员添加</p>
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
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Trash2 className="w-4 h-4 mr-1" />}
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sync Dialog */}
      <Dialog open={syncDialogOpen} onOpenChange={setSyncDialogOpen}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={e => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>同步Dify知识库</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Dify Provider</Label>
              <Select value={form.dify_provider_id} onValueChange={v => setForm(prev => ({ ...prev, dify_provider_id: v }))}>
                <SelectTrigger><SelectValue placeholder="选择Provider" /></SelectTrigger>
                <SelectContent>
                  {difyProviders.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {syncResult && (
              <div className="bg-muted p-3 rounded-lg text-sm">
                <p>同步完成：共发现 <strong>{syncResult.total_datasets}</strong> 个Dify知识库</p>
                <p>新增同步：<strong>{syncResult.synced_count}</strong> 个</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSyncDialogOpen(false)}>关闭</Button>
            <Button onClick={handleSync} disabled={syncing || !form.dify_provider_id}>
              {syncing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <RefreshCw className="w-4 h-4 mr-1" />}
              开始同步
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
