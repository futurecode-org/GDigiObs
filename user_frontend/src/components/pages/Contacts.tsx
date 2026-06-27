import { useState } from "react"
import { Search, Plus, User, Users, Check, X } from "lucide-react"
import { Badge } from "@/components/shared/Badge"
import { Btn } from "@/components/shared/Btn"
import { cn } from "@/lib/utils"
import { friendGroups, friendRequests } from "@/lib/mockData"

export function ContactsPage() {
  const [activeTab, setActiveTab] = useState<"friends" | "requests">("friends")
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedGroups, setExpandedGroups] = useState<number[]>([1])

  const toggleGroup = (id: number) => {
    setExpandedGroups(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id])
  }

  return (
    <div className="h-full flex">
      <div className="w-80 border-r border-border flex flex-col flex-shrink-0">
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">联系人</h2>
            <Btn variant="ghost" size="xs"><Plus className="w-4 h-4" /></Btn>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="搜索联系人..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-muted border border-transparent rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        <div className="flex border-b border-border">
          <button onClick={() => setActiveTab("friends")} className={cn("flex-1 py-2 text-sm font-medium transition-colors", activeTab === "friends" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground")}>
            好友
            <Badge variant="muted" className="ml-1">{friendGroups.reduce((sum, g) => sum + g.friends.length, 0)}</Badge>
          </button>
          <button onClick={() => setActiveTab("requests")} className={cn("flex-1 py-2 text-sm font-medium transition-colors", activeTab === "requests" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground")}>
            申请
            <Badge variant="danger" className="ml-1">{friendRequests.filter(r => r.status === "pending" && r.type === "incoming").length}</Badge>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === "friends" ? (
            <div className="p-2 space-y-1">
              {friendGroups.map(group => (
                <div key={group.id}>
                  <button onClick={() => toggleGroup(group.id)} className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <Users className="w-3.5 h-3.5" />
                    {group.name}
                    <span className="ml-auto text-[10px]">{group.friends.length}</span>
                  </button>
                  {expandedGroups.includes(group.id) && (
                    <div className="ml-6 space-y-0.5">
                      {group.friends.map(friend => (
                        <button key={friend.id} className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-muted/50 transition-colors text-left">
                          <div className="relative">
                            <div className="w-8 h-8 rounded-full bg-primary/15 text-primary text-xs font-semibold flex items-center justify-center">
                              {friend.avatar}
                            </div>
                            {friend.online && <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border-2 border-card" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-foreground">{friend.name}</span>
                              {friend.unread > 0 && <Badge variant="danger" className="text-[9px]">{friend.unread}</Badge>}
                            </div>
                            <p className="text-[10px] text-muted-foreground">{friend.role}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {friendRequests.map(req => (
                <div key={req.id} className="p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/15 text-primary text-xs font-semibold flex items-center justify-center">
                      {req.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{req.name}</span>
                        <Badge variant={req.type === "incoming" ? "info" : "muted"}>
                          {req.type === "incoming" ? "收到" : "发送"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{req.role}</p>
                      {req.msg && <p className="text-xs text-muted-foreground mt-0.5 truncate">{req.msg}</p>}
                      <p className="text-[10px] text-muted-foreground mt-0.5">{req.time}</p>
                    </div>
                  </div>
                  {req.status === "pending" && req.type === "incoming" && (
                    <div className="flex gap-2 mt-3">
                      <Btn variant="primary" size="sm"><Check className="w-3.5 h-3.5" /> 接受</Btn>
                      <Btn variant="danger" size="sm"><X className="w-3.5 h-3.5" /> 拒绝</Btn>
                    </div>
                  )}
                  {req.status === "accepted" && <Badge variant="success">已接受</Badge>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-muted border border-border flex items-center justify-center mx-auto">
            <User className="w-7 h-7 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-base font-medium text-foreground">选择联系人</h3>
            <p className="text-sm text-muted-foreground mt-1">点击左侧列表中的联系人查看详情或发起聊天</p>
          </div>
        </div>
      </div>
    </div>
  )
}