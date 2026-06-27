import { MessageSquare, Search, BookOpen, Wand2 } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts"
import { StatCard } from "@/shared/components/StatCard"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { SectionHeader } from "@/shared/components/SectionHeader"
import { activityData, sentimentData, contacts, myTasks, queryExamples } from "@/lib/mockData"

export function UserDashboard() {
  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="我的消息" value="128" icon={MessageSquare} trend={5.2} color="primary" />
        <StatCard label="智能问数" value="45" icon={Search} trend={12.3} color="info" />
        <StatCard label="知识库检索" value="23" icon={BookOpen} trend={-3.1} color="purple" />
        <StatCard label="技能调用" value="89" icon={Wand2} trend={8.7} color="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-4">
            <SectionHeader title="活动趋势" />
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
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
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
                  formatter={(value) => [`${value ?? 0}%`, "占比"]}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-4">
            <SectionHeader title="最近联系人" action={<button className="text-xs text-primary hover:underline">查看全部 →</button>} />
            <div className="space-y-2">
              {contacts.slice(0, 4).map(c => (
                <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/15 text-cyan-400 text-sm font-semibold flex items-center justify-center">
                      {c.name[0]}
                    </div>
                    {c.online && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-card" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{c.name}</span>
                      {c.online && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{c.lastMsg}</p>
                  </div>
                  {(c.unread ?? 0) > 0 && <Badge variant="destructive">{c.unread}</Badge>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <SectionHeader title="待处理任务" action={<button className="text-xs text-primary hover:underline">查看全部 →</button>} />
            <div className="space-y-3 mt-2">
              {myTasks.filter(t => t.status !== "success").slice(0, 3).map(t => (
                <div key={t.id} className="p-2 rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground truncate">{t.title}</span>
                    <Badge variant={t.status === "running" ? "outline" : "secondary"}>
                      {t.status === "running" ? "进行中" : "待处理"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${t.progress}%` }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{t.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <SectionHeader title="问数示例" />
            <div className="space-y-2">
              {queryExamples.slice(0, 4).map((q, i) => (
                <button
                  key={i}
                  className="w-full p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="flex items-start gap-2">
                    <Search className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <span className="text-xs text-foreground">{q}</span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
