# SDD 增补章节：Dify 接口调用支持设计

## 1. 增补目标

为数智瞭望系统增加 Dify 接口调用支持，使系统在以下能力中可调用 Dify 应用：

1. 工作流 Workflow。
2. Chatflow 对话流。
3. 聊天助手 Chatbot。
4. Agent 应用。
5. 文本生成 Text Generator。
6. 数字员工执行。
7. 用户端智能问数。
8. 管理端系统问数。
9. 工作流节点。
10. 技能调用。

Dify 作为外部 AI 应用编排平台接入系统，用于复用 Dify 中已经编排好的模型、知识库、工具、Agent 和流程能力。

---

# 2. Dify 在系统中的定位

## 2.1 系统定位

Dify 在本系统中定位为 **外部 AI 应用提供商**，与 OpenAI、Anthropic、Ollama 这类模型提供商不同，Dify 提供的是“已编排好的 AI 应用能力”。

原有模型管理主要管理底层模型：

1. LLM。
2. Embedding。
3. Rerank。

Dify 集成主要管理上层 AI 应用：

1. Workflow 应用。
2. Chatflow 应用。
3. Chatbot 应用。
4. Agent 应用。
5. Text Generator 应用。

## 2.2 与现有模块关系

```text
Dify Provider
  ↓
Dify App
  ↓
Dify Skill / Workflow Node / Agent Tool
  ↓
系统工作流、数字员工、聊天助手、智能问数、文本生成
```

## 2.3 适用场景

| 系统场景       | Dify 应用类型                   |
| ---------- | --------------------------- |
| 一次性任务处理    | Workflow                    |
| 结构化多轮对话    | Chatflow                    |
| 普通聊天助手     | Chatbot                     |
| 自主工具调用助手   | Agent                       |
| 文案、摘要、报告生成 | Text Generator              |
| 数字员工步骤执行   | Workflow / Agent / Chatflow |
| 系统工作流节点    | Workflow / Text Generator   |
| 用户聊天助手     | Chatflow / Chatbot / Agent  |

---

# 3. Dify 应用类型设计

## 3.1 Dify Workflow

### 功能说明

Workflow 用于一次性流程执行。系统向 Dify Workflow 传入 inputs，Dify 按预设流程执行并返回结果。

### 适用场景

1. 自动报告生成。
2. 数据清洗辅助。
3. 舆情分析摘要。
4. 风险分析。
5. 结构化数据处理。
6. 数字员工批处理任务。
7. 系统工作流中的外部处理节点。

### 系统调用方式

系统后端调用 Dify Workflow API，不允许前端直接调用。

---

## 3.2 Dify Chatflow

### 功能说明

Chatflow 用于对话式流程，每次用户消息都会触发 Dify 中已编排好的流程。

### 适用场景

1. 用户端聊天助手。
2. 企业内部问答助手。
3. 引导式问数。
4. 客服式问答。
5. 群聊中的 AI 助手。
6. 数字员工对话入口。

### 会话规则

1. 系统需要维护本地 conversation_id 与 Dify conversation_id 的映射。
2. 新会话首次调用时，不传或传空 conversation_id。
3. Dify 返回 conversation_id 后，本地保存。
4. 后续同一会话继续传入该 conversation_id。
5. 本系统的会话与 Dify 会话需要隔离管理。

Dify 对话 API 会返回 conversation_id，后续调用需要带上该 ID 来保持对话连续性。

---

## 3.3 Dify Chatbot

### 功能说明

Chatbot 用于普通聊天助手，不一定包含复杂流程编排。

### 适用场景

1. 用户个人 AI 助手。
2. 群聊 AI 助手。
3. 管理端帮助助手。
4. 知识库问答助手。

---

## 3.4 Dify Agent

### 功能说明

Agent 应用适合具备工具调用、推理、任务执行能力的 AI 助手。

### 适用场景

1. 数字员工。
2. 自动分析助手。
3. 自动处理任务助手。
4. 可调用工具的问答助手。
5. 管理端智能运营助手。

### 设计规则

1. Dify Agent 可作为数字员工的执行引擎之一。
2. Dify Agent 的工具调用过程由 Dify 内部编排。
3. 本系统只保存调用记录、输入摘要、输出摘要、Token 消耗和错误信息。
4. 如需系统级权限控制，必须在调用 Dify 前由本系统先完成权限校验。

