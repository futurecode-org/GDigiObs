import { useState, useEffect } from "react";
import { MessageSquare, Search, BookOpen, Wand2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { StatCard } from "@/shared/components/StatCard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeader } from "@/shared/components/SectionHeader";
import { askApi, conversationApi, dashboardApi, knowledgeApi, skillApi, workflowApi } from "../../../lib/api";
import type { Conversation, DashboardSentimentResponse, DashboardStatsResponse, DashboardTrendsResponse, WorkflowRun } from "../../../lib/types";

export function UserDashboard() {
  const [stats, setStats] = useState({ messages: 0, queries: 0, knowledge: 0, skills: 0 });
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [tasks, setTasks] = useState<WorkflowRun[]>([]);
  const [activityData, setActivityData] = useState<DashboardTrendsResponse["items"]>([]);
  const [sentimentData, setSentimentData] = useState<DashboardSentimentResponse["chat"]>([]);
  const [queryExamples, setQueryExamples] = useState<string[]>([]);
  const [changes, setChanges] = useState<Record<string, { value: number; direction: "up" | "down" }>>({});
  const [isLoading, setIsLoading] = useState(true);

  async function fetchDashboardData() {
    setIsLoading(true);
    try {
      const [convResult, taskResult, askResult, knowledgeResult, skillResult, statsResult, trendsResult, sentimentResult] = await Promise.all([
        conversationApi.getList(),
        workflowApi.getTasks({ page: 1, page_size: 10 }),
        askApi.getList({ page: 1, page_size: 5 }),
        knowledgeApi.getList({ page: 1, page_size: 1 }),
        skillApi.getList({ page: 1, page_size: 1 }),
        dashboardApi.getStats(),
        dashboardApi.getTrends(7),
        dashboardApi.getSentiment(),
      ]);

      const convList = convResult as Conversation[];
      setConversations(convList.slice(0, 4));

      const taskList = taskResult.items || [];
      setTasks(taskList.filter((t: WorkflowRun) => t.status !== "completed").slice(0, 3));

      const totalMessages = convList.reduce((sum, c) => sum + (c.message_count || 0), 0);
      const statsRes = statsResult as DashboardStatsResponse;
      setStats({
        messages: totalMessages,
        queries: askResult.total,
        knowledge: knowledgeResult.total,
        skills: skillResult.total
      });
      setChanges(statsRes.changes || {});

      const trends = trendsResult as DashboardTrendsResponse;
      setActivityData(trends.items || []);

      const sentiment = sentimentResult as DashboardSentimentResponse;
      setSentimentData(sentiment.chat && sentiment.chat.length > 0 ? sentiment.chat : sentiment.collect);

      // 取最近问数记录作为示例
      setQueryExamples((askResult.items || []).slice(0, 4).map((r) => r.question));
    } catch {
      setConversations([]);
      setTasks([]);
      setActivityData([]);
      setSentimentData([]);
      setQueryExamples([]);
      setChanges({});
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(fetchDashboardData);
  }, []);

  const getTrend = (key: string) => {
    const c = changes[key];
    return c ? (c.direction === "up" ? c.value : -c.value) : undefined;
  };

  const getConversationName = (conv: Conversation) => {
    if (conv.type === "group" && conv.name) return conv.name;
    return conv.members?.[0]?.nickname || conv.members?.[0]?.username || "未知";
  };

  const weekDayMap = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return weekDayMap[d.getDay()];
  };

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="我的消息" value={stats.messages.toString()} icon={MessageSquare} trend={getTrend("messages")} color="primary" />
        <StatCard label="智能问数" value={stats.queries.toString()} icon={Search} trend={getTrend("ask_records")} color="info" />
        <StatCard label="知识库检索" value={stats.knowledge.toString()} icon={BookOpen} trend={getTrend("collected")} color="purple" />
        <StatCard label="技能调用" value={stats.skills.toString()} icon={Wand2} trend={getTrend("model_calls")} color="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-4">
            <SectionHeader title="活动趋势" />
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={activityData.map(item => ({ ...item, date: formatDateLabel(item.date) }))}>
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
            <SectionHeader title="聊天风险分布" />
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={sentimentData.length > 0 ? sentimentData : [{ name: "无数据", value: 1, color: "#6B7280" }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {(sentimentData.length > 0 ? sentimentData : [{ name: "无数据", value: 1, color: "#6B7280" }]).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "6px" }}
                  formatter={(value) => [`${value ?? 0}`, "数量"]}
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
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex items-center gap-3 p-2">
                    <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
                    <div className="flex-1 space-y-1">
                      <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
                      <div className="h-3 w-3/4 bg-muted animate-pulse rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">暂无联系人</p>
                ) : (
                  conversations.map(c => (
                    <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-cyan-500/15 text-cyan-400 text-sm font-semibold flex items-center justify-center">
                          {getConversationName(c).charAt(0)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{getConversationName(c)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{c.last_message?.content || "暂无消息"}</p>
                      </div>
                      {c.unread_count > 0 && <Badge variant="destructive">{c.unread_count}</Badge>}
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <SectionHeader title="待处理任务" action={<button className="text-xs text-primary hover:underline">查看全部 →</button>} />
            {isLoading ? (
              <div className="space-y-3 mt-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="p-2 rounded-lg bg-muted/30">
                    <div className="h-4 w-1/2 bg-muted animate-pulse rounded mb-1.5" />
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: "50%" }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3 mt-2">
                {tasks.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">暂无任务</p>
                ) : (
                  tasks.map(t => (
                    <div key={t.id} className="p-2 rounded-lg bg-muted/30">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-foreground truncate">{t.workflow_name || "工作流任务"}</span>
                        <Badge variant={t.status === "running" ? "outline" : "secondary"}>
                          {t.status === "running" ? "进行中" : "待处理"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${t.status === "running" ? 50 : 0}%` }} />
                        </div>
                        <span className="text-[10px] text-muted-foreground">{t.status === "running" ? "50%" : "0%"}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <SectionHeader title="问数示例" />
            <div className="space-y-2">
              {queryExamples.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">暂无问数记录</p>
              ) : (
                queryExamples.slice(0, 4).map((q, i) => (
                  <button
                    key={i}
                    className="w-full p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="flex items-start gap-2">
                      <Search className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <span className="text-xs text-foreground">{q}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
