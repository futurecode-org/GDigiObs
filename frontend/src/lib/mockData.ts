export const activityData = [
  { date: "6/20", messages: 142, queries: 28, tasks: 12 },
  { date: "6/21", messages: 198, queries: 41, tasks: 18 },
  { date: "6/22", messages: 167, queries: 35, tasks: 9 },
  { date: "6/23", messages: 223, queries: 52, tasks: 22 },
  { date: "6/24", messages: 189, queries: 44, tasks: 15 },
  { date: "6/25", messages: 251, queries: 63, tasks: 28 },
  { date: "6/26", messages: 178, queries: 47, tasks: 19 },
]

export const sentimentData = [
  { name: "正向", value: 58, color: "#10b981" },
  { name: "中性", value: 29, color: "#5a7098" },
  { name: "负向", value: 13, color: "#ef4444" },
]

export const collectStats = [
  { date: "6/20", collected: 1240, cleaned: 1180, analyzed: 950 },
  { date: "6/21", collected: 1870, cleaned: 1720, analyzed: 1400 },
  { date: "6/22", collected: 1560, cleaned: 1490, analyzed: 1230 },
  { date: "6/23", collected: 2100, cleaned: 1980, analyzed: 1680 },
  { date: "6/24", collected: 1890, cleaned: 1810, analyzed: 1520 },
  { date: "6/25", collected: 2450, cleaned: 2300, analyzed: 1980 },
  { date: "6/26", collected: 2180, cleaned: 2050, analyzed: 1760 },
]

export const modelCallData = [
  { name: "GPT-4o", calls: 8420, tokens: 12800000, cost: 384 },
  { name: "Claude 3.5", calls: 5230, tokens: 9600000, cost: 288 },
  { name: "Qwen-Max", calls: 3890, tokens: 7200000, cost: 144 },
  { name: "Ollama-Llama3", calls: 2140, tokens: 4800000, cost: 0 },
]

export const chatMessages = [
  { id: 1, sender: "张伟", avatar: "张", content: "下午的数据分析会议时间改了，推迟到3点半", time: "14:02", isMine: false },
  { id: 2, sender: "我", avatar: "我", content: "收到，谢谢通知！", time: "14:05", isMine: true },
  { id: 3, sender: "张伟", avatar: "张", content: "这是最新的数据报告，请查阅", time: "14:08", isMine: false, file: "Q2数据分析报告.xlsx" },
  { id: 4, sender: "我", avatar: "我", content: "好的，我看完之后在会议上讨论", time: "14:10", isMine: true },
  { id: 5, sender: "张伟", avatar: "张", content: "另外，你们团队的智能问数功能用得怎么样？", time: "14:23", isMine: false },
  { id: 6, sender: "我", avatar: "我", content: "非常好用！昨天用它分析了上半年的舆情数据，自动生成图表，省了很多时间", time: "14:25", isMine: true },
  { id: 7, sender: "张伟", avatar: "张", content: "👍 那我们可以在会议上分享一下最佳实践", time: "14:26", isMine: false },
]

export const contacts = [
  { id: 1, name: "张伟", role: "数据分析师", online: true, unread: 0, lastMsg: "👍 那我们可以在会议上分享..." },
  { id: 2, name: "李娜", role: "产品经理", online: true, unread: 3, lastMsg: "Q2用户增长报告已经上传" },
  { id: 3, name: "王强", role: "技术负责人", online: false, lastMsg: "明天代码评审记得参加" },
  { id: 4, name: "陈磊", role: "运营专员", online: false, lastMsg: "[文件] 活动方案.pptx", unread: 0 },
  { id: 5, name: "赵芳", role: "UI设计师", online: true, unread: 1, lastMsg: "新版本设计稿已发" },
]

export const groups = [
  { id: 1, name: "数据平台团队", members: 12, unread: 5, lastMsg: "系统部署更新通知", online: true },
  { id: 2, name: "产品需求讨论", members: 8, unread: 0, lastMsg: "PRD已更新至v2.3" },
  { id: 3, name: "技术攻坚组", members: 6, unread: 2, lastMsg: "@全体成员 紧急Bug修复" },
  { id: 4, name: "运营监控群", members: 15, unread: 0, lastMsg: "今日数据指标正常" },
]

