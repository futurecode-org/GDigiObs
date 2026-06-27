# 数智瞭望系统 API 接口文档

## 1. 文档信息

| 项目 | 内容 |
|------|------|
| 文档名称 | 数智瞭望系统 API 接口文档 |
| API 版本 | v1 |
| 服务地址 | `http://localhost:8000/api/v1` |
| 文档地址 | `http://localhost:8000/docs` (Swagger) |
| 技术栈 | FastAPI + SQLAlchemy + MySQL |

---

## 2. 通用规范

### 2.1 统一响应格式

```json
{
  "code": 0,
  "message": "success",
  "data": {},
  "timestamp": 1700000000
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| code | int | 状态码，0 表示成功，非 0 表示失败 |
| message | string | 提示信息 |
| data | any | 响应数据 |
| timestamp | int | 时间戳 |

### 2.2 分页响应格式

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
  "timestamp": 1700000000
}
```

### 2.3 错误响应格式

```json
{
  "code": 404,
  "message": "资源不存在",
  "data": null,
  "timestamp": 1700000000
}
```

### 2.4 认证方式

- **Bearer Token**: 在请求头中添加 `Authorization: Bearer <token>`
- **Token 获取**: 通过登录接口获取 `access_token` 和 `refresh_token`

---

## 3. 接口列表

### 3.1 认证模块 (Auth)

| 接口 | 方法 | 路径 | 描述 |
|------|------|------|------|
| 用户注册 | POST | `/auth/register` | 用户注册，自动创建个人租户 |
| 用户登录 | POST | `/auth/login` | 用户登录，返回 token |
| 刷新 Token | POST | `/auth/refresh` | 使用 refresh_token 刷新 access_token |
| 获取当前用户 | GET | `/auth/me` | 获取当前登录用户信息 |
| 修改密码 | POST | `/auth/change-password` | 修改当前用户密码 |

#### 3.1.1 用户注册

**请求**

```json
POST /api/v1/auth/register
Content-Type: application/json

{
  "username": "string (邮箱或手机号)",
  "password": "string (至少8位，包含字母和数字)",
  "nickname": "string (2-30字符)",
  "invite_code": "string (可选，企业邀请码)"
}
```

**响应**

```json
{
  "code": 0,
  "message": "注册成功",
  "data": {
    "id": 1,
    "username": "user@example.com",
    "nickname": "用户昵称",
    "tenant_id": 1,
    "role": "user"
  }
}
```

#### 3.1.2 用户登录

**请求**

```json
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "string (邮箱或手机号)",
  "password": "string"
}
```

**响应**

```json
{
  "code": 0,
  "message": "登录成功",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "expires_in": 7200,
    "user": {
      "id": 1,
      "username": "user@example.com",
      "nickname": "用户昵称",
      "tenant_id": 1,
      "roles": ["user"]
    }
  }
}
```

---

### 3.2 多租户模块 (Tenant)

| 接口 | 方法 | 路径 | 描述 |
|------|------|------|------|
| 获取租户列表 | GET | `/tenants` | 获取租户列表（管理员） |
| 获取租户详情 | GET | `/tenants/{tenant_id}` | 获取租户详情 |
| 创建企业租户 | POST | `/tenants` | 创建企业租户 |
| 更新租户 | PUT | `/tenants/{tenant_id}` | 更新租户信息 |
| 删除租户 | DELETE | `/tenants/{tenant_id}` | 删除租户（软删除） |
| 启用租户 | POST | `/tenants/{tenant_id}/enable` | 启用租户 |
| 停用租户 | POST | `/tenants/{tenant_id}/disable` | 停用租户 |

**权限**: 平台超级管理员可访问所有租户，租户管理员仅访问本租户

---

### 3.3 RBAC 权限模块

| 接口 | 方法 | 路径 | 描述 |
|------|------|------|------|
| 获取角色列表 | GET | `/roles` | 获取角色列表 |
| 获取角色详情 | GET | `/roles/{role_id}` | 获取角色详情 |
| 创建角色 | POST | `/roles` | 创建角色 |
| 更新角色 | PUT | `/roles/{role_id}` | 更新角色 |
| 删除角色 | DELETE | `/roles/{role_id}` | 删除角色 |
| 分配菜单权限 | POST | `/roles/{role_id}/menus` | 分配菜单权限 |
| 分配按钮权限 | POST | `/roles/{role_id}/buttons` | 分配按钮权限 |
| 分配数据权限 | POST | `/roles/{role_id}/data-permission` | 分配数据权限 |
| 获取菜单列表 | GET | `/menus` | 获取当前用户菜单 |
| 获取权限列表 | GET | `/permissions` | 获取权限列表 |
| 获取当前用户权限 | GET | `/permissions/current` | 获取当前用户权限摘要 |

