import { useState } from "react"
import { Plus, Settings, Eye, EyeOff, Cpu, Sparkles, Zap, Brain, Search } from "lucide-react"
import { Card } from "@/components/shared/Card"
import { SectionHeader } from "@/components/shared/SectionHeader"
import { Badge } from "@/components/shared/Badge"
import { StatusDot } from "@/components/shared/StatusDot"
import { Btn } from "@/components/shared/Btn"
import { modelList } from "@/lib/mockData"

export function ModelManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("")

  const filteredModels = modelList.filter(model => {
    const matchSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchType = !filterType || model.type === filterType
    return matchSearch && matchType
  })

  const handleToggleModel = (modelId: number) => {
    console.log(`Toggle model ${modelId}`)
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <Card className="p-4 mb-4">
        <SectionHeader title="模型管理" action={<Btn onClick={() => alert("添加模型")}><Plus className="w-4 h-4" /> 添加模型</Btn>} />
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="搜索模型名称..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="px-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">全部类型</option>
            <option value="llm">大语言模型</option>
            <option value="embedding">嵌入模型</option>
          </select>
        </div>
      </Card>

      <div className="space-y-4">
        {filteredModels.map(model => (
          <Card key={model.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  {model.type === "llm" ? <Cpu className="w-6 h-6 text-primary" /> : <Sparkles className="w-6 h-6 text-primary" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-medium text-foreground">{model.name}</h3>
                    <Badge variant={model.type === "llm" ? "info" : "success"}>{model.type === "llm" ? "LLM" : "Embedding"}</Badge>
                    <Badge variant={model.visibility === "platform" ? "warning" : "muted"}>{model.visibility === "platform" ? "平台级" : "租户级"}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">API: {model.api.toUpperCase()} · Context: {(model.context / 1000).toFixed(0)}K</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Btn variant="ghost" onClick={() => alert(`配置模型 ${model.name}`)}><Settings className="w-4 h-4" /></Btn>
                <Btn variant={model.status === "enabled" ? "success" : "danger"} onClick={() => handleToggleModel(model.id)}>
                  {model.status === "enabled" ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Btn>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                <StatusDot status={model.status} />
                <span className="text-sm text-muted-foreground">{model.status === "enabled" ? "已启用" : "已停用"}</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-muted-foreground">工具调用</span>
                </div>
                {model.vision && (
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs text-muted-foreground">视觉能力</span>
                  </div>
                )}
                {model.tools && (
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-muted-foreground">函数调用</span>
                  </div>
                )}
                {model.reasoning && (
                  <div className="flex items-center gap-1.5">
                    <Brain className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs text-muted-foreground">推理能力</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredModels.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-sm text-muted-foreground">暂无模型</p>
          <Btn className="mt-4"><Plus className="w-4 h-4" /> 添加模型</Btn>
        </Card>
      )}
    </div>
  )
}