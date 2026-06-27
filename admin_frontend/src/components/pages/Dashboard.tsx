import { Activity, Users, Database, MessageSquare, AlertTriangle } from "lucide-react"
import { StatCard } from "@/components/shared/StatCard"
import { Card } from "@/components/shared/Card"
import { SectionHeader } from "@/components/shared/SectionHeader"
import { Badge } from "@/components/shared/Badge"
import { StatusDot } from "@/components/shared/StatusDot"
import { Btn } from "@/components/shared/Btn"
import { activityData, sentimentData, collectStats, modelCallData, adminUsers, adminNotifications } from "@/lib/mockData"

export function AdminDashboard() {
  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="今日活跃用户" value="2,847" icon={Users} trend={12.5} color="primary" />
        <StatCard label="消息发送量" value="45,682" icon={MessageSquare} trend={8.3} color="success" />
        <StatCard label="数据采集量" value="13,290" icon={Database} trend={15.7} color="info" />
        <StatCard label="模型调用次数" value="19,680" icon={Activity} trend={-2.1} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-4">
            <SectionHeader title="数据概览" action={<Btn variant="ghost">查看详情</Btn>} />
            <div className="h-64">
              <div className="h-full flex items-end justify-between gap-2 px-2">
                {activityData.map(item => (
                  <div key={item.date} className="flex-1 flex flex-col items-center gap-2">
                    <div className="relative w-full flex items-end justify-center gap-0.5 h-48">
                      <div className="w-3 bg-primary/60 rounded-t" style={{ height: `${(item.messages / 300) * 100}%` }} />
                      <div className="w-3 bg-emerald-500/60 rounded-t" style={{ height: `${(item.queries / 70) * 100}%` }} />
                      <div className="w-3 bg-amber-500/60 rounded-t" style={{ height: `${(item.tasks / 30) * 100}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground">{item.date}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-primary/60 rounded" />
                  <span className="text-xs text-muted-foreground">消息数</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-emerald-500/60 rounded" />
                  <span className="text-xs text-muted-foreground">查询数</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-amber-500/60 rounded" />
                  <span className="text-xs text-muted-foreground">任务数</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-4">
          <SectionHeader title="情感分布" />
          <div className="h-64 flex items-center justify-center">
            <div className="relative w-48 h-48">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                {(() => {
                  let accumulatedAngle = 0
                  return sentimentData.map((curr, i) => {
                    const startAngle = accumulatedAngle
                    const endAngle = accumulatedAngle + (curr.value / 100) * 360
                    accumulatedAngle = endAngle
                    const startRad = (startAngle * Math.PI) / 180
                    const endRad = (endAngle * Math.PI) / 180
                    const x1 = 50 + 40 * Math.cos(startRad)
                    const y1 = 50 + 40 * Math.sin(startRad)
                    const x2 = 50 + 40 * Math.cos(endRad)
                    const y2 = 50 + 40 * Math.sin(endRad)
                    const largeArc = curr.value > 50 ? 1 : 0
                    return (
                      <g key={i}>
                        <path
                          d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                          fill={curr.color}
                          className="transition-all duration-300 hover:opacity-80"
                        />
                      </g>
                    )
                  })
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-foreground">100%</span>
                <span className="text-xs text-muted-foreground">总量</span>
              </div>
            </div>
          </div>
          <div className="space-y-2 mt-4 pt-4 border-t border-border">
            {sentimentData.map(item => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                </div>
                <span className="text-xs font-medium text-foreground">{item.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-4">
          <SectionHeader title="数据处理统计" />
          <div className="h-48 space-y-3">
            {collectStats.slice(-5).map(item => (
              <div key={item.date} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{item.date}</span>
                  <span className="text-foreground">{item.collected.toLocaleString()} 条</span>
                </div>
                <div className="h-4 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${(item.collected / 2500) * 100}%` }} />
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>清洗: {item.cleaned.toLocaleString()}</span>
                  <span>分析: {item.analyzed.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <SectionHeader title="模型调用排行" />
          <div className="space-y-3">
            {modelCallData.map((item, index) => (
              <div key={item.name} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${index === 0 ? "bg-amber-500/20 text-amber-400" : index === 1 ? "bg-slate-500/20 text-slate-400" : index === 2 ? "bg-amber-700/20 text-amber-600" : "bg-muted text-muted-foreground"}`}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{item.name}</div>
                  <div className="text-xs text-muted-foreground">{(item.tokens / 1000).toFixed(0)}K tokens</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-foreground">{(item.calls).toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">¥{item.cost}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <SectionHeader title="最近用户" action={<Btn variant="ghost">全部</Btn>} />
          <div className="space-y-2">
            {adminUsers.slice(0, 5).map(user => (
              <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-semibold text-primary">
                  {user.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground truncate">{user.name}</span>
                    <StatusDot status={user.status} />
                  </div>
                  <div className="text-xs text-muted-foreground">{user.role} · {user.loginAt}</div>
                </div>
                <Badge variant={user.role === "平台超级管理员" ? "warning" : user.role === "普通管理员" ? "info" : "muted"}>
                  {user.role}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <SectionHeader title="系统告警" action={<Btn variant="ghost">全部通知</Btn>} />
        <div className="space-y-2">
          {adminNotifications.slice(0, 5).map(notif => (
            <div key={notif.id} className={`flex items-start gap-3 p-3 rounded-lg ${notif.level === "high" ? "bg-red-500/10 border border-red-500/20" : notif.level === "medium" ? "bg-amber-500/10 border border-amber-500/20" : "bg-muted/30"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${notif.level === "high" ? "bg-red-500/20 text-red-400" : notif.level === "medium" ? "bg-amber-500/20 text-amber-400" : "bg-muted text-muted-foreground"}`}>
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{notif.title}</span>
                  {notif.level === "high" && <Badge variant="danger">紧急</Badge>}
                  {notif.level === "medium" && <Badge variant="warning">警告</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{notif.content}</p>
                <span className="text-[10px] text-muted-foreground font-mono">{notif.time}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}