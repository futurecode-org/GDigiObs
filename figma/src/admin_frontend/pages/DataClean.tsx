import { Plus, Database, CheckCircle, AlertTriangle, Wrench, Radio, Eye, ChevronRight } from "lucide-react"
import { cn } from "@/shared/utils"
import { Badge, StatCard, SectionHeader, Card, Btn } from "@/shared/ui"
import { cleanRules } from "@/shared/mockData"

export function DataCleanPage() {
  return (
    <div className="p-6 space-y-5 h-full overflow-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">数据清洗</h2>
          <p className="text-xs text-muted-foreground mt-0.5">配置清洗规则，对采集数据进行标准化处理</p>
        </div>
        <Btn size="sm"><Plus className="w-4 h-4" />新建清洗规则</Btn>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <StatCard label="今日清洗量" value="12,530" icon={Database} color="primary" trend={8} />
        <StatCard label="清洗成功率" value="94.3%" icon={CheckCircle} color="success" />
        <StatCard label="异常数据" value="234" icon={AlertTriangle} color="warning" />
        <StatCard label="活跃规则" value="3" icon={Wrench} color="info" />
      </div>

      <div className="space-y-3">
        {cleanRules.map(r => (
          <Card key={r.id} className="p-4 hover:border-primary/25 transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                <Wrench className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{r.name}</span>
                  <Badge variant={r.status === "enabled" ? "success" : "muted"}>{r.status === "enabled" ? "启用" : "停用"}</Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-1">绑定任务：{r.tasks.join("、")}</div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {r.caps.map(c => (
                    <span key={c} className="px-2 py-0.5 bg-secondary text-muted-foreground text-[10px] rounded border border-border">{c}</span>
                  ))}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xs text-muted-foreground">已清洗</div>
                <div className="text-base font-semibold font-mono text-foreground">{r.cleaned.toLocaleString()}</div>
                <div className="text-[10px] text-muted-foreground mt-1">{r.lastRun.slice(5)}</div>
              </div>
              <div className="flex flex-col gap-1 flex-shrink-0">
                <Btn variant="primary" size="xs"><Radio className="w-3.5 h-3.5" />执行清洗</Btn>
                <Btn variant="ghost" size="xs"><Eye className="w-3.5 h-3.5" />查看日志</Btn>
                <Btn variant="ghost" size="xs"><Wrench className="w-3.5 h-3.5" />编辑规则</Btn>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Pipeline viz */}
      <Card className="p-4">
        <SectionHeader title="清洗流程示意" />
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {["原始数据", "去重过滤", "格式标准化", "字段映射", "实体识别", "情感分析", "分类打标", "异常检测", "清洗完成"].map((step, i, arr) => (
            <div key={step} className="flex items-center gap-2 flex-shrink-0">
              <div className={cn("px-3 py-2 rounded-lg text-xs text-center border min-w-[80px]",
                i === 0 ? "bg-muted border-border text-muted-foreground" :
                i === arr.length - 1 ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400" :
                "bg-primary/10 border-primary/20 text-primary"
              )}>
                {step}
              </div>
              {i < arr.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