export const queryExamples = [
  "过去30天每日采集数据量趋势",
  "各平台负向情感数据占比",
  "本月活跃用户Top 10及消息数量",
  "近7天模型调用次数及Token消耗统计",
]

export const queryResult = {
  question: "过去7天每日采集数据量与清洗数据量对比",
  sql: `SELECT
  DATE(created_at) AS date,
  COUNT(*) AS collected_count,
  SUM(CASE WHEN is_cleaned = 1 THEN 1 ELSE 0 END) AS cleaned_count
FROM collected_data
WHERE tenant_id = :tenant_id
  AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY DATE(created_at)
ORDER BY date ASC`,
  explanation: "过去7天共采集数据 13,290 条，清洗完成 12,530 条（清洗率 94.3%）。最高采集量出现在 6/25，达 2,450 条。",
  data: collectStats,
}

export const knowledgeBases = [
  { id: 1, name: "企业内部政策库", type: "tenant", files: 48, status: "ready", updated: "2026-06-20" },
  { id: 2, name: "行业舆情分析规则", type: "personal", files: 12, status: "ready", updated: "2026-06-22" },
  { id: 3, name: "数据采集规范文档", type: "group", files: 23, status: "indexing", updated: "2026-06-25" },
  { id: 4, name: "AI问数最佳实践", type: "public", files: 31, status: "ready", updated: "2026-06-18" },
]

export const skills = [
  { id: 1, name: "网络数据爬取", type: "function_call", status: "enabled", calls: 1240, visibility: "tenant", updated: "2026-06-24" },
  { id: 2, name: "情感分析工具", type: "mcp", status: "enabled", calls: 3870, visibility: "public", updated: "2026-06-20" },
  { id: 3, name: "数据格式转换", type: "function_call", status: "enabled", calls: 892, visibility: "personal", updated: "2026-06-23" },
  { id: 4, name: "企业知识检索", type: "skill", status: "disabled", calls: 256, visibility: "tenant", updated: "2026-06-15" },
  { id: 5, name: "风险预警通知", type: "mcp", status: "pending_review", calls: 0, visibility: "public", updated: "2026-06-26" },
]

export const agents = [
  { id: 1, name: "舆情监控员", model: "GPT-4o", status: "enabled", runs: 248, successRate: 96.8, lastRun: "10分钟前" },
  { id: 2, name: "数据报告生成器", model: "Claude 3.5", status: "enabled", runs: 134, successRate: 99.2, lastRun: "1小时前" },
  { id: 3, name: "风险预警助手", model: "GPT-4o", status: "running", runs: 89, successRate: 94.4, lastRun: "运行中" },
  { id: 4, name: "竞品分析员", model: "Qwen-Max", status: "disabled", runs: 45, successRate: 91.1, lastRun: "3天前" },
]

export const adminUsers = [
  { id: 1, name: "张伟", email: "zhangwei@corp.com", role: "普通用户", tenant: "数智科技", dept: "数据部", status: "normal", loginAt: "2026-06-26 14:02" },
  { id: 2, name: "李娜", email: "lina@corp.com", role: "普通用户", tenant: "数智科技", dept: "产品部", status: "normal", loginAt: "2026-06-26 13:45" },
  { id: 3, name: "外部用户A", email: "extuser@gmail.com", role: "外部用户", tenant: "个人租户", dept: "-", status: "normal", loginAt: "2026-06-25 09:30" },
  { id: 4, name: "王强", email: "wangqiang@corp.com", role: "普通管理员", tenant: "数智科技", dept: "技术部", status: "normal", loginAt: "2026-06-26 10:15" },
  { id: 5, name: "陈磊", email: "chenlei@corp.com", role: "普通用户", tenant: "数智科技", dept: "运营部", status: "banned", loginAt: "2026-06-20 16:30" },
  { id: 6, name: "赵芳", email: "zhaofang@corp.com", role: "普通用户", tenant: "数智科技", dept: "设计部", status: "normal", loginAt: "2026-06-26 11:20" },
]

