import { useState } from "react"
import { Search, History, TrendingUp, Copy, Check } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SectionHeader } from "@/shared/components/SectionHeader"
import { queryExamples, queryResult } from "@/lib/mockData"

export function QueryPage() {
  const [query, setQuery] = useState("")
  const [result, setResult] = useState<typeof queryResult | null>(null)
  const [copied, setCopied] = useState(false)

  const handleQuery = () => {
    if (query.trim()) {
      setResult(queryResult)
    }
  }

  const handleCopy = () => {
    if (result?.sql) {
      navigator.clipboard.writeText(result.sql)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <SectionHeader title="智能问数" action={<Button variant="outline" size="sm"><History className="w-4 h-4" /> 历史记录</Button>} />
        <div className="flex gap-2 mt-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleQuery()}
              placeholder="输入你的问题，例如：过去7天每日采集数据量..."
              className="w-full pl-9 pr-3 py-2.5 bg-muted border border-transparent rounded-lg text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <Button onClick={handleQuery}><Search className="w-4 h-4" /> 查询</Button>
        </div>
        <div className="flex gap-2 mt-2">
          {queryExamples.map((q, i) => (
            <button
              key={i}
              onClick={() => setQuery(q)}
              className="px-2 py-1 text-xs bg-muted/50 text-muted-foreground rounded hover:bg-muted transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {result ? (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <SectionHeader title="查询结果" />
                <p className="text-sm text-foreground mb-3">{result.question}</p>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground">分析说明</span>
                    <Badge variant="secondary">查询成功</Badge>
                  </div>
                  <p className="text-sm text-foreground">{result.explanation}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-foreground">数据可视化</span>
                  <Button variant="ghost" size="xs"><TrendingUp className="w-3 h-3" /> 查看详情</Button>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={result.data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" />
                    <XAxis dataKey="date" className="text-xs text-muted-foreground" />
                    <YAxis className="text-xs text-muted-foreground" />
                    <Tooltip contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "6px" }} />
                    <Bar dataKey="collected" name="采集量" fill="#06B6D4" />
                    <Bar dataKey="cleaned" name="清洗量" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-foreground">SQL 语句</span>
                  <Button variant="ghost" size="xs" onClick={handleCopy}>
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? "已复制" : "复制"}
                  </Button>
                </div>
                <pre className="p-3 bg-muted/30 rounded-lg text-xs text-muted-foreground overflow-x-auto">
                  <code>{result.sql}</code>
                </pre>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>输入问题开始智能问数</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
