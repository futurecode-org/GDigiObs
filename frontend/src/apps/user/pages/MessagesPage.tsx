import { useState } from "react"
import { Search, Paperclip, Send, MoreVertical } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { chatMessages, contacts, groups } from "@/lib/mockData"
import { cn } from "@/lib/utils"

export function MessagesPage() {
  const [activeTab, setActiveTab] = useState<"private" | "group">("private")
  const [selectedChat, setSelectedChat] = useState(1)
  const [message, setMessage] = useState("")

  const chatList = activeTab === "private" ? contacts : groups
  const currentContact = contacts.find(c => c.id === selectedChat) || contacts[0]

  return (
    <div className="h-full flex">
      <div className="w-72 border-r border-border flex flex-col">
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="搜索..."
              className="w-full pl-9 pr-3 py-2 bg-muted border border-transparent rounded-lg text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div className="flex gap-1 mt-3">
            <button
              onClick={() => setActiveTab("private")}
              className={cn("flex-1 py-1.5 text-xs rounded transition-colors", activeTab === "private" ? "bg-primary/10 text-primary" : "text-muted-foreground")}
            >
              私聊
            </button>
            <button
              onClick={() => setActiveTab("group")}
              className={cn("flex-1 py-1.5 text-xs rounded transition-colors", activeTab === "group" ? "bg-primary/10 text-primary" : "text-muted-foreground")}
            >
              群聊
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {chatList.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedChat(c.id)}
              className={cn("w-full flex items-center gap-3 p-3 transition-colors text-left", selectedChat === c.id ? "bg-primary/10" : "hover:bg-muted/50")}
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-cyan-500/15 text-cyan-400 text-sm font-semibold flex items-center justify-center">
                  {c.name[0]}
                </div>
                {"online" in c && c.online && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-card" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{c.name}</span>
                  {(c.unread ?? 0) > 0 && <Badge variant="destructive">{c.unread}</Badge>}
                </div>
                <p className="text-xs text-muted-foreground truncate">{c.lastMsg}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="h-14 px-4 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-cyan-500/15 text-cyan-400 text-sm font-semibold flex items-center justify-center">
              {currentContact.name[0]}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{currentContact.name}</p>
              <p className="text-xs text-muted-foreground">{"role" in currentContact ? currentContact.role : ""}</p>
            </div>
          </div>
          <button className="p-2 rounded-lg hover:bg-muted transition-colors">
            <MoreVertical className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {chatMessages.map(msg => (
            <div key={msg.id} className={cn("flex gap-2", msg.isMine ? "justify-end" : "justify-start")}>
              {!msg.isMine && (
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center flex-shrink-0">
                  {msg.avatar}
                </div>
              )}
              <div className={cn("max-w-[70%]", msg.isMine ? "order-1" : "")}>
                <div className={cn("px-3 py-2 rounded-lg text-sm", msg.isMine ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")}>
                  {msg.content}
                </div>
                {msg.file && (
                  <div className={cn("mt-1 p-2 bg-muted/50 rounded flex items-center gap-2", !msg.isMine && "ml-0")}>
                    <Paperclip className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-foreground">{msg.file}</span>
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground mt-1">{msg.time}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-muted transition-colors">
              <Paperclip className="w-4 h-4 text-muted-foreground" />
            </button>
            <input
              type="text"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="输入消息..."
              className="flex-1 px-3 py-2 bg-muted border border-transparent rounded-lg text-sm focus:outline-none focus:border-primary"
            />
            <button className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
