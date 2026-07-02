import { useState, useEffect, useCallback } from "react"
import { Search, Plus, Settings, Play, Pause, Loader2, User, Bot, Send } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SectionHeader } from "@/shared/components/SectionHeader"
import { API_BASE_URL, agentApi, difyApi, getAccessToken } from "@/lib/api"
import type { Agent, DifyApp, PaginatedData } from "@/lib/types"
import { cn } from "@/lib/utils"
import { RichMessageContent } from "@/shared/components/RichMessageContent"

export function AgentsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [difyAgents, setDifyAgents] = useState<DifyApp[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [chatInput, setChatInput] = useState("")
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([])
  const [difyConversationId, setDifyConversationId] = useState<string | undefined>()
  const [chatLoading, setChatLoading] = useState(false)

  const fetchAgents = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await agentApi.getList({ page: 1, page_size: 100 }) as PaginatedData<Agent>
      const difyResult = await difyApi.getApps({ use_as_digital_employee: true, page: 1, page_size: 100 }) as PaginatedData<DifyApp>
      setAgents(result.items)
      setDifyAgents(difyResult.items)
      if (!selectedAgent) {
        if (result.items.length > 0) {
          setSelectedAgent(`agent:${result.items[0].id}`)
        } else if (difyResult.items.length > 0) {
          setSelectedAgent(`dify:${difyResult.items[0].id}`)
        }
      }
    } catch (error) {
      console.error("获取数字员工列表失败:", error)
      setAgents([])
    } finally {
      setIsLoading(false)
    }
  }, [selectedAgent])

  useEffect(() => {
    fetchAgents()
  }, [fetchAgents])

  const agentItems = [
    ...agents.map(agent => ({ kind: "agent" as const, id: `agent:${agent.id}`, name: agent.name, status: agent.status, data: agent })),
    ...difyAgents.map(app => ({ kind: "dify" as const, id: `dify:${app.id}`, name: app.name, status: app.status, data: app })),
  ]
  const filteredAgents = agentItems.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()))
  const currentItem = agentItems.find(a => a.id === selectedAgent)
  const currentAgent = currentItem?.kind === "agent" ? currentItem.data : undefined
  const currentDifyAgent = currentItem?.kind === "dify" ? currentItem.data : undefined

  const statusLabels: Record<string, string> = { 
    enabled: "已启用", 
    disabled: "已禁用", 
    running: "运行中",
    pending: "待审核" 
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "enabled": case "running": return "bg-emerald-500"
      case "disabled": return "bg-gray-500"
      case "pending": return "bg-yellow-500"
      default: return "bg-gray-500"
    }
  }

  const getBgColor = (status: string) => {
    switch (status) {
      case "enabled": return "bg-primary/10 text-primary"
      case "running": return "bg-emerald-500/15 text-emerald-400"
      case "disabled": return "bg-muted text-muted-foreground"
      default: return "bg-muted text-muted-foreground"
    }
  }

  const handleToggleStatus = async (agent: Agent) => {
    try {
      if (agent.status === "enabled") {
        await agentApi.update(agent.id, { status: "disabled" })
      } else {
        await agentApi.update(agent.id, { status: "enabled" })
      }
      fetchAgents()
    } catch (error) {
      console.error("切换状态失败:", error)
    }
  }

  const handleDifyChat = async () => {
    if (!currentDifyAgent || !chatInput.trim()) return
    const question = chatInput.trim()
    setChatInput("")
    setChatMessages(prev => [...prev, { role: "user", content: question }])
    setChatLoading(true)
    try {
      if (currentDifyAgent.response_mode === "streaming") {
        const assistantIndex = chatMessages.length + 1
        setChatMessages(prev => [...prev, { role: "assistant", content: "" }])
        const response = await fetch(`${API_BASE_URL}/dify/apps/${currentDifyAgent.id}/stream`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {}),
          },
          body: JSON.stringify({
            inputs: {},
            query: question,
            conversation_id: difyConversationId,
            scene: "digital_employee",
          }),
        })
        if (!response.ok || !response.body) throw new Error("stream failed")
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ""
        let answer = ""
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const events = buffer.split("\n\n")
          buffer = events.pop() || ""
          for (const rawEvent of events) {
            const line = rawEvent.split("\n").find(item => item.startsWith("data:"))
            if (!line) continue
            const event = JSON.parse(line.slice(5))
            if (event.conversation_id) setDifyConversationId(event.conversation_id)
            const chunk = event.answer || event.data?.answer || ""
            if (chunk) {
              answer += chunk
              setChatMessages(prev => prev.map((msg, index) => index === assistantIndex ? { ...msg, content: answer } : msg))
            }
          }
        }
        if (!answer) {
          setChatMessages(prev => prev.map((msg, index) => index === assistantIndex ? { ...msg, content: "Dify 应用未返回内容" } : msg))
        }
        return
      }
      const result = await difyApi.chatDigitalEmployee(currentDifyAgent.id, {
        message: question,
        conversation_id: difyConversationId,
      })
      if (result.conversation_id) {
        setDifyConversationId(result.conversation_id)
      }
      setChatMessages(prev => [...prev, { role: "assistant", content: result.answer || "Dify 应用未返回内容" }])
    } catch (error) {
      setChatMessages(prev => [...prev, { role: "assistant", content: "调用 Dify 失败，请稍后重试。" }])
    } finally {
      setChatLoading(false)
    }
  }

  return (
    <div className="h-full flex">
      {/* 左侧数字员工列表 */}
      <div className="w-80 border-r border-border flex flex-col flex-shrink-0">
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">数字员工</h2>
            <Button size="icon-xs" title="创建数字员工">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜索数字员工..."
              className="w-full pl-9 pr-3 py-2 bg-muted border border-transparent rounded-lg text-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredAgents.length > 0 ? (
            filteredAgents.map(agent => (
              <button
                key={agent.id}
                onClick={() => {
                  setSelectedAgent(agent.id)
                  setChatMessages([])
                  setDifyConversationId(undefined)
                }}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors mb-1",
                  selectedAgent === agent.id ? "bg-primary/10" : "hover:bg-muted/50"
                )}
              >
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", getBgColor(agent.status))}>
                  {agent.kind === "dify" ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{agent.name}</p>
                    <span className={cn("w-2 h-2 rounded-full flex-shrink-0", getStatusColor(agent.status))} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {agent.kind === "dify" ? "Dify App" : ((agent.data as Agent).system_prompt ? "已配置" : "未配置")}
                  </p>
                </div>
              </button>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {searchQuery ? "未找到匹配的数字员工" : "暂无数字员工"}
            </div>
          )}
        </div>
      </div>

      {/* 右侧数字员工详情 */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : currentDifyAgent ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{currentDifyAgent.name}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <Badge variant={currentDifyAgent.status === "enabled" ? "secondary" : "outline"}>
                    Dify 数字员工
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {currentDifyAgent.app_type} · {currentDifyAgent.visibility}
                  </span>
                </div>
              </div>
            </div>

            <Card>
              <CardContent className="p-4">
                <SectionHeader title="对话" />
                <div className="h-80 overflow-y-auto rounded-lg border border-border p-3 space-y-3">
                  {chatMessages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-sm text-muted-foreground">开始与数字员工对话</div>
                  ) : (
                    chatMessages.map((msg, index) => (
                      <div key={index} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                        <div className={cn("max-w-[75%] rounded-lg px-3 py-2 text-sm", msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")}>
                          {msg.content ? <RichMessageContent content={msg.content} /> : <span className="text-muted-foreground">正在生成...</span>}
                        </div>
                      </div>
                    ))
                  )}
                  {chatLoading && <div className="text-xs text-muted-foreground">正在生成回复...</div>}
                </div>
                <div className="mt-3 flex gap-2">
                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleDifyChat()}
                    placeholder="输入消息..."
                    className="flex-1 px-3 py-2 bg-muted border border-transparent rounded-lg text-sm focus:outline-none focus:border-primary"
                  />
                  <Button size="sm" onClick={handleDifyChat} disabled={chatLoading || !chatInput.trim()}>
                    {chatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : currentAgent ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{currentAgent.name}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <Badge variant={currentAgent.status === "enabled" ? "secondary" : "outline"}>
                    {statusLabels[currentAgent.status] || currentAgent.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    可见性: {currentAgent.visibility}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleToggleStatus(currentAgent)}
                >
                  {currentAgent.status === "enabled" ? (
                    <><Pause className="w-4 h-4 mr-1" /> 停止</>
                  ) : (
                    <><Play className="w-4 h-4 mr-1" /> 启动</>
                  )}
                </Button>
                <Button variant="ghost" size="sm">
                  <Settings className="w-4 h-4 mr-1" /> 配置
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">关联技能</p>
                  <p className="text-xl font-bold text-foreground">{currentAgent.skill_ids?.length || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">关联知识库</p>
                  <p className="text-xl font-bold text-foreground">{currentAgent.knowledge_base_ids?.length || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">关联工作流</p>
                  <p className="text-xl font-bold text-foreground">{currentAgent.workflow_ids?.length || 0}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-4">
                <SectionHeader title="角色配置" />
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <span className="text-sm text-muted-foreground">角色描述</span>
                    <span className="text-sm text-foreground max-w-[60%] truncate">
                      {currentAgent.role_description || "未配置"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <span className="text-sm text-muted-foreground">系统提示词</span>
                    <span className="text-sm text-foreground max-w-[60%] truncate">
                      {currentAgent.system_prompt ? "已配置" : "未配置"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <span className="text-sm text-muted-foreground">创建时间</span>
                    <span className="text-sm text-foreground">
                      {new Date(currentAgent.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <User className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>选择一个数字员工</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
