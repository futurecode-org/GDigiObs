import { useState } from "react"
import {
  AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts"
import { Plus, Download, Radio, BarChart2 } from "lucide-react"
import { cn } from "@/shared/utils"
import { Badge, SectionHeader, Card, Btn } from "@/shared/ui"
import { activityData, sentimentData, analysisTasksData, keywordData } from "@/shared/mockData"

export function DataAnalysisPage() {
  const [activeTask, setActiveTask] = useState<number | null>(1)
  const statusVariant: Record<string, "success" | "info" | "danger" | "muted"> = {
    success: "success", running: "info", failed: "danger", pending: "muted"
  }

  return (
    <div className="h-full flex overflow-hidden">
      {/* Left: Task List */}
      <div className="w-72 border-r border-border flex flex-col flex-shrink-0">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <span className="text-sm font-semibold">分析任务</span>
          <Btn size="xs"><Plus className="w-3.5 h-3.5" />新建</Btn>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {analysisTasksData.map(t => (
            <button key={t.id} onClick={() => setActiveTask(t.id)} className={cn(
              "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors",
              activeTask === t.id ? "bg-primary/15 border border-primary/25" : "hover:bg-secondary border border-transparent"
            )}>
              <div className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                t.status === "success" ? "bg-emerald-400" : t.status === "running" ? "bg-blue-400 animate-pulse" : "bg-red-400"
              )} />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-foreground font-medium">{t.name}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{t.type} · {t.source}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{t.lastRun.slice(5)}</div>
              </div>
              <Badge variant={statusVariant[t.status]}>{t.status === "success" ? "成功" : t.status === "running" ? "运行中" : "失败"}</Badge>
            </button>
          ))}
        </div>
      </div>

      {/* Right: Result */}
      <div className="flex-1 overflow-auto p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold">舆情情感趋势分析</h3>
            <p className="text-xs text-muted-foreground mt-0.5">数据源：微博舆情监控 · 最近7天 · 运行于 2026-06-26 13:00</p>
          </div>
          <div className="flex gap-2">
            <Btn variant="outline" size="sm"><Download className="w-4 h-4" />导出结果</Btn>
            <Btn variant="outline" size="sm"><BarChart2 className="w-4 h-4" />加入大屏</Btn>
            <Btn size="sm"><Radio className="w-4 h-4" />重新运行</Btn>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {sentimentData.map(s => (
            <Card key={s.name} className="p-4 text-center">
              <div className="text-2xl font-semibold font-mono" style={{ color: s.color }}>{s.value}%</div>
              <div className="text-xs text-muted-foreground mt-1">{s.name}内容</div>
            </Card>
          ))}
        </div>

        <Card className="p-4">
          <SectionHeader title="情感分布趋势（近7天）" />
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={activityData}>
              <defs>
                <linearGradient id="da-pos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="da-neg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(79,132,245,0.08)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#5a7098" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#5a7098" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#0c1628", border: "1px solid rgba(79,132,245,0.2)", borderRadius: 6, fontSize: 12, color: "#dde5f5" }} />
              <Area type="monotone" dataKey="messages" stroke="#10b981" fill="url(#da-pos)" name="正向" strokeWidth={2} />
              <Area type="monotone" dataKey="tasks" stroke="#ef4444" fill="url(#da-neg)" name="负向" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4">
          <SectionHeader title="热点关键词 Top 8" />
          <div className="space-y-2">
            {keywordData.map((k, i) => (
              <div key={k.word} className="flex items-center gap-3">
                <span className={cn("w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center flex-shrink-0",
                  i < 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>{i + 1}</span>
                <span className="text-sm text-foreground w-24 flex-shrink-0">{k.word}</span>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${(k.count / 4280) * 100}%` }} />
                </div>
                <span className="text-xs font-mono text-muted-foreground w-12 text-right">{k.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
