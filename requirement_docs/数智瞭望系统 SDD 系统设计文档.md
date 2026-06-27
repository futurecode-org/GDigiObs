# 数智瞭望系统 SDD 系统设计文档

## 1. 文档信息

| 项目    | 内容                                             |
| ----- | ---------------------------------------------- |
| 文档名称  | 数智瞭望系统 SDD 系统设计文档                              |
| 对应文档  | PRD、FRD                                        |
| 系统名称  | 数智瞭望系统                                         |
| 系统组成  | user_frontend、admin_frontend、backend           |
| 前端技术栈 | React、TypeScript、shadcn/ui、Tailwind CSS        |
| 后端技术栈 | Python、FastAPI、UV                              |
| 数据库   | MySQL                                          |
| 文档目标  | 说明系统架构、模块设计、数据模型、接口设计、安全设计、任务调度、AI 能力集成和关键技术方案 |
| 适用对象  | 架构师、前端研发、后端研发、测试工程师、运维工程师                      |

---

# 2. 系统设计目标

## 2.1 设计目标

数智瞭望系统的设计目标是构建一个支持多租户、RBAC 权限、数据采集、数据清洗、数据分析、智能问数、知识库、即时通讯、模型管理、技能管理、数字员工和低代码工作流的综合平台。

系统需要满足以下目标：

1. 支持用户端和管理端分离。
2. 支持企业租户和个人租户。
3. 支持外部注册用户访问公开数据。
4. 支持所有核心数据按租户隔离。
5. 支持 RBAC 菜单权限、按钮权限和数据权限。
6. 支持自然语言生成 SQL，并进行安全校验。
7. 支持 AI 模型、技能、MCP、Function Call 和 Skill 的统一调度。
8. 支持数字员工通过工作流自动执行任务。
9. 支持聊天消息审计和采集数据情感审计。
10. 支持响应式 Web 访问。

## 2.2 设计原则

1. **模块化**：系统按领域模块拆分，降低耦合。
2. **多租户优先**：业务数据默认带 tenant_id。
3. **权限后端兜底**：前端控制展示，后端控制真实权限。
4. **AI 能力抽象化**：模型、技能、知识库、工作流统一抽象为可调用能力。
5. **异步化处理**：采集、清洗、分析、向量化、工作流执行等采用任务化设计。
6. **审计可追溯**：关键操作、AI 调用、SQL 问数、消息审计均留痕。
7. **可扩展**：模型供应商、采集平台、技能类型、工作流节点均可扩展。
8. **源代码运行优先**：暂不引入复杂部署设计。

---

# 3. 总体架构设计

## 3.1 系统逻辑架构

```text
+-------------------------------------------------------------+
|                         用户浏览器                           |
|                                                             |
|   user_frontend                    admin_frontend            |
|   用户端 React 应用                 管理端 React 应用          |
+-------------------------+-----------------------------------+
                          |
                          | HTTPS / WebSocket
                          |
+-------------------------------------------------------------+
|                         backend                             |
|                      FastAPI 服务层                          |
|                                                             |
|  Auth / Tenant / RBAC / User / Org                          |
|  IM / Group / File / Notification                           |
|  Collect / Clean / Analysis / Audit                         |
|  Ask / Model / Skill / MCP / KB / Agent / Workflow          |
|  Logs / System Config                                       |
+-------------------------+-----------------------------------+
                          |
       +------------------+--------------------+
       |                  |                    |
+-------------+   +----------------+   +----------------+
|   MySQL     |   | File Storage   |   | Task Runtime   |
|  主数据库   |   | 本地文件存储    |   | 后台任务执行    |
+-------------+   +----------------+   +----------------+
                          |
                          |
              +----------------------------+
              | External AI / Data Sources |
              | OpenAI / Anthropic/Ollama  |
              | API / RSS / Crawler        |
              | NPX / UVX / MCP / Skill    |
              +----------------------------+
```

## 3.2 前后端划分

### user_frontend

用户端负责：

1. 普通用户注册登录。
2. 个人大屏。
3. 好友和群组。
4. 即时通讯。
5. 智能问数。
6. 知识库。
7. 技能。
8. 数字员工。
9. 工作流。
10. 通知和设置。

### admin_frontend

管理端负责：

1. 管理工作台。
2. 租户管理。
3. 用户管理。
4. 组织架构。
5. RBAC 权限管理。
6. 数据采集、清洗、分析。
7. 审计风控。
8. 模型、技能、数字员工、工作流管理。
9. 日志和系统设置。

### backend

后端负责：

1. REST API。
2. WebSocket。
3. 权限校验。
4. 业务规则。
5. 数据访问。
6. 任务调度。
7. AI 能力调用。
8. 文件处理。
9. 日志审计。

---

# 4. 技术架构设计

## 4.1 前端技术架构

### 技术选型

| 类型        | 技术                       |
| --------- | ------------------------ |
| 框架        | React                    |
| 语言        | TypeScript               |
| UI 组件     | shadcn/ui                |
| 样式        | Tailwind CSS             |
| 路由        | React Router             |
| 状态管理      | Zustand 或 Redux Toolkit  |
| 服务端状态     | TanStack Query           |
| 表单        | React Hook Form + Zod    |
| 图表        | ECharts 或 Recharts       |
| 工作流画布     | React Flow               |
| WebSocket | 原生 WebSocket 或 Socket 封装 |
| Markdown  | react-markdown           |
| 表格        | TanStack Table           |
| 构建工具      | Vite                     |

### 前端目录建议

```text
user_frontend/
  src/
    app/
    routes/
    layouts/
    pages/
    components/
    features/
      auth/
      dashboard/
      im/
      contacts/
      ask/
      kb/
      skills/
      agents/
      workflows/
      notifications/
      settings/
    services/
    stores/
    hooks/
    lib/
    types/

admin_frontend/
  src/
    app/
    routes/
    layouts/
    pages/
    components/
    features/
      dashboard/
      tenants/
      users/
      org/
      rbac/
      collect/
      clean/
      analysis/
      audit/
      models/
      skills/
      agents/
      workflows/
      kb/
      logs/
      system/
    services/
    stores/
    hooks/
    lib/
    types/
```

## 4.2 后端技术架构

### 技术选型

| 类型        | 技术                                                       |
| --------- | -------------------------------------------------------- |
| Web 框架    | FastAPI                                                  |
| 包管理       | UV                                                       |
| ORM       | SQLAlchemy 2.x 或 SQLModel                                |
| 数据校验      | Pydantic                                                 |
| 数据库       | MySQL                                                    |
| 数据迁移      | Alembic                                                  |
| 认证        | JWT                                                      |
| WebSocket | FastAPI WebSocket                                        |
| 异步任务      | 初期可使用 FastAPI BackgroundTasks / APScheduler，后续可扩展 Celery |
| HTTP 客户端  | httpx                                                    |
| 爬虫        | httpx、BeautifulSoup、Playwright，按需引入                      |
| 文件处理      | 本地文件系统                                                   |
| 日志        | structlog 或 logging                                      |
| 配置        | pydantic-settings                                        |

### 后端目录建议