export const collectTasks = [
  { id: 1, name: "微博舆情监控", platform: "社交媒体", method: "API", status: "enabled", isPublic: true, lastRun: "2026-06-26 14:00", failCount: 0 },
  { id: 2, name: "行业新闻采集", platform: "新闻网站", method: "爬虫", status: "running", isPublic: true, lastRun: "2026-06-26 14:30", failCount: 0 },
  { id: 3, name: "RSS技术资讯", platform: "RSS", method: "RSS", status: "enabled", isPublic: false, lastRun: "2026-06-26 12:00", failCount: 0 },
  { id: 4, name: "论坛社区监控", platform: "论坛社区", method: "爬虫", status: "error", isPublic: false, lastRun: "2026-06-25 08:00", failCount: 3 },
  { id: 5, name: "竞品信息追踪", platform: "行业网站", method: "爬虫", status: "disabled", isPublic: false, lastRun: "2026-06-23 15:00", failCount: 1 },
]

export const modelList = [
  { id: 1, name: "GPT-4o", key: "gpt-4o", type: "llm", api: "openai", vision: true, tools: true, reasoning: false, context: 128000, status: "enabled", visibility: "platform" },
  { id: 2, name: "Claude 3.5 Sonnet", key: "claude-3-5-sonnet-20241022", type: "llm", api: "anthropic", vision: true, tools: true, reasoning: false, context: 200000, status: "enabled", visibility: "platform" },
  { id: 3, name: "Qwen-Max", key: "qwen-max", type: "llm", api: "openai", vision: false, tools: true, reasoning: false, context: 32000, status: "enabled", visibility: "tenant" },
  { id: 4, name: "Ollama Llama3", key: "llama3", type: "llm", api: "ollama", vision: false, tools: false, reasoning: false, context: 8000, status: "enabled", visibility: "platform" },
  { id: 5, name: "text-embedding-3-large", key: "text-embedding-3-large", type: "embedding", api: "openai", vision: false, tools: false, reasoning: false, context: 8191, status: "enabled", visibility: "platform" },
]

export const chatAuditRecords = [
  { id: 1, user: "外部用户A", content: "这个产品真的很差劲，客服态度极其恶劣！", risk: "low", type: "辱骂", status: "passed", time: "2026-06-26 14:10" },
  { id: 2, user: "匿名用户X", content: "[已拦截内容]", risk: "high", type: "违法违规", status: "blocked", time: "2026-06-26 13:58" },
  { id: 3, user: "陈磊", content: "你们有没有xxx的资源，快分享一下", risk: "medium", type: "涉黄", status: "reviewing", time: "2026-06-26 13:42" },
  { id: 4, user: "新用户001", content: "推广，私聊了解优惠", risk: "low", type: "广告", status: "passed", time: "2026-06-26 13:20" },
  { id: 5, user: "测试账号B", content: "[已拦截内容]", risk: "high", type: "涉政", status: "blocked", time: "2026-06-26 12:55" },
]

export const friendGroups = [
  {
    id: 1, name: "同事", friends: [
      { id: 1, name: "张伟", role: "数据分析师", online: true, unread: 0, lastSeen: "在线", avatar: "张" },
      { id: 3, name: "王强", role: "技术负责人", online: false, unread: 0, lastSeen: "1小时前", avatar: "王" },
      { id: 4, name: "陈磊", role: "运营专员", online: false, unread: 0, lastSeen: "昨天", avatar: "陈" },
    ]
  },
  {
    id: 2, name: "好友", friends: [
      { id: 2, name: "李娜", role: "产品经理", online: true, unread: 3, lastSeen: "在线", avatar: "李" },
      { id: 5, name: "赵芳", role: "UI设计师", online: true, unread: 1, lastSeen: "在线", avatar: "赵" },
    ]
  },
  {
    id: 3, name: "外部联系人", friends: [
      { id: 6, name: "刘洋", role: "合作方-数据顾问", online: false, unread: 0, lastSeen: "3天前", avatar: "刘" },
      { id: 7, name: "孙静", role: "外部用户", online: false, unread: 0, lastSeen: "1周前", avatar: "孙" },
    ]
  },
]

export const friendRequests = [
  { id: 1, name: "周明", role: "产品设计师", company: "云数据研究院", msg: "你好，我是周明，希望和您保持联系", time: "2026-06-26 10:23", status: "pending", avatar: "周", type: "incoming" },
  { id: 2, name: "吴刚", role: "数据工程师", company: "数智科技", msg: "同事推荐，加个好友方便沟通", time: "2026-06-25 16:40", status: "pending", avatar: "吴", type: "incoming" },
  { id: 3, name: "郑婷", role: "运营经理", company: "媒体观察", msg: "", time: "2026-06-24 09:15", status: "accepted", avatar: "郑", type: "outgoing" },
]