**数据权限类型**: `all_platform` / `current_tenant` / `current_department` / `current_department_and_children` / `self` / `custom`

---

### 3.4 用户管理模块 (User)

| 接口 | 方法 | 路径 | 描述 |
|------|------|------|------|
| 获取用户列表 | GET | `/users` | 获取用户列表 |
| 获取用户详情 | GET | `/users/{user_id}` | 获取用户详情 |
| 创建用户 | POST | `/users` | 创建用户 |
| 更新用户 | PUT | `/users/{user_id}` | 更新用户信息 |
| 删除用户 | DELETE | `/users/{user_id}` | 删除用户（软删除） |
| 禁用用户 | POST | `/users/{user_id}/disable` | 禁用用户 |
| 启用用户 | POST | `/users/{user_id}/enable` | 启用用户 |
| 封禁用户 | POST | `/users/{user_id}/ban` | 封禁用户 |
| 解封用户 | POST | `/users/{user_id}/unban` | 解封用户 |
| 分配角色 | POST | `/users/{user_id}/roles` | 分配角色 |
| 获取部门列表 | GET | `/departments` | 获取部门列表 |
| 创建部门 | POST | `/departments` | 创建部门 |
| 更新部门 | PUT | `/departments/{dept_id}` | 更新部门 |
| 删除部门 | DELETE | `/departments/{dept_id}` | 删除部门 |

---

### 3.5 即时通讯模块 (IM)

| 接口 | 方法 | 路径 | 描述 |
|------|------|------|------|
| 获取会话列表 | GET | `/conversations` | 获取用户会话列表 |
| 获取会话详情 | GET | `/conversations/{conv_id}` | 获取会话详情 |
| 创建会话 | POST | `/conversations` | 创建会话 |
| 删除会话 | DELETE | `/conversations/{conv_id}` | 删除会话 |
| 获取消息列表 | GET | `/conversations/{conv_id}/messages` | 获取会话消息 |
| 发送消息 | POST | `/conversations/{conv_id}/messages` | 发送消息 |
| 撤回消息 | POST | `/messages/{msg_id}/recall` | 撤回消息 |
| 标记已读 | POST | `/conversations/{conv_id}/read` | 标记会话已读 |
| 获取未读数 | GET | `/conversations/unread-count` | 获取未读消息数 |

**消息类型**: `text` / `image` / `file` / `voice` / `video` / `emoji` / `system`

#### 3.5.1 消息审计功能

发送文本消息时会自动进行内容审计：

```json
POST /api/v1/conversations/{conv_id}/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "message_type": "text",
  "content": "这是一条测试消息"
}
```

**审计通过的响应**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 12345,
    "conversation_id": 1,
    "sender_id": 1,
    "message_type": "text",
    "content": "这是一条测试消息",
    "created_at": "2024-01-01 12:00:00"
  }
}
```

**消息被拦截的响应**

```json
{
  "code": 400,
  "message": "消息内容不符合规范: 检测到敏感内容: 政治敏感",
  "data": null
}
```

**消息需要审核的响应**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 12345,
    "conversation_id": 1,
    "sender_id": 1,
    "message_type": "text",
    "content": "这是一条测试消息",
    "created_at": "2024-01-01 12:00:00",
    "audit_status": "pending_review",
    "risk_level": "medium"
  }
}
```

**审计规则**

敏感词分类：
- 政治敏感: 涉及政治人物的敏感词汇
- 色情低俗: 色情低俗相关词汇
- 暴力恐怖: 暴力恐怖相关词汇
- 赌博诈骗: 赌博诈骗相关词汇
- 恶意攻击: 恶意人身攻击词汇
- 广告推销: 广告推销类词汇
- 违法信息: 违法相关词汇

审计动作：
- `allow`: 放行，消息正常发送
- `block`: 拦截，消息被拒绝发送
- `review`: 人工审核，消息可发送但标记待审核

风险等级：
- `low`: 低风险，正常放行
- `medium`: 中等风险，标记待审核
- `high`: 高风险，直接拦截

---

### 3.6 群组模块 (Group)