```text
backend/
  pyproject.toml
  uv.lock
  alembic/
  app/
    main.py
    core/
      config.py
      security.py
      database.py
      dependencies.py
      permissions.py
      exceptions.py
      logging.py
    api/
      v1/
        router.py
        auth.py
        users.py
        tenants.py
        rbac.py
        org.py
        im.py
        groups.py
        collect.py
        clean.py
        analysis.py
        ask.py
        kb.py
        models.py
        skills.py
        agents.py
        workflows.py
        audit.py
        logs.py
        system.py
    modules/
      auth/
      tenants/
      users/
      rbac/
      org/
      im/
      groups/
      collect/
      clean/
      analysis/
      ask/
      kb/
      models/
      skills/
      mcp/
      agents/
      workflows/
      audit/
      notifications/
      files/
      logs/
      system/
    schemas/
    models/
    repositories/
    services/
    tasks/
    utils/
    tests/
```

---

# 5. 后端分层设计

## 5.1 分层结构

```text
API Router 层
  ↓
Schema / DTO 层
  ↓
Service 业务层
  ↓
Repository 数据访问层
  ↓
ORM Model 层
  ↓
MySQL
```

## 5.2 各层职责

| 层           | 职责                        |
| ----------- | ------------------------- |
| API Router  | 接收请求、参数绑定、调用 Service、返回响应 |
| Schema      | 请求/响应数据结构、字段校验            |
| Service     | 业务规则、权限判断、流程编排            |
| Repository  | 数据查询、写入、更新、分页             |
| ORM Model   | 数据库表映射                    |
| Task        | 后台任务、异步执行                 |
| Integration | 外部模型、MCP、采集源、邮件服务适配       |

## 5.3 统一响应格式

```json
{
  "code": 0,
  "message": "success",
  "data": {},
  "request_id": "req_xxxxxx"
}
```

## 5.4 分页响应格式

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [],
    "total": 100,
    "page": 1,
    "page_size": 20
  },
  "request_id": "req_xxxxxx"
}
```

---

# 6. 核心模块设计

# 6.1 Auth 认证模块设计

## 6.1.1 模块职责

1. 用户注册。
2. 用户登录。
3. Token 签发。
4. Token 刷新。
5. 当前用户信息。
6. 密码加密。
7. 登录日志。

## 6.1.2 认证流程

```text
用户提交账号密码
  ↓
校验账号是否存在
  ↓
校验密码 Hash
  ↓
校验用户状态
  ↓
校验租户状态
  ↓
生成 access_token 和 refresh_token
  ↓
记录登录日志
  ↓
返回用户信息和 Token
```

## 6.1.3 JWT Payload 设计

```json
{
  "sub": "user_id",
  "tenant_id": "tenant_id",
  "roles": ["role_code"],
  "user_type": "internal",
  "exp": 1710000000
}
```

## 6.1.4 密码安全

1. 使用 bcrypt 或 argon2 加密。
2. 不保存明文密码。
3. 登录失败次数可记录，后续支持锁定策略。
4. 重置密码必须记录日志。

---

# 6.2 Tenant 多租户模块设计

## 6.2.1 模块职责

1. 租户创建。
2. 企业租户管理。
3. 个人租户自动创建。
4. 租户状态控制。
5. 租户资源统计。

## 6.2.2 租户类型

| 类型         | 说明   |
| ---------- | ---- |
| enterprise | 企业租户 |
| personal   | 个人租户 |

## 6.2.3 租户隔离策略

1. 业务表强制包含 tenant_id。
2. Repository 查询默认注入 tenant_id。
3. 公开数据通过 is_public=true 允许跨租户读取。
4. 平台超级管理员可跨租户查询。
5. 管理端系统问数也必须注入权限条件。

## 6.2.4 租户上下文

后端请求进入时，通过 Token 解析租户信息，形成 RequestContext：

```python
class RequestContext:
    user_id: int
    tenant_id: int
    roles: list[str]
    permissions: list[str]
    data_scope: dict
    is_super_admin: bool
```

---

# 6.3 RBAC 权限模块设计

## 6.3.1 模块职责

1. 角色管理。
2. 菜单权限。
3. 按钮权限。
4. 数据权限。
5. 用户角色分配。
6. 权限缓存。
7. 权限校验。

## 6.3.2 权限模型

```text
User
  ↓ many-to-many
Role
  ↓ many-to-many
Permission
  ↓
Menu / Button / API / Data Scope
```

## 6.3.3 权限编码建议

```text
user:view
user:create
user:update
user:disable
role:view
role:create
collect:task:create
collect:task:run
ask:system:query
audit:message:review
```

## 6.3.4 权限校验方式

API 层使用依赖注入：

```python
@router.post("/users")
async def create_user(
    payload: UserCreate,
    ctx: RequestContext = Depends(require_permission("user:create"))
):
    ...
```

## 6.3.5 数据权限注入

Service 或 Repository 层统一处理：

```text
基础查询
  ↓
判断是否超级管理员
  ↓
注入 tenant_id
  ↓
注入部门/用户/自定义数据范围
  ↓
执行查询
```

---

# 6.4 User 用户模块设计

## 6.4.1 模块职责

1. 用户资料。
2. 用户状态。
3. 用户角色。
4. 用户部门。
5. 用户封禁。
6. 登录记录。
7. 问数记录关联。

## 6.4.2 用户状态

| 状态       | 说明  |
| -------- | --- |
| normal   | 正常  |
| disabled | 禁用  |
| banned   | 封禁  |
| pending  | 待激活 |
| deleted  | 已删除 |

## 6.4.3 用户封禁策略

1. 封禁后用户不可登录。
2. 在线用户被封禁后 WebSocket 应断开。
3. 封禁行为写入操作日志。
4. 聊天审计可触发封禁。

---

# 6.5 IM 即时通讯模块设计

## 6.5.1 模块职责

1. 单聊会话。
2. 群聊会话。
3. 消息发送。
4. 消息撤回。
5. 已读未读。
6. 文件消息。
7. WebSocket 推送。
8. 消息审计接入。

## 6.5.2 会话模型

| 会话类型   | 说明 |
| ------ | -- |
| direct | 单聊 |
| group  | 群聊 |

## 6.5.3 消息发送流程

```text
前端发送消息
  ↓
后端校验 Token
  ↓
校验会话权限
  ↓
校验用户状态
  ↓
校验群禁言状态
  ↓
调用 Audit 服务进行敏感审计
  ↓
根据审计结果判断 passed / blocked / reviewing
  ↓
写入 messages 表
  ↓
更新 conversations 最近消息
  ↓
WebSocket 推送
  ↓
写入通知
```

## 6.5.4 WebSocket 通道设计

### 连接地址

```text
/ws/im?token=xxx
```

### 事件类型

| 事件                   | 说明       |
| -------------------- | -------- |
| message.new          | 新消息      |
| message.recalled     | 消息撤回     |
| message.read         | 消息已读     |
| conversation.updated | 会话更新     |
| notification.new     | 新通知      |
| agent.run.updated    | 数字员工执行状态 |
| workflow.run.updated | 工作流执行状态  |

### 消息格式

```json
{
  "event": "message.new",
  "data": {
    "conversation_id": 1,
    "message_id": 1001
  }
}
```

## 6.5.5 消息审计接入点

1. 文本消息发送前审计。
2. 文件名、图片描述、语音转文本可后续扩展审计。
3. 高风险直接 blocked。
4. 中风险 reviewing。
5. 低风险 passed 但带 risk_tags。

---

# 6.6 Group 群组模块设计

## 6.6.1 模块职责

1. 创建群。
2. 群成员管理。
3. 群角色。
4. 群公告。
5. 入群申请。
6. 邀请进群。
7. 群禁言。
8. 群解散。

## 6.6.2 群角色

| 角色     | 权限            |
| ------ | ------------- |
| owner  | 全部权限          |
| admin  | 成员管理、公告、审批、禁言 |
| member | 普通聊天和查看       |

## 6.6.3 群权限判断

```text
操作请求
  ↓