export const myTasks = [
  { id: 1, title: "完成Q2数据分析报告", type: "personal", priority: "high", status: "running", due: "2026-06-27", progress: 65, assignee: "自己" },
  { id: 2, title: "审核新闻采集规则配置", type: "personal", priority: "medium", status: "pending", due: "2026-06-28", progress: 0, assignee: "自己" },
  { id: 3, title: "整理知识库文档分类", type: "personal", priority: "low", status: "pending", due: "2026-06-30", progress: 0, assignee: "自己" },
  { id: 4, title: "舆情监控周报生成", type: "agent", priority: "high", status: "success", due: "2026-06-26", progress: 100, agent: "舆情监控员", runId: "run-20260626-001" },
  { id: 5, title: "竞品关键词趋势分析", type: "agent", priority: "medium", status: "failed", due: "2026-06-26", progress: 42, agent: "数据报告生成器", runId: "run-20260626-002" },
  { id: 6, title: "风险预警检测任务", type: "workflow", priority: "high", status: "running", due: "2026-06-26", progress: 78, workflow: "舆情风险工作流", runId: "wf-20260626-003" },
  { id: 7, title: "每日数据清洗流程", type: "workflow", priority: "low", status: "success", due: "2026-06-26", progress: 100, workflow: "数据清洗工作流", runId: "wf-20260625-007" },
]

export const myNotifications = [
  { id: 1, type: "friend_request", title: "好友申请", content: "周明 请求添加您为好友", time: "10分钟前", read: false, action: true, avatar: "周", from: "周明" },
  { id: 2, type: "friend_request", title: "好友申请", content: "吴刚 请求添加您为好友", time: "2小时前", read: false, action: true, avatar: "吴", from: "吴刚" },
  { id: 3, type: "friend_accepted", title: "好友申请已通过", content: "郑婷 接受了您的好友申请，现在可以发起聊天", time: "昨天 16:42", read: true, action: false, avatar: "郑", from: "郑婷" },
  { id: 4, type: "group_invite", title: "群聊邀请", content: "李娜 邀请您加入「产品创新讨论组」", time: "昨天 11:20", read: false, action: true, avatar: "李", from: "李娜", groupName: "产品创新讨论组" },
  { id: 5, type: "agent_done", title: "数字员工执行完成", content: "「舆情监控员」已完成周报生成任务，点击查看结果", time: "2026-06-26 09:00", read: true, action: false, avatar: "🤖", from: "" },
  { id: 6, type: "workflow_failed", title: "工作流执行失败", content: "「竞品分析工作流」在「模型节点」处执行失败，请检查配置", time: "2026-06-25 22:34", read: false, action: true, avatar: "⚠️", from: "" },
  { id: 7, type: "system", title: "系统通知", content: "您的账号已于 2026-06-25 完成实名认证", time: "2026-06-25 14:00", read: true, action: false, avatar: "🔔", from: "" },
  { id: 8, type: "kb_done", title: "知识库索引完成", content: "「数据采集规范文档」知识库已完成向量化，可以开始检索", time: "2026-06-25 11:45", read: true, action: false, avatar: "📚", from: "" },
  { id: 9, type: "audit_alert", title: "审计告警", content: "您发送的消息被系统标记为低风险，已记录审计日志", time: "2026-06-24 18:10", read: true, action: false, avatar: "🛡️", from: "" },
]

export const tenants = [
  { id: 1, name: "数智科技有限公司", type: "enterprise", status: "enabled", users: 48, admin: "超级管理员", created: "2025-01-15", data: "2.1 GB" },
  { id: 2, name: "云数据研究院", type: "enterprise", status: "enabled", users: 23, admin: "李院长", created: "2025-03-20", data: "890 MB" },
  { id: 3, name: "外部用户A (个人)", type: "personal", status: "enabled", users: 1, admin: "外部用户A", created: "2026-05-10", data: "12 MB" },
  { id: 4, name: "媒体观察集团", type: "enterprise", status: "disabled", users: 31, admin: "张总监", created: "2024-11-02", data: "1.4 GB" },
  { id: 5, name: "测试账号B (个人)", type: "personal", status: "disabled", users: 1, admin: "测试账号B", created: "2026-06-01", data: "2 MB" },
]

