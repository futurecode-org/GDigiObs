import { useEffect, useState } from "react"
import { Wand2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { skillApi, modelApi } from "@/lib/api"
import type { Skill, ModelConfig } from "@/lib/types"
import { toast } from "sonner"

export type SkillType = "function_call" | "mcp" | "skill"

interface SkillFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  skill?: Skill | null
  defaultType?: SkillType
  onSuccess?: () => void
}

const typeLabels: Record<SkillType, string> = {
  function_call: "Function Call",
  mcp: "MCP",
  skill: "Skill",
}

const visibilityOptions = [
  { value: "personal", label: "个人" },
  { value: "tenant", label: "租户" },
  { value: "public", label: "公开" },
]

const runtimeLanguageOptions = [
  { value: "python", label: "Python" },
  { value: "javascript", label: "JavaScript" },
]

const startupMethodOptions = [
  { value: "npx", label: "NPX" },
  { value: "uvx", label: "UVX" },
]

const importMethodOptions = [
  { value: "npx", label: "NPX 安装" },
  { value: "markdown", label: "Markdown 导入" },
]

function safeJsonStringify(value: unknown): string {
  if (value === undefined || value === null) return ""
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return ""
  }
}

function safeJsonParse(value: string): unknown {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  try {
    return JSON.parse(trimmed)
  } catch (e) {
    throw new Error("JSON 格式错误")
  }
}