判断用户是否群成员
  ↓
判断群状态
  ↓
判断用户群角色
  ↓
判断具体操作权限
  ↓
执行操作
```

---

# 6.7 Collect 数据采集模块设计

## 6.7.1 模块职责

1. 采集平台管理。
2. 采集任务管理。
3. API 采集。
4. RSS 采集。
5. 爬虫采集。
6. 手动采集。
7. 定时采集。
8. 原文存档。
9. 采集日志。

## 6.7.2 采集器接口抽象

```python
class BaseCollector:
    async def collect(self, task: CollectTask) -> list[CollectedItem]:
        raise NotImplementedError
```

### 采集器类型

```text
ApiCollector
RssCollector
CrawlerCollector
```

## 6.7.3 采集流程

```text
读取采集任务
  ↓
根据 collect_method 选择 Collector
  ↓
执行采集
  ↓
保存原始内容 raw_content
  ↓
生成 collected_items
  ↓
写入 collect_logs
  ↓
触发清洗任务
```

## 6.7.4 原文存档设计

采集数据保存：

1. title。
2. content。
3. author。
4. publish_at。
5. source_platform。
6. source_url。
7. raw_content。
8. raw_content_type。
9. attachments。
10. collected_at。

---

# 6.8 Clean 数据清洗模块设计

## 6.8.1 模块职责

1. 去重。
2. 格式标准化。
3. 字段映射。
4. 实体识别。
5. 敏感词过滤。
6. 情感分析。
7. 分类打标。
8. 异常值处理。

## 6.8.2 清洗管道

```text
Raw Item
  ↓
DeduplicateProcessor
  ↓
NormalizeProcessor
  ↓
FieldMappingProcessor
  ↓
EntityExtractProcessor
  ↓
SensitiveWordProcessor
  ↓
SentimentProcessor
  ↓
TaggingProcessor
  ↓
AnomalyProcessor
  ↓
Cleaned Item
```

## 6.8.3 Processor 抽象

```python
class BaseCleanProcessor:
    async def process(self, item: CollectedItem, context: CleanContext) -> CollectedItem:
        raise NotImplementedError
```

## 6.8.4 去重策略

1. source_url 精确去重。
2. title + content_hash 去重。
3. 近似文本去重预留。
4. 重复数据标记为 duplicate。

---

# 6.9 Analysis 数据分析模块设计

## 6.9.1 模块职责

1. 趋势分析。
2. 情感分析。
3. 主题聚类。
4. 关键词分析。
5. 风险预警。
6. 用户行为分析。
7. 经营指标分析。

## 6.9.2 分析任务流程

```text
创建分析任务
  ↓
选择数据源
  ↓
配置分析维度和指标
  ↓
执行分析任务
  ↓
生成 analysis_results
  ↓
生成图表配置 chart_config
  ↓
可发布为公开结果
```

## 6.9.3 分析结果结构

```json
{
  "summary": "分析摘要",
  "metrics": {},
  "chart_type": "line",
  "chart_config": {},
  "table_data": []
}
```

---

# 6.10 Ask 智能问数模块设计

## 6.10.1 模块职责

1. 问题理解。
2. 数据源选择。
3. 自然语言生成 SQL。
4. SQL 安全校验。
5. 权限注入。
6. 查询执行。
7. 图表生成。
8. 结果解释。
9. 历史记录。
10. SQL 审计。

## 6.10.2 智能问数处理流程

```text
用户输入问题
  ↓
获取用户上下文 RequestContext
  ↓
识别可访问数据源
  ↓
构造 Schema Context
  ↓
调用 LLM 生成 SQL
  ↓
SQL 语法解析
  ↓
SQL 安全校验
  ↓
注入租户和数据权限
  ↓
执行只读查询
  ↓
生成图表推荐
  ↓
生成自然语言解释
  ↓
保存 ask_records 和 ask_sql_logs
  ↓
返回结果
```

## 6.10.3 SQL 安全设计

### 禁止语句

1. INSERT。
2. UPDATE。
3. DELETE。
4. DROP。
5. ALTER。
6. TRUNCATE。
7. CREATE。
8. GRANT。
9. REVOKE。
10. CALL。
11. 多语句执行。

### 安全校验步骤

1. 使用 SQL Parser 解析 SQL。
2. 只允许 SELECT。
3. 校验访问表白名单。
4. 校验字段白名单。
5. 自动添加 tenant_id 条件。
6. 自动添加 data_scope 条件。
7. 限制 LIMIT。
8. 限制执行时间。
9. 记录 SQL 审计。

## 6.10.4 图表推荐

| 数据结构        | 推荐图表 |
| ----------- | ---- |
| 时间字段 + 数值字段 | 折线图  |
| 分类字段 + 数值字段 | 柱状图  |
| 分类字段 + 占比字段 | 饼图   |
| 单条聚合值       | 指标卡片 |
| 多字段明细       | 表格   |

---

# 6.11 KB 知识库模块设计

## 6.11.1 模块职责

1. 知识库创建。
2. 文件上传。
3. 文本解析。
4. 文本分片。
5. Embedding。
6. 检索。
7. 权限控制。
8. 知识问答。

## 6.11.2 知识库索引流程

```text
上传文件
  ↓
保存 file_assets
  ↓
解析文本
  ↓
切分 chunks
  ↓
调用 Embedding 模型
  ↓
保存 knowledge_chunks
  ↓
更新文件状态 ready
```

## 6.11.3 向量存储设计

当前数据库指定为 MySQL，初期可采用以下方案：

1. 知识分片文本存储在 MySQL。
2. embedding_vector 字段可暂存 JSON 或单独二进制字段。
3. 初期检索可用关键词检索 + 简单相似度计算。
4. 后续可扩展 Milvus、Qdrant、pgvector 或 Elasticsearch。

## 6.11.4 知识库权限

1. personal：仅创建人。
2. group：群成员。
3. tenant：租户内授权用户。
4. public：所有用户可读。

---

# 6.12 Model 模型管理模块设计

## 6.12.1 模块职责

1. 模型配置。
2. 模型测试。
3. 模型调用。
4. 模型能力标记。
5. 模型可见范围。
6. Token 和调用日志。

## 6.12.2 模型调用适配器

```python
class BaseModelProvider:
    async def chat(self, messages, tools=None, **kwargs):
        raise NotImplementedError

    async def embed(self, texts, **kwargs):
        raise NotImplementedError

    async def rerank(self, query, docs, **kwargs):
        raise NotImplementedError
```

### Provider

```text
OpenAIProvider
AnthropicProvider
OllamaProvider
CustomProvider
```

## 6.12.3 模型能力字段

1. support_tool_call。
2. support_vision。
3. support_reasoning。
4. context_length。
5. max_tokens。
6. model_type。
7. api_type。

## 6.12.4 API Key 安全

1. API Key 加密存储。
2. 前端不返回明文 API Key。
3. 编辑时只允许覆盖，不展示原值。
4. 调用日志不记录敏感 Header。

---

# 6.13 Skill 技能模块设计

## 6.13.1 模块职责

1. Function Call 技能。
2. MCP 技能。
3. Skill 技能。
4. 技能测试。
5. 技能审核。
6. 技能调用日志。
7. 技能权限控制。

## 6.13.2 技能统一调用接口

```python
class BaseSkillExecutor:
    async def execute(self, skill, input_data, context):
        raise NotImplementedError