---

## 3.5 Dify Text Generator

### 功能说明

Text Generator 用于单次文本生成，不维护多轮对话上下文。

### 适用场景

1. 报告生成。
2. 摘要生成。
3. 舆情简报。
4. 文案生成。
5. 数据分析解读。
6. 通知模板生成。
7. 审计说明生成。

Dify 文本生成 API 示例中使用 `/completion-messages`，对话类应用使用 `/chat-messages`。

---

# 4. 模块设计调整

## 4.1 新增 Dify Provider 模块

后端新增模块：

```text
backend/app/modules/dify/
  provider.py
  service.py
  schemas.py
  repository.py
  client.py
  executors.py
```

### 模块职责

1. Dify 服务配置管理。
2. Dify 应用配置管理。
3. Dify API Key 加密存储。
4. Dify 应用调用。
5. Streaming 响应转发。
6. Blocking 响应处理。
7. Dify conversation_id 映射。
8. Dify 调用日志。
9. Dify 应用可见范围和权限控制。
10. Dify 应用绑定到技能、工作流、数字员工、聊天助手。

---

## 4.2 Model 模块调整

原模型管理中增加一个新的 Provider 类型：

```text
provider_type:
  openai
  anthropic
  ollama
  dify
  custom
```

但建议不要把 Dify 完全等同于底层模型，而是作为 **AI App Provider** 单独管理。

推荐新增一级菜单：

```text
AI 能力 / Dify 应用管理
```

也可以在模型管理下增加：

```text
AI 应用提供商
```

---

## 4.3 Skill 模块调整

技能类型新增：

```text
dify_app
```

技能类型变为：

```text
function_call
mcp
skill
dify_app
```

### Dify 技能说明

Dify 技能是对一个 Dify 应用的封装，系统内的数字员工、工作流、聊天助手可以像调用普通技能一样调用 Dify 应用。

### Dify 技能配置

| 字段      | 说明                                             |
| ------- | ---------------------------------------------- |
| 技能名称    | 系统内展示名称                                        |
| 技能类型    | dify_app                                       |
| Dify 服务 | 绑定哪个 Dify Provider                             |
| Dify 应用 | 绑定哪个 Dify App                                  |
| 应用类型    | workflow/chatflow/chatbot/agent/text_generator |
| 输入映射    | 系统变量到 Dify inputs 的映射                          |
| 输出映射    | Dify 响应到系统字段的映射                                |
| 响应模式    | blocking/streaming                             |
| 可见范围    | personal/tenant/public                         |
| 状态      | enabled/disabled                               |

---

## 4.4 Workflow 模块调整

工作流节点新增：

```text
dify
```

### Dify 节点用途

系统工作流中可通过 Dify 节点调用外部 Dify 应用。

### Dify 节点配置

| 字段             | 说明                                             |
| -------------- | ---------------------------------------------- |
| node_type      | dify                                           |
| dify_app_id    | 绑定的 Dify 应用                                    |
| app_type       | workflow/chatflow/chatbot/agent/text_generator |
| input_mapping  | 将上游节点输出映射到 Dify inputs/query                   |
| response_mode  | blocking/streaming                             |
| output_mapping | 将 Dify 返回值映射到后续节点                              |
| timeout        | 调用超时时间                                         |
| retry_config   | 重试配置                                           |

### 执行规则

1. Workflow 类型 Dify App 适合工作流节点调用。
2. Text Generator 适合文本生成节点。
3. Chatflow/Chatbot/Agent 可用于需要对话上下文的工作流节点。
4. 工作流执行前必须校验 Dify App 权限。
5. Dify 节点执行日志写入 workflow_node_logs。
6. Dify 调用日志写入 dify_call_logs。

---

## 4.5 Agent 数字员工模块调整

数字员工执行引擎增加：

```text
agent_engine:
  native
  dify
  hybrid
```

### 类型说明

| 类型     | 说明                                |
| ------ | --------------------------------- |
| native | 使用本系统模型、技能、知识库和工作流执行              |
| dify   | 直接调用 Dify Agent/Chatflow/Workflow |
| hybrid | 本系统工作流中部分节点调用 Dify                |

### 数字员工配置新增字段

