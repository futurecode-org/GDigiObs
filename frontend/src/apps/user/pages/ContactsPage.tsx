import { useState } from "react"
import { Search, Plus, User, Users, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { friendGroups, friendRequests } from "@/lib/mockData"
import { cn } from "@/lib/utils"

export function ContactsPage() {
  const [activeTab, setActiveTab] = useState<"friends" | "requests">("friends")

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
          {activeTab === "friends" ? (
            <div className="space-y-4">
              {friendGroups.map(group => (
                <div key={group.id}>
                  <div className="px-2 py-1 text-[10px] font-medium text-muted-foreground uppercase">
                    {group.name} ({group.friends.length})
                  </div>
                  {group.friends.map(friend => (
                    <button
                      key={friend.id}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="relative">
                        <div className="w-9 h-9 rounded-full bg-cyan-500/15 text-cyan-400 text-sm font-semibold flex items-center justify-center">
                          {friend.avatar}
                        </div>
                        {friend.online && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-card" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{friend.name}</p>
                        <p className="text-[10px] text-muted-foreground">{friend.lastSeen}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {friendRequests.filter(r => r.type === "incoming" && r.status === "pending").map(req => (
                <div key={req.id} className="p-3 rounded-lg bg-muted/30">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/15 text-cyan-400 text-sm font-semibold flex items-center justify-center">
                      {req.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{req.name}</p>
                      <p className="text-xs text-muted-foreground">{req.role} · {req.company}</p>
                      {req.msg && <p className="text-xs text-muted-foreground mt-1">{req.msg}</p>}
                      <p className="text-[10px] text-muted-foreground mt-1">{req.time}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button variant="default" size="xs" className="flex-1"><Check className="w-3 h-3" /> 接受</Button>
                    <Button variant="outline" size="xs" className="flex-1"><X className="w-3 h-3" /> 拒绝</Button>
                  </div>
                </div>
              ))}
            </div>
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
  )
}
