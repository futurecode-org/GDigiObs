import { useState, useEffect } from "react";
import { Search, Plus, User, Users, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { friendApi } from "../../../lib/api";
import type { Friend, FriendRequest } from "../../../lib/types";
import { cn } from "@/lib/utils";

export function ContactsPage() {
  const [activeTab, setActiveTab] = useState<"friends" | "requests">("friends");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (activeTab === "friends") {
      fetchFriends();
    } else {
      fetchRequests();
    }
  }, [activeTab]);

  const fetchFriends = async () => {
    setIsLoading(true);
    try {
      const result = await friendApi.getList();
      setFriends(result as Friend[]);
    } catch {
      setFriends([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const result = await friendApi.getRequests();
      setRequests(result as FriendRequest[]);
    } catch {
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (id: number) => {
    try {
      await friendApi.acceptRequest(id);
      fetchRequests();
    } catch {}
  };

  const handleReject = async (id: number) => {
    try {
      await friendApi.rejectRequest(id);
      fetchRequests();
    } catch {}
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (hours < 1) return "刚刚";
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString();
  };

  return (
    <div className="h-full flex">
      <div className="w-72 border-r border-border flex flex-col">
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">联系人</h2>
            <Button variant="default" size="xs"><Plus className="w-4 h-4" /></Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="搜索联系人..."
              className="w-full pl-9 pr-3 py-2 bg-muted border border-transparent rounded-lg text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div className="flex gap-1 mt-3">
            <button
              onClick={() => setActiveTab("friends")}
              className={cn("flex-1 py-1.5 text-xs rounded transition-colors flex items-center justify-center gap-1", activeTab === "friends" ? "bg-primary/10 text-primary" : "text-muted-foreground")}
            >
              <Users className="w-3 h-3" /> 好友
            </button>
            <button
              onClick={() => setActiveTab("requests")}
              className={cn("flex-1 py-1.5 text-xs rounded transition-colors flex items-center justify-center gap-1", activeTab === "requests" ? "bg-primary/10 text-primary" : "text-muted-foreground")}
            >
              <User className="w-3 h-3" /> 请求
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
                  <div className="flex-1 space-y-1">
                    <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-3/4 bg-muted animate-pulse rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : activeTab === "friends" ? (
            friends.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>暂无好友</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="px-2 py-1 text-[10px] font-medium text-muted-foreground uppercase">
                  好友 ({friends.length})
                </div>
                {friends.map(friend => (
                  <button
                    key={friend.id}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="relative">
                      <div className="w-9 h-9 rounded-full bg-cyan-500/15 text-cyan-400 text-sm font-semibold flex items-center justify-center">
                        {(friend.nickname || friend.username || "?").charAt(0)}
                      </div>
                      {friend.is_online && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-card" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{friend.nickname || friend.username || "?"}</p>
                      <p className="text-[10px] text-muted-foreground">{friend.is_online ? "在线" : `上次在线 ${formatTime(friend.last_online_at || "")}`}</p>
                    </div>
                  </button>
                ))}
              </div>
            )
          ) : (
            requests.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>暂无好友请求</p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.filter(r => r.status === "pending" && r.type === "incoming").map(req => (
                  <div key={req.id} className="p-3 rounded-lg bg-muted/30">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-cyan-500/15 text-cyan-400 text-sm font-semibold flex items-center justify-center">
                        {(req.from_nickname || req.from_username || "?").charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{req.from_nickname || req.from_username}</p>
                        <p className="text-xs text-muted-foreground">{req.from_role || "-"} · {req.from_company || "-"}</p>
                        {req.message && <p className="text-xs text-muted-foreground mt-1">{req.message}</p>}
                        <p className="text-[10px] text-muted-foreground mt-1">{formatTime(req.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button variant="default" size="xs" className="flex-1" onClick={() => handleAccept(req.id)}><Check className="w-3 h-3" /> 接受</Button>
                      <Button variant="outline" size="xs" className="flex-1" onClick={() => handleReject(req.id)}><X className="w-3 h-3" /> 拒绝</Button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <User className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>选择一个联系人开始聊天</p>
        </div>
      </div>
    </div>
  );
}