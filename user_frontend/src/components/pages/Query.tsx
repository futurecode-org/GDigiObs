import { useState } from "react"
import { Search, Send, History, BookOpen, Code, FileText, TrendingUp, RefreshCw, Copy, Check } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card } from "@/components/shared/Card"
import { Badge } from "@/components/shared/Badge"
import { SectionHeader } from "@/components/shared/SectionHeader"
import { queryExamples, queryResult, collectStats } from "@/lib/mockData"

export function QueryPage() {
  const [query, setQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showResult, setShowResult] = useState(true)
  const [copied, setCopied] = useState(false)

  const handleSubmit = () => {
    if (!query.trim()) return
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      setShowResult(true)
    }, 1500)
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <Card className="p-6">
        <SectionHeader title="智能问数" action={<Badge variant="muted">SQL 自动生成</Badge>} />
        <div className="relative mt-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <textarea
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="输入自然语言查询数据，例如：&#10;过去7天每日采集数据量与清洗数据量对比&#10;本月活跃用户Top 10及消息数量"
            className="w-full pl-12 pr-40 py-4 bg-muted border border-transparent rounded-xl text-sm resize-none focus:outline-none focus:border-primary transition-colors min-h-[100px]"
            onKeyDown={e => e.key === "Enter" && e.ctrlKey && handleSubmit()}
          />
          <button
            onClick={handleSubmit}
            disabled={!query.trim() || isLoading}
            className="absolute right-3 bottom-3 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {isLoading ? "查询中..." : "执行查询"}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground">快捷示例：</span>
          {queryExamples.map((ex, i) => (
            <button key={i} onClick={() => setQuery(ex)} className="px-3 py-1.5 bg-muted/50 text-xs text-muted-foreground rounded-md hover:bg-muted hover:text-foreground transition-colors">
              {ex}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-3 flex items-center gap-1">
          <History className="w-3 h-3" /> 按 Ctrl+Enter 快捷执行
        </p>
      </Card>

      {showResult && (
        <div className="space-y-6">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">查询结果</h3>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg mb-4">
              <p className="text-sm text-foreground">{queryResult.question}</p>
            </div>
            <p className="text-sm text-muted-foreground">{queryResult.explanation}</p>
          </Card>

          <div className="grid grid-cols-2 gap-6">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-semibold text-foreground">生成的 SQL</h3>
                </div>
                <button onClick={() => { navigator.clipboard.writeText(queryResult.sql); setCopied(true); setTimeout(() => setCopied(false), 2000) }} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                </button>
              </div>
              <pre className="p-3 bg-muted/30 rounded-lg text-xs font-mono text-foreground overflow-x-auto">{queryResult.sql}</pre>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-foreground">数据图表</h3>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={collectStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" />
                  <XAxis dataKey="date" className="text-xs text-muted-foreground" />
                  <YAxis className="text-xs text-muted-foreground" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "6px" }}
                  />
                  <Bar dataKey="collected" name="采集量" fill="#8B5CF6" />
                  <Bar dataKey="cleaned" name="清洗量" fill="#06B6D4" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-semibold text-foreground">数据明细</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">日期</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">采集量</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">清洗量</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">分析量</th>
                    <th className="text-right py-2 px-3 font-medium text-muted-foreground">清洗率</th>
                  </tr>
                </thead>
                <tbody>
                  {collectStats.map((row, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-2 px-3 text-foreground">{row.date}</td>
                      <td className="py-2 px-3 text-right font-mono text-foreground">{row.collected.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right font-mono text-foreground">{row.cleaned.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right font-mono text-foreground">{row.analyzed.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right font-mono text-emerald-400">{((row.cleaned / row.collected) * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}