| 接口 | 方法 | 路径 | 描述 |
|------|------|------|------|
| 获取群列表 | GET | `/groups` | 获取用户群列表 |
| 获取群详情 | GET | `/groups/{group_id}` | 获取群详情 |
| 创建群 | POST | `/groups` | 创建群组 |
| 更新群 | PUT | `/groups/{group_id}` | 更新群信息 |
| 删除群 | DELETE | `/groups/{group_id}` | 删除群 |
| 获取群成员 | GET | `/groups/{group_id}/members` | 获取群成员列表 |
| 添加成员 | POST | `/groups/{group_id}/members` | 添加群成员 |
| 删除成员 | DELETE | `/groups/{group_id}/members/{user_id}` | 删除群成员 |
| 设置管理员 | POST | `/groups/{group_id}/admins` | 设置群管理员 |
| 禁言成员 | POST | `/groups/{group_id}/mute` | 禁言/解禁成员 |
| 转让群主 | POST | `/groups/{group_id}/transfer` | 转让群主 |
| 退出群 | POST | `/groups/{group_id}/leave` | 退出群 |

**群角色**: `owner` / `admin` / `member`

---

### 3.7 好友模块 (Friend)

| 接口 | 方法 | 路径 | 描述 |
|------|------|------|------|
| 获取好友列表 | GET | `/friends` | 获取好友列表 |
| 搜索用户 | GET | `/friends/search` | 搜索用户 |
| 发送好友申请 | POST | `/friends/requests` | 发送好友申请 |
| 获取申请列表 | GET | `/friends/requests` | 获取好友申请列表 |
| 接受申请 | POST | `/friends/requests/{req_id}/accept` | 接受好友申请 |
| 拒绝申请 | POST | `/friends/requests/{req_id}/reject` | 拒绝好友申请 |
| 删除好友 | DELETE | `/friends/{friend_id}` | 删除好友 |
| 修改备注 | PUT | `/friends/{friend_id}` | 修改好友备注 |

---

### 3.8 数据采集模块 (Collect)

| 接口 | 方法 | 路径 | 描述 |
|------|------|------|------|
| 获取平台列表 | GET | `/collect/platforms` | 获取采集平台列表 |
| 创建平台 | POST | `/collect/platforms` | 创建采集平台 |
| 获取任务列表 | GET | `/collect/tasks` | 获取采集任务列表 |
| 获取任务详情 | GET | `/collect/tasks/{task_id}` | 获取任务详情 |
| 创建任务 | POST | `/collect/tasks` | 创建采集任务 |
| 更新任务 | PUT | `/collect/tasks/{task_id}` | 更新任务 |
| 删除任务 | DELETE | `/collect/tasks/{task_id}` | 删除任务 |
| 启用任务 | POST | `/collect/tasks/{task_id}/enable` | 启用任务 |
| 禁用任务 | POST | `/collect/tasks/{task_id}/disable` | 禁用任务 |
| 获取采集数据 | GET | `/collect/items` | 获取采集数据列表 |
| 获取数据详情 | GET | `/collect/items/{item_id}` | 获取数据详情 |
| 获取采集日志 | GET | `/collect/logs` | 获取采集日志 |

**采集方式**: `api` / `rss` / `crawler`

---

### 3.9 数据清洗模块 (Clean)

| 接口 | 方法 | 路径 | 描述 |
|------|------|------|------|
| 获取清洗规则 | GET | `/clean/rules` | 获取清洗规则列表 |
| 获取规则详情 | GET | `/clean/rules/{rule_id}` | 获取规则详情 |
| 创建清洗规则 | POST | `/clean/rules` | 创建清洗规则 |
| 更新清洗规则 | PUT | `/clean/rules/{rule_id}` | 更新规则 |
| 删除清洗规则 | DELETE | `/clean/rules/{rule_id}` | 删除规则 |
| 执行清洗 | POST | `/clean/rules/{rule_id}/execute` | 执行清洗规则 |
| 获取清洗日志 | GET | `/clean/logs` | 获取清洗日志 |

**清洗规则类型**: `deduplication` / `format_standardization` / `sensitive_filter` / `entity_recognition` / `sentiment_analysis`

---

### 3.10 数据分析模块 (Analysis)

| 接口 | 方法 | 路径 | 描述 |
|------|------|------|------|
| 获取分析任务 | GET | `/analysis/tasks` | 获取分析任务列表 |
| 获取任务详情 | GET | `/analysis/tasks/{task_id}` | 获取任务详情 |
| 创建分析任务 | POST | `/analysis/tasks` | 创建分析任务 |
| 更新分析任务 | PUT | `/analysis/tasks/{task_id}` | 更新任务 |
| 删除分析任务 | DELETE | `/analysis/tasks/{task_id}` | 删除任务 |
| 执行分析 | POST | `/analysis/tasks/{task_id}/execute` | 执行分析任务 |
| 获取分析日志 | GET | `/analysis/logs` | 获取分析日志 |

