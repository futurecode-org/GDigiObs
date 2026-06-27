import { useState } from "react"
import {
  AreaChart, Area, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts"
import { Sparkles, Send, Plus, Terminal, Download, ChevronDown } from "lucide-react"
import { cn } from "@/shared/utils"
import { Card, Btn } from "@/shared/ui"
import { queryExamples, queryResult } from "@/shared/mockData"

export function QueryPage() {
  const [asked, setAsked] = useState(false)
  const [input, setInput] = useState("")
  const [showSQL, setShowSQL] = useState(false)
  const [loading, setLoading] = useState(false)
  const [chartType, setChartType] = useState<"area" | "bar" | "table">("area")

  const ask = (q?: string) => {
    const question = q || input
    if (!question.trim()) return
    setLoading(true)
    setInput(question)
    setTimeout(() => { setLoading(false); setAsked(true) }, 1200)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border px-6 py-4">
        <h2 className="text-base font-semibold">智能问数</h2>
        <p className="text-xs text-muted-foreground mt-0.5">用自然语言查询您权限范围内的数据</p>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: History */}
        <div className="w-56 border-r border-border flex flex-col flex-shrink-0">
          <div className="p-3 border-b border-border">
            <Btn size="xs" className="w-full justify-center"><Plus className="w-3.5 h-3.5" />新建对话</Btn>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {["今日查询 (3)", "本周查询 (12)", "本月查询 (47)"].map((g, i) => (
              <div key={i}>
                <div className="text-[10px] text-muted-foreground px-2 py-1.5 uppercase tracking-wider">{g}</div>
                {queryExamples.slice(0, 2).map((q, j) => (
                  <button key={j} onClick={() => ask(q)} className="w-full text-left px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary rounded truncate transition-colors">
                    {q}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Query Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!asked ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-medium">向数据提问</h3>
                <p className="text-sm text-muted-foreground max-w-md">系统将自动识别数据源，生成 SQL，执行查询并生成可视化图表</p>
              </div>
              <div className="grid grid-cols-2 gap-2 max-w-lg w-full">
                {queryExamples.map((q, i) => (
                  <button key={i} onClick={() => ask(q)} className="text-left px-3 py-2.5 text-xs text-muted-foreground bg-card border border-border rounded-lg hover:border-primary/40 hover:text-foreground transition-all">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
                <p className="text-sm text-muted-foreground">正在生成 SQL 并查询数据...</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Question */}
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary font-semibold flex-shrink-0">我</div>
                <div className="bg-primary text-primary-foreground rounded-lg px-3 py-2 text-sm">{input}</div>
              </div>

              {/* Answer */}
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div className="flex-1 space-y-4">
                  <p className="text-sm text-foreground">{queryResult.explanation}</p>

                  {/* SQL Toggle */}
                  <div>
                    <button onClick={() => setShowSQL(!showSQL)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                      <Terminal className="w-3.5 h-3.5" />
                      {showSQL ? "隐藏" : "查看"} 生成的 SQL
                      <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", showSQL && "rotate-180")} />
                    </button>
                    {showSQL && (
                      <Card className="mt-2 overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted">
                          <span className="text-xs text-muted-foreground font-mono">generated.sql</span>
                          <Btn variant="ghost" size="xs"><Download className="w-3.5 h-3.5" /></Btn>
                        </div>
                        <pre className="p-4 text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed">{queryResult.sql}</pre>
                      </Card>
                    )}
                  </div>

                  {/* Chart Controls */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">图表类型：</span>
                    {(["area", "bar", "table"] as const).map(t => (
                      <button key={t} onClick={() => setChartType(t)} className={cn("text-xs px-2 py-1 rounded transition-colors",
                        chartType === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground bg-muted"
                      )}>
                        {t === "area" ? "折线图" : t === "bar" ? "柱状图" : "表格"}
                      </button>
                    ))}
                    <Btn variant="outline" size="xs" className="ml-auto"><Download className="w-3.5 h-3.5" />导出</Btn>
                  </div>

                  {/* Chart */}
                  <Card className="p-4">
                    {chartType !== "table" ? (
                      <ResponsiveContainer width="100%" height={220}>
                        {chartType === "area" ? (
                          <AreaChart data={queryResult.data}>
                            <defs>
                              <linearGradient id="qp-gradC" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4f84f5" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#4f84f5" stopOpacity={0} />
                              </linearGradient>
                              <linearGradient id="qp-gradCl" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(79,132,245,0.08)" />
                            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#5a7098" }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: "#5a7098" }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ background: "#0c1628", border: "1px solid rgba(79,132,245,0.2)", borderRadius: 6, fontSize: 12, color: "#dde5f5" }} />
                            <Area type="monotone" dataKey="collected" stroke="#4f84f5" fill="url(#qp-gradC)" name="采集量" strokeWidth={2} />
                            <Area type="monotone" dataKey="cleaned" stroke="#10b981" fill="url(#qp-gradCl)" name="清洗量" strokeWidth={2} />
                          </AreaChart>
                        ) : (
                          <BarChart data={queryResult.data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(79,132,245,0.08)" />
                            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#5a7098" }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: "#5a7098" }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ background: "#0c1628", border: "1px solid rgba(79,132,245,0.2)", borderRadius: 6, fontSize: 12, color: "#dde5f5" }} />
                            <Bar dataKey="collected" fill="#4f84f5" radius={[3, 3, 0, 0]} name="采集量" />
                            <Bar dataKey="cleaned" fill="#10b981" radius={[3, 3, 0, 0]} name="清洗量" />
                          </BarChart>
                        )}
                      </ResponsiveContainer>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-border">
                              {["日期", "采集量", "清洗量", "分析量"].map(h => (
                                <th key={h} className="text-left py-2 px-3 text-muted-foreground font-medium">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {queryResult.data.map((row, i) => (
                              <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                                <td className="py-2 px-3 font-mono text-muted-foreground">{row.date}</td>
                                <td className="py-2 px-3 font-mono text-foreground">{row.collected.toLocaleString()}</td>
                                <td className="py-2 px-3 font-mono text-foreground">{row.cleaned.toLocaleString()}</td>
                                <td className="py-2 px-3 font-mono text-foreground">{row.analyzed.toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* Input */}
          <div className="flex-shrink-0 border-t border-border p-4">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && ask()}
                className="flex-1 bg-input-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                placeholder="输入问题，例如：过去7天的采集数据量趋势..."
              />
              <Btn onClick={() => ask()} disabled={!input.trim()}>
                <Send className="w-4 h-4" /> 问数
              </Btn>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