| 字段                         | 说明                                             |
| -------------------------- | ---------------------------------------------- |
| agent_engine               | native/dify/hybrid                             |
| dify_app_id                | 绑定 Dify App                                    |
| dify_app_type              | workflow/chatflow/chatbot/agent/text_generator |
| dify_conversation_strategy | 是否复用会话                                         |
| dify_input_mapping         | 输入映射                                           |
| dify_output_mapping        | 输出映射                                           |

### 执行规则

1. 如果 agent_engine=native，按原生数字员工逻辑执行。
2. 如果 agent_engine=dify，数字员工触发后直接调用 Dify App。
3. 如果 agent_engine=hybrid，则由系统工作流编排，某些节点调用 Dify。
4. Dify Agent 的权限控制由本系统调用前完成。
5. Dify 返回内容进入数字员工执行结果。
6. 执行完成后仍按本系统 push_config 推送结果。

---

## 4.6 聊天助手模块新增

建议新增模块：

```text
Chat Assistant 聊天助手
```

### 功能说明

聊天助手是可被用户在单聊、群聊或独立助手页面中调用的 AI 对话能力。

### 助手引擎

```text
assistant_engine:
  native_chat
  dify_chatbot
  dify_chatflow
  dify_agent
```

### 使用场景

1. 个人聊天助手。
2. 群聊 AI 助手。
3. 管理端智能助手。
4. 问数引导助手。
5. 知识库助手。

### 业务规则

1. 用户可创建自己的聊天助手。
2. 管理员可创建租户级聊天助手。
3. 公开聊天助手需审核。
4. 群主可将聊天助手加入群聊。
5. 群成员可通过 @助手名称 调用助手。
6. Dify Chatflow/Chatbot/Agent 可以作为聊天助手后端。
7. 聊天助手调用结果进入消息审计流程或单独标记 AI 消息。

---

# 5. Dify 配置管理设计

## 5.1 Dify Provider 配置

新增 Dify 服务配置。

### 字段

| 字段                | 说明                                    |
| ----------------- | ------------------------------------- |
| provider_name     | Dify 服务名称                             |
| base_url          | Dify API 地址，例如 https://api.dify.ai/v1 |
| api_key_encrypted | 加密后的 API Key                          |
| tenant_id         | 所属租户，平台级可为空                           |
| visibility        | platform/tenant/personal              |
| status            | enabled/disabled                      |
| remark            | 备注                                    |

### 规则

1. API Key 必须加密存储。
2. 前端永不返回 API Key 明文。
3. 调用 Dify 必须从后端发起。
4. Dify Provider 可由平台、租户或个人创建。
5. 停用 Provider 后，关联 Dify App 不可调用。
6. 删除 Provider 前需检查是否被 Dify App、技能、工作流、数字员工引用。

Dify 官方文档建议不要在前端代码或客户端请求中暴露 API Key，应始终通过后端调用 Dify API。

---

## 5.2 Dify App 配置

新增 Dify 应用配置。

### 字段

| 字段                   | 说明                                             |
| -------------------- | ---------------------------------------------- |
| app_name             | 应用名称                                           |
| provider_id          | Dify Provider ID                               |
| app_type             | workflow/chatflow/chatbot/agent/text_generator |
| api_endpoint         | API 路径                                         |
| response_mode        | blocking/streaming                             |
| input_schema         | 输入变量 Schema                                    |
| output_schema        | 输出 Schema                                      |
| default_inputs       | 默认输入                                           |
| conversation_enabled | 是否需要会话                                         |
| visibility           | personal/tenant/public                         |
| status               | enabled/disabled                               |
| created_by           | 创建人                                            |

### API Endpoint 建议

| Dify 应用类型      | Endpoint             |
| -------------- | -------------------- |
| Text Generator | /completion-messages |
| Chatbot        | /chat-messages       |
| Chatflow       | /chat-messages       |
| Agent          | /chat-messages       |
| Workflow       | /workflows/run       |

> 注：具体 endpoint 以 Dify 应用的 Access API 页面生成的文档为准。Dify 会根据应用配置生成对应 API 文档和示例。

---

# 6. Dify 调用设计

## 6.1 统一调用接口

后端抽象统一 Dify 调用接口：

```python
class DifyClient:
    async def invoke(
        self,
        app: DifyApp,
        inputs: dict,
        query: str | None,
        user: str,
        conversation_id: str | None = None,
        files: list[dict] | None = None,
        response_mode: str = "blocking",
    ) -> DifyInvokeResult:
        ...
```