**分析类型**: `trend` / `sentiment` / `topic` / `keyword` / `risk`

---

### 3.11 知识库模块 (Knowledge)

| 接口 | 方法 | 路径 | 描述 |
|------|------|------|------|
| 获取知识库列表 | GET | `/knowledge` | 获取知识库列表 |
| 获取知识库详情 | GET | `/knowledge/{kb_id}` | 获取知识库详情 |
| 创建知识库 | POST | `/knowledge` | 创建知识库 |
| 更新知识库 | PUT | `/knowledge/{kb_id}` | 更新知识库 |
| 删除知识库 | DELETE | `/knowledge/{kb_id}` | 删除知识库 |
| 上传文件 | POST | `/knowledge/{kb_id}/files` | 上传知识文件 |
| 获取文件列表 | GET | `/knowledge/{kb_id}/files` | 获取文件列表 |
| 删除文件 | DELETE | `/knowledge/{kb_id}/files/{file_id}` | 删除文件 |
| 检索知识 | POST | `/knowledge/{kb_id}/search` | 检索知识库 |

**知识库类型**: `personal` / `group` / `tenant` / `public`

#### 3.11.1 文件处理流程

上传知识文件后，系统会自动执行以下处理流程：

```
文件上传 → 文本解析 → 智能分片 → 向量化 → 存储
```

**支持的文件类型**

| 文件类型 | 扩展名 | 解析器 |
|----------|--------|--------|
| 文本文件 | .txt, .md, .json, .csv | TextFileParser |
| Word文档 | .docx | DocxFileParser |
| PDF文档 | .pdf | PdfFileParser |
| Excel表格 | .xlsx, .xls | ExcelFileParser |

**文件处理状态**

| 状态 | 说明 |
|------|------|
| `pending` | 待处理 |
| `parsing` | 正在解析 |
| `embedding` | 正在向量化 |
| `completed` | 处理完成 |
| `failed` | 处理失败 |

**文件解析配置**

分片器配置：
- `chunk_size`: 每个分片的字符数（默认500）
- `chunk_overlap`: 分片重叠字符数（默认50）

智能分片策略：
- 按句子边界（句号）分割
- 保持段落完整性
- 支持重叠分割以保持上下文连贯性

**Embedding服务**

| 服务类型 | 客户端 | 说明 |
|----------|--------|------|
| `dify` | DifyEmbeddingClient | 调用Dify Embedding服务 |
| `local` | LocalEmbeddingClient | 本地随机向量（开发测试用） |

**上传文件响应**

```json
POST /api/v1/knowledge/{kb_id}/files
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <file>

{
  "code": 0,
  "message": "success",
  "data": {
    "id": 12345,
    "kb_id": 1,
    "file_id": 100,
    "parse_status": "parsing"
  }
}
```

**获取文件列表响应**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 12345,
        "kb_id": 1,
        "file_id": 100,
        "parse_status": "completed",
        "chunk_count": 15,
        "created_at": "2024-01-01 12:00:00"
      },
      {
        "id": 12346,
        "kb_id": 1,
        "file_id": 101,
        "parse_status": "parsing",
        "chunk_count": 0,
        "created_at": "2024-01-01 12:05:00"
      }
    ],
    "total": 2,
    "page": 1,
    "page_size": 50
  }
}
```

**知识检索请求**

```json
POST /api/v1/knowledge/{kb_id}/search
Authorization: Bearer <token>
Content-Type: application/json

