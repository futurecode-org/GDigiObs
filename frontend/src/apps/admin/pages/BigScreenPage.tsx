import { useEffect, useMemo, useRef, useState } from "react";
import {
  Users,
  Database,
  MessageSquare,
  AlertTriangle,
  Bot,
  BarChart3,
  Search,
  Activity,
  Maximize2,
  Minimize2,
  Monitor,
  Globe,
  TrendingUp,
  Smile,
  Hash,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  AreaChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import GlobeView, { type GlobeMethods } from "react-globe.gl";
import { dashboardApi } from "../../../lib/api";
import type {
  DashboardGeoResponse,
  DashboardSentimentResponse,
  DashboardStatsResponse,
  DashboardTrendsResponse,
  RiskOverviewResponse,
} from "../../../lib/types";

type GlobePoint = {
  name: string;
  lat: number;
  lng: number;
  value: number;
};

type GlobeArc = {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
};

const GLOBE_HEIGHT = 320;
const GLOBE_IMAGE_URL = "/globe/earth-blue-marble.jpg";
const GLOBE_BUMP_IMAGE_URL = "/globe/earth-topology.png";

export function BigScreenPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [stats, setStats] = useState<DashboardStatsResponse["stats"] | null>(null);
  const [trends, setTrends] = useState<DashboardTrendsResponse["items"]>([]);
  const [sentiment, setSentiment] = useState<DashboardSentimentResponse["collect"]>([]);
  const [keywords, setKeywords] = useState<{ name: string; value: number }[]>([]);
  const [geo, setGeo] = useState<DashboardGeoResponse | null>(null);
  const [risk, setRisk] = useState<RiskOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const wordCloudRef = useRef<HTMLDivElement>(null);
  const globeContainerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const wordCloudChart = useRef<unknown>(null);
  const [globeWidth, setGlobeWidth] = useState(640);

  const globePoints = useMemo<GlobePoint[]>(
    () =>
      (geo?.points ?? []).map((point) => ({
        name: point.name,
        lng: point.value[0],
        lat: point.value[1],
        value: point.value[2] ?? 1,
      })),
    [geo],
  );

  const globeArcs = useMemo<GlobeArc[]>(
    () =>
      (geo?.lines ?? []).map((line) => ({
        startLng: line.from_coord[0],
        startLat: line.from_coord[1],
        endLng: line.to_coord[0],
        endLat: line.to_coord[1],
      })),
    [geo],
  );

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [statsRes, trendsRes, sentimentRes, keywordsRes, geoRes, riskRes] = await Promise.all([
          dashboardApi.getStats(),
          dashboardApi.getTrends(7),
          dashboardApi.getSentiment(),
          dashboardApi.getWordCloud(80),
          dashboardApi.getGeo(),
          dashboardApi.getRiskOverview(),
        ]);
        setStats(statsRes.stats);
        setTrends(trendsRes.items);
        setSentiment(sentimentRes.collect && sentimentRes.collect.length > 0 ? sentimentRes.collect : sentimentRes.chat);
        setKeywords(keywordsRes.items);
        setGeo(geoRes);
        setRisk(riskRes);
      } catch (err) {
        console.error("大屏数据加载失败", err);
      } finally {
        setLoading(false);
      }
    }
    void fetchData();
  }, []);

  // 词云
  useEffect(() => {
    if (!wordCloudRef.current || keywords.length === 0) return;
    let disposed = false;
    let resize: (() => void) | undefined;
    (async () => {
      const echarts = await import("echarts");
      await import("echarts-wordcloud");
      if (disposed) return;
      const chart = echarts.init(wordCloudRef.current!);
      wordCloudChart.current = chart;
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
            sizeRange: [12, 40],
            rotationRange: [-45, 90],
            rotationStep: 45,
            gridSize: 8,
            drawOutOfBound: false,
            textStyle: {
              fontFamily: "sans-serif",
              fontWeight: "bold",
              color: () => {
                const colors = isDark
                  ? ["#38bdf8", "#818cf8", "#34d399", "#fbbf24", "#f472b6", "#a78bfa", "#60a5fa"]
                  : ["#0ea5e9", "#6366f1", "#16a34a", "#d97706", "#db2777", "#7c3aed", "#2563eb"];
                return colors[Math.floor(Math.random() * colors.length)];
              },
            },
            emphasis: { focus: "self", textStyle: { textShadowBlur: 10, textShadowColor: isDark ? "#333" : "#ccc" } },
            data: keywords,
          },
        ],
      };
      chart.setOption(option);
      resize = () => chart.resize();
      window.addEventListener("resize", resize);
    })();
    return () => {
      disposed = true;
      if (resize) window.removeEventListener("resize", resize);
      (wordCloudChart.current as { dispose?: () => void } | undefined)?.dispose?.();
    };
  }, [keywords, isDark]);

  useEffect(() => {
    const container = globeContainerRef.current;
    if (!container) return;
    const updateWidth = () => {
      setGlobeWidth(Math.floor(container.clientWidth || 640));
    };
    updateWidth();
    const frameId = window.requestAnimationFrame(updateWidth);
    const timeoutId = window.setTimeout(updateWidth, 100);
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateWidth);
      return () => {
        window.cancelAnimationFrame(frameId);
        window.clearTimeout(timeoutId);
        window.removeEventListener("resize", updateWidth);
      };
    }
    const observer = new ResizeObserver(([entry]) => {
      setGlobeWidth(Math.floor(entry.contentRect.width));
    });
    observer.observe(container);
    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, []);

  const handleGlobeReady = () => {
    const globe = globeRef.current;
    if (!globe) return;
    const controls = globe.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.55;
    controls.enableDamping = true;
    controls.enablePan = false;
    globe.pointOfView({ lat: 25, lng: 105, altitude: 2.15 }, 0);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  const statCards = [
    { label: "用户总数", value: stats?.users ?? 0, icon: Users, color: "text-blue-500" },
    { label: "采集数据量", value: stats?.collected ?? 0, icon: Database, color: "text-cyan-500" },
    { label: "消息总数", value: stats?.messages ?? 0, icon: MessageSquare, color: "text-purple-500" },
    { label: "敏感消息", value: stats?.sensitive_messages ?? 0, icon: AlertTriangle, color: "text-red-500" },
    { label: "数字员工执行", value: stats?.agent_runs ?? 0, icon: Bot, color: "text-emerald-500" },
    { label: "问数次数", value: stats?.ask_records ?? 0, icon: Search, color: "text-amber-500" },
    { label: "模型调用", value: stats?.model_calls ?? 0, icon: BarChart3, color: "text-pink-500" },
    { label: "负面数据", value: stats?.negative_collected ?? 0, icon: Activity, color: "text-orange-500" },
  ];

  const trendChartConfig = {
    messages: { label: "消息数", color: "#8B5CF6" },
    queries: { label: "查询数", color: "#06B6D4" },
    tasks: { label: "任务数", color: "#10B981" },
  };

  const sentimentColors = ["#10B981", "#6B7280", "#EF4444"];

  return (
    <div className="h-full overflow-y-auto bg-background p-4">
      <div className="max-w-[1920px] mx-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Monitor className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">数智大屏</h1>
              <p className="text-xs text-muted-foreground">实时监控 · 数据可视化 · 风险预警</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-lg font-mono font-medium text-foreground">{currentTime.toLocaleTimeString()}</div>
              <div className="text-xs text-muted-foreground">{currentTime.toLocaleDateString()}</div>
            </div>
            <Button variant="outline" size="icon" onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {loading ? (
          <Card className="border-dashed">
            <CardContent className="flex items-center justify-center h-96 text-muted-foreground">
              数据加载中...
            </CardContent>
          </Card>
        ) : (
          <>
            {/* 统计卡片 */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-4">
              {statCards.map((card) => (
                <Card key={card.label}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <card.icon className={`w-4 h-4 ${card.color}`} />
                      <span className="text-xs text-muted-foreground">{card.label}</span>
                    </div>
                    <div className="text-xl font-bold font-mono text-foreground">{Number(card.value).toLocaleString()}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* 3D 地球 + 词云 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Globe className="w-4 h-4 text-primary" />
                      全球数据态势
                    </CardTitle>
                  </div>
                  <CardDescription>按来源平台映射的实时数据分布</CardDescription>
                </CardHeader>
                <CardContent>
                  <div ref={globeContainerRef} className="h-[320px] w-full overflow-hidden">
                    {globeWidth > 0 && (
                      <GlobeView
                        ref={globeRef}
                        width={globeWidth}
                        height={GLOBE_HEIGHT}
                        backgroundColor="rgba(0,0,0,0)"
                        globeImageUrl={GLOBE_IMAGE_URL}
                        bumpImageUrl={GLOBE_BUMP_IMAGE_URL}
                        showAtmosphere
                        atmosphereColor={isDark ? "#38bdf8" : "#0ea5e9"}
                        atmosphereAltitude={0.18}
                        pointsData={globePoints}
                        pointLat="lat"
                        pointLng="lng"
                        pointAltitude={(point) => Math.min(0.24, 0.04 + ((point as GlobePoint).value || 1) / 700)}
                        pointRadius={(point) => Math.max(0.25, Math.min(0.75, ((point as GlobePoint).value || 1) / 80))}
                        pointColor={() => (isDark ? "rgba(56, 189, 248, 0.92)" : "rgba(2, 132, 199, 0.92)")}
                        pointLabel={(point) => {
                          const item = point as GlobePoint;
                          return `${item.name}<br/>数据量：${item.value}`;
                        }}
                        pointsTransitionDuration={800}
                        arcsData={globeArcs}
                        arcStartLat="startLat"
                        arcStartLng="startLng"
                        arcEndLat="endLat"
                        arcEndLng="endLng"
                        arcColor={() => [isDark ? "rgba(14, 165, 233, 0.1)" : "rgba(2, 132, 199, 0.1)", isDark ? "rgba(56, 189, 248, 0.85)" : "rgba(14, 165, 233, 0.85)"]}
                        arcAltitude={0.18}
                        arcStroke={0.55}
                        arcDashLength={0.32}
                        arcDashGap={1.8}
                        arcDashAnimateTime={2600}
                        arcsTransitionDuration={800}
                        onGlobeReady={handleGlobeReady}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Hash className="w-4 h-4 text-primary" />
                    热点词云
                  </CardTitle>
                  <CardDescription>基于采集数据内容的关键词统计</CardDescription>
                </CardHeader>
                <CardContent>
                  <div ref={wordCloudRef} className="h-[320px] w-full" />
                </CardContent>
              </Card>
            </div>

            {/* 趋势 + 情感 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    近 7 天数据趋势
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={trendChartConfig} className="h-[280px]">
                    <AreaChart data={trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" tickFormatter={(v) => v.slice(5)} />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Area type="monotone" dataKey="messages" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorMessages)" />
                      <Area type="monotone" dataKey="queries" stroke="#06B6D4" fill="transparent" />
                      <Bar dataKey="tasks" fill="#10B981" radius={[4, 4, 0, 0]} />
                    </AreaChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Smile className="w-4 h-4 text-primary" />
                    情感分布
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={{}} className="h-[280px]">
                    <PieChart>
                      <Pie
                        data={sentiment}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      >
                        {sentiment.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color || sentimentColors[index % sentimentColors.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                      <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            {/* 风险告警 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  风险概览
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                  {[
                    { label: "高风险消息", value: risk?.high_risk_messages ?? 0, color: "text-red-500" },
                    { label: "中风险消息", value: risk?.medium_risk_messages ?? 0, color: "text-orange-500" },
                    { label: "低风险消息", value: risk?.low_risk_messages ?? 0, color: "text-yellow-500" },
                    { label: "负面采集", value: risk?.negative_collected ?? 0, color: "text-rose-500" },
                    { label: "未处理告警", value: risk?.unresolved_alerts ?? 0, color: "text-blue-500" },
                  ].map((item) => (
                    <div key={item.label} className="text-center p-3 rounded-lg bg-muted/50">
                      <div className={`text-2xl font-bold font-mono ${item.color}`}>{item.value.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">{item.label}</div>
                    </div>
                  ))}
                </div>
                <Separator className="my-4" />
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {(risk?.recent_alerts || []).length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-2">近期无告警</p>
                  ) : (
                    (risk?.recent_alerts || []).map((alert) => (
                      <div key={alert.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 text-xs">
                        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        <span className="font-medium text-foreground">{alert.title}</span>
                        <Badge variant="outline" className="ml-auto text-[10px]">{alert.risk_level}</Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
