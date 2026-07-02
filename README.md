# 数智瞭望系统

数智瞭望系统是一个前后端分离的智能化业务平台，覆盖多租户、RBAC 权限、即时通讯、智能问数、知识库、数字员工、工作流、数据采集清洗分析、审计与通知等能力。

## 项目结构

```text
.
├── backend/           # FastAPI 后端服务
├── frontend/          # React + TypeScript + Vite 前端应用
├── figma/             # Figma 导出的前端原型代码
├── docs/              # API 等开发文档
├── requirement_docs/  # PRD / FRD / SDD 需求与设计文档
├── .env.example       # 后端根环境变量示例
└── README.md          # 项目总览
```

## 技术栈

### 后端

- Python 3.11
- FastAPI
- SQLAlchemy
- MySQL / SQLite
- JWT 鉴权
- APScheduler
- ChromaDB
- Dify 接口集成

### 前端

- React 19
- TypeScript
- Vite
- React Router
- Tailwind CSS
- shadcn/ui、Radix UI
- ECharts / Recharts

## 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd GDigiObs
```

### 2. 配置后端环境变量

复制根目录环境变量示例：

```bash
cp .env.example .env
```

开发环境可先使用 SQLite，避免依赖远程 MySQL：

```env
DATABASE_TYPE=sqlite
SQLITE_DATABASE_PATH=backend/data/gdigiobs.db
JWT_SECRET_KEY=replace-with-a-secure-secret
CORS_ALLOW_ORIGINS=*
CORS_ALLOW_CREDENTIALS=true
CORS_ALLOW_METHODS=*
CORS_ALLOW_HEADERS=*
```

如需使用 MySQL，请配置：

```env
DATABASE_TYPE=mysql
DATABASE_HOST=127.0.0.1
DATABASE_PORT=3306
DATABASE_NAME=cdut_liaowang
DATABASE_USER=cdut_liaowang
DATABASE_PASSWORD=your_password
```

### 3. 启动后端

推荐使用 `uv`：

```bash
cd backend
uv sync
uv run python main.py
```

也可以使用 `pip`：

```bash
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

后端默认地址：

- API 根地址：`http://localhost:8000`
- Swagger 文档：`http://localhost:8000/docs`
- 健康检查：`http://localhost:8000/health`

后端启动时会自动初始化数据库表、系统角色权限和默认超级管理员。

默认超级管理员配置来自 `.env`：

```env
INITIAL_SUPER_ADMIN_USERNAME=admin
INITIAL_SUPER_ADMIN_PASSWORD=admin123
```

### 4. 配置并启动前端

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

前端默认读取：

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_WS_BASE_URL=ws://localhost:8000/ws
```

启动后访问 Vite 输出的本地地址，通常为：

```text
http://localhost:5173
```

## 常用命令

### 前端

```bash
cd frontend
npm run dev        # 启动开发服务器
npm run build      # 类型检查并构建生产包
npm run preview    # 本地预览构建产物
npm run lint       # ESLint 检查
npm run typecheck  # TypeScript 类型检查
npm run format     # Prettier 格式化
```

### 后端

```bash
cd backend
uv run python main.py
```

或：

```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## 功能模块

### 用户端

- 工作台
- 消息与联系人
- 智能问数与查询历史
- 知识库
- 技能市场与技能管理
- 数字员工
- 工作流
- 任务、通知、个人设置

### 管理端

- 平台总览
- 租户、用户、角色与权限管理
- 组织架构
- 数据采集、清洗、分析与审核
- 知识库、模型、数字员工、技能与工作流管理
- 聊天审计、敏感词、操作日志与审计日志
- 通知配置、平台配置、Chroma 配置

## 接口与文档

- API 文档：`docs/API接口文档.md`
- 产品需求：`requirement_docs/数智瞭望系统 PRD 产品需求文档.md`
- 功能需求：`requirement_docs/数智瞭望系统 FRD 功能需求文档.md`
- 系统设计：`requirement_docs/数智瞭望系统 SDD 系统设计文档.md`
- Dify 接口设计：`requirement_docs/数智瞭望系统 SDD 增补章节：Dify 接口调用支持设计.md`
- 原型代码说明：`figma/README.md`

## 环境变量说明

根目录 `.env` 由后端读取，主要配置项包括：

| 变量 | 说明 |
| --- | --- |
| `UVICORN_HOST` | 后端监听地址 |
| `UVICORN_PORT` | 后端监听端口 |
| `DATABASE_TYPE` | 数据库类型，支持 `mysql` / `sqlite` |
| `DATABASE_HOST` | MySQL 地址 |
| `DATABASE_PORT` | MySQL 端口 |
| `DATABASE_NAME` | MySQL 数据库名 |
| `DATABASE_USER` | MySQL 用户名 |
| `DATABASE_PASSWORD` | MySQL 密码 |
| `SQLITE_DATABASE_PATH` | SQLite 文件路径 |
| `JWT_SECRET_KEY` | JWT 签名密钥 |
| `INITIAL_SUPER_ADMIN_USERNAME` | 初始超级管理员用户名 |
| `INITIAL_SUPER_ADMIN_PASSWORD` | 初始超级管理员密码 |
| `CORS_ALLOW_ORIGINS` | 允许跨域来源，多个值用逗号分隔 |

前端环境变量位于 `frontend/.env.local` 或 `frontend/.env.production`：

| 变量 | 说明 |
| --- | --- |
| `VITE_API_BASE_URL` | 后端 API 基础地址 |
| `VITE_WS_BASE_URL` | WebSocket 服务地址 |
| `VITE_APP_TITLE` | 应用标题 |
| `VITE_APP_VERSION` | 应用版本 |

## 开发约定

- 后端接口统一挂载在 `/api/v1` 前缀下。
- 后端统一响应格式详见 `docs/API接口文档.md`。
- 前端登录后根据用户角色进入管理端或用户端，管理员可在两端之间切换。
- 不要提交本地 `.env`、虚拟环境、依赖目录和构建产物。

## 部署提示

1. 使用生产级 `JWT_SECRET_KEY`，不要沿用示例值。
2. 生产环境应显式配置 `CORS_ALLOW_ORIGINS`，不要使用 `*`。
3. MySQL 请提前创建数据库并授予账号权限。
4. 前端构建前需将 `VITE_API_BASE_URL`、`VITE_WS_BASE_URL` 指向生产服务地址。
5. 后端服务建议由进程管理器或容器编排平台托管，并配置反向代理与 HTTPS。
