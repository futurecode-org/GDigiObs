export interface DifyAvailableModel {
  model: string;
  label: { en_US?: string; zh_Hans?: string };
  model_type: string;
  features?: string[];
  fetch_from: string;
  model_properties?: Record<string, unknown>;
  status: string;
}

export interface DifyModelProvider {
  provider: string;
  label: { en_US?: string; zh_Hans?: string };
  icon_small?: Record<string, string>;
  icon_large?: Record<string, string>;
  status: string;
  models: DifyAvailableModel[];
}

export interface DifySyncResult {
  synced_count: number;
  total_datasets: number;
}export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
  request_id?: string;
}

export interface PaginatedData<T = unknown> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface CurrentUserResponse {
  id: number;
  username: string;
  email?: string;
  phone?: string;
  nickname?: string;
  avatar_file_id?: number;
  user_type: string;
  status: string;
  tenant_id?: number;
  tenant_name?: string;
  tenant_type?: string;
  roles: string[];
  permissions: string[];
  menus: MenuItem[];
  is_super_admin: boolean;
  is_tenant_admin: boolean;
  last_login_at?: string;
}

export interface MenuItem {
  id: number;
  name: string;
  path: string;
  icon?: string;
  children?: MenuItem[];
}

export interface Notification {
  id: number;
  user_id: number;
  notification_type: "system" | "task" | "message" | "approval" | "friend_application" | "group_invitation";
  type?: "system" | "task" | "message" | "approval" | "friend_application" | "group_invitation";
  title: string;
  content: string;
  data?: any;
  read?: boolean;
  status?: string;
  created_at: string;
  updated_at?: string;
}

export interface Conversation {
  id: number;
  type: "direct" | "group";
  name?: string;
  unread_count: number;
  message_count?: number;
  last_message?: Message;
  members: ConversationMember[];
  created_at: string;
  updated_at: string;
}

