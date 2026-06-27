import { useState, useEffect } from "react";
import { Search, Paperclip, Send, MoreVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { conversationApi } from "../../../lib/api";
import type { Conversation, Message } from "../../../lib/types";
import { cn } from "@/lib/utils";
import { useAuth } from "../../../lib/auth";

export function MessagesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"private" | "group">("private");
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, [activeTab]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat);
    }
  }, [selectedChat]);

  const fetchConversations = async () => {
    setIsLoading(true);
    try {
      const result = await conversationApi.getList();
      const convList = result as Conversation[];
      setConversations(convList);
      if (convList.length > 0 && !selectedChat) {
        setSelectedChat(convList[0].id);
      }
    } catch {
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (conversationId: number) => {
    try {
      const result = await conversationApi.getMessages(conversationId, { page: 1, page_size: 50 });
      setMessages(result as Message[]);
    } catch {
      setMessages([]);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedChat) return;

    try {
      await conversationApi.sendMessage(selectedChat, "text", message);
      setMessage("");
      fetchMessages(selectedChat);
      fetchConversations();
    } catch {}
  };

  const getConversationName = (conv: Conversation) => {
    if (conv.type === "group" && conv.name) return conv.name;
    
    const otherMember = conv.members.find(m => m.user_id !== user?.id);
    return otherMember?.nickname || otherMember?.username || "未知";
  };

  const getConversationAvatar = (conv: Conversation) => {
    if (conv.type === "group") return conv.name?.charAt(0) || "群";
    
    const otherMember = conv.members.find(m => m.user_id !== user?.id);
    const name = otherMember?.nickname || otherMember?.username || "未知";
    return name.charAt(0);
  };

  const selectedConversation = conversations.find(c => c.id === selectedChat);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  };

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
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
                  <div className="flex-1 space-y-1">
                    <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-3/4 bg-muted animate-pulse rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>暂无会话</p>
            </div>
          ) : (
            conversations.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedChat(c.id)}
                className={cn("w-full flex items-center gap-3 p-3 transition-colors text-left", selectedChat === c.id ? "bg-primary/10" : "hover:bg-muted/50")}
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-cyan-500/15 text-cyan-400 text-sm font-semibold flex items-center justify-center">
                    {getConversationAvatar(c)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{getConversationName(c)}</span>
                    {c.unread_count > 0 && <Badge variant="destructive">{c.unread_count}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {c.last_message?.content || "暂无消息"}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            <div className="h-14 px-4 flex items-center justify-between border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-cyan-500/15 text-cyan-400 text-sm font-semibold flex items-center justify-center">
                  {getConversationAvatar(selectedConversation)}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{getConversationName(selectedConversation)}</p>
                  <p className="text-xs text-muted-foreground">{selectedConversation.type === "group" ? "群聊" : "私聊"}</p>
                </div>
              </div>
              <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                <MoreVertical className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map(msg => (
                <div key={msg.id} className={cn("flex gap-2", msg.sender_id === user?.id ? "justify-end" : "justify-start")}>
                  {msg.sender_id !== user?.id && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center flex-shrink-0">
                      {msg.sender_name.charAt(0)}
                    </div>
                  )}
                  <div className={cn("max-w-[70%]")}>
                    <div className={cn("px-3 py-2 rounded-lg text-sm", msg.sender_id === user?.id ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")}>
                      {msg.content}
                    </div>
                    {msg.file_name && (
                      <div className={cn("mt-1 p-2 bg-muted/50 rounded flex items-center gap-2")}>
                        <Paperclip className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs text-foreground">{msg.file_name}</span>
                      </div>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1">{formatTime(msg.created_at)}</p>
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
                  onKeyDown={e => e.key === "Enter" && handleSendMessage()}
                  placeholder="输入消息..."
                  className="flex-1 px-3 py-2 bg-muted border border-transparent rounded-lg text-sm focus:outline-none focus:border-primary"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <p>选择一个会话开始聊天</p>
          </div>
        )}
      </div>
    </div>
  );
}