export const departments = [
  { id: 1, name: "数智科技有限公司", pid: null, members: 48, children: [
    { id: 2, name: "技术部", pid: 1, members: 16, children: [
      { id: 5, name: "前端组", pid: 2, members: 6, children: [] },
      { id: 6, name: "后端组", pid: 2, members: 7, children: [] },
      { id: 7, name: "算法组", pid: 2, members: 3, children: [] },
    ]},
    { id: 3, name: "数据部", pid: 1, members: 12, children: [
      { id: 8, name: "数据采集组", pid: 3, members: 4, children: [] },
      { id: 9, name: "数据分析组", pid: 3, members: 5, children: [] },
    ]},
    { id: 4, name: "产品运营部", pid: 1, members: 20, children: [
      { id: 10, name: "产品组", pid: 4, members: 8, children: [] },
      { id: 11, name: "运营组", pid: 4, members: 7, children: [] },
      { id: 12, name: "设计组", pid: 4, members: 5, children: [] },
    ]},
  ]},
]

export const deptMembers = [
  { id: 1, name: "张伟", email: "zhangwei@corp.com", dept: "数据分析组", post: "高级分析师", status: "normal" },
  { id: 2, name: "李娜", email: "lina@corp.com", dept: "产品组", post: "产品经理", status: "normal" },
  { id: 3, name: "王强", email: "wangqiang@corp.com", dept: "后端组", post: "技术负责人", status: "normal" },
  { id: 4, name: "陈磊", email: "chenlei@corp.com", dept: "运营组", post: "运营专员", status: "banned" },
  { id: 5, name: "赵芳", email: "zhaofang@corp.com", dept: "设计组", post: "UI设计师", status: "normal" },
]

export const roles = [
  { id: 1, name: "平台超级管理员", desc: "拥有全平台所有权限", users: 1, menus: 28, builtin: true },
  { id: 2, name: "租户管理员", desc: "管理本租户内所有资源", users: 3, menus: 22, builtin: true },
  { id: 3, name: "普通管理员", desc: "拥有部分后台模块管理权限", users: 8, menus: 14, builtin: true },
  { id: 4, name: "数据分析员", desc: "可访问数据中心所有模块", users: 12, menus: 8, builtin: false },
  { id: 5, name: "内容审核员", desc: "负责聊天消息和数据审计", users: 5, menus: 6, builtin: false },
  { id: 6, name: "只读观察员", desc: "仅可查看各模块数据", users: 20, menus: 18, builtin: false },
]

export const menuTree = [
  { key: "dashboard", label: "工作台", checked: true, children: [] },
  { key: "tenant", label: "租户管理", checked: true, children: [
    { key: "tenant-list", label: "租户列表", checked: true },
  ]},
  { key: "user", label: "用户权限", checked: true, children: [
    { key: "users", label: "用户管理", checked: true },
    { key: "roles", label: "角色管理", checked: true },
    { key: "perms", label: "权限管理", checked: false },
  ]},
  { key: "data", label: "数据中心", checked: true, children: [
    { key: "collect", label: "数据采集", checked: true },
    { key: "clean", label: "数据清洗", checked: true },
    { key: "analysis", label: "数据分析", checked: true },
    { key: "data-audit", label: "数据审计", checked: false },
  ]},
  { key: "ai", label: "AI 能力", checked: true, children: [
    { key: "models", label: "模型管理", checked: true },
    { key: "skills-admin", label: "技能管理", checked: false },
    { key: "agents-admin", label: "数字员工", checked: false },
  ]},
  { key: "audit", label: "审计风控", checked: false, children: [
    { key: "chat-audit", label: "聊天审计", checked: false },
    { key: "sensitive", label: "敏感词库", checked: false },
  ]},
  { key: "logs", label: "日志中心", checked: false, children: [
    { key: "op-logs", label: "操作日志", checked: false },
    { key: "audit-logs", label: "审计日志", checked: false },
  ]},
]