```

### Executor

```text
FunctionCallExecutor
McpExecutor
SkillExecutor
```

## 6.13.3 Function Call 执行设计

执行流程：

```text
校验入参 Schema
  ↓
准备沙箱环境
  ↓
执行用户代码
  ↓
限制超时和资源
  ↓
校验出参
  ↓
记录调用日志
  ↓
返回结果
```

## 6.13.4 MCP 执行设计

1. MCP 配置通过 JSON 导入。
2. 支持 command、args、env。
3. 优先支持 NPX、UVX。
4. env 敏感字段加密。
5. MCP 工具列表可测试获取。
6. MCP 执行结果统一包装。

## 6.13.5 Skill 导入设计

1. 支持 NPX 安装。
2. 支持 Markdown 导入。
3. Markdown 内容解析技能名称、描述、使用方式。
4. 公开 Skill 需审核。

---

# 6.14 Agent 数字员工模块设计

## 6.14.1 模块职责

1. 数字员工配置。
2. 模型绑定。
3. 技能绑定。
4. 知识库绑定。
5. 工作流绑定。
6. 执行任务。
7. 结果推送。
8. 执行日志。

## 6.14.2 数字员工执行流程

```text
触发数字员工
  ↓
创建 agent_run
  ↓
加载员工配置
  ↓
校验模型/技能/知识库/工作流权限
  ↓
执行工作流或默认任务
  ↓
记录步骤日志
  ↓
生成结果
  ↓
按 push_config 推送
  ↓
更新运行状态
```

## 6.14.3 触发方式

1. manual。
2. schedule。
3. chat_command。
4. webhook。

---

# 6.15 Workflow 工作流模块设计

## 6.15.1 模块职责

1. 工作流保存。
2. 节点配置。
3. 连线配置。
4. 发布校验。
5. 工作流执行。
6. 节点执行。
7. 失败重试。
8. 执行日志。

## 6.15.2 工作流数据结构

```json
{
  "nodes": [
    {
      "id": "node_1",
      "type": "trigger",
      "name": "手动触发",
      "config": {}
    }
  ],
  "edges": [
    {
      "source": "node_1",
      "target": "node_2"
    }
  ]
}
```

## 6.15.3 节点执行器

```python
class BaseWorkflowNodeExecutor:
    async def execute(self, node, input_data, context):
        raise NotImplementedError
```

### 节点类型

1. trigger。
2. collect。
3. clean。
4. analysis。
5. model。
6. skill。
7. kb_search。
8. condition。
9. manual_review。
10. notify。
11. end。

## 6.15.4 执行流程

```text
读取工作流定义
  ↓
校验 DAG
  ↓
找到触发节点
  ↓
按依赖顺序执行节点
  ↓
每个节点写入 workflow_node_logs
  ↓
失败按 retry_config 重试
  ↓
生成 workflow_run_logs
```

---

# 6.16 Audit 审计模块设计

## 6.16.1 模块职责

1. 聊天消息审计。
2. 采集数据情感审计。
3. 敏感词库。
4. 告警。
5. 人工复核。
6. 用户禁言和封禁联动。

## 6.16.2 聊天审计流程

```text
接收消息内容
  ↓
敏感词匹配
  ↓
规则分类
  ↓
模型辅助判断，预留
  ↓
生成风险类别和风险等级
  ↓
返回审计动作
```

## 6.16.3 风险等级

| 等级     | 动作        |
| ------ | --------- |
| none   | 正常发送      |
| low    | 正常发送，记录标签 |
| medium | 进入复核      |
| high   | 自动拦截并告警   |

## 6.16.4 数据情感审计

1. positive。
2. neutral。
3. negative。

---

# 6.17 Notification 通知模块设计

## 6.17.1 模块职责

1. 站内通知。
2. 浏览器通知。
3. 邮件通知。
4. 通知模板。
5. 通知已读未读。
6. 通知偏好设置。

## 6.17.2 通知渠道

| 渠道      | 说明    |
| ------- | ----- |
| in_app  | 站内通知  |
| browser | 浏览器通知 |
| email   | 邮件通知  |
| webhook | 预留    |

## 6.17.3 通知流程

```text
业务事件产生
  ↓
创建 notification
  ↓
判断用户通知偏好
  ↓
WebSocket 推送站内通知
  ↓
浏览器通知
  ↓
邮件发送
```

---

# 6.18 File 文件模块设计

## 6.18.1 模块职责

1. 文件上传。
2. 文件存储。
3. 文件预览。
4. 文件元数据。
5. 文件权限校验。
6. 知识库文件解析。

## 6.18.2 文件存储策略

初期使用本地文件系统：

```text
storage/
  tenants/
    {tenant_id}/
      images/
      chat/
      kb/
      avatars/
      temp/
