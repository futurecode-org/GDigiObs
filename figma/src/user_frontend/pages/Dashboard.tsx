import {
  AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts"
import {
  Users, MessageSquare, Bot, Network, ClipboardList, TrendingUp,
  RefreshCw, Download, Hash, Bell, UserPlus, AlertTriangle
} from "lucide-react"
import { Sparkles } from "lucide-react"
import { cn } from "@/shared/utils"
import { Card, StatCard, SectionHeader, Badge, StatusDot, Btn } from "@/shared/ui"
import { activityData, queryExamples, agents } from "@/shared/mockData"

export function Dashboard() {
  return (
    <div className="p-6 space-y-6 overflow-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">个人大屏</h1>
          <p className="text-sm text-muted-foreground mt-0.5">你好，张伟 · 今日 2026-06-26</p>
        </div>
        <div className="flex items-center gap-2">
          <Btn variant="outline" size="sm"><RefreshCw className="w-3.5 h-3.5" />刷新</Btn>
          <Btn variant="outline" size="sm"><Download className="w-3.5 h-3.5" />导出</Btn>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="好友数量" value="48" icon={Users} color="primary" trend={2} />
        <StatCard label="群组数量" value="12" icon={Network} color="info" />
        <StatCard label="未读消息" value="4" icon={MessageSquare} color="warning" />
        <StatCard label="问数次数" value="63" sub="本月" icon={Sparkles} color="purple" trend={18} />
        <StatCard label="数字员工" value="3" sub="运行中" icon={Bot} color="success" />
        <StatCard label="待办任务" value="7" icon={ClipboardList} color="warning" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="col-span-2 p-4">
          <SectionHeader title="近7日活跃数据" />
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={activityData}>
              <defs>
                <linearGradient id="ud-gradMsg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f84f5" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4f84f5" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="ud-gradQuery" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(79,132,245,0.08)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#5a7098" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#5a7098" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#0c1628", border: "1px solid rgba(79,132,245,0.2)", borderRadius: 6, fontSize: 12, color: "#dde5f5" }} />
              <Area type="monotone" dataKey="messages" stroke="#4f84f5" fill="url(#ud-gradMsg)" name="消息数" strokeWidth={2} />
              <Area type="monotone" dataKey="queries" stroke="#06b6d4" fill="url(#ud-gradQuery)" name="问数次数" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-4">
          <SectionHeader title="最近问数记录" />
          <div className="space-y-3">
            {queryExamples.map((q, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <Hash className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">{q}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Agents + Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <SectionHeader title="数字员工状态" action={<Btn variant="ghost" size="xs">查看全部</Btn>} />
          <div className="space-y-3">
            {agents.slice(0, 3).map(a => (
              <div key={a.id} className="flex items-center gap-3 py-1">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-foreground">{a.name}</div>
                  <div className="text-xs text-muted-foreground">运行 {a.runs} 次 · 成功率 {a.successRate}%</div>
                </div>
                <StatusDot status={a.status} />
                <span className={cn("text-xs", a.status === "running" ? "text-blue-400" : "text-muted-foreground")}>{a.lastRun}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-4">
          <SectionHeader title="通知中心" action={<Badge variant="warning">2 条新通知</Badge>} />
          <div className="space-y-3">
            {[
              { icon: UserPlus, text: "李娜 接受了你的好友申请", time: "10分钟前", type: "success" },
              { icon: Bell, text: "数字员工「风险预警助手」执行完成", time: "28分钟前", type: "info" },
              { icon: MessageSquare, text: "「数据平台团队」有新消息", time: "1小时前", type: "default" },
              { icon: AlertTriangle, text: "知识库「数据采集规范」索引构建中", time: "2小时前", type: "warning" },
            ].map((n, i) => (
              <div key={i} className="flex items-start gap-3 py-1">
                <div className={cn("w-7 h-7 rounded flex items-center justify-center flex-shrink-0",
                  n.type === "success" ? "bg-emerald-500/10 text-emerald-400" :
                  n.type === "warning" ? "bg-amber-500/10 text-amber-400" :
                  n.type === "info" ? "bg-cyan-500/10 text-cyan-400" :
                  "bg-primary/10 text-primary"
                )}>
                  <n.icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-foreground">{n.text}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{n.time}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