## 6.2 请求参数映射

### 通用参数

| 系统字段                 | Dify 字段         | 说明                 |
| -------------------- | --------------- | ------------------ |
| input_mapping        | inputs          | 应用变量               |
| user_message         | query           | 用户输入               |
| response_mode        | response_mode   | blocking/streaming |
| dify_conversation_id | conversation_id | Dify 会话 ID         |
| user_id              | user            | 用户唯一标识             |
| files                | files           | 多模态文件              |

### user 字段设计

Dify API 需要 user 标识符。建议格式：

```text
tenant_{tenant_id}_user_{user_id}
```

示例：

```text
tenant_1001_user_2008
```

### conversation_id 映射

本系统需要保存：

```text
system_conversation_id <-> dify_conversation_id
```

适用对象：

1. Chatflow。
2. Chatbot。
3. Agent。
4. 聊天助手。
5. 群聊 AI 助手。

---

## 6.3 Blocking 调用

### 适用场景

1. 后台任务。
2. 工作流节点。
3. 文本生成。
4. 数字员工非实时任务。
5. 管理端分析任务。

### 流程

```text
系统后端接收调用请求
  ↓
校验用户权限
  ↓
加载 Dify App 和 Provider
  ↓
组装请求
  ↓
调用 Dify API
  ↓
解析完整响应
  ↓
保存调用日志
  ↓
返回结果
```

---

## 6.4 Streaming 调用

### 适用场景

1. 聊天助手。
2. 智能问数对话。
3. 用户端 AI 对话。
4. 群聊 AI 助手。
5. 实时文本生成。

### 流程

```text
前端请求本系统后端
  ↓
后端校验权限
  ↓
后端调用 Dify streaming API
  ↓
接收 Dify SSE
  ↓
转换为系统 SSE 或 WebSocket 事件
  ↓
前端逐步展示
  ↓
结束后保存完整结果和调用日志
```

### 规则

1. 前端不直接连接 Dify。
2. 后端代理 Dify streaming 响应。
3. 系统需记录完整输出内容。
4. 用户中断时，后端应尝试停止 Dify 任务，若 Dify 应用支持停止接口。
5. Streaming 过程中异常需向前端发送 error 事件。

Dify 对话 API 支持 `streaming` 和 `blocking` 两种 response_mode；streaming 使用服务器发送事件流。

---

# 7. 数据库设计增补

## 7.1 dify_providers 表

| 字段                | 类型            | 说明                       |
| ----------------- | ------------- | ------------------------ |
| id                | bigint pk     | Dify Provider ID         |
| tenant_id         | bigint null   | 租户 ID，空表示平台级             |
| owner_id          | bigint null   | 创建人                      |
| name              | varchar(100)  | Provider 名称              |
| base_url          | varchar(500)  | Dify API Base URL        |
| api_key_encrypted | text          | 加密 API Key               |
| visibility        | varchar(20)   | platform/tenant/personal |
| status            | varchar(20)   | enabled/disabled         |
| remark            | text          | 备注                       |
| created_at        | datetime      | 创建时间                     |
| updated_at        | datetime      | 更新时间                     |
| deleted_at        | datetime null | 删除时间                     |

### 索引建议

1. index(tenant_id)。
2. index(owner_id)。
3. index(status)。
4. index(visibility)。

---

## 7.2 dify_apps 表

| 字段                   | 类型            | 说明                                             |
| -------------------- | ------------- | ---------------------------------------------- |
| id                   | bigint pk     | Dify App ID                                    |
| tenant_id            | bigint null   | 租户 ID                                          |
| owner_id             | bigint null   | 创建人                                            |
| provider_id          | bigint        | Dify Provider ID                               |
| name                 | varchar(100)  | 应用名称                                           |
| app_type             | varchar(30)   | workflow/chatflow/chatbot/agent/text_generator |
| api_endpoint         | varchar(200)  | API 路径                                         |
| response_mode        | varchar(20)   | blocking/streaming                             |
| input_schema         | json          | 输入 Schema                                      |
| output_schema        | json          | 输出 Schema                                      |
| default_inputs       | json          | 默认输入                                           |
| conversation_enabled | boolean       | 是否启用会话                                         |
| visibility           | varchar(20)   | personal/tenant/public                         |
| review_status        | varchar(20)   | draft/pending/approved/rejected                |
| status               | varchar(20)   | enabled/disabled                               |
| created_at           | datetime      | 创建时间                                           |
| updated_at           | datetime      | 更新时间                                           |
| deleted_at           | datetime null | 删除时间                                           |