export const adminGroups = [
  { id: 1, name: "数据平台团队", members: 12, owner: "王强", type: "internal", status: "normal", msgs: 1284, created: "2025-08-10" },
  { id: 2, name: "产品需求讨论", members: 8, owner: "李娜", type: "internal", status: "normal", msgs: 873, created: "2025-09-15" },
  { id: 3, name: "技术攻坚组", members: 6, owner: "王强", type: "internal", status: "muted", msgs: 2341, created: "2026-01-05" },
  { id: 4, name: "运营监控群", members: 15, owner: "陈磊", type: "mixed", status: "normal", msgs: 456, created: "2026-03-20" },
  { id: 5, name: "外部协作群", members: 9, owner: "张伟", type: "mixed", status: "disabled", msgs: 128, created: "2026-05-01" },
]

export const cleanRules = [
  { id: 1, name: "微博舆情清洗规则", tasks: ["微博舆情监控"], caps: ["去重", "情感分析", "实体识别"], status: "enabled", lastRun: "2026-06-26 14:00", cleaned: 18420 },
  { id: 2, name: "新闻标准化规则", tasks: ["行业新闻采集"], caps: ["去重", "格式标准化", "分类打标", "敏感词过滤"], status: "enabled", lastRun: "2026-06-26 13:30", cleaned: 9340 },
  { id: 3, name: "论坛去重规则", tasks: ["论坛社区监控"], caps: ["去重", "HTML清理"], status: "enabled", lastRun: "2026-06-25 20:00", cleaned: 4520 },
  { id: 4, name: "竞品数据增强", tasks: ["竞品信息追踪"], caps: ["去重", "实体识别", "关键词提取"], status: "disabled", lastRun: "2026-06-23 15:00", cleaned: 1890 },
]

export const cleanHistory = [
  { id: 1, rule: "微博舆情清洗规则", status: "success", total: 1234, cleaned: 1180, failed: 0, startTime: "2026-06-26 14:00", endTime: "2026-06-26 14:02" },
  { id: 2, rule: "新闻标准化规则", status: "success", total: 567, cleaned: 542, failed: 0, startTime: "2026-06-26 13:30", endTime: "2026-06-26 13:31" },
  { id: 3, rule: "论坛去重规则", status: "error", total: 234, cleaned: 189, failed: 3, startTime: "2026-06-25 20:00", endTime: "2026-06-25 20:05" },
]

export const analysisTasks = [
  { id: 1, name: "微博情感趋势分析", type: "sentiment", status: "success", created: "2026-06-26 10:00", completed: "2026-06-26 10:15", records: 15420 },
  { id: 2, name: "竞品对比周报", type: "report", status: "running", created: "2026-06-26 09:00", completed: null, records: 8900 },
  { id: 3, name: "热点事件追踪", type: "tracking", status: "pending", created: "2026-06-26 08:00", completed: null, records: 0 },
  { id: 4, name: "舆情日报生成", type: "report", status: "success", created: "2026-06-25 18:00", completed: "2026-06-25 18:12", records: 12340 },
]

export const sensitiveWords = [
  { id: 1, word: "违禁词A", type: "politics", level: "high", action: "block", count: 45, updated: "2026-06-20" },
  { id: 2, word: "低俗内容B", type: "vulgar", level: "medium", action: "review", count: 128, updated: "2026-06-22" },
  { id: 3, word: "广告推销C", type: "ad", level: "low", action: "flag", count: 342, updated: "2026-06-18" },
  { id: 4, word: "涉黄内容D", type: "porn", level: "high", action: "block", count: 23, updated: "2026-06-15" },
  { id: 5, word: "谣言传播E", type: "rumor", level: "medium", action: "review", count: 67, updated: "2026-06-24" },
]

export const workflows = [
  { id: 1, name: "舆情风险工作流", type: "risk", nodes: 8, status: "enabled", runs: 245, successRate: 96.3, lastRun: "2026-06-26 14:30" },
  { id: 2, name: "数据清洗工作流", type: "data", nodes: 5, status: "enabled", runs: 1890, successRate: 99.1, lastRun: "2026-06-26 02:00" },
  { id: 3, name: "报告自动生成", type: "report", nodes: 12, status: "disabled", runs: 56, successRate: 87.5, lastRun: "2026-06-20 09:00" },
  { id: 4, name: "热点事件追踪", type: "tracking", nodes: 6, status: "enabled", runs: 123, successRate: 92.7, lastRun: "2026-06-26 08:00" },
]