{
  "query": "什么是数据采集",
  "top_k": 5
}
```

---

### 3.12 模型管理模块 (Model)

| 接口 | 方法 | 路径 | 描述 |
|------|------|------|------|
| 获取模型列表 | GET | `/models` | 获取模型列表 |
| 获取模型详情 | GET | `/models/{model_id}` | 获取模型详情 |
| 创建模型 | POST | `/models` | 创建模型配置 |
| 更新模型 | PUT | `/models/{model_id}` | 更新模型 |
| 删除模型 | DELETE | `/models/{model_id}` | 删除模型 |
| 测试模型 | POST | `/models/{model_id}/test` | 测试模型连接 |
| 获取预置模型 | GET | `/models/presets` | 获取平台预置模型 |

**模型类型**: `llm` / `embedding` / `rerank`

**API 格式**: `openai` / `anthropic` / `ollama` / `custom`

---

### 3.13 技能管理模块 (Skill)

| 接口 | 方法 | 路径 | 描述 |
|------|------|------|------|
| 获取技能列表 | GET | `/skills` | 获取技能列表 |
| 获取技能详情 | GET | `/skills/{skill_id}` | 获取技能详情 |
| 创建技能 | POST | `/skills` | 创建技能 |
| 更新技能 | PUT | `/skills/{skill_id}` | 更新技能 |
| 删除技能 | DELETE | `/skills/{skill_id}` | 删除技能 |
| 审核通过 | POST | `/skills/{skill_id}/approve` | 审核通过技能 |
| 拒绝审核 | POST | `/skills/{skill_id}/reject` | 拒绝技能审核 |

**技能类型**: `function_call` / `mcp` / `skill` / `dify_app`

**可见范围**: `personal` / `tenant` / `public`

---

### 3.14 数字员工模块 (Agent)

| 接口 | 方法 | 路径 | 描述 |
|------|------|------|------|
| 获取数字员工列表 | GET | `/agents` | 获取数字员工列表 |
| 获取数字员工详情 | GET | `/agents/{agent_id}` | 获取数字员工详情 |
| 创建数字员工 | POST | `/agents` | 创建数字员工 |
| 更新数字员工 | PUT | `/agents/{agent_id}` | 更新数字员工 |
| 删除数字员工 | DELETE | `/agents/{agent_id}` | 删除数字员工 |
| 执行数字员工 | POST | `/agents/{agent_id}/run` | 执行数字员工 |
| 获取执行记录 | GET | `/agents/{agent_id}/runs` | 获取执行记录列表 |
| 获取执行详情 | GET | `/agents/runs/{run_id}` | 获取执行记录详情 |

**触发方式**: `manual` / `schedule` / `chat` / `webhook`

#### 3.14.1 执行引擎

数字员工支持三种执行引擎：

| 引擎类型 | 执行器 | 功能说明 |
|----------|--------|----------|
| `native` | NativeAgentEngine | 原生引擎，直接调用配置的AI模型 |
| `dify` | DifyAgentEngine | Dify引擎，调用外部Dify应用 |
| `hybrid` | HybridAgentEngine | 混合引擎，根据规则动态选择执行引擎 |

**NativeAgentEngine - 原生执行引擎**

直接调用系统配置的AI模型，适用于简单的对话场景：
- 使用系统配置的模型
- 支持技能调用
- 支持知识库检索

**DifyAgentEngine - Dify执行引擎**

调用外部Dify应用，利用Dify的强大编排能力：
- 支持Dify Workflow、Chatflow、Chatbot、Agent、Text Generator
- 支持Blocking和Streaming两种响应模式
- 自动管理Dify会话上下文
- 记录Token使用量

**HybridAgentEngine - 混合执行引擎**

根据规则动态选择执行引擎：

```json
{
  "engine_type": "hybrid",
  "rules": [
    {
      "condition_type": "contains_any",
      "keywords": ["数据分析", "报表", "统计"],
      "engine_type": "dify"
    },
    {
      "condition_type": "contains_any",
      "keywords": ["知识库", "文档"],
      "engine_type": "native"
    }
  ]
}
```

**执行数字员工**

```json
POST /api/v1/agents/{agent_id}/run
Authorization: Bearer <token>
Content-Type: application/json

{
  "input_data": {
    "prompt": "帮我分析一下本周的数据趋势",
    "conversation_id": "optional_existing_conversation_id",
    "inputs": {
      "user_query": "本周数据趋势"
    }
  }
}
```

**响应**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "run_id": 12345,
    "agent_id": 1,
    "status": "running",
    "started_at": "2024-01-01 12:00:00"
  }
}
```