### 索引建议

1. index(tenant_id)。
2. index(provider_id)。
3. index(app_type)。
4. index(status)。
5. index(visibility)。

---

## 7.3 dify_conversations 表

| 字段                       | 类型           | 说明                          |
| ------------------------ | ------------ | --------------------------- |
| id                       | bigint pk    | ID                          |
| tenant_id                | bigint       | 租户 ID                       |
| user_id                  | bigint       | 用户 ID                       |
| dify_app_id              | bigint       | Dify App ID                 |
| system_conversation_type | varchar(30)  | assistant/im/agent/workflow |
| system_conversation_id   | bigint null  | 系统会话 ID                     |
| dify_conversation_id     | varchar(100) | Dify 会话 ID                  |
| title                    | varchar(200) | 会话标题                        |
| status                   | varchar(20)  | active/closed               |
| created_at               | datetime     | 创建时间                        |
| updated_at               | datetime     | 更新时间                        |

### 规则

1. 同一个用户、同一个 Dify App、同一个系统会话可以绑定一个 Dify conversation_id。
2. 用户清空对话时，可关闭本地映射。
3. 不同租户之间不得复用 conversation_id。

---

## 7.4 dify_call_logs 表

| 字段                   | 类型           | 说明                                            |
| -------------------- | ------------ | --------------------------------------------- |
| id                   | bigint pk    | 日志 ID                                         |
| tenant_id            | bigint       | 租户 ID                                         |
| user_id              | bigint       | 调用用户                                          |
| provider_id          | bigint       | Dify Provider ID                              |
| dify_app_id          | bigint       | Dify App ID                                   |
| app_type             | varchar(30)  | 应用类型                                          |
| call_scene           | varchar(50)  | ask/chat/agent/workflow/skill/text_generation |
| request_inputs       | json         | 输入变量摘要                                        |
| request_query        | text         | 用户输入                                          |
| response_mode        | varchar(20)  | blocking/streaming                            |
| dify_task_id         | varchar(100) | Dify 任务 ID                                    |
| dify_message_id      | varchar(100) | Dify 消息 ID                                    |
| dify_conversation_id | varchar(100) | Dify 会话 ID                                    |
| answer_summary       | text         | 输出摘要                                          |
| metadata             | json         | Dify 返回 metadata                              |
| token_usage          | json         | Token 用量                                      |
| latency_ms           | int          | 耗时                                            |
| status               | varchar(20)  | success/failed/canceled                       |
| error_message        | text         | 错误信息                                          |
| created_at           | datetime     | 创建时间                                          |

---

## 7.5 chat_assistants 表

| 字段               | 类型           | 说明                                                |
| ---------------- | ------------ | ------------------------------------------------- |
| id               | bigint pk    | 助手 ID                                             |
| tenant_id        | bigint       | 租户 ID                                             |
| owner_id         | bigint       | 创建人                                               |
| name             | varchar(100) | 助手名称                                              |
| avatar_file_id   | bigint null  | 头像                                                |
| description      | text         | 描述                                                |
| assistant_engine | varchar(30)  | native_chat/dify_chatbot/dify_chatflow/dify_agent |
| model_id         | bigint null  | 原生模型 ID                                           |
| dify_app_id      | bigint null  | Dify App ID                                       |
| system_prompt    | text         | 原生助手提示词                                           |
| visibility       | varchar(20)  | personal/tenant/public                            |
| status           | varchar(20)  | enabled/disabled                                  |
| created_at       | datetime     | 创建时间                                              |
| updated_at       | datetime     | 更新时间                                              |

---

# 8. 接口设计增补

## 8.1 Dify Provider 接口

| 方法     | 路径                               | 权限                   | 说明               |
| ------ | -------------------------------- | -------------------- | ---------------- |
| GET    | /api/v1/dify/providers           | dify:provider:view   | Dify Provider 列表 |
| POST   | /api/v1/dify/providers           | dify:provider:create | 创建 Dify Provider |
| GET    | /api/v1/dify/providers/{id}      | dify:provider:view   | Provider 详情      |
| PUT    | /api/v1/dify/providers/{id}      | dify:provider:update | 编辑 Provider      |
| DELETE | /api/v1/dify/providers/{id}      | dify:provider:delete | 删除 Provider      |
| POST   | /api/v1/dify/providers/{id}/test | dify:provider:test   | 测试连接             |

