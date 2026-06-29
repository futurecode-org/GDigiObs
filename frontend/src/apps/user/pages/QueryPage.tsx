import { useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Search, History, TrendingUp, Copy, Check, Loader2 } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SectionHeader } from "@/shared/components/SectionHeader"
import { askApi } from "@/lib/api"
import type { AskRecord } from "@/lib/types"

const queryExamples = [
  "过去7天每日采集数据量与清洗数据量对比",
  "各平台负向情感数据占比统计",
  "本月活跃用户Top 10及消息数量",
  "近7天模型调用次数及Token消耗统计",
]

export function QueryPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const [result, setResult] = useState<AskRecord | null>(null)
  const [copied, setCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleQuery = useCallback(async () => {
    if (!query.trim()) return

    setIsLoading(true)
    setResult(null)
    try {
      const data = await askApi.create(query) as AskRecord
      setResult(data)
    } catch (error) {
      console.error("问数失败:", error)
    } finally {
      setIsLoading(false)
    }
  }, [query])

  const handleCopy = () => {
    if (result?.answer) {
      navigator.clipboard.writeText(result.answer)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const chartData = result?.result_data as Array<{ date: string; collected: number; cleaned: number }> || []

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <SectionHeader 
          title="智能问数" 
          action={<Button variant="outline" size="sm" onClick={() => navigate("/query-history")}><History className="w-4 h-4" /> 历史记录</Button>} 
        />
        <div className="flex gap-2 mt-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleQuery()}
              placeholder="输入你的问题，例如：过去7天每日采集数据量..."
              className="pl-9"
              disabled={isLoading}
            />
          </div>
          <Button onClick={handleQuery} disabled={isLoading}>
            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4" />}
            {isLoading ? "查询中..." : "查询"}
          </Button>
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
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin" />
              <p>AI 正在分析您的问题...</p>
            </div>
          </div>
        ) : result ? (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <SectionHeader title="查询结果" />
                <p className="text-sm text-foreground mb-3">{result.question}</p>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground">分析说明</span>
                    <Badge variant="secondary">{result.status === "completed" ? "查询成功" : result.status}</Badge>
                  </div>
                  <p className="text-sm text-foreground">{result.answer || "暂无分析结果"}</p>
                </div>
              </CardContent>
            </Card>

            {chartData.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-foreground">数据可视化</span>
                    <Button variant="ghost" size="xs"><TrendingUp className="w-3 h-3" /> 查看详情</Button>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData}>
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
            )}

            {result.data_source && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-foreground">数据来源</span>
                    <Button variant="ghost" size="xs" onClick={handleCopy}>
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied ? "已复制" : "复制"}
                    </Button>
                  </div>
                  <pre className="p-3 bg-muted/30 rounded-lg text-xs text-muted-foreground overflow-x-auto">
                    <code>{result.data_source}</code>
                  </pre>
                </CardContent>
              </Card>
            )}
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