**执行记录详情响应**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 12345,
    "agent_id": 1,
    "trigger_type": "manual",
    "input_data": {
      "prompt": "帮我分析一下本周的数据趋势",
      "conversation_id": "conv_123"
    },
    "output_data": {
      "response": "根据数据分析，本周整体趋势上升...",
      "conversation_id": "conv_123",
      "message_id": "msg_456",
      "metadata": {},
      "token_usage": {
        "prompt_tokens": 100,
        "completion_tokens": 200,
        "total_tokens": 300
      }
    },
    "status": "completed",
    "started_at": "2024-01-01 12:00:00",
    "finished_at": "2024-01-01 12:00:05",
    "error_message": null,
    "steps_log": []
  }
}
```

---

### 3.15 工作流模块 (Workflow)

| 接口 | 方法 | 路径 | 描述 |
|------|------|------|------|
| 获取工作流列表 | GET | `/workflows` | 获取工作流列表 |
| 获取工作流详情 | GET | `/workflows/{workflow_id}` | 获取工作流详情 |
| 创建工作流 | POST | `/workflows` | 创建工作流 |
| 更新工作流 | PUT | `/workflows/{workflow_id}` | 更新工作流 |
| 删除工作流 | DELETE | `/workflows/{workflow_id}` | 删除工作流 |
| 启用工作流 | POST | `/workflows/{workflow_id}/enable` | 启用工作流 |
| 禁用工作流 | POST | `/workflows/{workflow_id}/disable` | 禁用工作流 |
| 执行工作流 | POST | `/workflows/{workflow_id}/run` | 执行工作流 |
| 获取执行记录 | GET | `/workflows/{workflow_id}/runs` | 获取执行记录列表 |
| 获取执行详情 | GET | `/workflows/runs/{run_id}` | 获取执行记录详情 |

#### 3.15.1 节点执行器

工作流执行时会调用相应的节点执行器，每个节点类型对应一个执行器：

| 节点类型 | 执行器 | 功能说明 |
|----------|--------|----------|
| `trigger` | TriggerNodeExecutor | 触发器节点，启动工作流执行 |
| `collect` | CollectNodeExecutor | 数据采集节点，执行数据采集任务 |
| `clean` | CleanNodeExecutor | 数据清洗节点，执行数据清洗规则 |
| `analysis` | AnalysisNodeExecutor | 数据分析节点，执行数据分析任务 |
| `model` | ModelNodeExecutor | 模型调用节点，调用AI模型 |
| `skill` | SkillNodeExecutor | 技能调用节点，调用已配置的技能 |
| `kb_search` | KbSearchNodeExecutor | 知识库搜索节点，在知识库中检索相关内容 |
| `condition` | ConditionNodeExecutor | 条件判断节点，根据条件分流执行 |
| `manual_review` | ManualReviewNodeExecutor | 人工审核节点，暂停等待人工审批 |
| `notify` | NotifyNodeExecutor | 通知节点，发送通知消息 |
| `end` | EndNodeExecutor | 结束节点，标记工作流结束 |

**执行工作流**

```json
POST /api/v1/workflows/{workflow_id}/run
Authorization: Bearer <token>
Content-Type: application/json

{
  "input_data": {
    "query": "最近一周的数据统计"
  }
}
```

**响应**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "run_id": 12345,
    "workflow_id": 1,
    "status": "running",
    "started_at": "2024-01-01 12:00:00"
  }
}
```

**执行记录详情响应**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 12345,
    "workflow_id": 1,
    "trigger_type": "manual",
    "input_data": {
      "query": "最近一周的数据统计"
    },
    "output_data": {
      "collected_count": 1000,
      "cleaned_count": 950,
      "analysis_result": "..."
    },
    "status": "completed",
    "started_at": "2024-01-01 12:00:00",
    "finished_at": "2024-01-01 12:05:00",
    "error_message": null,
    "node_logs": [
      {
        "id": 1,
        "node_id": "node_1",
        "node_type": "trigger",
        "status": "success",
        "started_at": "2024-01-01 12:00:00",
        "finished_at": "2024-01-01 12:00:01",
        "error_message": null
      },
      {
        "id": 2,
        "node_id": "node_2",
        "node_type": "collect",
        "status": "success",
        "started_at": "2024-01-01 12:00:01",
        "finished_at": "2024-01-01 12:02:00",
        "error_message": null
      }
    ]
  }
}
```

**节点执行器配置示例**

```json
// 条件判断节点配置
{
  "type": "condition",
  "config": {
    "conditions": [
      {
        "field": "collected_count",
        "operator": "gt",
        "value": 100
      }
    ],
    "true_node": "node_analysis",
    "false_node": "node_notify"
  }
}

// 知识库搜索节点配置
{
  "type": "kb_search",
  "config": {
    "kb_ids": [1, 2, 3],
    "top_k": 5
  }
}

// 通知节点配置
{
  "type": "notify",
  "config": {
    "notify_type": "system",
    "recipients": ["admin", "user_123"],
    "template": "工作流执行完成"
  }
}
```

---

### 3.16 智能问数模块 (Ask)

| 接口 | 方法 | 路径 | 描述 |
|------|------|------|------|
| 获取问数记录 | GET | `/ask` | 获取问数记录列表 |
| 获取记录详情 | GET | `/ask/{record_id}` | 获取问数记录详情 |
| 创建问数记录 | POST | `/ask` | 创建问数记录 |
| 更新问数记录 | PUT | `/ask/{record_id}` | 更新问数记录 |
| 收藏/取消收藏 | POST | `/ask/{record_id}/save` | 收藏或取消收藏 |
| 校验SQL查询 | POST | `/ask/sql/validate` | 校验SQL语句安全性 |
| 执行SQL查询 | POST | `/ask/sql/execute` | 执行SQL查询（已校验） |

#### 3.16.1 SQL安全校验接口

**校验SQL查询**

```json
POST /api/v1/ask/sql/validate
Authorization: Bearer <token>
Content-Type: application/json