---

## 8.2 Dify App 接口

| 方法     | 路径                            | 权限              | 说明          |
| ------ | ----------------------------- | --------------- | ----------- |
| GET    | /api/v1/dify/apps             | dify:app:view   | Dify App 列表 |
| POST   | /api/v1/dify/apps             | dify:app:create | 创建 Dify App |
| GET    | /api/v1/dify/apps/{id}        | dify:app:view   | App 详情      |
| PUT    | /api/v1/dify/apps/{id}        | dify:app:update | 编辑 App      |
| DELETE | /api/v1/dify/apps/{id}        | dify:app:delete | 删除 App      |
| POST   | /api/v1/dify/apps/{id}/test   | dify:app:test   | 测试调用        |
| POST   | /api/v1/dify/apps/{id}/invoke | dify:app:invoke | 调用 Dify App |

---

## 8.3 Dify Streaming 调用接口

| 方法   | 路径                            | 权限              | 说明            |
| ---- | ----------------------------- | --------------- | ------------- |
| POST | /api/v1/dify/apps/{id}/stream | dify:app:invoke | 流式调用 Dify App |

### 请求示例

```json
{
  "inputs": {
    "topic": "数智平台建设"
  },
  "query": "请生成一份建设建议",
  "conversation_id": "",
  "files": [],
  "scene": "chat_assistant"
}
```

### 响应方式

1. SSE。
2. 或转为系统 WebSocket 事件。

---

## 8.4 聊天助手接口

| 方法     | 路径                                  | 权限                    | 说明    |
| ------ | ----------------------------------- | --------------------- | ----- |
| GET    | /api/v1/chat-assistants             | chat_assistant:view   | 助手列表  |
| POST   | /api/v1/chat-assistants             | chat_assistant:create | 创建助手  |
| GET    | /api/v1/chat-assistants/{id}        | chat_assistant:view   | 助手详情  |
| PUT    | /api/v1/chat-assistants/{id}        | chat_assistant:update | 编辑助手  |
| DELETE | /api/v1/chat-assistants/{id}        | chat_assistant:delete | 删除助手  |
| POST   | /api/v1/chat-assistants/{id}/chat   | chat_assistant:chat   | 与助手对话 |
| POST   | /api/v1/chat-assistants/{id}/stream | chat_assistant:chat   | 流式对话  |

---

# 9. 菜单结构增补

## 9.1 用户端菜单增补

| 一级菜单  | 二级菜单      | 说明                |
| ----- | --------- | ----------------- |
| AI 助手 | 我的聊天助手    | 创建和管理个人聊天助手       |
| AI 助手 | 助手广场      | 查看公开或租户共享助手       |
| 技能    | Dify 应用技能 | 用户绑定或创建 Dify 应用技能 |

---

## 9.2 管理端菜单增补

| 一级菜单  | 二级菜单          | 说明                                                |
| ----- | ------------- | ------------------------------------------------- |
| AI 能力 | Dify Provider | 管理 Dify 服务地址和密钥                                   |
| AI 能力 | Dify 应用       | 管理 Workflow、Chatflow、Chatbot、Agent、Text Generator |
| AI 能力 | 聊天助手管理        | 管理租户级和公开聊天助手                                      |
| 审计日志  | Dify 调用日志     | 查看 Dify 调用、Token、错误、耗时                            |

---

# 10. 权限增补

## 10.1 Dify 权限编码

```text
dify:provider:view
dify:provider:create
dify:provider:update
dify:provider:delete
dify:provider:test

dify:app:view
dify:app:create
dify:app:update
dify:app:delete
dify:app:test
dify:app:invoke

chat_assistant:view
chat_assistant:create
chat_assistant:update
chat_assistant:delete
chat_assistant:chat
chat_assistant:manage
```

## 10.2 权限规则

