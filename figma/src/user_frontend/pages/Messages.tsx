import { useState, useRef } from "react"
import {
  Search, Send, Paperclip, SmilePlus, Image, AtSign,
  FileText, Download, Info
} from "lucide-react"
import { cn } from "@/shared/utils"
import { Btn } from "@/shared/ui"
import { contacts, groups, chatMessages } from "@/shared/mockData"

export function MessagesPage() {
  const [activeContact, setActiveContact] = useState(contacts[0])
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState(chatMessages)
  const [tab, setTab] = useState<"chats" | "groups">("chats")
  const msgEndRef = useRef<HTMLDivElement>(null)

  const sendMsg = () => {
    if (!input.trim()) return
    setMessages(prev => [...prev, { id: Date.now(), sender: "我", avatar: "我", content: input, time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }), isMine: true }])
    setInput("")
    setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50)
  }

  return (
    <div className="h-full flex">
      {/* Contact List */}
      <div className="w-64 border-r border-border flex flex-col flex-shrink-0">
        <div className="p-3 border-b border-border">
          <div className="flex gap-2 mb-2">
            {(["chats", "groups"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} className={cn("flex-1 py-1 text-xs rounded font-medium transition-colors",
                tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}>
                {t === "chats" ? "联系人" : "群聊"}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input className="w-full bg-muted border-none rounded px-3 py-1.5 pl-7 text-xs focus:outline-none text-foreground placeholder:text-muted-foreground" placeholder="搜索..." />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {tab === "chats" ? contacts.map(c => (
            <button key={c.id} onClick={() => setActiveContact(c)} className={cn(
              "w-full flex items-center gap-3 p-3 text-left hover:bg-secondary transition-colors",
              activeContact.id === c.id && "bg-secondary"
            )}>
              <div className="relative flex-shrink-0">
                <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/25 flex items-center justify-center text-sm font-semibold text-primary">
                  {c.name[0]}
                </div>
                {c.online && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-background" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">{c.name}</span>
                  {c.unread ? <span className="bg-primary text-primary-foreground text-[10px] rounded-full px-1.5 py-0.5 min-w-[18px] text-center">{c.unread}</span> : null}
                </div>
                <div className="text-xs text-muted-foreground truncate">{c.lastMsg}</div>
              </div>
            </button>
          )) : groups.map(g => (
            <button key={g.id} className="w-full flex items-center gap-3 p-3 text-left hover:bg-secondary transition-colors">
              <div className="w-9 h-9 rounded-full bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center text-sm font-semibold text-cyan-400">
                群
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">{g.name}</span>
                  {g.unread ? <span className="bg-primary text-primary-foreground text-[10px] rounded-full px-1.5 py-0.5 min-w-[18px] text-center">{g.unread}</span> : null}
                </div>
                <div className="text-xs text-muted-foreground truncate">{g.lastMsg}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-14 border-b border-border flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary">
              {activeContact.name[0]}
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">{activeContact.name}</div>
              <div className="text-xs text-muted-foreground">{activeContact.role}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Btn variant="ghost" size="xs"><Search className="w-4 h-4" /></Btn>
            <Btn variant="ghost" size="xs"><Info className="w-4 h-4" /></Btn>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(m => (
            <div key={m.id} className={cn("flex gap-3", m.isMine && "flex-row-reverse")}>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0",
                m.isMine ? "bg-primary/20 text-primary" : "bg-cyan-500/15 text-cyan-400"
              )}>
                {m.avatar}
              </div>
              <div className={cn("max-w-xs space-y-1", m.isMine && "items-end flex flex-col")}>
                {(m as { file?: string }).file ? (
                  <div className={cn("px-3 py-2.5 rounded-lg border text-sm", m.isMine ? "bg-primary/20 border-primary/30 text-foreground" : "bg-card border-border text-foreground")}>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <span className="text-xs">{(m as { file?: string }).file}</span>
                      <Download className="w-3.5 h-3.5 text-muted-foreground cursor-pointer hover:text-foreground" />
                    </div>
                  </div>
                ) : (
                  <div className={cn("px-3 py-2 rounded-lg text-sm leading-relaxed", m.isMine ? "bg-primary text-primary-foreground" : "bg-card border border-border text-foreground")}>
                    {m.content}
                  </div>
                )}
                <div className="text-[10px] text-muted-foreground px-1">{m.time}</div>
              </div>
            </div>
          ))}
          <div ref={msgEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-2 mb-2">
            <Btn variant="ghost" size="xs"><SmilePlus className="w-4 h-4" /></Btn>
            <Btn variant="ghost" size="xs"><Image className="w-4 h-4" /></Btn>
            <Btn variant="ghost" size="xs"><Paperclip className="w-4 h-4" /></Btn>
            <Btn variant="ghost" size="xs"><AtSign className="w-4 h-4" /></Btn>
          </div>
          <div className="flex gap-2">
            <input
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMsg()}
              className="flex-1 bg-input-background border border-border rounded px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              placeholder="输入消息... (Enter 发送)"
            />
            <Btn onClick={sendMsg} disabled={!input.trim()}>
              <Send className="w-4 h-4" />
            </Btn>
          </div>
        </div>
      </div>
    </div>
  )
}
