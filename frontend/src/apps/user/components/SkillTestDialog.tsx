import { useState } from "react"
import { Play, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { skillApi } from "@/lib/api"
import { toast } from "sonner"

interface SkillTestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  skillId: number | null
  skillName: string
}

export function SkillTestDialog({
  open,
  onOpenChange,
  skillId,
  skillName,
}: SkillTestDialogProps) {
  const [inputJson, setInputJson] = useState('{}')
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<{
    success?: boolean
    output?: unknown
    message?: string
    duration_ms?: number
  } | null>(null)

  const handleTest = async () => {
    if (!skillId) return
    let inputData: Record<string, unknown> = {}
    try {
      inputData = JSON.parse(inputJson.trim() || "{}")
    } catch {
      toast.error("入参 JSON 格式错误")
      return
    }

    setIsRunning(true)
    setResult(null)
    try {
      const res = await skillApi.test(skillId, inputData)
      setResult(res)
      if (res.success) {
        toast.success("测试成功")
      } else {
        toast.error(res.message || "测试失败")
      }
    } catch (error: any) {
      toast.error(error.message || "测试失败")
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="w-4 h-4" />
            测试技能：{skillName}
          </DialogTitle>
          <DialogDescription>
            输入测试参数并执行，Function Call 将在受限环境中运行，MCP/Skill 仅校验配置。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="test-input">测试入参 (JSON)</Label>
            <Textarea
              id="test-input"
              value={inputJson}
              onChange={(e) => setInputJson(e.target.value)}
              placeholder='{"key": "value"}'
              className="min-h-24 font-mono text-xs"
            />
          </div>

          {result && (
            <div className="grid gap-2">
              <Label>测试结果</Label>
              <div
                className={`rounded-lg border p-3 text-xs font-mono ${
                  result.success
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                    : "border-red-200 bg-red-50 text-red-900"
                }`}
              >
                <div className="mb-1">
                  状态：{result.success ? "成功" : "失败"}
                  {result.duration_ms !== undefined && ` · 耗时 ${result.duration_ms}ms`}
                </div>
                {result.message && <div className="mb-1">{result.message}</div>}
                {result.output !== undefined && (
                  <pre className="mt-2 max-h-48 overflow-auto rounded bg-white/60 p-2">
                    {JSON.stringify(result.output, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isRunning}>
            关闭
          </Button>
          <Button onClick={handleTest} disabled={isRunning}>
            {isRunning && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
            执行测试
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
