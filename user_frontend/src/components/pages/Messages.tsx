import { useState } from "react"
import { Search, Plus, Paperclip, Send, MoreVertical, User } from "lucide-react"
import { Badge } from "@/components/shared/Badge"
import { Btn } from "@/components/shared/Btn"
import { cn } from "@/lib/utils"
import { chatMessages, contacts, groups } from "@/lib/mockData"

export function MessagesPage() {
  const [activeTab, setActiveTab] = useState<"private" | "group">("private")
  const [selectedChat, setSelectedChat] = useState(1)
  const [message, setMessage] = useState("")

  const currentContact = contacts.find(c => c.id === selectedChat) || contacts[0]

  return (
    <div className="h-full flex">
      <div className="w-80 border-r border-border flex flex-col flex-shrink-0">
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">消息</h2>
            <Btn variant="ghost" size="xs"><Plus className="w-4 h-4" /></Btn>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="搜索消息..." className="w-full pl-9 pr-3 py-2 bg-muted border border-transparent rounded-lg text-sm focus:outline-none focus:border-primary transition-colors" />
          </div>
        </div>

        <div className="flex border-b border-border">
          <button onClick={() => setActiveTab("private")} className={cn("flex-1 py-2 text-sm font-medium transition-colors", activeTab === "private" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground")}>
            私聊
            <Badge variant="muted" className="ml-1">{contacts.length}</Badge>
          </button>
          <button onClick={() => setActiveTab("group")} className={cn("flex-1 py-2 text-sm font-medium transition-colors", activeTab === "group" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground")}>
            群聊
            <Badge variant="muted" className="ml-1">{groups.length}</Badge>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {activeTab === "private" ? (
            contacts.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedChat(c.id)}
                className={cn("w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left", selectedChat === c.id ? "bg-primary/10" : "hover:bg-muted/50")}
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-primary/15 text-primary text-sm font-semibold flex items-center justify-center">
                    {c.name[0]}
                  </div>
                  {c.online && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-card" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{c.name}</span>
                    {(c.unread ?? 0) > 0 && <Badge variant="danger">{c.unread}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{c.lastMsg}</p>
                </div>
              </button>
            ))
          ) : (
            groups.map(g => (
              <button
                key={g.id}
                onClick={() => setSelectedChat(g.id)}
                className={cn("w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left", selectedChat === g.id ? "bg-primary/10" : "hover:bg-muted/50")}
              >
                <div className="w-10 h-10 rounded-full bg-cyan-500/15 text-cyan-400 text-sm font-semibold flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{g.name}</span>
                    {g.unread > 0 && <Badge variant="danger">{g.unread}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{g.lastMsg}</p>
                  <p className="text-[10px] text-muted-foreground">{g.members} 位成员</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="h-14 border-b border-border flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-primary/15 text-primary text-sm font-semibold flex items-center justify-center">
                {currentContact.name[0]}
              </div>
              {currentContact.online && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-card" />}
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">{currentContact.name}</div>
              <div className="text-[10px] text-muted-foreground">{currentContact.role}</div>
            </div>
          </div>
          <Btn variant="ghost" size="xs"><MoreVertical className="w-4 h-4" /></Btn>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatMessages.map(msg => (
            <div key={msg.id} className={cn("flex gap-3", msg.isMine && "flex-row-reverse")}>
              <div className={cn("w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-semibold", msg.isMine ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")}>
                {msg.avatar[0]}
              </div>
              <div className={cn("max-w-[70%]", msg.isMine ? "text-right" : "text-left")}>
                <div className={cn("text-xs text-muted-foreground mb-1", msg.isMine && "mr-1")}>{msg.sender}</div>
                <div className={cn("px-3 py-2 rounded-2xl text-sm", msg.isMine ? "bg-primary text-primary-foreground rounded-br-md" : "bg-card border border-border rounded-bl-md")}>
                  {msg.file ? (
                    <div className="flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-muted-foreground" />
                      <span>{msg.file}</span>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
                <div className={cn("text-[10px] text-muted-foreground mt-1", msg.isMine && "mr-1")}>{msg.time}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="h-14 border-t border-border flex items-center gap-2 px-4">
          <Btn variant="ghost" size="sm"><Paperclip className="w-4 h-4" /></Btn>
          <input
            type="text"
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="输入消息..."
            className="flex-1 px-3 py-2 bg-muted border border-transparent rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
          />
          <Btn variant="primary" size="sm" disabled={!message.trim()}><Send className="w-4 h-4" /></Btn>
        </div>
      </div>
    </div>
  )
}