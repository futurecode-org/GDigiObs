import { useEffect, useRef, useState } from "react";
import { Brain, MessageSquare, Database, AlertTriangle, Play, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { dashboardApi, modelApi } from "../../../lib/api";
import type { ModelConfig, PublicOpinionAnalyzeResponse } from "../../../lib/types";

export function PublicOpinionPage() {
  const [dataSources, setDataSources] = useState<string[]>(["chat", "collect"]);
  const [days, setDays] = useState<number>(7);
  const [modelId, setModelId] = useState<string>("");
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<PublicOpinionAnalyzeResponse | null>(null);

  const wordCloudRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchModels() {
      setLoadingModels(true);
      try {
        const res = await modelApi.getList({ model_type: "llm", page: 1, page_size: 100 });
        setModels((res.items || []).filter((m: ModelConfig) => m.status === "enabled"));
      } catch {
        setModels([]);
      } finally {
        setLoadingModels(false);
      }
    }
    void fetchModels();
  }, []);

  const handleAnalyze = async () => {
    if (dataSources.length === 0) return;
    setAnalyzing(true);
    try {
      const res = await dashboardApi.analyzePublicOpinion({
        data_sources: dataSources,
        days,
        model_id: modelId ? Number(modelId) : undefined,
      });
      setResult(res);
    } catch (err) {
      console.error("舆情分析失败", err);
    } finally {
      setAnalyzing(false);
    }
  };

  const toggleSource = (source: string) => {
    setDataSources((prev) =>
      prev.includes(source) ? prev.filter((s) => s !== source) : [...prev, source]
    );
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "high": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "medium": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      default: return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    }
  };

  // 词云
  useEffect(() => {
    if (!wordCloudRef.current || !result?.keywords?.length) return;
    let disposed = false;
    (async () => {
      const echarts = await import("echarts");
      await import("echarts-wordcloud");
      if (disposed) return;
      const chart = echarts.init(wordCloudRef.current!);
      const option: echarts.EChartsCoreOption = {
        backgroundColor: "transparent",
        tooltip: { show: true },
        series: [
          {
            type: "wordCloud",
            shape: "circle",
            left: "center",
            top: "center",
            width: "90%",
            height: "90%",
            sizeRange: [12, 36],
            rotationRange: [-30, 60],
            rotationStep: 30,
            gridSize: 8,
            drawOutOfBound: false,
            textStyle: {
              fontFamily: "sans-serif",
              fontWeight: "bold",
              color: () => {
                const colors = ["#38bdf8", "#818cf8", "#34d399", "#fbbf24", "#f472b6", "#a78bfa"];
                return colors[Math.floor(Math.random() * colors.length)];
              },
            },
            emphasis: { focus: "self" },
            data: result.keywords,
          },
        ],
      };
      chart.setOption(option);
      const resize = () => chart.resize();
      window.addEventListener("resize", resize);
    })();
    return () => {
      disposed = true;
    };
  }, [result?.keywords]);

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            智能舆情分析
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            通过 AI 模型自主分析智能聊天子系统与瞭望子系统中的数据并识别风险
          </p>
        </div>
      </div>

      {/* 分析配置 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">数据源</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={dataSources.includes("chat")} onCheckedChange={() => toggleSource("chat")} />
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  聊天子系统
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={dataSources.includes("collect")} onCheckedChange={() => toggleSource("collect")} />
                  <Database className="w-4 h-4 text-muted-foreground" />
                  瞭望子系统
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">时间范围</label>
              <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">近 1 天</SelectItem>
                  <SelectItem value="3">近 3 天</SelectItem>
                  <SelectItem value="7">近 7 天</SelectItem>
                  <SelectItem value="14">近 14 天</SelectItem>
                  <SelectItem value="30">近 30 天</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">AI 模型</label>
              <Select value={modelId} onValueChange={setModelId} disabled={loadingModels}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="使用默认模型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">使用默认模型</SelectItem>
                  {models.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="mt-6">
              <Button onClick={handleAnalyze} disabled={analyzing || dataSources.length === 0}>
                {analyzing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {analyzing ? "分析中..." : "开始 AI 分析"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 分析结果 */}
      {result && (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium mb-2">分析摘要</h3>
              <div className="text-sm text-muted-foreground leading-relaxed prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{result.summary}</ReactMarkdown>
              </div>
              <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                {result.model_name && <Badge variant="outline">模型：{result.model_name}</Badge>}
                {result.analyzed_at && <span>分析时间：{new Date(result.analyzed_at).toLocaleString()}</span>}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  风险事件
                </h3>
                <div className="space-y-3">
                  {result.risk_events.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">未识别到显著风险</p>
                  ) : (
                    result.risk_events.map((event, i) => (
                      <div key={i} className={`p-3 rounded-lg border ${getRiskColor(event.level)}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{event.title}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {event.source === "chat" ? "聊天" : "瞭望"}
                          </Badge>
                        </div>
                        <p className="text-xs opacity-90 mb-2">{event.summary}</p>
                        <p className="text-xs"><span className="font-medium">建议：</span>{event.suggestion}</p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-medium mb-3">关键词云</h3>
                {result.keywords.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">暂无关键词</p>
                ) : (
                  <div ref={wordCloudRef} className="h-[240px] w-full" />
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium mb-3">AI 建议措施</h3>
              <ul className="space-y-2">
                {result.suggestions.length === 0 ? (
                  <li className="text-sm text-muted-foreground">暂无建议</li>
                ) : (
                  result.suggestions.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-primary font-medium">{i + 1}.</span>
                      {s}
                    </li>
                  ))
                )}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
