import { useState } from "react"
import { Search, Users, UserPlus, Plus, ChevronRight, MessageSquare, Wrench, X, CheckCircle } from "lucide-react"
import { cn } from "@/shared/utils"
import { Badge, Btn } from "@/shared/ui"
import { friendGroups, friendRequests, groups } from "@/shared/mockData"

export function ContactsPage({ onStartChat }: { onStartChat?: () => void }) {
  const [tab, setTab] = useState<"friends" | "groups" | "requests">("friends")
  const [search, setSearch] = useState("")
  const [selectedFriend, setSelectedFriend] = useState<(typeof friendGroups)[0]["friends"][0] | null>(null)
  const [expanded, setExpanded] = useState<Record<number, boolean>>({ 1: true, 2: true, 3: true })
  const [requests, setRequests] = useState(friendRequests)

  const allFriends = friendGroups.flatMap(g => g.friends)
  const filteredGroups = friendGroups.map(g => ({
    ...g,
    friends: search ? g.friends.filter(f => f.name.includes(search) || f.role.includes(search)) : g.friends
  })).filter(g => !search || g.friends.length > 0)

  const pendingCount = requests.filter(r => r.status === "pending" && r.type === "incoming").length

  const handleRequest = (id: number, action: "accept" | "reject") => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: action === "accept" ? "accepted" : "rejected" } : r))
  }

  return (
    <div className="h-full flex overflow-hidden">
      {/* Left panel */}
      <div className="w-64 border-r border-border flex flex-col flex-shrink-0">
        {/* Tabs */}
        <div className="p-3 border-b border-border space-y-2">
          <div className="flex gap-1 bg-muted/40 rounded-lg p-1">
            {(["friends", "groups", "requests"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={cn("flex-1 py-1 text-xs rounded font-medium transition-colors relative",
                  tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}>
                {t === "friends" ? "好友" : t === "groups" ? "群组" : "申请"}
                {t === "requests" && pendingCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 text-white text-[8px] rounded-full flex items-center justify-center font-bold">{pendingCount}</span>
                )}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-input-background border border-border rounded px-3 py-1.5 pl-8 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              placeholder={tab === "friends" ? "搜索好友..." : tab === "groups" ? "搜索群组..." : ""} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {tab === "friends" && (
            <div className="py-1">
              {filteredGroups.map(g => (
                <div key={g.id}>
                  <button
                    onClick={() => setExpanded(prev => ({ ...prev, [g.id]: !prev[g.id] }))}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ChevronRight className={cn("w-3 h-3 transition-transform", expanded[g.id] && "rotate-90")} />
                    <span className="font-medium">{g.name}</span>
                    <span className="text-[10px] opacity-60">{g.friends.length}</span>
                  </button>
                  {expanded[g.id] && g.friends.map(f => (
                    <button key={f.id} onClick={() => setSelectedFriend(f)}
                      className={cn("w-full flex items-center gap-3 px-4 py-2 transition-colors text-left",
                        selectedFriend?.id === f.id ? "bg-primary/10 text-foreground" : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                      )}>
                      <div className="relative flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/20 flex items-center justify-center text-sm font-semibold text-primary">{f.avatar}</div>
                        {f.online && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-background" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-foreground truncate">{f.name}</div>
                        <div className="text-[10px] text-muted-foreground truncate">{f.online ? "在线" : f.lastSeen}</div>
                      </div>
                      {f.unread > 0 && (
                        <span className="w-4 h-4 bg-primary text-primary-foreground text-[9px] rounded-full flex items-center justify-center font-bold">{f.unread}</span>
                      )}
                    </button>
                  ))}
                </div>
              ))}
              <div className="px-3 py-4 text-center">
                <Btn variant="ghost" size="xs"><UserPlus className="w-3.5 h-3.5" />添加好友</Btn>
              </div>
            </div>
          )}

          {tab === "groups" && (
            <div className="py-1">
              {groups.map(g => (
                <button key={g.id} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-secondary transition-colors text-left">
                  <div className="w-9 h-9 rounded-full bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center text-sm font-semibold text-cyan-400 flex-shrink-0">群</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-foreground">{g.name}</div>
                    <div className="text-[10px] text-muted-foreground">{g.members} 名成员</div>
                  </div>
                  {g.unread > 0 && (
                    <span className="w-4 h-4 bg-primary text-primary-foreground text-[9px] rounded-full flex items-center justify-center font-bold">{g.unread}</span>
                  )}
                </button>
              ))}
              <div className="px-3 py-4 text-center">
                <Btn variant="ghost" size="xs"><Plus className="w-3.5 h-3.5" />创建群组</Btn>
              </div>
            </div>
          )}

          {tab === "requests" && (
            <div className="py-1">
              {requests.length === 0 && (
                <div className="py-10 text-center text-xs text-muted-foreground">暂无好友申请</div>
              )}
              {requests.map(r => (
                <div key={r.id} className={cn("px-3 py-3 border-b border-border/50", r.status !== "pending" && "opacity-50")}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary flex-shrink-0">{r.avatar}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-foreground">{r.name}</div>
                      <div className="text-[10px] text-muted-foreground">{r.role} · {r.company}</div>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{r.type === "incoming" ? "收到" : "发出"}</span>
                  </div>
                  {r.msg && <p className="text-[10px] text-muted-foreground bg-muted/40 rounded px-2 py-1 mb-2">"{r.msg}"</p>}
                  {r.status === "pending" && r.type === "incoming" ? (
                    <div className="flex gap-2">
                      <Btn size="xs" className="flex-1 justify-center" onClick={() => handleRequest(r.id, "accept")}><CheckCircle className="w-3 h-3" />接受</Btn>
                      <Btn size="xs" variant="outline" className="flex-1 justify-center" onClick={() => handleRequest(r.id, "reject")}><X className="w-3 h-3" />拒绝</Btn>
                    </div>
                  ) : (
                    <Badge variant={r.status === "accepted" ? "success" : r.status === "rejected" ? "danger" : "muted"}>
                      {r.status === "accepted" ? "已接受" : r.status === "rejected" ? "已拒绝" : r.type === "outgoing" ? "等待对方确认" : "已处理"}
                    </Badge>
                  )}
                  <div className="text-[10px] text-muted-foreground mt-1.5">{r.time}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Friend Detail */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedFriend && tab === "friends" ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6">
            <div className="text-center space-y-3">
              <div className="relative inline-block">
                <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center text-3xl font-semibold text-primary mx-auto">
                  {selectedFriend.avatar}
                </div>
                {selectedFriend.online && (
                  <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-background" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">{selectedFriend.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedFriend.role}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{selectedFriend.online ? "🟢 当前在线" : `⚫ ${selectedFriend.lastSeen}`}</p>
              </div>
            </div>

            <div className="w-full max-w-xs space-y-2">
              {[
                { label: "好友备注", value: selectedFriend.name },
                { label: "所在分组", value: friendGroups.find(g => g.friends.some(f => f.id === selectedFriend.id))?.name || "-" },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between py-2 border-b border-border/50">
                  <span className="text-xs text-muted-foreground">{row.label}</span>
                  <span className="text-xs text-foreground">{row.value}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Btn size="md" onClick={onStartChat}>
                <MessageSquare className="w-4 h-4" />发起聊天
              </Btn>
              <Btn size="md" variant="outline">
                <Wrench className="w-4 h-4" />编辑备注
              </Btn>
              <Btn size="md" variant="danger">
                <X className="w-4 h-4" />删除好友
              </Btn>
            </div>

            <div className="w-full max-w-xs">
              <div className="text-xs text-muted-foreground mb-2">共同群组</div>
              <div className="space-y-1.5">
                {groups.filter((_, i) => i < 2).map(g => (
                  <div key={g.id} className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg">
                    <div className="w-6 h-6 rounded bg-cyan-500/15 flex items-center justify-center text-[10px] text-cyan-400">群</div>
                    <span className="text-xs text-foreground">{g.name}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">{g.members} 人</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-muted/40 border border-border flex items-center justify-center">
              <Users className="w-7 h-7 text-muted-foreground/40" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {tab === "friends" ? "选择左侧联系人查看详情" : tab === "groups" ? "选择群组查看详情" : "处理好友申请"}
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                {tab === "friends" ? `共 ${allFriends.length} 位好友` : tab === "groups" ? `共 ${groups.length} 个群组` : `${pendingCount} 条待处理申请`}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
