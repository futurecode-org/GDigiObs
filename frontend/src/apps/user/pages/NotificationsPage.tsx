import { useState, useEffect } from "react";
import { Bell, Check, CheckCheck, Trash2, Search, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/shared/components/SectionHeader";
import { notificationApi, friendApi } from "../../../lib/api";
import { toast } from "sonner";
import type { Notification } from "../../../lib/types";
import { cn } from "@/lib/utils";

export function NotificationsPage() {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page] = useState(1);

  useEffect(() => {
    fetchNotifications();
  }, [page]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const result = await notificationApi.getList({ page, page_size: 50 });
      setNotifications(result.items as Notification[]);
    } catch {
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, status: "read", read: true } : n));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, status: "read", read: true })));
    } catch {}
  };

  const deleteNotification = async (id: number) => {
    try {
      await notificationApi.delete(id);
      setNotifications(notifications.filter(n => n.id !== id));
    } catch {}
  };

  const handleAcceptFriendRequest = async (notif: Notification) => {
    const applicationId = (notif.data as any)?.application_id;
    if (!applicationId) return;
    
    try {
      await friendApi.acceptApplication(applicationId);
      setNotifications(notifications.filter(n => n.id !== notif.id));
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || "接受好友申请失败";
      toast.error(message);
    }
  };

  const handleRejectFriendRequest = async (notif: Notification) => {
    const applicationId = (notif.data as any)?.application_id;
    if (!applicationId) return;
    
    try {
      await friendApi.rejectApplication(applicationId);
      setNotifications(notifications.filter(n => n.id !== notif.id));
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || "拒绝好友申请失败";
      toast.error(message);
    }
  };

  const typeLabels: Record<string, string> = { system: "系统", task: "任务", message: "消息", approval: "审批", friend_application: "好友申请" };
  const typeColors: Record<string, string> = { system: "secondary", task: "default", message: "outline", approval: "outline", friend_application: "destructive" };

  // 获取通知类型（兼容两种字段名）
  const getNotifType = (notif: Notification) => notif.notification_type || notif.type || "system";
  
  // 判断是否未读
  const isUnread = (notif: Notification) => notif.status === "unread" || notif.read === false;

  const filteredNotifs = filter === "all" ? notifications : notifications.filter(n => isUnread(n));
  const unreadCount = notifications.filter(n => isUnread(n)).length;

  const formatTime = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return "刚刚";
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString();
  };

  return (
    <div className="h-full overflow-y-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <SectionHeader title="通知中心" subtitle={`${unreadCount} 条未读`} />
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={markAllRead} disabled={unreadCount === 0}>
            <CheckCheck className="w-4 h-4" /> 全部已读
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-2">
          <div className="flex items-center gap-2 px-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="搜索通知..."
                className="w-full pl-9 pr-3 py-2 bg-muted border border-transparent rounded-lg text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <button
              onClick={() => setFilter("all")}
              className={cn("px-3 py-1.5 text-xs rounded-lg transition-colors", filter === "all" ? "bg-primary/10 text-primary" : "text-muted-foreground")}
            >
              全部
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={cn("px-3 py-1.5 text-xs rounded-lg transition-colors", filter === "unread" ? "bg-primary/10 text-primary" : "text-muted-foreground")}
            >
              未读 {unreadCount > 0 && `(${unreadCount})`}
            </button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <Card key={i} className="p-4">
              <CardContent>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-3/4 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-1/3 bg-muted animate-pulse rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredNotifs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>暂无通知</p>
            </div>
          ) : (
            filteredNotifs.map(notif => {
              const notifType = getNotifType(notif);
              const unread = isUnread(notif);
              const fromUsername = (notif.data as any)?.from_username || "";
              const fromNickname = (notif.data as any)?.from_nickname || fromUsername;
              const fromRole = (notif.data as any)?.from_role || "";
              const fromCompany = (notif.data as any)?.from_company || "";
              
              // 用户类型中文映射
              const roleLabels: Record<string, string> = {
                internal: "内部用户",
                external: "外部用户",
                admin: "管理员"
              };
              const fromRoleLabel = fromRole ? (roleLabels[fromRole] || fromRole) : "";
              
              return (
              <Card key={notif.id} className={cn("transition-colors", unread && "bg-primary/5")}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", !unread ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary")}>
                      <Bell className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-foreground">
                          {notifType === "friend_application" ? `${fromNickname} 请求添加您为好友` : notif.title}
                        </span>
                        <Badge variant={typeColors[notifType] as "default" | "secondary" | "outline" | "destructive" | "ghost"} className="text-[10px]">
                          {typeLabels[notifType]}
                        </Badge>
                      </div>
                      {notifType === "friend_application" ? (
                        <>
                          {(fromRoleLabel || fromCompany) && (
                            <p className="text-xs text-muted-foreground mb-1">{fromRoleLabel}{fromRoleLabel && fromCompany ? " · " : ""}{fromCompany}</p>
                          )}
                          {(notif.data as any)?.message && (
                            <p className="text-xs text-muted-foreground/80 mb-2 italic">"{(notif.data as any).message}"</p>
                          )}
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground mb-2">{notif.content}</p>
                      )}
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] text-muted-foreground">{formatTime(notif.created_at)}</span>
                        <div className="flex gap-3 ml-auto">
                          {notifType === "friend_application" && (
                            <>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleAcceptFriendRequest(notif); }} 
                                className="text-[10px] text-green-500 hover:underline flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" /> 接受
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleRejectFriendRequest(notif); }} 
                                className="text-[10px] text-red-400 hover:underline flex items-center gap-1"
                              >
                                <X className="w-3 h-3" /> 拒绝
                              </button>
                            </>
                          )}
                          {unread && notifType !== "friend_application" && (
                            <button onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }} className="text-[10px] text-primary hover:underline flex items-center gap-1">
                              <Check className="w-3 h-3" /> 标记已读
                            </button>
                          )}
                          <button onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }} className="text-[10px] text-red-400 hover:underline flex items-center gap-1">
                            <Trash2 className="w-3 h-3" /> 删除
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )})
          )}
        </div>
      )}
    </div>
  );
}