import {
  GitBranch, Plus, Eye, Brain, Zap, BookOpen, Radio,
  UserCircle, Bell, CheckCircle
} from "lucide-react"
import { Card, Btn } from "@/shared/ui"

export function WorkflowPage() {
  return (
    <div className="p-6 space-y-5 h-full overflow-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">工作流</h2>
          <p className="text-xs text-muted-foreground mt-0.5">低代码可视化编排自动化任务</p>
        </div>
        <Btn size="sm"><Plus className="w-4 h-4" />新建工作流</Btn>
      </div>
      <Card className="p-10 flex flex-col items-center justify-center text-center border-dashed gap-4">
        <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <GitBranch className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-foreground">工作流编辑器</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            支持拖拽节点、条件分支、模型调用、技能节点、知识库检索等多种节点类型
          </p>
        </div>
        <div className="flex gap-2">
          <Btn size="sm" variant="outline"><Eye className="w-4 h-4" />查看示例</Btn>
          <Btn size="sm"><Plus className="w-4 h-4" />创建工作流</Btn>
        </div>
      </Card>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Radio, label: "触发器", desc: "定时/手动/Webhook" },
          { icon: Brain, label: "模型节点", desc: "调用 LLM" },
          { icon: Zap, label: "技能节点", desc: "Function/MCP" },
          { icon: BookOpen, label: "知识库节点", desc: "向量检索" },
          { icon: GitBranch, label: "条件判断", desc: "分支逻辑" },
          { icon: UserCircle, label: "人工审核", desc: "等待确认" },
          { icon: Bell, label: "消息推送", desc: "通知/邮件" },
          { icon: CheckCircle, label: "结束节点", desc: "流程终止" },
        ].map(n => (
          <div key={n.label} className="bg-card border border-border rounded-lg p-3 flex items-center gap-3 cursor-pointer hover:border-primary/30 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <n.icon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="text-xs font-medium text-foreground">{n.label}</div>
              <div className="text-[10px] text-muted-foreground">{n.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