export interface ConversationMember {
  id: number;
  user_id: number;
  username: string;
  nickname?: string;
  avatar_file_id?: number;
  role?: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_name: string;
  message_type: "text" | "image" | "file" | "system";
  content: string;
  file_id?: number;
  file_name?: string;
  file_size?: number;
  read: boolean;
  recalled: boolean;
  audit_status?: "passed" | "blocked" | "reviewing";
  risk_level?: "none" | "low" | "medium" | "high";
  risk_tags?: string[];
  ai_risk_level?: "none" | "low" | "medium" | "high";
  ai_risk_tags?: string[];
  ai_detected_at?: string;
  ai_model_id?: number;
  ai_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface ChatAuditMessage {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_name: string;
  content?: string;
  message_type: string;
  audit_status?: string;
  risk_level?: string;
  risk_tags?: string[];
  ai_risk_level?: string;
  ai_risk_tags?: string[];
  ai_detected_at?: string;
  ai_model_id?: number;
  ai_reason?: string;
  created_at?: string;
}

export interface AiDetectionResult {
  model_id: number;
  model_name: string;
  risk_level: string;
  risk_tags: string[];
  reason: string;
  success: boolean;
  error?: string;
}

export interface User {
  id: number;
  username: string;
  email?: string;
  phone?: string;
  nickname?: string;
  avatar_file_id?: number;
  user_type: string;
  status: string;
  is_active?: boolean;
  is_super_admin?: boolean;
  is_tenant_admin?: boolean;
  tenant_id?: number;
  tenant_name?: string;
  department_name?: string;
  roles: string[];
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Friend {
  id: number;
  user_id: number;
  friend_id: number;
  user_info: User;
  friend_info: User;
  nickname?: string;
  username?: string;
  remark?: string;
  group?: string;
  is_online?: boolean;
  last_online_at?: string;
  status: "pending" | "accepted";
  created_at: string;
  updated_at: string;
}

export interface FriendApplication {
  id: number;
  from_user_id: number;
  to_user_id: number;
  message?: string;
  status: "pending" | "accepted" | "rejected";
  from_user?: User;
  from_nickname?: string;
  from_username?: string;
  from_role?: string;
  from_company?: string;
  type?: string;
  created_at: string;
  updated_at: string;
}

export type FriendRequest = FriendApplication;

export interface Group {
  id: number;
  name: string;
  description?: string;
  max_members: number;
  member_count: number;
  status: string;
  created_by: number;
  owner?: {
    user_id: number;
    username?: string;
    nickname?: string;
  };
  members: GroupMember[];
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: number;
  group_id: number;
  user_id: number;
  username: string;
  nickname?: string;
  avatar_file_id?: number;
  role: "owner" | "admin" | "member";
  joined_at: string;
  muted_until?: string;
}

export interface GroupAnnouncement {
  id: number;
  tenant_id: number;
  group_id: number;
  content: string;
  created_by: number;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

export interface GroupJoinApplication {
  id: number;
  tenant_id: number;
  group_id: number;
  user_id: number;
  message?: string;
  status: "pending" | "accepted" | "rejected";
  handled_by?: number;
  handled_at?: string;
  created_at: string;
  username?: string;
  nickname?: string;
}

export interface GroupInvitation {
  id: number;
  tenant_id: number;
  group_id: number;
  inviter_id: number;
  invitee_id: number;
  message?: string;
  status: "pending" | "accepted" | "rejected" | "expired";
  expires_at: string;
  accepted_at?: string;
  created_at: string;
  group_name?: string;
  inviter_name?: string;
}

export interface Agent {
  id: number;
  name: string;
  avatar_file_id?: number;
  role_description?: string;
  system_prompt?: string;
  model_id?: number;
  skill_ids: number[];
  knowledge_base_ids: number[];
  workflow_ids: number[];
  trigger_config?: unknown;
  push_config?: unknown;
  visibility: "private" | "public";
  status: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface AgentRun {
  id: number;
  agent_id: number;
  agent_name: string;
  input_data?: unknown;
  output_data?: unknown;
  status: "pending" | "running" | "completed" | "failed";
  error_message?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface Skill {
  id: number;
  name: string;
  type: string;
  description?: string;
  config?: unknown;
  input_schema?: unknown;
  output_schema?: unknown;
  visibility: "private" | "public";
  status: string;
  review_status?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeBase {
  id: number;
  name: string;
  type: string;
  description?: string;
  group_id?: number;
  provider_type: "local" | "dify";
  chroma_config_id?: number;
  dify_provider_id?: number;
  dify_dataset_id?: string;
  embedding_model_id?: number;
  rerank_model_id?: number;
  dify_embedding_model?: string;
  dify_embedding_model_provider?: string;
  dify_rerank_model?: string;
  dify_rerank_model_provider?: string;
  chunk_size?: number;
  chunk_overlap?: number;
  status: string;
  is_public?: boolean;
  file_count: number;
  chunk_count: number;
  created_by: number;
  created_at: string;
  updated_at: string;
  // 详情嵌套对象
  chroma_config?: { id: number; name: string; host: string };
  dify_provider?: { id: number; name: string };
  embedding_model?: { id: number; name: string };
  rerank_model?: { id: number; name: string };
}

export interface KnowledgeFile {
  id: number;
  kb_id: number;
  file_id: number;
  original_filename?: string;
  file_size?: number;
  word_count?: number;
  parse_status: string;
  error_message?: string;
  chunk_count: number;
  dify_document_id?: string;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeChunk {
  id: number;
  kb_id: number;
  file_id: number;
  chunk_index: number;
  content: string;
  token_count: number;
  chroma_doc_id?: string;
  created_at: string;
}

export interface ChromaConfig {
  id: number;
  name: string;
  host: string;
  port: number;
  collection_prefix: string;
  visibility: string;
  status: string;
  remark?: string;
  created_at: string;
  updated_at: string;
}

export interface RetrieveTestResult {
  id: string;
  content: string;
  score: number;
  metadata: Record<string, unknown>;
  source: "local" | "dify";
}

export interface RetrieveTestResponse {
  query: string;
  results_count: number;
  latency_ms: number;
  results: RetrieveTestResult[];
}

export interface QAResponse {
  query: string;
  answer: string;
  results_count: number;
  latency_ms: number;
  references: RetrieveTestResult[];
}

export interface KBRetrievalLog {
  id: number;
  query: string;
  retrieval_type: string;
  results_count: number;
  latency_ms?: number;
  status: string;
  created_at: string;
}

export interface Workflow {
  id: number;
  name: string;
  description?: string;
  nodes: unknown[];
  edges: unknown[];
  trigger_type: string;
  schedule_config?: unknown;
  status: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface WorkflowRun {
  id: number;
  workflow_id: number;
  workflow_name: string;
  input_data?: unknown;
  output_data?: unknown;
  status: "pending" | "running" | "completed" | "failed";
  error_message?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface CollectPlatform {
  id: number;
  name: string;
  platform_type: string;
  default_method: string;
  config_schema?: Record<string, unknown>;
  description?: string;
  status: string;
  created_at: string;
  updated_at?: string;
}

export interface CollectTask {
  id: number;
  tenant_id: number;
  name: string;
  platform_id: number;
  platform_name?: string;
  platform_type?: string;
  collect_method: string;
  source_url?: string;
  request_config?: Record<string, unknown>;
  parse_rule?: Record<string, unknown>;
  schedule_config?: ScheduleConfig;
  is_public: boolean;
  status: string;
  last_run_at?: string;
  fail_count: number;
  created_by: number;
  created_at: string;
  updated_at?: string;
}

export interface ScheduleConfig {
  cron?: string;
  interval?: "daily" | "weekly" | "monthly";
  hour?: number;
  minute?: number;
  day_of_week?: string;
  day?: number;
}

export interface CollectedItem {
  id: number;
  tenant_id: number;
  task_id: number;
  title?: string;
  content?: string;
  author?: string;
  publish_at?: string;
  source_platform?: string;
  source_url?: string;
  raw_content_type?: string;
  attachments?: Array<{ type: string; url: string; name?: string }>;
  sentiment?: string;
  tags?: Record<string, unknown>;
  entities?: Record<string, unknown>;
  is_public: boolean;
  status: string;
  created_at: string;
}

export interface CollectedItemDetail extends CollectedItem {
  raw_content?: string;
}

export interface CollectLog {
  id: number;
  tenant_id: number;
  task_id: number;
  run_at: string;
  status: string;
  items_count: number;
  error_message?: string;
  duration_seconds?: number;
  created_at: string;
}

export interface AnalysisTask {
  id: number;
  name: string;
  analysis_type: string;
  data_source: unknown;
  config?: unknown;
  description?: string;
  status: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: number;
  name: string;
  status: string;
  progress?: number;
  created_at?: string;
}

export interface AskRecord {
  id: number;
  question: string;
  answer?: string;
  data_source?: string;
  chart_type?: string;
  chart_config?: unknown;
  result_data?: unknown;
  status: string;
  is_saved?: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface Tenant {
  id: number;
  name: string;
  tenant_type: "enterprise" | "personal";
  description?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  status: "active" | "disabled";
  member_count: number;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: number;
  name: string;
  code: string;
  description?: string;
  is_system: boolean;
  permissions: Permission[];
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: number;
  name: string;
  code: string;
  description?: string;
  module?: string;
  created_at: string;
}

export interface ModelConfig {
  id: number;
  name: string;
  model_key: string;
  model_type: "chat" | "embedding" | "rerank" | "llm";
  api_type: "openai" | "anthropic" | "ollama" | "custom";
  base_url?: string;
  api_key?: string;
  visibility: "platform" | "tenant" | "personal";
  support_tool_call?: boolean;
  support_vision?: boolean;
  support_reasoning?: boolean;
  context_length?: number;
  max_tokens?: number;
  temperature?: number;
  currency?: string;
  input_price?: number;
  output_price?: number;
  price_unit?: string;
  default_config?: unknown;
  status: "enabled" | "disabled";
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface ModelUsageRankingItem {
  model_id: number;
  name: string;
  model_key: string;
  currency: string;
  input_price?: number;
  output_price?: number;
  price_unit: string;
  calls: number;
  prompt_tokens: number;
  completion_tokens: number;
  cost: number;
}

export interface OperationLog {
  id: number;
  user_id: number;
  username: string;
  module: string;
  action: string;
  resource_type?: string;
  resource_id?: number;
  detail?: string;
  ip_address?: string;
  user_agent?: string;
  success: boolean;
  error_message?: string;
  created_at: string;
}

export interface AuditLog {
  id: number;
  tenant_id?: number;
  user_id?: number;
  audit_type: string;
  risk_level: string;
  risk_tags?: string[];
  content_summary?: string;
  object_type?: string;
  object_id?: number;
  result?: unknown;
  created_at: string;
}

export interface MessageAuditItem {
  id: number;
  tenant_id?: number;
  conversation_id: number;
  conversation_type?: "direct" | "group";
  sender_id: number;
  sender_name: string;
  message_type: string;
  content?: string;
  audit_status: "passed" | "blocked" | "reviewing";
  risk_level: "none" | "low" | "medium" | "high";
  risk_tags?: string[];
  risk_categories?: string[];
  ai_risk_level?: "none" | "low" | "medium" | "high";
  ai_risk_tags?: string[];
  ai_detected_at?: string;
  ai_model_id?: number;
  ai_reason?: string;
  created_at: string;
}

export interface SensitiveWord {
  id: number;
  tenant_id?: number;
  scope: "platform" | "tenant";
  word: string;
  category: string;
  category_label?: string;
  risk_level: "low" | "medium" | "high";
  is_enabled: boolean;
  is_regex: boolean;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface AlertRecord {
  id: number;
  tenant_id?: number;
  alert_type: string;
  source_type?: string;
  source_id?: number;
  title: string;
  content?: string;
  risk_level?: string;
  status: "unresolved" | "resolved" | "ignored";
  notified_channels?: Record<string, boolean>;
  resolved_by_name?: string;
  resolved_at?: string;
  created_at: string;
}

export interface AlertRule {
  id: number;
  tenant_id?: number;
  scope: "platform" | "tenant";
  rule_name: string;
  alert_type: string;
  trigger_condition?: Record<string, unknown>;
  channels?: Record<string, boolean>;
  enabled: boolean;
  created_at: string;
}

export interface DifyProvider {
  id: number;
  name: string;
  provider_type: string;
  base_url: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface DifyApp {
  id: number;
  provider_id: number;
  name: string;
  app_type: string;
  api_endpoint: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationSetting {
  id: number;
  user_id: number;
  browser_enabled: boolean;
  email_enabled: boolean;
  scene_settings?: Record<string, { browser?: boolean; email?: boolean }>;
  created_at: string;
  updated_at: string;
}

export interface SystemEmailConfig {
  id: number;
  tenant_id?: number;
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  sender_email: string;
  sender_name?: string;
  security_protocol: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface DifyProvider {
  id: number;
  name: string;
  base_url: string;
  visibility: string;
  status: string;
  remark?: string;
  created_at: string;
  updated_at: string;
}

export interface DifyApp {
  id: number;
  name: string;
  provider_id: number;
  app_type: string;
  api_endpoint: string;
  response_mode: string;
  input_schema?: unknown;
  output_schema?: unknown;
  default_inputs?: unknown;
  conversation_enabled: boolean;
  visibility: string;
  review_status: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export type UserPage = 
  | "dashboard"
  | "messages"
  | "contacts"
  | "query"
  | "query-history"
  | "knowledge"
  | "skills"
  | "skill-market"
  | "agents"
  | "workflow"
  | "tasks"
  | "notifications"
  | "settings"
  | "dify-providers";

export type AdminPage =
  | "dashboard"
  | "tenants"
  | "org"
  | "users"
  | "roles"
  | "permissions"
  | "groups"
  | "collect"
  | "clean"
  | "analysis"
  | "data-audit"
  | "models"
  | "skills"
  | "agents"
  | "workflows"
  | "knowledge"
  | "chroma-configs"
  | "query"
  | "chat-audit"
  | "sensitive"
  | "alert-management"
  | "op-logs"
  | "audit-logs"
  | "notify-settings"
  | "platform-config"
  | "admin-notifications";
