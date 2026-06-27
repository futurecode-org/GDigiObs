import {
  BarChart, Bar, PieChart, Pie, Cell,
  CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts"
import {
  Users, Database, Activity, Building2, Cpu, Hash, Bot, Siren,
  RefreshCw, AlertTriangle, Shield, CircleAlert, AlertCircle
} from "lucide-react"
import { cn } from "@/shared/utils"
import { Card, StatCard, SectionHeader, Badge } from "@/shared/ui"
import { collectStats, sentimentData, modelCallData } from "@/shared/mockData"
import { Btn } from "@/shared/ui"

export function AdminDashboard() {
  return (
    <div className="p-6 space-y-6 overflow-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">管理大屏</h1>
          <p className="text-sm text-muted-foreground mt-0.5">平台运营全局视图 · 数智科技</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="bg-input-background border border-border rounded px-2 py-1.5 text-xs text-foreground">
            <option>近 7 天</option>
            <option>近 30 天</option>
            <option>近 90 天</option>
          </select>
          <Btn variant="outline" size="sm"><RefreshCw className="w-3.5 h-3.5" />刷新</Btn>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-3">
        <StatCard label="注册用户数" value="12,480" icon={Users} color="primary" trend={8} />
        <StatCard label="活跃用户" value="3,241" sub="今日" icon={Activity} color="success" trend={12} />
        <StatCard label="租户数量" value="84" icon={Building2} color="info" />
        <StatCard label="采集数据量" value="2.4M" sub="总计" icon={Database} color="purple" trend={15} />
        <StatCard label="模型调用" value="19,680" sub="本周" icon={Cpu} color="warning" trend={22} />
        <StatCard label="Token 消耗" value="34.4M" sub="本周" icon={Hash} color="warning" />
        <StatCard label="敏感消息" value="127" sub="待处理 23" icon={Siren} color="danger" />
        <StatCard label="数字员工执行" value="516" sub="成功率 96.3%" icon={Bot} color="success" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="col-span-2 p-4">
          <SectionHeader title="采集数据趋势" action={
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary inline-block" />采集</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />清洗</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />分析</span>
            </div>
          } />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={collectStats} barSize={12} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(79,132,245,0.08)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#5a7098" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#5a7098" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#0c1628", border: "1px solid rgba(79,132,245,0.2)", borderRadius: 6, fontSize: 12, color: "#dde5f5" }} />
              <Bar dataKey="collected" fill="#4f84f5" radius={[2, 2, 0, 0]} name="采集" />
              <Bar dataKey="cleaned" fill="#10b981" radius={[2, 2, 0, 0]} name="清洗" />
              <Bar dataKey="analyzed" fill="#06b6d4" radius={[2, 2, 0, 0]} name="分析" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-4">
          <SectionHeader title="情感分布" />
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={sentimentData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                {sentimentData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#0c1628", border: "1px solid rgba(79,132,245,0.2)", borderRadius: 6, fontSize: 12, color: "#dde5f5" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5">
            {sentimentData.map(d => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                  <span className="text-muted-foreground">{d.name}</span>
                </div>
                <span className="font-mono text-foreground">{d.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Model Calls + Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <SectionHeader title="模型调用统计" />
          <div className="space-y-3">
            {modelCallData.map(m => (
              <div key={m.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-foreground">{m.name}</span>
                  <span className="font-mono text-muted-foreground">{m.calls.toLocaleString()} 次</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${(m.calls / 8420) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-4">
          <SectionHeader title="风险预警" action={<Badge variant="danger">高风险 2 条</Badge>} />
          <div className="space-y-3">
            {[
              { icon: Siren, text: "匿名用户发送违规内容已拦截", time: "14:58", level: "high" },
              { icon: AlertTriangle, text: "论坛采集任务连续失败 3 次", time: "13:42", level: "medium" },
              { icon: Shield, text: "测试账号B 违规内容已拦截", time: "12:55", level: "high" },
              { icon: CircleAlert, text: "陈磊账号涉黄内容待复核", time: "13:42", level: "medium" },
              { icon: AlertCircle, text: "新用户001 发送广告内容", time: "13:20", level: "low" },
            ].map((a, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={cn("w-7 h-7 rounded flex items-center justify-center flex-shrink-0",
                  a.level === "high" ? "bg-red-500/10 text-red-400" :
                  a.level === "medium" ? "bg-amber-500/10 text-amber-400" :
                  "bg-muted text-muted-foreground"
                )}>
                  <a.icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 text-xs text-foreground">{a.text}</div>
                <span className="text-[10px] text-muted-foreground font-mono">{a.time}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
