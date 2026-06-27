import { useState } from "react"
import { MessageSquare, Search, BookOpen, Wand2, Clock, Send } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts"
import { StatCard } from "@/components/shared/StatCard"
import { Badge } from "@/components/shared/Badge"
import { Card } from "@/components/shared/Card"
import { SectionHeader } from "@/components/shared/SectionHeader"
import { cn } from "@/lib/utils"
import { activityData, sentimentData, contacts, myTasks, queryExamples, collectStats } from "@/lib/mockData"

export function UserDashboard() {
  const [quickQuery, setQuickQuery] = useState("")

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="今日消息" value="256" icon={MessageSquare} trend={12} color="primary" />
        <StatCard label="问数查询" value="47" icon={Search} trend={8} color="info" />
        <StatCard label="知识库文档" value="92" icon={BookOpen} trend={5} color="purple" />
        <StatCard label="技能调用" value="156" icon={Wand2} trend={-3} color="success" />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <Card className="p-4">
            <SectionHeader title="近7日活跃度" action={<Badge variant="muted">2026年6月</Badge>} />
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" />
                <XAxis dataKey="date" className="text-xs text-muted-foreground" />
                <YAxis className="text-xs text-muted-foreground" />
                <Tooltip 
                  contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "6px" }}
                  formatter={(value, name) => [`${value}`, name as string]}
                />
                <Legend />
                <Bar dataKey="messages" name="消息数" fill="#8B5CF6" />
                <Bar dataKey="queries" name="查询数" fill="#06B6D4" />
                <Bar dataKey="tasks" name="任务数" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <Card className="p-4">
          <SectionHeader title="情感分析分布" />
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={sentimentData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {sentimentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                  contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "6px" }}
                  formatter={(value, name) => [`${value}`, name as string]}
                />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="p-4">
          <SectionHeader title="智能问数" action={<button className="text-xs text-primary hover:underline">查看历史 →</button>} />
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="输入自然语言查询数据..."
              value={quickQuery}
              onChange={e => setQuickQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-muted border border-transparent rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {queryExamples.slice(0, 3).map((ex, i) => (
              <button key={i} onClick={() => setQuickQuery(ex)} className="px-2.5 py-1 bg-muted/50 text-xs text-muted-foreground rounded-md hover:bg-muted hover:text-foreground transition-colors">
                {ex}
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <SectionHeader title="最近联系人" action={<button className="text-xs text-primary hover:underline">全部 →</button>} />
          <div className="space-y-2 mt-2">
            {contacts.slice(0, 4).map(c => (
              <button key={c.id} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors text-left">
                <div className="w-8 h-8 rounded-full bg-primary/15 text-primary text-sm font-semibold flex items-center justify-center">
                  {c.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{c.name}</span>
                    {c.online && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{c.lastMsg}</p>
                </div>
                {(c.unread ?? 0) > 0 && <Badge variant="danger">{c.unread}</Badge>}
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <SectionHeader title="待处理任务" action={<button className="text-xs text-primary hover:underline">查看全部 →</button>} />
          <div className="space-y-3 mt-2">
            {myTasks.filter(t => t.status !== "success").slice(0, 3).map(t => (
              <div key={t.id} className="p-2 rounded-lg bg-muted/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground truncate">{t.title}</span>
                  <Badge variant={t.priority === "high" ? "danger" : t.priority === "medium" ? "warning" : "muted"}>
                    {t.priority === "high" ? "紧急" : t.priority === "medium" ? "中等" : "低"}
                  </Badge>
                </div>
                <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full", t.priority === "high" ? "bg-red-400" : t.priority === "medium" ? "bg-amber-400" : "bg-emerald-400")} style={{ width: `${t.progress}%` }} />
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">{t.due}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <SectionHeader title="数据采集概览" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">日期</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">采集量</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">清洗量</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground">分析量</th>
                <th className="text-center py-2 px-3 font-medium text-muted-foreground">状态</th>
              </tr>
            </thead>
            <tbody>
              {collectStats.slice(-5).map((row, i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="py-2 px-3 text-foreground">{row.date}</td>
                  <td className="py-2 px-3 text-right font-mono text-foreground">{row.collected.toLocaleString()}</td>
                  <td className="py-2 px-3 text-right font-mono text-foreground">{row.cleaned.toLocaleString()}</td>
                  <td className="py-2 px-3 text-right font-mono text-foreground">{row.analyzed.toLocaleString()}</td>
                  <td className="py-2 px-3 text-center">
                    <Badge variant="success">正常</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}