```

## 6.18.3 文件访问规则

1. 文件元数据保存在 file_assets。
2. 文件下载和预览必须校验权限。
3. PDF 使用浏览器内置预览。
4. Office 使用 Microsoft Office Web 预览组件。
5. 知识库仅允许纯文本类文件。

---

# 7. 数据库设计

## 7.1 数据库设计原则

1. 所有核心业务表包含 id、tenant_id、created_at、updated_at。
2. 所有删除默认软删除，使用 deleted_at。
3. 状态字段统一使用 varchar 或 enum 风格字符串。
4. JSON 字段用于灵活配置。
5. 大文本使用 text 或 longtext。
6. 频繁查询字段建立索引。
7. 跨租户访问必须依赖 is_public 或超级管理员权限。

---

## 7.2 核心数据表

## 7.2.1 tenants 租户表

| 字段            | 类型            | 说明                  |
| ------------- | ------------- | ------------------- |
| id            | bigint pk     | 租户 ID               |
| name          | varchar(100)  | 租户名称                |
| type          | varchar(20)   | enterprise/personal |
| status        | varchar(20)   | enabled/disabled    |
| admin_user_id | bigint        | 租户管理员               |
| config        | json          | 租户配置                |
| created_at    | datetime      | 创建时间                |
| updated_at    | datetime      | 更新时间                |
| deleted_at    | datetime null | 删除时间                |

## 7.2.2 users 用户表

| 字段             | 类型            | 说明                             |
| -------------- | ------------- | ------------------------------ |
| id             | bigint pk     | 用户 ID                          |
| tenant_id      | bigint index  | 租户 ID                          |
| username       | varchar(100)  | 用户名                            |
| email          | varchar(200)  | 邮箱                             |
| phone          | varchar(50)   | 手机号                            |
| password_hash  | varchar(255)  | 密码 Hash                        |
| nickname       | varchar(100)  | 昵称                             |
| avatar_file_id | bigint        | 头像文件                           |
| user_type      | varchar(20)   | external/internal/admin        |
| status         | varchar(20)   | normal/disabled/banned/pending |
| last_login_at  | datetime      | 最近登录                           |
| created_at     | datetime      | 创建时间                           |
| updated_at     | datetime      | 更新时间                           |
| deleted_at     | datetime null | 删除时间                           |

### 索引建议

1. unique(email)。
2. unique(phone)。
3. index(tenant_id)。
4. index(status)。

## 7.2.3 roles 角色表

| 字段          | 类型           | 说明               |
| ----------- | ------------ | ---------------- |
| id          | bigint pk    | 角色 ID            |
| tenant_id   | bigint       | 租户 ID            |
| name        | varchar(100) | 角色名称             |
| code        | varchar(100) | 角色编码             |
| description | text         | 描述               |
| is_system   | boolean      | 是否系统内置           |
| status      | varchar(20)  | enabled/disabled |
| created_at  | datetime     | 创建时间             |
| updated_at  | datetime     | 更新时间             |

## 7.2.4 permissions 权限表

| 字段         | 类型           | 说明                   |
| ---------- | ------------ | -------------------- |
| id         | bigint pk    | 权限 ID                |
| code       | varchar(100) | 权限编码                 |
| name       | varchar(100) | 权限名称                 |
| type       | varchar(20)  | menu/button/api/data |
| parent_id  | bigint       | 父级权限                 |
| path       | varchar(255) | 菜单路径或 API 路径         |
| method     | varchar(20)  | API 方法               |
| sort_order | int          | 排序                   |
| status     | varchar(20)  | 状态                   |

## 7.2.5 user_roles 用户角色表

| 字段         | 类型        | 说明    |
| ---------- | --------- | ----- |
| id         | bigint pk | ID    |
| user_id    | bigint    | 用户 ID |
| role_id    | bigint    | 角色 ID |
| created_at | datetime  | 创建时间  |

## 7.2.6 role_permissions 角色权限表

| 字段            | 类型        | 说明    |
| ------------- | --------- | ----- |
| id            | bigint pk | ID    |
| role_id       | bigint    | 角色 ID |
| permission_id | bigint    | 权限 ID |
| created_at    | datetime  | 创建时间  |

---

## 7.3 社交与消息表

## 7.3.1 friend_relations 好友关系表

| 字段             | 类型           | 说明                     |
| -------------- | ------------ | ---------------------- |
| id             | bigint pk    | ID                     |
| tenant_id      | bigint       | 当前用户租户                 |
| user_id        | bigint       | 用户                     |
| friend_user_id | bigint       | 好友                     |
| remark         | varchar(100) | 备注                     |
| group_name     | varchar(100) | 好友分组                   |
| status         | varchar(20)  | normal/deleted/blocked |
| created_at     | datetime     | 创建时间                   |

## 7.3.2 friend_applications 好友申请表

| 字段           | 类型           | 说明                                |
| ------------ | ------------ | --------------------------------- |
| id           | bigint pk    | ID                                |
| from_user_id | bigint       | 申请人                               |
| to_user_id   | bigint       | 接收人                               |
| message      | varchar(255) | 验证消息                              |
| status       | varchar(20)  | pending/accepted/rejected/expired |
| handled_at   | datetime     | 处理时间                              |
| created_at   | datetime     | 创建时间                              |

## 7.3.3 groups 群表

| 字段                  | 类型           | 说明                        |
| ------------------- | ------------ | ------------------------- |
| id                  | bigint pk    | 群 ID                      |
| tenant_id           | bigint       | 归属租户                      |
| name                | varchar(100) | 群名称                       |
| avatar_file_id      | bigint       | 群头像                       |
| description         | text         | 简介                        |
| owner_id            | bigint       | 群主                        |
| join_mode           | varchar(20)  | invite_only/approval/open |
| allow_member_invite | boolean      | 是否允许成员邀请                  |
| status              | varchar(20)  | normal/disabled/dissolved |
| created_at          | datetime     | 创建时间                      |

## 7.3.4 group_members 群成员表

| 字段          | 类型            | 说明                  |
| ----------- | ------------- | ------------------- |
| id          | bigint pk     | ID                  |
| group_id    | bigint        | 群 ID                |
| user_id     | bigint        | 用户 ID               |
| role        | varchar(20)   | owner/admin/member  |
| muted_until | datetime null | 禁言截止                |
| joined_at   | datetime      | 入群时间                |
| status      | varchar(20)   | normal/removed/left |

## 7.3.5 conversations 会话表

| 字段              | 类型          | 说明           |
| --------------- | ----------- | ------------ |
| id              | bigint pk   | 会话 ID        |
| tenant_id       | bigint      | 租户 ID        |
| type            | varchar(20) | direct/group |
| group_id        | bigint null | 群 ID         |
| last_message_id | bigint      | 最近消息         |
| last_message_at | datetime    | 最近消息时间       |
| created_at      | datetime    | 创建时间         |

## 7.3.6 conversation_members 会话成员表

| 字段                   | 类型        | 说明     |
| -------------------- | --------- | ------ |
| id                   | bigint pk | ID     |
| conversation_id      | bigint    | 会话 ID  |
| user_id              | bigint    | 用户 ID  |
| unread_count         | int       | 未读数    |
| muted                | boolean   | 是否免打扰  |
| pinned               | boolean   | 是否置顶   |
| last_read_message_id | bigint    | 最后已读消息 |
| updated_at           | datetime  | 更新时间   |

## 7.3.7 messages 消息表

| 字段              | 类型            | 说明                                       |
| --------------- | ------------- | ---------------------------------------- |
| id              | bigint pk     | 消息 ID                                    |
| tenant_id       | bigint        | 租户 ID                                    |
| conversation_id | bigint        | 会话 ID                                    |
| sender_id       | bigint        | 发送者                                      |
| message_type    | varchar(20)   | text/image/file/audio/video/emoji/system |
| content         | longtext      | 消息内容                                     |
| file_id         | bigint null   | 文件 ID                                    |
| audit_status    | varchar(20)   | passed/blocked/reviewing                 |
| risk_level      | varchar(20)   | none/low/medium/high                     |
| risk_tags       | json          | 风险标签                                     |
| recalled_at     | datetime null | 撤回时间                                     |
| created_at      | datetime      | 发送时间                                     |

---

## 7.4 数据采集分析表

## 7.4.1 collect_platforms 采集平台表

| 字段             | 类型           | 说明               |
| -------------- | ------------ | ---------------- |
| id             | bigint pk    | 平台 ID            |
| name           | varchar(100) | 平台名称             |
| platform_type  | varchar(50)  | 平台类型             |
| default_method | varchar(20)  | api/rss/crawler  |
| config_schema  | json         | 配置 Schema        |
| status         | varchar(20)  | enabled/disabled |
| created_at     | datetime     | 创建时间             |

## 7.4.2 collect_tasks 采集任务表

| 字段              | 类型           | 说明                           |
| --------------- | ------------ | ---------------------------- |
| id              | bigint pk    | 任务 ID                        |
| tenant_id       | bigint       | 租户 ID                        |
| name            | varchar(100) | 任务名称                         |
| platform_id     | bigint       | 平台 ID                        |
| collect_method  | varchar(20)  | api/rss/crawler              |
| source_url      | text         | 采集地址                         |
| request_config  | json         | 请求配置                         |
| parse_rule      | json         | 解析规则                         |
| schedule_config | json         | 定时配置                         |
| is_public       | boolean      | 是否公开                         |
| status          | varchar(20)  | draft/enabled/disabled/error |
| last_run_at     | datetime     | 最近运行                         |
| created_by      | bigint       | 创建人                          |
| created_at      | datetime     | 创建时间                         |

## 7.4.3 collected_items 采集数据表

| 字段               | 类型           | 说明                                   |
| ---------------- | ------------ | ------------------------------------ |
| id               | bigint pk    | 数据 ID                                |
| tenant_id        | bigint       | 租户 ID                                |
| task_id          | bigint       | 任务 ID                                |
| title            | varchar(500) | 标题                                   |
| content          | longtext     | 正文                                   |
| author           | varchar(200) | 作者                                   |
| publish_at       | datetime     | 发布时间                                 |
| source_platform  | varchar(100) | 来源平台                                 |
| source_url       | text         | 来源 URL                               |
| raw_content      | longtext     | 原始内容                                 |
| raw_content_type | varchar(50)  | html/json/text                       |
| content_hash     | varchar(128) | 内容 Hash                              |
| sentiment        | varchar(20)  | positive/neutral/negative            |
| tags             | json         | 标签                                   |
| entities         | json         | 实体                                   |
| is_public        | boolean      | 是否公开                                 |
| status           | varchar(20)  | raw/cleaned/analyzed/duplicate/error |
| created_at       | datetime     | 创建时间                                 |

## 7.4.4 analysis_results 分析结果表

| 字段            | 类型          | 说明      |
| ------------- | ----------- | ------- |
| id            | bigint pk   | 结果 ID   |
| tenant_id     | bigint      | 租户 ID   |
| task_id       | bigint      | 分析任务 ID |
| analysis_type | varchar(50) | 分析类型    |
| summary       | text        | 摘要      |
| metrics       | json        | 指标      |
| chart_type    | varchar(50) | 图表类型    |
| chart_config  | json        | 图表配置    |
| table_data    | json        | 表格数据    |
| is_public     | boolean     | 是否公开    |
| created_at    | datetime    | 创建时间    |

---

## 7.5 AI 能力表

## 7.5.1 models 模型表

| 字段                | 类型           | 说明                             |
| ----------------- | ------------ | ------------------------------ |
| id                | bigint pk    | 模型 ID                          |
| tenant_id         | bigint null  | 租户 ID                          |
| owner_id          | bigint null  | 创建人                            |
| name              | varchar(100) | 模型名称                           |
| model_key         | varchar(100) | API 模型标识                       |
| model_type        | varchar(20)  | llm/embedding/rerank           |
| api_type          | varchar(20)  | openai/anthropic/ollama/custom |
| base_url          | varchar(500) | API 地址                         |
| api_key_encrypted | text         | 加密 API Key                     |
| support_tool_call | boolean      | 工具调用                           |
| support_vision    | boolean      | 图像识别                           |
| support_reasoning | boolean      | 深度思考                           |
| context_length    | int          | 上下文长度                          |
| max_tokens        | int          | Token 上限                       |
| default_config    | json         | 默认参数                           |
| visibility        | varchar(20)  | platform/tenant/personal       |
| status            | varchar(20)  | enabled/disabled               |
| created_at        | datetime     | 创建时间                           |

## 7.5.2 skills 技能表

| 字段            | 类型           | 说明                              |
| ------------- | ------------ | ------------------------------- |
| id            | bigint pk    | 技能 ID                           |
| tenant_id     | bigint       | 租户 ID                           |
| owner_id      | bigint       | 创建人                             |
| name          | varchar(100) | 技能名称                            |
| type          | varchar(20)  | function_call/mcp/skill         |
| description   | text         | 描述                              |
| config        | json         | 配置                              |
| visibility    | varchar(20)  | personal/tenant/public          |
| review_status | varchar(20)  | draft/pending/approved/rejected |
| status        | varchar(20)  | enabled/disabled                |
| created_at    | datetime     | 创建时间                            |

## 7.5.3 digital_agents 数字员工表

| 字段                 | 类型           | 说明                     |
| ------------------ | ------------ | ---------------------- |
| id                 | bigint pk    | 数字员工 ID                |
| tenant_id          | bigint       | 租户 ID                  |
| owner_id           | bigint       | 创建人                    |
| name               | varchar(100) | 名称                     |
| avatar_file_id     | bigint       | 头像                     |
| role_description   | text         | 角色描述                   |
| system_prompt      | text         | 系统提示词                  |
| model_id           | bigint       | 默认模型                   |
| skill_ids          | json         | 技能列表                   |
| knowledge_base_ids | json         | 知识库列表                  |
| workflow_ids       | json         | 工作流列表                  |
| trigger_config     | json         | 触发配置                   |
| push_config        | json         | 推送配置                   |
| visibility         | varchar(20)  | personal/tenant/public |
| status             | varchar(20)  | enabled/disabled       |
| created_at         | datetime     | 创建时间                   |

## 7.5.4 workflows 工作流表

| 字段           | 类型           | 说明                           |
| ------------ | ------------ | ---------------------------- |
| id           | bigint pk    | 工作流 ID                       |
| tenant_id    | bigint       | 租户 ID                        |
| owner_id     | bigint       | 创建人                          |
| name         | varchar(100) | 名称                           |
| description  | text         | 描述                           |
| nodes        | json         | 节点                           |
| edges        | json         | 连线                           |
| trigger_type | varchar(20)  | schedule/manual/chat/webhook |
| status       | varchar(20)  | draft/enabled/disabled       |
| created_at   | datetime     | 创建时间                         |
| updated_at   | datetime     | 更新时间                         |

---

## 7.6 知识库表

## 7.6.1 knowledge_bases 知识库表

| 字段                 | 类型           | 说明                           |
| ------------------ | ------------ | ---------------------------- |
| id                 | bigint pk    | 知识库 ID                       |
| tenant_id          | bigint       | 租户 ID                        |
| owner_id           | bigint       | 创建人                          |
| name               | varchar(100) | 名称                           |
| description        | text         | 描述                           |
| type               | varchar(20)  | personal/group/tenant/public |
| group_id           | bigint null  | 群 ID                         |
| embedding_model_id | bigint       | Embedding 模型                 |
| status             | varchar(20)  | draft/indexing/ready/failed  |
| created_at         | datetime     | 创建时间                         |

## 7.6.2 knowledge_files 知识文件表

| 字段            | 类型          | 说明                                               |
| ------------- | ----------- | ------------------------------------------------ |
| id            | bigint pk   | 文件 ID                                            |
| tenant_id     | bigint      | 租户 ID                                            |
| kb_id         | bigint      | 知识库 ID                                           |
| file_id       | bigint      | 文件资源 ID                                          |
| parse_status  | varchar(20) | uploaded/parsing/chunking/embedding/ready/failed |
| error_message | text        | 错误信息                                             |
| created_at    | datetime    | 创建时间                                             |

## 7.6.3 knowledge_chunks 知识分片表

| 字段               | 类型        | 说明      |
| ---------------- | --------- | ------- |
| id               | bigint pk | 分片 ID   |
| tenant_id        | bigint    | 租户 ID   |
| kb_id            | bigint    | 知识库 ID  |
| file_id          | bigint    | 知识文件 ID |
| chunk_index      | int       | 分片序号    |
| content          | text      | 分片文本    |
| token_count      | int       | Token 数 |
| embedding_vector | json      | 向量，初期方案 |
| metadata         | json      | 元信息     |
| created_at       | datetime  | 创建时间    |

---

## 7.7 日志与审计表

## 7.7.1 operation_logs 操作日志表

| 字段          | 类型           | 说明             |
| ----------- | ------------ | -------------- |
| id          | bigint pk    | 日志 ID          |
| tenant_id   | bigint       | 租户 ID          |
| user_id     | bigint       | 操作人            |
| module      | varchar(100) | 模块             |
| action      | varchar(100) | 操作             |
| object_type | varchar(100) | 对象类型           |
| object_id   | bigint       | 对象 ID          |
| before_data | json         | 操作前            |
| after_data  | json         | 操作后            |
| ip          | varchar(100) | IP             |
| user_agent  | text         | UA             |
| status      | varchar(20)  | success/failed |
| created_at  | datetime     | 创建时间           |

## 7.7.2 audit_logs 审计日志表

| 字段              | 类型           | 说明                                          |
| --------------- | ------------ | ------------------------------------------- |
| id              | bigint pk    | 审计 ID                                       |
| tenant_id       | bigint       | 租户 ID                                       |
| user_id         | bigint       | 用户                                          |
| audit_type      | varchar(50)  | message/data/sql/model/skill/agent/workflow |
| risk_level      | varchar(20)  | none/low/medium/high                        |
| risk_tags       | json         | 风险标签                                        |
| content_summary | text         | 内容摘要                                        |
| object_type     | varchar(100) | 对象类型                                        |
| object_id       | bigint       | 对象 ID                                       |
| result          | json         | 审计结果                                        |
| created_at      | datetime     | 创建时间                                        |

---

# 8. 接口设计

## 8.1 接口设计原则

1. RESTful 风格。
2. 统一 `/api/v1` 前缀。
3. 管理端接口可通过权限区分，不强制物理分离。
4. 所有接口返回统一结构。
5. 所有写接口记录操作日志。
6. 所有敏感接口校验权限编码。
7. 所有列表接口支持分页。
8. 所有列表接口支持租户和数据权限过滤。

## 8.2 认证接口

| 方法   | 路径                    | 权限     | 说明       |
| ---- | --------------------- | ------ | -------- |
| POST | /api/v1/auth/register | public | 注册       |
| POST | /api/v1/auth/login    | public | 登录       |
| POST | /api/v1/auth/logout   | login  | 退出       |
| POST | /api/v1/auth/refresh  | public | 刷新 Token |
| GET  | /api/v1/auth/me       | login  | 当前用户信息   |

## 8.3 用户接口

| 方法   | 路径                         | 权限               | 说明   |
| ---- | -------------------------- | ---------------- | ---- |
| GET  | /api/v1/users              | user:view        | 用户列表 |
| POST | /api/v1/users              | user:create      | 新增用户 |
| GET  | /api/v1/users/{id}         | user:view        | 用户详情 |
| PUT  | /api/v1/users/{id}         | user:update      | 编辑用户 |
| POST | /api/v1/users/{id}/disable | user:disable     | 禁用用户 |
| POST | /api/v1/users/{id}/ban     | user:ban         | 封禁用户 |
| POST | /api/v1/users/{id}/roles   | user:assign_role | 分配角色 |

## 8.4 即时通讯接口

| 方法   | 路径                                  | 权限    | 说明           |
| ---- | ----------------------------------- | ----- | ------------ |
| GET  | /api/v1/conversations               | login | 会话列表         |
| GET  | /api/v1/conversations/{id}/messages | login | 消息列表         |
| POST | /api/v1/messages                    | login | 发送消息         |
| POST | /api/v1/messages/{id}/recall        | login | 撤回消息         |
| POST | /api/v1/messages/read               | login | 标记已读         |
| GET  | /api/v1/messages/search             | login | 消息搜索         |
| WS   | /ws/im                              | login | IM WebSocket |

## 8.5 智能问数接口

| 方法   | 路径                       | 权限               | 说明     |
| ---- | ------------------------ | ---------------- | ------ |
| POST | /api/v1/ask              | ask:query        | 发起问数   |
| POST | /api/v1/ask/sql-preview  | ask:sql_preview  | SQL 预览 |
| GET  | /api/v1/ask/history      | ask:view_history | 问数历史   |
| GET  | /api/v1/ask/history/{id} | ask:view_history | 问数详情   |
| POST | /api/v1/ask/export       | ask:export       | 导出结果   |

## 8.6 数据采集接口

| 方法   | 路径                             | 权限                      | 说明   |
| ---- | ------------------------------ | ----------------------- | ---- |
| GET  | /api/v1/collect/platforms      | collect:platform:view   | 平台列表 |
| POST | /api/v1/collect/platforms      | collect:platform:create | 新增平台 |
| GET  | /api/v1/collect/tasks          | collect:task:view       | 任务列表 |
| POST | /api/v1/collect/tasks          | collect:task:create     | 创建任务 |
| PUT  | /api/v1/collect/tasks/{id}     | collect:task:update     | 编辑任务 |
| POST | /api/v1/collect/tasks/{id}/run | collect:task:run        | 运行任务 |
| GET  | /api/v1/collect/items          | collect:item:view       | 采集数据 |

## 8.7 AI 能力接口

| 方法   | 路径                         | 权限              | 说明     |
| ---- | -------------------------- | --------------- | ------ |
| GET  | /api/v1/models             | model:view      | 模型列表   |
| POST | /api/v1/models             | model:create    | 创建模型   |
| POST | /api/v1/models/{id}/test   | model:test      | 测试模型   |
| GET  | /api/v1/skills             | skill:view      | 技能列表   |
| POST | /api/v1/skills             | skill:create    | 创建技能   |
| POST | /api/v1/skills/{id}/test   | skill:test      | 测试技能   |
| GET  | /api/v1/agents             | agent:view      | 数字员工列表 |
| POST | /api/v1/agents             | agent:create    | 创建数字员工 |
| POST | /api/v1/agents/{id}/run    | agent:run       | 执行数字员工 |
| GET  | /api/v1/workflows          | workflow:view   | 工作流列表  |
| POST | /api/v1/workflows          | workflow:create | 创建工作流  |
| POST | /api/v1/workflows/{id}/run | workflow:run    | 运行工作流  |

---

# 9. 安全设计

## 9.1 认证安全

1. JWT 设置过期时间。
2. refresh_token 单独管理。
3. 密码 Hash 存储。
4. 登录失败记录日志。
5. 用户状态实时校验。
6. 租户状态实时校验。

## 9.2 权限安全

1. 前端路由按权限展示。
2. 后端接口必须校验权限。
3. 查询必须注入租户条件。
4. 管理端查询必须注入数据权限。
5. SQL 问数必须只读。
6. 导出必须记录日志。

## 9.3 数据安全

1. API Key 加密存储。
2. MCP env 加密存储。
3. 文件访问校验权限。
4. 敏感字段导出脱敏。
5. 日志不记录明文密钥。
6. 删除采用软删除。

## 9.4 自定义代码安全

Function Call 自定义代码存在较高风险，初期建议：

1. 使用独立进程运行。
2. 设置超时时间。
3. 限制文件系统访问。
4. 限制网络访问。
5. 限制环境变量读取。
6. 限制 CPU 和内存。
7. 记录执行日志。

后续可升级为容器沙箱。

## 9.5 SQL 安全

1. 使用 SQL Parser。
2. 禁止多语句。
3. 只允许 SELECT。
4. 限制可查询表。
5. 限制可查询字段。
6. 强制 LIMIT。
7. 强制 tenant_id 条件。
8. 强制数据权限条件。
9. 记录 SQL 审计。

---

# 10. 任务调度设计

## 10.1 任务类型

1. 定时采集任务。
2. 手动采集任务。
3. 数据清洗任务。
4. 数据分析任务。
5. 知识库索引任务。
6. 数字员工任务。
7. 工作流任务。
8. 邮件通知任务。

## 10.2 初期任务方案

初期源代码运行，可采用：

1. APScheduler：定时任务。
2. FastAPI BackgroundTasks：轻量后台任务。
3. asyncio task：短任务。
4. 数据库任务表：记录任务状态。

## 10.3 后续可扩展方案

后续可升级：

1. Celery。
2. Redis Queue。
3. Dramatiq。
4. 独立 worker 服务。

## 10.4 任务运行表设计

### task_runs 通用任务运行表

| 字段            | 类型          | 说明                                    |
| ------------- | ----------- | ------------------------------------- |
| id            | bigint pk   | 运行 ID                                 |
| tenant_id     | bigint      | 租户 ID                                 |
| task_type     | varchar(50) | 任务类型                                  |
| task_id       | bigint      | 业务任务 ID                               |
| run_status    | varchar(20) | queued/running/success/failed/timeout |
| input_data    | json        | 输入                                    |
| output_data   | json        | 输出                                    |
| error_message | text        | 错误                                    |
| started_at    | datetime    | 开始                                    |
| finished_at   | datetime    | 结束                                    |
| created_at    | datetime    | 创建                                    |

---

# 11. 前端设计

## 11.1 路由设计

### 用户端路由

```text
/login
/register
/app/dashboard
/app/messages
/app/contacts/friends
/app/contacts/groups
/app/ask
/app/kb
/app/skills
/app/agents
/app/workflows
/app/tasks
/app/notifications
/app/settings
```

### 管理端路由

```text
/admin/login
/admin/dashboard
/admin/tenants
/admin/org
/admin/users
/admin/roles
/admin/permissions
/admin/groups
/admin/collect/platforms
/admin/collect/tasks
/admin/clean
/admin/analysis
/admin/audit/data
/admin/audit/messages
/admin/models
/admin/skills
/admin/agents
/admin/workflows
/admin/kb
/admin/logs/operations
/admin/logs/audits
/admin/system
```

## 11.2 权限路由

1. 前端启动调用 `/auth/me`。
2. 根据返回 menus 动态生成路由。
3. 无权限路由跳转 403 页面。
4. 按钮通过 `hasPermission("xxx")` 控制。
5. 后端仍需兜底校验。

## 11.3 API Client

前端统一封装 request：

1. 自动携带 Token。
2. 自动处理 401。
3. 自动刷新 Token。
4. 自动处理错误提示。
5. 支持上传进度。
6. 支持取消请求。

## 11.4 WebSocket Client

前端统一 WebSocket 管理：

1. 登录后建立连接。
2. 心跳保活。
3. 断线重连。
4. 事件分发。
5. 收到新消息更新会话。
6. 收到通知更新通知中心。

---

# 12. AI 能力编排设计

## 12.1 AI 能力关系

```text
Model
  ↑