export const adminOpLogs = [
  { id: 1, user: "张伟", action: "修改模型配置", target: "GPT-4o", ip: "192.168.1.100", time: "2026-06-26 14:30" },
  { id: 2, user: "王强", action: "启用数据采集任务", target: "行业新闻采集", ip: "192.168.1.102", time: "2026-06-26 13:45" },
  { id: 3, user: "系统", action: "自动清洗任务", target: "微博舆情清洗规则", ip: "127.0.0.1", time: "2026-06-26 14:00" },
  { id: 4, user: "张伟", action: "创建租户", target: "媒体观察集团", ip: "192.168.1.100", time: "2026-06-25 16:20" },
  { id: 5, user: "王强", action: "禁用数字员工", target: "竞品分析员", ip: "192.168.1.102", time: "2026-06-25 11:30" },
]

export const auditLogs = [
  { id: 1, user: "外部用户A", action: "发送消息", target: "群聊", risk: "low", result: "通过", time: "2026-06-26 14:10" },
  { id: 2, user: "匿名用户X", action: "发送消息", target: "私聊", risk: "high", result: "拦截", time: "2026-06-26 13:58" },
  { id: 3, user: "陈磊", action: "上传文件", target: "知识库", risk: "medium", result: "需审核", time: "2026-06-26 13:42" },
  { id: 4, user: "新用户001", action: "注册账号", target: "-", risk: "low", result: "通过", time: "2026-06-26 13:20" },
  { id: 5, user: "测试账号B", action: "发送消息", target: "群聊", risk: "high", result: "拦截", time: "2026-06-26 12:55" },
]

export const platformConfig = {
  siteName: "数智瞭望系统",
  siteUrl: "https://szliaowang.example.com",
  allowRegister: true,
  allowExternalUser: true,
  chatAudit: true,
  dataAudit: true,
  maxUploadSize: 100,
  logRetention: 90,
}

export const notifyScenarios = [
  { id: 1, name: "数据采集完成", enabled: true, channels: ["站内", "邮件"], channelsEnabled: { inapp: true, email: true, sms: false } },
  { id: 2, name: "任务执行完成", enabled: true, channels: ["站内"], channelsEnabled: { inapp: true, email: false, sms: false } },
  { id: 3, name: "好友申请", enabled: true, channels: ["站内"], channelsEnabled: { inapp: true, email: false, sms: false } },
  { id: 4, name: "群聊邀请", enabled: true, channels: ["站内"], channelsEnabled: { inapp: true, email: false, sms: false } },
  { id: 5, name: "风险预警", enabled: true, channels: ["站内", "邮件", "短信"], channelsEnabled: { inapp: true, email: true, sms: true } },
]

export const userNotifyScenarios = [
  { id: 1, name: "数据采集完成", inapp: true, email: false, sms: false },
  { id: 2, name: "任务执行完成", inapp: true, email: true, sms: false },
  { id: 3, name: "好友申请", inapp: true, email: false, sms: false },
  { id: 4, name: "群聊邀请", inapp: true, email: false, sms: false },
  { id: 5, name: "风险预警", inapp: true, email: true, sms: true },
]

export const adminNotifications = [
  { id: 1, type: "system", title: "系统升级通知", content: "平台将于 2026-06-28 02:00-04:00 进行例行升级，届时服务可能短暂中断", time: "2026-06-26 10:00", read: false },
  { id: 2, type: "alert", title: "存储空间告警", content: "平台存储空间使用率已达 85%，请及时清理或扩容", time: "2026-06-26 09:30", read: false },
  { id: 3, type: "task", title: "定时任务失败", content: "「竞品数据追踪」采集任务连续3次执行失败，请检查配置", time: "2026-06-25 22:00", read: true },
  { id: 4, type: "user", title: "新用户注册", content: "今日新增注册用户 12 人，其中企业用户 3 人", time: "2026-06-25 18:00", read: true },
  { id: 5, type: "system", title: "模型配额提醒", content: "GPT-4o 本月 API 调用量已达限额的 90%，当前使用量 8,420/10,000", time: "2026-06-25 14:00", read: true },
]