export function SkillFormDialog({
  open,
  onOpenChange,
  skill,
  defaultType = "function_call",
  onSuccess,
}: SkillFormDialogProps) {
  const isEdit = !!skill
  const [skillType, setSkillType] = useState<SkillType>(defaultType)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [inputSchema, setInputSchema] = useState("")
  const [outputSchema, setOutputSchema] = useState("")
  const [runtimeLanguage, setRuntimeLanguage] = useState("python")
  const [codeContent, setCodeContent] = useState("")
  const [timeout, setTimeoutValue] = useState("30")
  const [visibility, setVisibility] = useState("personal")
  const [status, setStatus] = useState(true)
  const [modelId, setModelId] = useState<string>("")
  const [mcpStartupMethod, setMcpStartupMethod] = useState("npx")
  const [mcpCommand, setMcpCommand] = useState("")
  const [mcpArgs, setMcpArgs] = useState("")
  const [mcpEnv, setMcpEnv] = useState("")
  const [mcpTools, setMcpTools] = useState("")
  const [skillImportMethod, setSkillImportMethod] = useState("npx")
  const [entryDescription, setEntryDescription] = useState("")
  const [models, setModels] = useState<ModelConfig[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setIsLoading(true)
      modelApi
        .getList({ model_type: "llm", page_size: 100 })
        .then((res) => setModels(res.items))
        .catch(() => setModels([]))
        .finally(() => setIsLoading(false))
    }
  }, [open])

  useEffect(() => {
    if (skill) {
      setSkillType(skill.type as SkillType)
      setName(skill.name)
      setDescription(skill.description || "")
      setInputSchema(safeJsonStringify(skill.input_schema))
      setOutputSchema(safeJsonStringify(skill.output_schema))
      setVisibility(skill.visibility)
      setStatus(skill.status === "enabled")
      setModelId(skill.model_id ? String(skill.model_id) : "")

      const config = (skill.config || {}) as Record<string, unknown>
      if (skill.type === "function_call") {
        setRuntimeLanguage((config.runtime_language as string) || "python")
        setCodeContent((config.code_content as string) || "")
        setTimeoutValue(String(config.timeout || "30"))
      } else if (skill.type === "mcp") {
        setMcpStartupMethod((config.startup_method as string) || "npx")
        setMcpCommand((config.command as string) || "")
        setMcpArgs(safeJsonStringify(config.args))
        setMcpEnv(safeJsonStringify(config.env))
        setMcpTools(safeJsonStringify(config.tools))
      } else if (skill.type === "skill") {
        setSkillImportMethod((config.import_method as string) || "npx")
        setEntryDescription((config.entry_description as string) || "")
      }
    } else {
      // reset
      setSkillType(defaultType)
      setName("")
      setDescription("")
      setInputSchema("")
      setOutputSchema("")
      setRuntimeLanguage("python")
      setCodeContent("")
      setTimeoutValue("30")
      setVisibility("personal")
      setStatus(true)
      setModelId("")
      setMcpStartupMethod("npx")
      setMcpCommand("")
      setMcpArgs("")
      setMcpEnv("")
      setMcpTools("")
      setSkillImportMethod("npx")
      setEntryDescription("")
    }
  }, [skill, defaultType, open])

  const buildPayload = (): Record<string, unknown> => {
    const base = {
      name,
      type: skillType,
      description,
      visibility,
      status: status ? "enabled" : "disabled",
      model_id: modelId ? Number(modelId) : undefined,
    }

    if (skillType === "function_call") {
      return {
        ...base,
        input_schema: safeJsonParse(inputSchema),
        output_schema: safeJsonParse(outputSchema),
        config: {
          runtime_language: runtimeLanguage,
          code_content: codeContent,
          timeout: Number(timeout) || 30,
        },
      }
    }

    if (skillType === "mcp") {
      return {
        ...base,
        config: {
          import_method: "json",
          startup_method: mcpStartupMethod,
          command: mcpCommand,
          args: safeJsonParse(mcpArgs),
          env: safeJsonParse(mcpEnv),
          tools: safeJsonParse(mcpTools),
        },
      }
    }

    return {
      ...base,
      config: {
        import_method: skillImportMethod,
        entry_description: entryDescription,
      },
    }
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("请输入技能名称")
      return
    }

    try {
      buildPayload()
    } catch (e: any) {
      toast.error(e.message || "配置格式错误")
      return
    }

    setIsSaving(true)
    try {
      const payload = buildPayload()
      if (isEdit && skill) {
        await skillApi.update(skill.id, payload)
        toast.success("技能已更新")
      } else {
        await skillApi.create(payload)
        toast.success("技能已创建")
      }
      onSuccess?.()
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || "保存失败")
    } finally {
      setIsSaving(false)
    }
  }

  const typeSelector = (
    <div className="grid gap-2">
      <Label>技能类型</Label>
      <Tabs value={skillType} onValueChange={(v) => setSkillType(v as SkillType)}>
        <TabsList className="grid w-full grid-cols-3">
          {(Object.keys(typeLabels) as SkillType[]).map((t) => (
            <TabsTrigger key={t} value={t} disabled={isEdit}>
              {typeLabels[t]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  )

  const commonFields = (
    <>
      <div className="grid gap-2">
        <Label htmlFor="skill-name">技能名称</Label>
        <Input
          id="skill-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="请输入技能名称"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="skill-description">描述</Label>
        <Textarea
          id="skill-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="给模型或用户理解的描述"
          className="min-h-20"
        />
      </div>
    </>
  )

  const visibilityAndStatus = (
    <div className="grid grid-cols-2 gap-4">
      <div className="grid gap-2">
        <Label>可见范围</Label>
        <Select value={visibility} onValueChange={setVisibility}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {visibilityOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label>状态</Label>
        <div className="flex h-8 items-center gap-2">
          <Switch checked={status} onCheckedChange={setStatus} />
          <span className="text-sm text-muted-foreground">
            {status ? "启用" : "停用"}
          </span>
        </div>
      </div>
    </div>
  )

  const modelBinding = (
    <div className="grid gap-2">
      <Label>绑定模型</Label>
      <Select value={modelId} onValueChange={setModelId}>
      <SelectTrigger>
          <SelectValue placeholder="选择模型（可选）" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">不绑定</SelectItem>
          {models.map((m) => (
            <SelectItem key={m.id} value={String(m.id)}>
              {m.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )

  const functionCallFields = (
    <>
      {commonFields}
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="input-schema">入参 Schema (JSON)</Label>
          <Textarea
            id="input-schema"
            value={inputSchema}
            onChange={(e) => setInputSchema(e.target.value)}
            placeholder='{"type": "object", "properties": {...}}'
            className="min-h-24 font-mono text-xs"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="output-schema">出参 Schema (JSON)</Label>
          <Textarea
            id="output-schema"
            value={outputSchema}
            onChange={(e) => setOutputSchema(e.target.value)}
            placeholder='{"type": "object", "properties": {...}}'
            className="min-h-24 font-mono text-xs"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>运行语言</Label>
          <Select value={runtimeLanguage} onValueChange={setRuntimeLanguage}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {runtimeLanguageOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="timeout">超时时间（秒）</Label>
          <Input
            id="timeout"
            type="number"
            min={1}
            max={300}
            value={timeout}
            onChange={(e) => setTimeoutValue(e.target.value)}
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="code-content">代码内容</Label>
        <Textarea
          id="code-content"
          value={codeContent}
          onChange={(e) => setCodeContent(e.target.value)}
          placeholder={
            runtimeLanguage === "python"
              ? "# Python 代码，最后需打印 JSON 结果\nprint(result)"
              : "// JavaScript 代码，最后需输出 JSON 结果\nconsole.log(JSON.stringify(result));"
          }
          className="min-h-40 font-mono text-xs"
        />
      </div>
      {modelBinding}
      {visibilityAndStatus}
    </>
  )

  const mcpFields = (
    <>
      {commonFields}
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>导入方式</Label>
          <Input value="JSON 导入" disabled />
        </div>
        <div className="grid gap-2">
          <Label>启动方式</Label>
          <Select value={mcpStartupMethod} onValueChange={setMcpStartupMethod}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {startupMethodOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="mcp-command">命令 (command)</Label>
        <Input
          id="mcp-command"
          value={mcpCommand}
          onChange={(e) => setMcpCommand(e.target.value)}
          placeholder="例如：npx 或 uvx"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="mcp-args">参数 (args JSON 数组)</Label>
        <Textarea
          id="mcp-args"
          value={mcpArgs}
          onChange={(e) => setMcpArgs(e.target.value)}
          placeholder='["-y", "package-name"]'
          className="min-h-16 font-mono text-xs"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="mcp-env">环境变量 (env JSON)</Label>
        <Textarea
          id="mcp-env"
          value={mcpEnv}
          onChange={(e) => setMcpEnv(e.target.value)}
          placeholder='{"KEY": "value"}'
          className="min-h-16 font-mono text-xs"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="mcp-tools">工具列表 (tools JSON)</Label>
        <Textarea
          id="mcp-tools"
          value={mcpTools}
          onChange={(e) => setMcpTools(e.target.value)}
          placeholder='[{"name": "search", "description": "..."}]'
          className="min-h-24 font-mono text-xs"
        />
      </div>
      {visibilityAndStatus}
    </>
  )

  const skillFields = (
    <>
      {commonFields}
      <div className="grid gap-2">
        <Label>导入方式</Label>
        <Select value={skillImportMethod} onValueChange={setSkillImportMethod}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {importMethodOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="entry-description">入口说明</Label>
        <Textarea
          id="entry-description"
          value={entryDescription}
          onChange={(e) => setEntryDescription(e.target.value)}
          placeholder="执行入口或文档说明"
          className="min-h-24"
        />
      </div>
      {visibilityAndStatus}
    </>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="w-4 h-4" />
            {isEdit ? "编辑技能" : "创建技能"}
          </DialogTitle>
          <DialogDescription>
            配置技能基本信息与类型专属参数，保存后即可在智能问数、数字员工、工作流中调用。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {typeSelector}
          {skillType === "function_call" && functionCallFields}
          {skillType === "mcp" && mcpFields}
          {skillType === "skill" && skillFields}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isLoading}>
            {isSaving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
            {isEdit ? "保存" : "创建"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