{
  "sql": "SELECT * FROM users WHERE status = 'active'",
  "data_scope_type": "current_tenant",
  "department_ids": [1, 2, 3]
}
```

**响应**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "is_valid": true,
    "sanitized_sql": "SELECT * FROM users WHERE status = 'active' AND tenant_id = 1",
    "detected_threats": [],
    "tables": ["users"]
  }
}
```

**校验失败的响应**

```json
{
  "code": 400,
  "message": "禁止执行INSERT语句",
  "data": null
}
```

**执行SQL查询**

```json
POST /api/v1/ask/sql/execute
Authorization: Bearer <token>
Content-Type: application/json

{
  "sql": "SELECT COUNT(*) as total FROM collected_items",
  "data_scope_type": "current_tenant"
}
```

**响应**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "data": [
      {"total": 12345}
    ],
    "row_count": 1,
    "sanitized_sql": "SELECT COUNT(*) as total FROM collected_items WHERE tenant_id = 1"
  }
}
```

**SQL安全规则**

- 禁止语句: `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `TRUNCATE`, `CREATE`, `GRANT`, `REVOKE`, `CALL`, `EXEC`, `MERGE`
- 危险函数: `LOAD_FILE`, `INTO OUTFILE`, `UNION`, `SLEEP`, `BENCHMARK`, `CONCAT_WS`
- 自动注入 `tenant_id = {当前租户ID}` 条件
- 支持数据权限条件注入（部门/个人/自定义）

---

### 3.17 通知模块 (Notification)

| 接口 | 方法 | 路径 | 描述 |
|------|------|------|------|
| 获取通知列表 | GET | `/notifications` | 获取通知列表 |
| 获取通知详情 | GET | `/notifications/{notification_id}` | 获取通知详情 |
| 获取未读数量 | GET | `/notifications/unread/count` | 获取未读通知数量 |
| 标记已读 | POST | `/notifications/{notification_id}/read` | 标记通知已读 |
| 全部已读 | POST | `/notifications/read/all` | 全部标记为已读 |
| 删除通知 | DELETE | `/notifications/{notification_id}` | 删除通知 |
| 批量删除 | DELETE | `/notifications/batch` | 批量删除通知 |

**通知类型**: `friend_request` / `group_invite` / `audit_alert` / `agent_complete` / `workflow_fail` / `system`

---

### 3.18 文件管理模块 (File)

| 接口 | 方法 | 路径 | 描述 |
|------|------|------|------|
| 获取文件列表 | GET | `/files` | 获取文件列表 |
| 获取文件详情 | GET | `/files/{file_id}` | 获取文件详情 |
| 上传文件 | POST | `/files/upload` | 上传文件 |
| 删除文件 | DELETE | `/files/{file_id}` | 删除文件 |

**文件类型**: `image` / `pdf` / `office` / `knowledge` / `video` / `audio`

---

### 3.19 Dify 接口调用模块 (Dify)

#### 3.19.1 Provider 管理

| 接口 | 方法 | 路径 | 描述 |
|------|------|------|------|
| 获取 Provider 列表 | GET | `/dify/providers` | 获取 Dify Provider 列表 |
| 获取 Provider 详情 | GET | `/dify/providers/{provider_id}` | 获取 Provider 详情 |
| 创建 Provider | POST | `/dify/providers` | 创建 Dify Provider |
| 更新 Provider | PUT | `/dify/providers/{provider_id}` | 更新 Provider |
| 删除 Provider | DELETE | `/dify/providers/{provider_id}` | 删除 Provider |
| 测试连接 | POST | `/dify/providers/{provider_id}/test` | 测试 Dify 连接 |

**可见范围**: `platform` / `tenant` / `personal`

#### 3.19.2 App 管理

| 接口 | 方法 | 路径 | 描述 |
|------|------|------|------|
| 获取 App 列表 | GET | `/dify/apps` | 获取 Dify App 列表 |
| 获取 App 详情 | GET | `/dify/apps/{app_id}` | 获取 App 详情 |
| 创建 App | POST | `/dify/apps` | 创建 Dify App |
| 更新 App | PUT | `/dify/apps/{app_id}` | 更新 App |
| 删除 App | DELETE | `/dify/apps/{app_id}` | 删除 App |
| 测试调用 | POST | `/dify/apps/{app_id}/test` | 测试调用 App |

