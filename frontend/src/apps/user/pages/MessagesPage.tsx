import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Paperclip, Send, MoreVertical, Trash2, AlertCircle, Clock, CheckCircle2, AtSign, Image, FileText, Smile, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { conversationApi } from "../../../lib/api";
import type { Conversation, Message, ConversationMember } from "../../../lib/types";
import { cn } from "@/lib/utils";
import { useAuth } from "../../../lib/auth";
import { useWebSocket } from "../../../hooks/useWebSocket";
import { toast } from "sonner";

export function MessagesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"private" | "group">("private");
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [groupAnnouncement, setGroupAnnouncement] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [groupMembers, setGroupMembers] = useState<ConversationMember[]>([]);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState("");
  const [showFileUploadDialog, setShowFileUploadDialog] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchConversations();
  }, [activeTab]);

  useEffect(() => {
    if (selectedChat) {
      setCurrentPage(1);
      fetchMessages(selectedChat);
      conversationApi.markAsRead(selectedChat).catch(() => {});
      fetchGroupMembers();
    }
  }, [selectedChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectedConversation = conversations.find(c => c.id === selectedChat);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "@" && selectedConversation?.type === "group") {
        setShowMentionMenu(true);
      }
    };
    inputRef.current?.addEventListener("keydown", handleKeyDown);
    return () => inputRef.current?.removeEventListener("keydown", handleKeyDown);
  }, [selectedConversation?.type]);

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    if (container.scrollTop === 0 && hasMore && !isLoadingMore) {
      setIsLoadingMore(true);
      setCurrentPage(prev => prev + 1);
      fetchMessages(selectedChat!, currentPage + 1);
    }
  }, [hasMore, isLoadingMore, selectedChat, currentPage]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  const fetchConversations = async () => {
    setIsLoading(true);
    try {
      const result = await conversationApi.getList();
      const convList = result as Conversation[];
      const filteredList = activeTab === "private" 
        ? convList.filter(c => c.type === "direct")
        : convList.filter(c => c.type === "group");
      setConversations(filteredList);
      if (filteredList.length > 0 && !selectedChat) {
        setSelectedChat(filteredList[0].id);
      }
    } catch {
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (conversationId: number, page: number = 1) => {
    try {
      const result = await conversationApi.getMessages(conversationId, { page, page_size: 50 });
      const data = result as any;
      const newMessages = data.messages || data;
      
      if (page === 1) {
        setMessages(newMessages);
        setHasMore(newMessages.length >= 50);
      } else {
        setMessages(prev => [...newMessages, ...prev]);
        setHasMore(newMessages.length >= 50);
      }
      setIsLoadingMore(false);
    } catch {
      setIsLoadingMore(false);
    }
  };

  const fetchGroupMembers = async () => {
    if (!selectedChat || selectedConversation?.type !== "group") return;
    try {
      const conv = await conversationApi.getDetail(selectedChat);
      setGroupMembers(conv.members || []);
    } catch {
      setGroupMembers([]);
    }
  };

  const handleSearchMessages = async () => {
    if (!searchKeyword.trim() || !selectedChat) return;
    
    setIsSearching(true);
    try {
      const results = await conversationApi.searchMessages(selectedChat, searchKeyword);
      setSearchResults(results);
      setShowSearchResults(true);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchKeyword("");
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const renderMessage = (msg: Message) => (
    <div key={msg.id} className={cn("flex gap-2 group", msg.sender_id === user?.id ? "justify-end" : "justify-start")}>
      {msg.sender_id !== user?.id && (
        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center flex-shrink-0">
          {msg.sender_name.charAt(0)}
        </div>
      )}
      <div className={cn("max-w-[70%]")}>
        <div className={cn("px-3 py-2 rounded-lg text-sm", msg.sender_id === user?.id ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")}>
          {msg.recalled ? (
            <span className="text-muted-foreground">[消息已撤回]</span>
          ) : (
            <>
              {msg.message_type === "image" && msg.content ? (
                <img 
                  src={msg.content} 
                  alt="图片消息"
                  className="max-w-full max-h-48 rounded cursor-pointer"
                  onClick={() => {
                    setPreviewImageUrl(msg.content);
                    setShowImagePreview(true);
                  }}
                />
              ) : (
                msg.content
              )}
              {msg.audit_status && msg.audit_status !== "passed" && (
                <div className="flex items-center gap-1 mt-1 text-xs">
                  {getAuditStatusIcon(msg.audit_status)}
                  <span className={cn({
                    "text-red-500": msg.audit_status === "blocked",
                    "text-yellow-500": msg.audit_status === "reviewing",
                  })}>
                    {getAuditStatusText(msg.audit_status)}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
        {msg.file_name && !msg.recalled && msg.message_type !== "image" && (
          <div className={cn("mt-1 p-2 bg-muted/50 rounded flex items-center gap-2")}>
            {msg.file_name.match(/\.(pdf|doc|docx)$/i) ? (
              <FileText className="w-4 h-4 text-blue-500" />
            ) : (
              <Paperclip className="w-4 h-4 text-muted-foreground" />
            )}
            <span className="text-xs text-foreground">{msg.file_name}</span>
            {msg.file_size && (
              <span className="text-[10px] text-muted-foreground">({formatFileSize(msg.file_size)})</span>
            )}
            <Button variant="ghost" size="icon" className="ml-auto h-6 w-6">
              <Download className="w-3 h-3" />
            </Button>
          </div>
        )}
        <div className="flex items-center justify-between mt-1">
          <p className="text-[10px] text-muted-foreground">{formatDate(msg.created_at)}</p>
          {msg.sender_id === user?.id && !msg.recalled && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1 rounded hover:bg-muted/50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="w-3 h-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuItem onClick={() => handleRecallMessage(msg.id)} className="text-red-500">
                  <Trash2 className="w-3 h-3 mr-2" />
                  撤回消息
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  );

  const emojis = [
    "1F604", "1F60A", "1F60D", "1F618", "1F61A", "1F64F", "1F914", "1F44D",
    "1F389", "1F389", "2728", "1F389", "1F389", "1F389", "1F389", "1F389",
    "1F44B", "1F64C", "1F64F", "2764", "1F5A4", "2728", "1F31F", "1F339",
    "1F34E", "1F354", "1F355", "1F370", "1F37B", "1F381", "1F389", "1F3C6",
    "1F408", "1F412", "1F426", "1F43A", "1F43B", "1F577", "1F6B4", "1F6B6",
    "1F308", "1F30A", "1F31D", "1F31E", "1F324", "2600", "26C4", "26F2",
  ];

  const getEmoji = (code: string) => String.fromCodePoint(parseInt(code, 16));

  const handleSelectEmoji = (emoji: string) => {
    setMessage(prev => prev + emoji);
    inputRef.current?.focus();
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedChat) return;

    try {
      const result = await conversationApi.sendMessage(selectedChat, "text", message);
      setMessage("");
      const data = result as any;
      const newMsg = data.message || data;
      if (newMsg) {
        setMessages(prev => [newMsg, ...prev]);
      }
      fetchConversations();
    } catch {}
  };

  const handleRecallMessage = async (messageId: number) => {
    try {
      await conversationApi.recallMessage(messageId);
      fetchMessages(selectedChat!);
      fetchConversations();
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || "撤回消息失败";
      toast.error(msg);
    }
  };

  const handleMention = (member: ConversationMember) => {
    setMessage(prev => prev + `@${member.nickname || member.username} `);
    setShowMentionMenu(false);
    inputRef.current?.focus();
  };

  const handleFileUpload = async (file: File) => {
    if (!selectedChat) return;
    
    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";
      const accessToken = localStorage.getItem("gdigi_access_token");
      
      const response = await fetch(`${BASE_URL}/files/upload`, {
        method: "POST",
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: formData,
      });
      
      const result = await response.json();
      if (result.code === 0 && result.data?.id) {
        const fileType = file.type.startsWith("image/") ? "image" : "file";
        const sendResult = await conversationApi.sendMessage(selectedChat, fileType, file.name, result.data.id);
        const sendData = sendResult as any;
        const newMsg = sendData.message || sendData;
        if (newMsg) {
          setMessages(prev => [newMsg, ...prev]);
        }
        fetchConversations();
      }
    } catch {} finally {
      setUploadingFile(false);
      setShowFileUploadDialog(false);
    }
  };

  const handleNewMessage = (newMessage: Message) => {
    console.log("handleNewMessage called:", newMessage);
    if (newMessage.conversation_id === selectedChat) {
      setMessages(prev => [newMessage, ...prev]);
    }
    fetchConversations();
  };

  const handleMessageRecalled = (messageId: number) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, recalled: true, content: "[消息已撤回]" } : msg
    ));
  };

  const handleMessageRead = (conversationId: number) => {
    if (conversationId === selectedChat) {
      setMessages(prev => prev.map(msg => ({ ...msg, read: true })));
    }
    fetchConversations();
  };

  const handleConversationUpdated = () => {
    fetchConversations();
  };

  const handleFriendApplication = () => {
    window.dispatchEvent(new Event("friend_application_received"));
  };

  useWebSocket({
    onNewMessage: handleNewMessage,
    onMessageRecalled: handleMessageRecalled,
    onMessageRead: handleMessageRead,
    onConversationUpdated: handleConversationUpdated,
    onFriendApplication: handleFriendApplication,
  });

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

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getAuditStatusIcon = (auditStatus?: string) => {
    switch (auditStatus) {
      case "blocked":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "reviewing":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "passed":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      default:
        return null;
    }
  };

  const getAuditStatusText = (auditStatus?: string) => {
    switch (auditStatus) {
      case "blocked":
        return "已拦截";
      case "reviewing":
        return "审核中";
      case "passed":
        return "已通过";
      default:
        return "";
    }
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
                  {c.unread_count > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                      {c.unread_count > 99 ? "99+" : c.unread_count}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{getConversationName(c)}</span>
                    <span className="text-[10px] text-muted-foreground">{c.last_message?.created_at ? formatTime(c.last_message.created_at) : ""}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {c.last_message?.recalled ? "[消息已撤回]" : c.last_message?.content || "暂无消息"}
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
              <div className="flex-1 max-w-xs mx-4">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={e => setSearchKeyword(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSearchMessages()}
                    placeholder="搜索消息..."
                    className="w-full pl-7 pr-8 py-1.5 bg-muted border border-transparent rounded-lg text-xs focus:outline-none focus:border-primary"
                  />
                  {searchKeyword && (
                    <button onClick={handleClearSearch} className="absolute right-2 top-1/2 -translate-y-1/2">
                      <X className="w-3 h-3 text-muted-foreground" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedConversation.type === "group" && (
                  <>
                    {/* 公告查看（所有人可见） */}
                    <Dialog open={showAnnouncement} onOpenChange={setShowAnnouncement}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 px-2">
                          公告
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>群公告</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="text-sm text-muted-foreground">
                            {groupAnnouncement || "暂无公告"}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    {/* 公告编辑（仅群主和管理员） */}
                    {selectedConversation.members?.some(
                      m => m.user_id === user?.id && ["owner", "admin"].includes(m.role || "")
                    ) && (
                      <div className="space-y-4 mt-4">
                        <textarea
                          value={groupAnnouncement}
                          onChange={e => setGroupAnnouncement(e.target.value)}
                          placeholder="输入群公告内容..."
                          className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:border-primary resize-none"
                          rows={4}
                        />
                        <Button className="w-full">发布公告</Button>
                      </div>
                    )}
                  </>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                      <MoreVertical className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>清空记录</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4"
            >
              {showSearchResults ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs text-muted-foreground">搜索结果 ({searchResults.length} 条)</p>
                    <button onClick={handleClearSearch} className="text-xs text-primary hover:underline">
                      返回全部消息
                    </button>
                  </div>
                  {isSearching ? (
                    <div className="text-center py-8">
                      <Clock className="w-5 h-5 inline animate-spin text-muted-foreground" />
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">未找到相关消息</p>
                    </div>
                  ) : (
                    searchResults.map(msg => renderMessage(msg))
                  )}
                </>
              ) : (
                <>
                  {isLoadingMore && (
                    <div className="text-center py-2">
                      <Clock className="w-4 h-4 inline animate-spin text-muted-foreground" />
                    </div>
                  )}
                  {[...messages].reverse().map(msg => renderMessage(msg))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            <div className="p-4 border-t border-border">
              <div className="relative">
                {showMentionMenu && selectedConversation.type === "group" && (
                  <div className="absolute bottom-full left-0 mb-2 w-64 bg-background border border-border rounded-lg shadow-lg overflow-hidden">
                    <div className="p-2 border-b border-border">
                      <p className="text-xs font-medium text-muted-foreground">选择要@的成员</p>
                    </div>
                    <div className="max-h-40 overflow-y-auto">
                      {groupMembers.map(member => (
                        <button
                          key={member.user_id}
                          onClick={() => handleMention(member)}
                          className="w-full flex items-center gap-2 p-2 hover:bg-muted/50 transition-colors text-left"
                        >
                          <div className="w-7 h-7 rounded-full bg-cyan-500/15 text-cyan-400 text-xs flex items-center justify-center">
                            {(member.nickname || member.username || "?").charAt(0)}
                          </div>
                          <span className="text-sm">{member.nickname || member.username}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {showEmojiPicker && (
                  <div className="absolute bottom-full right-0 mb-2 w-64 bg-background border border-border rounded-lg shadow-lg p-3">
                    <div className="grid grid-cols-8 gap-1">
                      {emojis.map((code, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            handleSelectEmoji(getEmoji(code));
                            setShowEmojiPicker(false);
                          }}
                          className="text-xl hover:bg-muted rounded transition-colors"
                        >
                          {getEmoji(code)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Dialog open={showFileUploadDialog} onOpenChange={setShowFileUploadDialog}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-9 w-9">
                        <Paperclip className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>上传文件</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                          <input
                            type="file"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(file);
                            }}
                            className="hidden"
                            id="file-upload"
                          />
                          <label htmlFor="file-upload" className="cursor-pointer">
                            <FileText className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm text-foreground">点击或拖拽文件到此处</p>
                            <p className="text-xs text-muted-foreground mt-1">支持图片、文档等格式</p>
                          </label>
                        </div>
                        {uploadingFile && (
                          <div className="text-center">
                            <Clock className="w-6 h-6 mx-auto animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground mt-2">上传中...</p>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9"
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = "image/*";
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) handleFileUpload(file);
                      };
                      input.click();
                    }}
                  >
                    <Image className="w-4 h-4" />
                  </Button>

                  {selectedConversation.type === "group" && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9"
                      onClick={() => setShowMentionMenu(!showMentionMenu)}
                    >
                      <AtSign className="w-4 h-4" />
                    </Button>
                  )}

                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  >
                    <Smile className="w-4 h-4" />
                  </Button>

                  <input
                    ref={inputRef}
                    type="text"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSendMessage()}
                    placeholder="输入消息..."
                    className="flex-1 px-3 py-2 bg-muted border border-transparent rounded-lg text-sm focus:outline-none focus:border-primary"
                    onClick={() => setShowMentionMenu(false)}
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
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <p>选择一个会话开始聊天</p>
          </div>
        )}
      </div>

      <Dialog open={showImagePreview} onOpenChange={setShowImagePreview}>
        <DialogContent className="max-w-3xl max-h-[80vh] p-0">
          <img 
            src={previewImageUrl} 
            alt="图片预览"
            className="max-w-full max-h-[80vh] rounded-lg"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}