1. 平台超级管理员可管理所有 Dify Provider 和 Dify App。
2. 租户管理员可管理本租户 Dify Provider 和 Dify App。
3. 普通用户可创建个人 Dify App 绑定配置，前提是系统允许个人配置外部 API。
4. 公开 Dify App 需要管理员审核。
5. 用户调用 Dify App 前必须校验可见范围。
6. 工作流、数字员工、聊天助手调用 Dify App 时，必须继承触发用户的数据权限。
7. Dify API Key 永不返回前端。

---

# 11. 安全设计增补

## 11.1 API Key 安全

1. Dify API Key 加密存储。
2. 前端不展示 API Key 明文。
3. API Key 修改时只允许覆盖。
4. 调用日志不得记录 Authorization Header。
5. 不允许用户端直连 Dify API。
6. 后端应支持不同租户配置不同 Dify Key。

---

## 11.2 数据权限安全

Dify 是外部系统，本系统调用前必须完成数据权限过滤。

### 规则

1. 不得把用户无权限的数据传给 Dify。
2. 智能问数结果传入 Dify 生成报告前，必须先做权限过滤。
3. 聊天记录传给 Dify 前，必须确认用户有该会话访问权限。
4. 群聊调用 Dify 助手时，只能传入该群允许的上下文。
5. 外部注册用户只能调用自己有权限的 Dify App 和公开数据。

---

## 11.3 Prompt 注入与外部调用风险

Dify App 可能调用外部工具或知识库，因此需要：

1. 在系统侧记录用户输入。
2. 对敏感数据进行脱敏后再传给 Dify。
3. 对 Dify 返回结果进行内容审计。
4. 对 Dify 输出到聊天场景的内容进行消息审计。
5. 对 Dify 输出到报告/问数结果中的内容标记来源。
6. 对 Dify App 的公开发布进行审核。

---

# 12. 调用日志与审计增补

## 12.1 Dify 调用日志

所有 Dify 调用必须记录：

1. 调用人。
2. 租户。
3. Dify Provider。
4. Dify App。
5. 应用类型。
6. 调用场景。
7. 输入摘要。
8. 输出摘要。
9. response_mode。
10. conversation_id。
11. task_id。
12. message_id。
13. Token 用量。
14. 耗时。
15. 状态。
16. 错误信息。

Dify 对话 API 的响应中可能包含 task_id、message_id、conversation_id、metadata、usage 等信息，可用于调用追踪和用量统计。

---

## 12.2 Dify 输出审计

### 输出到聊天

如果 Dify 输出作为聊天消息进入单聊或群聊：

1. 必须进入聊天消息审计。
2. 审计通过后展示。
3. 高风险内容拦截。
4. 中风险内容进入复核。
5. AI 消息需要标识为 AI 生成。

### 输出到问数

如果 Dify 输出作为问数解释：

1. 保存问数记录。
2. 保存 Dify 调用日志。
3. 保存输出摘要。
4. 支持用户查看生成来源。

### 输出到工作流

如果 Dify 输出进入后续节点：

1. 保存节点输出。
2. 进入 workflow_node_logs。
3. 后续节点使用 output_mapping 读取。

---

# 13. 前端页面增补

## 13.1 Dify Provider 管理页

### 页面功能

1. Provider 列表。
2. 新增 Provider。
3. 编辑 Provider。
4. 测试连接。
5. 启用/停用。
6. 删除 Provider。

### 表单字段

1. 名称。
2. Base URL。
3. API Key。
4. 可见范围。
5. 状态。
6. 备注。

---

## 13.2 Dify App 管理页

### 页面功能

1. Dify App 列表。
2. 新增 Dify App。
3. 编辑 Dify App。
4. 测试调用。
5. 设置输入 Schema。
6. 设置输出 Schema。
7. 设置默认响应模式。
8. 设置可见范围。
9. 查看调用日志。

### 表单字段

1. 应用名称。
2. Provider。
3. 应用类型。
4. API Endpoint。
5. response_mode。
6. input_schema。
7. output_schema。
8. default_inputs。
9. conversation_enabled。
10. 可见范围。
11. 状态。

---

## 13.3 聊天助手管理页

### 页面功能

1. 助手列表。
2. 创建助手。
3. 选择助手引擎。
4. 绑定 Dify App。
5. 设置头像和简介。
6. 设置可见范围。
7. 测试对话。
8. 加入群聊。
9. 停用助手。

### 助手引擎选项

1. 原生聊天助手。
2. Dify Chatbot。
3. Dify Chatflow。
4. Dify Agent。

---

## 13.4 工作流 Dify 节点配置面板