Agent
  ↓
Workflow
  ↓
Skill / MCP / Function Call
  ↓
Knowledge Base
  ↓
Data / File / API
```

## 12.2 调用上下文

AI 调用统一传入上下文：

```json
{
  "user_id": 1,
  "tenant_id": 1,
  "permissions": [],
  "data_scope": {},
  "model_id": 1,
  "trace_id": "trace_xxx"
}
```

## 12.3 调用日志

每次 AI 相关调用记录：

1. user_id。
2. tenant_id。
3. model_id。
4. skill_id。
5. agent_id。
6. workflow_id。
7. input_summary。
8. output_summary。
9. token_usage。
10. latency_ms。
11. status。
12. error_message。

---

# 13. 审计与日志设计

## 13.1 操作日志切面

后端写操作统一通过装饰器或中间件记录：

```python
@operation_log(module="user", action="disable")
async def disable_user(...):
    ...
```

## 13.2 审计日志触发点

1. 消息发送。
2. 采集数据入库。
3. 问数 SQL 执行。
4. 模型调用。
5. 技能调用。
6. 数字员工执行。
7. 工作流执行。
8. 权限变更。
9. 导出数据。

## 13.3 Trace ID

每个请求生成 request_id，贯穿：

1. API 请求。
2. Service 调用。
3. 数据库日志。
4. AI 调用。
5. 任务执行。
6. WebSocket 推送。

---

# 14. 错误码设计

|   code | HTTP | 说明       |
| -----: | ---: | -------- |
|      0 |  200 | 成功       |
| 400001 |  400 | 参数错误     |
| 401001 |  401 | 未登录      |
| 401002 |  401 | Token 过期 |
| 403001 |  403 | 无权限      |
| 403002 |  403 | 数据越权     |
| 404001 |  404 | 资源不存在    |
| 409001 |  409 | 数据冲突     |
| 422001 |  422 | 业务校验失败   |
| 429001 |  429 | 请求过于频繁   |
| 500001 |  500 | 系统异常     |
| 500101 |  500 | 模型调用失败   |
| 500102 |  500 | 技能执行失败   |
| 500103 |  500 | 工作流执行失败  |

---

# 15. 配置设计

## 15.1 后端配置

```text
APP_NAME
APP_ENV
SECRET_KEY
JWT_EXPIRE_MINUTES
REFRESH_TOKEN_EXPIRE_DAYS