**应用类型**: `workflow` / `chatflow` / `chatbot` / `agent` / `text_generator`

**响应模式**: `blocking` / `streaming`

#### 3.19.3 App 调用

| 接口 | 方法 | 路径 | 描述 |
|------|------|------|------|
| 调用 App | POST | `/dify/apps/{app_id}/invoke` | 调用 Dify App (Blocking) |
| 流式调用 | POST | `/dify/apps/{app_id}/stream` | 调用 Dify App (Streaming) |

#### 3.19.4 调用日志

| 接口 | 方法 | 路径 | 描述 |
|------|------|------|------|
| 获取调用日志 | GET | `/dify/call-logs` | 获取调用日志列表 |

**调用场景**: `assistant` / `im` / `agent` / `workflow`

#### 3.19.5 聊天助手

| 接口 | 方法 | 路径 | 描述 |
|------|------|------|------|
| 获取助手列表 | GET | `/chat-assistants` | 获取聊天助手列表 |
| 获取助手详情 | GET | `/chat-assistants/{assistant_id}` | 获取助手详情 |
| 创建助手 | POST | `/chat-assistants` | 创建聊天助手 |
| 更新助手 | PUT | `/chat-assistants/{assistant_id}` | 更新助手 |
| 删除助手 | DELETE | `/chat-assistants/{assistant_id}` | 删除助手 |
| 发起对话 | POST | `/chat-assistants/{assistant_id}/chat` | 发起对话 |

**助手引擎**: `native_chat` / `dify_chatbot` / `dify_chatflow` / `dify_agent`

**可见范围**: `personal` / `tenant` / `public`

---

### 3.20 审计日志模块 (Audit)

| 接口 | 方法 | 路径 | 描述 |
|------|------|------|------|
| 获取操作日志 | GET | `/audit/operations` | 获取操作日志 |
| 获取审计日志 | GET | `/audit/logs` | 获取审计日志 |

**审计类型**: `message` / `data` / `sql` / `model` / `skill` / `agent` / `workflow`

**风险等级**: `none` / `low` / `medium` / `high`

---

## 4. 状态码说明

| 状态码 | 说明 |
|--------|------|
| 0 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未登录或 Token 失效 |
| 403 | 无权限访问 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 5. WebSocket 接口

### 5.1 实时消息推送

```
ws://localhost:8000/ws/messages?token=<access_token>
```

**消息格式**

```json
{
  "type": "message",
  "data": {
    "conversation_id": 1,
    "sender_id": 1,
    "content": "Hello",
    "message_type": "text",
    "created_at": "2024-01-01 12:00:00"
  }
}
```

**事件类型**: `message` / `read` / `typing` / `join` / `leave`

---

## 6. 数据安全

### 6.1 SQL 安全规则

- 默认只允许 SELECT 查询
- 禁止 DROP、DELETE、UPDATE、INSERT、ALTER、TRUNCATE、CREATE、GRANT、REVOKE、CALL、EXEC、MERGE 等写操作
- 禁止 LOAD_FILE、UNION、SLEEP、BENCHMARK、CONCAT_WS 等危险函数
- 检测 SQL 注入攻击模式（注释注入、联合查询等）
- 自动追加租户过滤条件 `tenant_id = {当前租户ID}`
- 支持数据权限条件注入：
  - `current_tenant`: 当前租户
  - `current_department`: 当前部门
  - `current_department_and_children`: 当前部门及子部门
  - `self`: 仅本人数据
  - `custom`: 自定义条件

### 6.2 敏感信息保护

- API Key 加密存储
- 密码使用 BCrypt 加密
- 敏感字段导出时自动脱敏
- 操作和审计日志完整记录

### 6.3 消息内容审计

- 文本消息发送前自动进行内容审计
- 支持7大类敏感词检测：
  - 政治敏感
  - 色情低俗
  - 暴力恐怖
  - 赌博诈骗
  - 恶意攻击
  - 广告推销
  - 违法信息
- 支持内容分类（普通聊天、问题、命令、URL、代码）
- 三级风险等级：低风险放行、中等风险待审核、高风险拦截

---

## 7. 多租户规则

- 所有业务数据必须包含 `tenant_id`
- 普通用户只能访问本租户数据
- 公开数据需显式设置 `is_public=true`
- 平台超级管理员可查看所有租户数据

---

## 8. 时间格式

- 所有时间字段统一使用 ISO 8601 格式：`YYYY-MM-DD HH:MM:SS`
- 时区：UTC+8