### 配置项

1. Dify Provider。
2. Dify App。
3. 应用类型。
4. 输入映射。
5. query 来源。
6. response_mode。
7. 输出映射。
8. 超时时间。
9. 失败重试。
10. 是否保存完整响应。

---

# 14. 后端执行器增补

## 14.1 Dify App Executor

```python
class DifyAppExecutor:
    async def execute(
        self,
        app_id: int,
        inputs: dict,
        query: str | None,
        context: RequestContext,
        conversation_key: str | None = None,
        files: list[dict] | None = None,
        response_mode: str = "blocking",
    ) -> dict:
        ...
```

### 职责

1. 校验 Dify App 权限。
2. 加载 Provider。
3. 解密 API Key。
4. 组装请求。
5. 调用 Dify。
6. 处理 streaming 或 blocking。
7. 保存 conversation_id。
8. 写入 dify_call_logs。
9. 返回标准化结果。

---

## 14.2 Dify Workflow Node Executor

```python
class DifyWorkflowNodeExecutor(BaseWorkflowNodeExecutor):
    async def execute(self, node, input_data, context):
        ...
```

### 职责

1. 读取节点 dify_app_id。
2. 从 input_mapping 生成 inputs/query。
3. 调用 DifyAppExecutor。
4. 将结果按 output_mapping 输出。
5. 记录节点日志。

---

## 14.3 Dify Skill Executor

```python
class DifySkillExecutor(BaseSkillExecutor):
    async def execute(self, skill, input_data, context):
        ...
```

### 职责

1. 读取技能绑定的 Dify App。
2. 校验调用权限。
3. 调用 Dify。
4. 返回技能标准结果。

---

# 15. Dify 与现有功能结合

## 15.1 工作流

系统工作流可新增 Dify 节点，用于调用 Dify Workflow、Text Generator 或 Chatflow。

## 15.2 Chatflow

Chatflow 可作为聊天助手引擎，也可作为数字员工对话入口。

## 15.3 聊天助手

聊天助手可绑定 Dify Chatbot、Dify Chatflow 或 Dify Agent。

## 15.4 Agent

数字员工可直接绑定 Dify Agent，或在系统工作流中调用 Dify Agent。

## 15.5 文本生成

文本生成可作为：

1. 独立文本生成页面。
2. 工作流节点。
3. 数字员工任务节点。
4. 数据分析结果解读。
5. 问数结果报告生成。
6. 审计说明生成。

---

# 16. 验收标准增补

## 16.1 Dify Provider

1. 管理员可创建 Dify Provider。
2. API Key 不在前端明文展示。
3. 可测试 Provider 连接。
4. 停用 Provider 后关联 App 不可调用。

## 16.2 Dify App

1. 可创建 Workflow 类型 App。
2. 可创建 Chatflow 类型 App。
3. 可创建 Chatbot 类型 App。
4. 可创建 Agent 类型 App。
5. 可创建 Text Generator 类型 App。
6. 可测试调用 App。
7. 可查看调用日志。
8. 可配置 blocking 或 streaming。

## 16.3 工作流集成

1. 工作流编辑器可添加 Dify 节点。
2. Dify 节点可配置输入映射。
3. Dify 节点可配置输出映射。
4. 工作流运行时可正确调用 Dify。
5. Dify 调用失败时节点状态为 failed。
6. Dify 调用日志可追踪到工作流节点。

## 16.4 聊天助手集成

1. 用户可创建 Dify Chatbot 助手。
2. 用户可创建 Dify Chatflow 助手。
3. 用户可创建 Dify Agent 助手。
4. 助手支持流式输出。
5. 助手可在独立页面对话。
6. 助手可被加入群聊并通过 @ 调用。
7. Dify conversation_id 可正确保持上下文。

## 16.5 数字员工集成

1. 数字员工可选择 dify 执行引擎。
2. 数字员工可绑定 Dify Agent。
3. 数字员工可绑定 Dify Workflow。
4. 执行结果可按 push_config 推送。
5. 执行日志记录 Dify 调用信息。

## 16.6 安全验收

1. 前端无法获取 Dify API Key 明文。
2. 用户无法调用无权限 Dify App。
3. Dify 调用前完成数据权限过滤。
4. Dify 输出进入聊天时经过消息审计。
5. Dify 调用日志完整记录。