MYSQL_HOST
MYSQL_PORT
MYSQL_USER
MYSQL_PASSWORD
MYSQL_DATABASE

STORAGE_ROOT

EMAIL_HOST
EMAIL_PORT
EMAIL_USERNAME
EMAIL_PASSWORD
EMAIL_FROM

DEFAULT_LLM_MODEL_ID
DEFAULT_EMBEDDING_MODEL_ID
```

## 15.2 系统配置表 system_configs

| 字段          | 类型           | 说明           |
| ----------- | ------------ | ------------ |
| id          | bigint pk    | 配置 ID        |
| tenant_id   | bigint null  | 租户 ID，空为平台配置 |
| key         | varchar(100) | 配置键          |
| value       | json         | 配置值          |
| description | text         | 描述           |
| updated_at  | datetime     | 更新时间         |

---

# 16. 开发优先级建议

虽然 PRD 不包含版本规划，但从技术依赖关系看，研发建议按以下依赖顺序实现：

1. 基础框架、认证、租户、用户。
2. RBAC、菜单权限、数据权限。
3. 文件模块、通知模块、操作日志。
4. 好友、群组、IM。
5. 模型管理。
6. 知识库。
7. 智能问数。
8. 数据采集、清洗、分析。
9. 审计风控。
10. 技能管理。
11. 工作流。
12. 数字员工。
13. 大屏和高级可视化。

---

# 17. 关键风险与设计约束

## 17.1 技术风险

1. Function Call 自定义代码运行存在安全风险。
2. MCP 和 NPX/UVX 运行依赖本地环境。
3. 自然语言生成 SQL 存在越权和误查询风险。
4. 爬虫采集存在平台规则和稳定性问题。
5. MySQL 不适合作为长期高性能向量检索引擎。
6. Office 在线预览依赖外部服务可访问性。

## 17.2 设计约束

1. 初期只考虑源代码运行。
2. 初期数据库使用 MySQL。
3. 初期不考虑性能目标。
4. 初期文件存储可使用本地存储。
5. 初期任务系统可使用轻量调度方案。
6. 后续可逐步替换为专用组件。

---

# 18. SDD 总结

本 SDD 从系统架构、技术选型、后端分层、核心模块、数据库、接口、安全、任务调度、前端设计、AI 能力编排和日志审计等方面，对数智瞭望系统进行了系统设计。

该设计的核心思想是：

1. 以多租户和 RBAC 作为系统基础。
2. 以数据采集、清洗、分析作为数据底座。
3. 以智能问数、知识库、模型、技能作为 AI 能力底座。
4. 以数字员工和工作流作为自动化执行层。
5. 以 IM、通知和大屏作为用户交互层。
6. 以审计、日志和权限作为安全治理层。
