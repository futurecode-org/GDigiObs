import { useState, useEffect } from "react";
import { Activity, Users, Database, MessageSquare, AlertTriangle, Loader2 } from "lucide-react";
import { StatCard } from "@/shared/components/StatCard";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeader } from "@/shared/components/SectionHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { collectApi, dashboardApi, modelApi, notificationApi, userApi } from "../../../lib/api";
import type { DashboardSentimentResponse, DashboardStatsResponse, DashboardTrendsResponse, ModelUsageRankingItem, Notification as NotificationType, User } from "../../../lib/types";

export function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [stats, setStats] = useState({ users: 0, notifications: 0, collected: 0, models: 0 });
  const [modelRanking, setModelRanking] = useState<ModelUsageRankingItem[]>([]);
  const [activityData, setActivityData] = useState<DashboardTrendsResponse["items"]>([]);
  const [sentimentData, setSentimentData] = useState<DashboardSentimentResponse["collect"]>([]);
  const [collectStats, setCollectStats] = useState<DashboardTrendsResponse["items"]>([]);
  const [changes, setChanges] = useState<Record<string, { value: number; direction: "up" | "down" }>>({});
  const [rankingLoading, setRankingLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  async function fetchDashboardData() {
    setIsLoading(true);
    setRankingLoading(true);
    try {
      const [userResult, notifResult, collectResult, modelResult, rankingResult, statsResult, trendsResult, sentimentResult] = await Promise.all([
        userApi.getList({ page: 1, page_size: 5 }),
        notificationApi.getList({ page: 1, page_size: 3 }),
        collectApi.getItems({ page: 1, page_size: 1 }),
        modelApi.getList({ page: 1, page_size: 1 }),
        modelApi.getUsageRanking(5),
        dashboardApi.getStats(),
        dashboardApi.getTrends(7),
        dashboardApi.getSentiment(),
      ]);

      const userList = userResult.items || [];
      setUsers(userList);

      const notifList = notifResult.items || [];
      setNotifications(notifList.filter((n: NotificationType) => !n.read));
      setStats({
        users: userResult.total,
        notifications: notifResult.total,
        collected: collectResult.total,
        models: modelResult.total
      });
      setModelRanking(rankingResult || []);

      const statsRes = statsResult as DashboardStatsResponse;
      setChanges(statsRes.changes || {});

      const trends = trendsResult as DashboardTrendsResponse;
      setActivityData(trends.items || []);
      setCollectStats(trends.items || []);

      const sentiment = sentimentResult as DashboardSentimentResponse;
      setSentimentData(sentiment.collect && sentiment.collect.length > 0 ? sentiment.collect : sentiment.chat);
    } catch {
      setUsers([]);
      setNotifications([]);
      setStats({ users: 0, notifications: 0, collected: 0, models: 0 });
      setModelRanking([]);
      setActivityData([]);
      setSentimentData([]);
      setCollectStats([]);
      setChanges({});
    } finally {
      setIsLoading(false);
      setRankingLoading(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(fetchDashboardData);
  }, []);

  const getTrend = (key: string) => {
    const c = changes[key];
    return c ? (c.direction === "up" ? c.value : -c.value) : undefined;
  };

  const weekDayMap = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return weekDayMap[d.getDay()];
  };

  const getCurrencySymbol = (currency?: string) => {
    switch (currency) {
      case "USD": return "$";
      case "EUR": return "€";
      case "JPY": return "¥";
      case "KRW": return "₩";
      default: return "¥";
    }
  };

  const displayRanking = modelRanking.length > 0 ? modelRanking : [];

  const maxMessages = Math.max(...activityData.map(d => d.messages || 0), 1);
  const maxQueries = Math.max(...activityData.map(d => d.queries || 0), 1);
  const maxTasks = Math.max(...activityData.map(d => d.tasks || 0), 1);
  const maxCollected = Math.max(...collectStats.map(d => d.collected || 0), 1);

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="用户总数" value={stats.users.toLocaleString()} icon={Users} trend={getTrend("messages")} color="primary" />
        <StatCard label="系统通知" value={stats.notifications.toLocaleString()} icon={MessageSquare} trend={getTrend("ask_records")} color="success" />
        <StatCard label="数据采集量" value={stats.collected.toLocaleString()} icon={Database} trend={getTrend("collected")} color="info" />
        <StatCard label="模型配置" value={stats.models.toLocaleString()} icon={Activity} trend={getTrend("model_calls")} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-4">
              <SectionHeader title="数据概览" action={<Button variant="ghost">查看详情</Button>} />
              <div className="h-64">
                {activityData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">暂无趋势数据</div>
                ) : (
                  <div className="h-full flex items-end justify-between gap-2 px-2">
                    {activityData.map(item => (
                      <div key={item.date} className="flex-1 flex flex-col items-center gap-2">
                        <div className="relative w-full flex items-end justify-center gap-0.5 h-48">
                          <div className="w-3 bg-primary/60 rounded-t" style={{ height: `${(item.messages / maxMessages) * 100}%` }} />
                          <div className="w-3 bg-emerald-500/60 rounded-t" style={{ height: `${(item.queries / maxQueries) * 100}%` }} />
                          <div className="w-3 bg-amber-500/60 rounded-t" style={{ height: `${(item.tasks / maxTasks) * 100}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{formatDateLabel(item.date)}</span>
                      </div>
                    ))}
                  </div>
                )}
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
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-4">
            <SectionHeader title="情感分布" />
            <div className="h-64 flex items-center justify-center">
              {sentimentData.length === 0 ? (
                <div className="text-muted-foreground text-sm">暂无情感数据</div>
              ) : (
                <div className="relative w-48 h-48">
                  <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    {(() => {
                      const total = sentimentData.reduce((sum, s) => sum + s.value, 0) || 1;
                      let accumulatedAngle = 0;
                      return sentimentData.map((curr, i) => {
                        const startAngle = accumulatedAngle;
                        const endAngle = accumulatedAngle + (curr.value / total) * 360;
                        accumulatedAngle = endAngle;
                        const startRad = (startAngle * Math.PI) / 180;
                        const endRad = (endAngle * Math.PI) / 180;
                        const x1 = 50 + 40 * Math.cos(startRad);
                        const y1 = 50 + 40 * Math.sin(startRad);
                        const x2 = 50 + 40 * Math.cos(endRad);
                        const y2 = 50 + 40 * Math.sin(endRad);
                        const largeArc = curr.value / total > 0.5 ? 1 : 0;
                        return (
                          <g key={i}>
                            <path
                              d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                              fill={curr.color || "#6B7280"}
                              className="transition-all duration-300 hover:opacity-80"
                            />
                          </g>
                        );
                      });
                    })()}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-foreground">
                      {sentimentData.reduce((sum, s) => sum + s.value, 0).toLocaleString()}
                    </span>
                    <span className="text-xs text-muted-foreground">总量</span>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-2 mt-4 pt-4 border-t border-border">
              {sentimentData.map(item => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="text-xs font-medium text-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-4">
            <SectionHeader title="数据处理统计" />
            <div className="h-48 space-y-3">
              {collectStats.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">暂无数据</div>
              ) : (
                collectStats.slice(-5).map(item => (
                  <div key={item.date} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-10">{formatDateLabel(item.date)}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-500/60 rounded-full" style={{ width: `${(item.collected / maxCollected) * 100}%` }} />
                    </div>
                    <span className="text-xs font-mono text-foreground">{item.collected}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <SectionHeader title="模型调用排行" />
            {rankingLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : displayRanking.length === 0 ? (
              <div className="text-center text-muted-foreground py-8 text-sm">暂无模型调用数据</div>
            ) : (
              <div className="space-y-3">
                {displayRanking.slice(0, 5).map((model, i) => (
                  <div key={model.model_id} className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-muted text-xs flex items-center justify-center text-muted-foreground">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{model.name}</p>
                      <p className="text-xs text-muted-foreground">{model.calls.toLocaleString()} 次调用</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono text-muted-foreground">
                        {getCurrencySymbol(model.currency)}{model.cost.toFixed ? model.cost.toFixed(4) : model.cost}
                      </span>
                      {model.input_price !== undefined && model.output_price !== undefined && (
                        <p className="text-[10px] text-muted-foreground">
                          {getCurrencySymbol(model.currency)}{Number(model.input_price).toFixed(4)} / {getCurrencySymbol(model.currency)}{Number(model.output_price).toFixed(4)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <SectionHeader title="系统通知" />
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="p-2 rounded-lg bg-muted/30">
                    <div className="flex items-start gap-2">
                      <div className="w-4 h-4 bg-muted animate-pulse rounded mt-0.5" />
                      <div className="flex-1 space-y-1">
                        <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
                        <div className="h-3 w-3/4 bg-muted animate-pulse rounded" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">暂无通知</p>
                ) : (
                  notifications.map(notif => (
                    <div key={notif.id} className="p-2 rounded-lg bg-muted/30">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-foreground truncate">{notif.title}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{notif.content}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <SectionHeader title="最近活跃用户" action={<Button variant="ghost" size="xs">查看全部</Button>} />
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex items-center gap-3 py-2 px-2">
                    <div className="w-7 h-7 rounded-full bg-muted animate-pulse" />
                    <div className="flex-1 space-y-1">
                      <div className="h-4 w-1/3 bg-muted animate-pulse rounded" />
                      <div className="h-3 w-1/4 bg-muted animate-pulse rounded" />
                    </div>
                    <div className="space-y-1">
                      <div className="h-3 w-1/4 bg-muted animate-pulse rounded" />
                      <div className="h-3 w-1/4 bg-muted animate-pulse rounded" />
                    </div>
                    <div className="w-12 h-4 bg-muted animate-pulse rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">用户</th>
                    <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">角色</th>
                    <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">租户</th>
                    <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">部门</th>
                    <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">状态</th>
                    <th className="text-left py-2 px-2 text-xs font-medium text-muted-foreground">最近登录</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-muted-foreground">暂无用户</td>
                    </tr>
                  ) : (
                    users.map(user => (
                      <tr key={user.id} className="border-b border-border/50 last:border-0">
                        <td className="py-2 px-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center">
                              {(user.nickname || user.username).charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm text-foreground">{user.nickname || user.username}</p>
                              <p className="text-[10px] text-muted-foreground">{user.email || "-"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-2 text-xs text-muted-foreground">{user.roles?.[0] || "-"}</td>
                        <td className="py-2 px-2 text-xs text-muted-foreground">{user.tenant_name || "-"}</td>
                        <td className="py-2 px-2 text-xs text-muted-foreground">{user.department_name || "-"}</td>
                        <td className="py-2 px-2">
                          <Badge variant={user.is_active ? "secondary" : "destructive"}>
                            {user.is_active ? "正常" : "禁用"}
                          </Badge>
                        </td>
                        <td className="py-2 px-2 text-xs text-muted-foreground">{user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
