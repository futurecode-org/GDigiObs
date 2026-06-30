import type {
  Agent,
  AgentRun,
  AnalysisTask,
  AskRecord,
  CollectedItem,
  CollectedItemDetail,
  CollectLog,
  CollectPlatform,
  CollectTask,
  Conversation,
  CurrentUserResponse,
  DifyApp,
  DifyProvider,
  Friend,
  FriendApplication,
  Group,
  GroupAnnouncement,
  GroupInvitation,
  GroupJoinApplication,
  KnowledgeBase,
  KnowledgeFile,
  Message,
  ModelConfig,
  Notification,
  NotificationSetting,
  OperationLog,
  PaginatedData,
  Permission,
  Role,
  Skill,
  SystemEmailConfig,
  Tenant,
  TokenResponse,
  User,
  Workflow,
  WorkflowRun,
} from "./types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

const STORAGE_KEYS = {
  ACCESS_TOKEN: "gdigi_access_token",
  REFRESH_TOKEN: "gdigi_refresh_token",
  EXPIRES_AT: "gdigi_expires_at",
};

export function getAccessToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
}

export function setAccessToken(token: string): void {
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
}

export function setRefreshToken(token: string): void {
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
}

export function setExpiresAt(expiresIn: number): void {
  const expiresAt = Date.now() + expiresIn * 1000;
  localStorage.setItem(STORAGE_KEYS.EXPIRES_AT, expiresAt.toString());
}

export function isTokenExpired(): boolean {
  const expiresAt = localStorage.getItem(STORAGE_KEYS.EXPIRES_AT);
  if (!expiresAt) return true;
  return Date.now() > parseInt(expiresAt, 10);
}

export function clearAuthStorage(): void {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.EXPIRES_AT);
}

let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

async function refreshTokenIfNeeded(): Promise<void> {
  const accessToken = getAccessToken();
  if (!accessToken) return;
  if (!isTokenExpired()) return;
  if (isRefreshing) return refreshPromise!;

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearAuthStorage();
        throw new Error("No refresh token");
      }

      const response = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      const result = await response.json();
      if (result.code !== 0) {
        clearAuthStorage();
        throw new Error(result.message || "Failed to refresh token");
      }

      const data = result.data as TokenResponse;
      setAccessToken(data.access_token);
      setRefreshToken(data.refresh_token);
      setExpiresAt(data.expires_in);
    } catch (error) {
      clearAuthStorage();
      throw error;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiRequest<T = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  await refreshTokenIfNeeded();

  const accessToken = getAccessToken();
  const headers = new Headers(options.headers);

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  // 对于 POST/PUT/DELETE 请求，如果有 body 且没有指定 Content-Type，则设置为 JSON
  const method = options.method?.toUpperCase() || "GET";
  if (!headers.has("Content-Type") && ["POST", "PUT", "DELETE"].includes(method) && options.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers,
    credentials: "include",
  });

  const result = await response.json();

  if (result.code !== 0) {
    if (result.code === 401) {
      clearAuthStorage();
      window.location.href = "/login";
    }
    throw new Error(result.message || "Request failed");
  }

  return result.data as T;
}

export async function get<T = unknown>(url: string, params?: Record<string, unknown>): Promise<T> {
  let fullUrl = url;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    if (searchParams.toString()) {
      fullUrl += `?${searchParams.toString()}`;
    }
  }
  return apiRequest<T>(fullUrl, { method: "GET" });
}

export async function post<T = unknown>(url: string, body?: unknown): Promise<T> {
  return apiRequest<T>(url, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function put<T = unknown>(url: string, body?: unknown): Promise<T> {
  return apiRequest<T>(url, {
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function del<T = unknown>(url: string): Promise<T> {
  return apiRequest<T>(url, { method: "DELETE" });
}

export const authApi = {
  login: (username: string, password: string): Promise<TokenResponse> =>
    post("/auth/login", { username, password }),

  register: (data: {
    username: string;
    password: string;
    email?: string;
    phone?: string;
    nickname?: string;
    invitation_code?: string;
  }): Promise<{ id: number; username: string }> =>
    post("/auth/register", data),

  getMe: (): Promise<CurrentUserResponse> =>
    get("/auth/me"),

  logout: (refreshToken?: string): Promise<void> =>
    post("/auth/logout", { refresh_token: refreshToken }),

  changePassword: (oldPassword: string, newPassword: string): Promise<void> =>
    post("/auth/change-password", { old_password: oldPassword, new_password: newPassword }),
};

export const notificationApi = {
  getList: (params?: { notification_type?: string; page?: number; page_size?: number }): Promise<PaginatedData<Notification>> =>
    get("/notifications", params),

  getDetail: (notificationId: number): Promise<Notification> =>
    get(`/notifications/${notificationId}`),

  getUnreadCount: (): Promise<number> =>
    get("/notifications/unread/count"),

  markAsRead: (notificationId: number): Promise<void> =>
    post(`/notifications/${notificationId}/read`),

  markAllAsRead: (): Promise<void> =>
    post("/notifications/read/all"),

  delete: (notificationId: number): Promise<void> =>
    del(`/notifications/${notificationId}`),

  batchDelete: (notificationIds: number[]): Promise<void> =>
    post("/notifications/batch", notificationIds),
};

export const conversationApi = {
  getList: (): Promise<Conversation[]> =>
    get("/conversations"),

  getDetail: (conversationId: number): Promise<Conversation> =>
    get(`/conversations/${conversationId}`),

  create: (targetUserId: number): Promise<Conversation> =>
    post("/conversations", { target_user_id: targetUserId }),

  getMessages: (conversationId: number, params?: { page?: number; page_size?: number }): Promise<Message[]> =>
    get(`/conversations/${conversationId}/messages`, params),

  sendMessage: (conversationId: number, messageType: string, content: string, fileId?: number): Promise<Message> =>
    post(`/conversations/${conversationId}/messages`, {
      message_type: messageType,
      content,
      file_id: fileId,
    }),

  markAsRead: (conversationId: number): Promise<void> =>
    post(`/conversations/${conversationId}/read`),

  recallMessage: (messageId: number): Promise<void> =>
    post(`/conversations/messages/${messageId}/recall`),

  updateSettings: (conversationId: number, settings?: { pinned?: boolean; muted?: boolean; hidden?: boolean }): Promise<void> =>
    put(`/conversations/${conversationId}/settings`, settings),

  searchMessages: (conversationId: number, keyword: string, params?: { page?: number; page_size?: number }): Promise<Message[]> =>
    get(`/conversations/${conversationId}/messages/search`, { keyword, ...params }),
};

export const friendApi = {
  getList: async (): Promise<Friend[]> => {
    const data = await get("/friends") as any[];
    return data.map((item: any) => ({
      id: item.friend_relation?.id || item.id,
      user_id: item.friend_user?.id || item.user_id,
      friend_id: item.friend_user?.id || item.friend_id,
      user_info: item.friend_user,
      friend_info: item.friend_user,
      nickname: item.friend_user?.nickname,
      username: item.friend_user?.username,
      remark: item.friend_relation?.remark,
      group: item.friend_relation?.group_name,
      is_online: item.friend_user?.is_online || false,
      last_online_at: item.friend_user?.last_online_at,
      status: "accepted" as const,
      created_at: item.friend_relation?.created_at || item.created_at,
      updated_at: item.friend_relation?.created_at || item.updated_at,
    }));
  },

  apply: (toUserId: number, message?: string): Promise<void> =>
    post("/friends/apply", { to_user_id: toUserId, message }),

  getApplications: (): Promise<FriendApplication[]> =>
    get("/friends/applications"),

  getRequests: (): Promise<FriendApplication[]> =>
    get("/friends/applications"),

  acceptApplication: (applicationId: number): Promise<void> =>
    post(`/friends/applications/${applicationId}/accept`),

  acceptRequest: (applicationId: number): Promise<void> =>
    post(`/friends/applications/${applicationId}/accept`),

  rejectApplication: (applicationId: number): Promise<void> =>
    post(`/friends/applications/${applicationId}/reject`),

  rejectRequest: (applicationId: number): Promise<void> =>
    post(`/friends/applications/${applicationId}/reject`),

  delete: (friendUserId: number): Promise<void> =>
    del(`/friends/${friendUserId}`),

  updateRemark: (friendUserId: number, remark: string): Promise<void> =>
    put(`/friends/${friendUserId}/remark`, { remark }),

  setGroup: (friendUserId: number, group: string): Promise<void> =>
    put(`/friends/${friendUserId}/group`, { group }),
};

export const groupApi = {
  getList: (): Promise<Group[]> =>
    get("/groups"),

  getDetail: (groupId: number): Promise<Group> =>
    get(`/groups/${groupId}`),

  create: (name: string, description?: string, maxMembers?: number): Promise<Group> =>
    post("/groups", { name, description, max_members: maxMembers }),

  addMembers: (groupId: number, userIds: number[]): Promise<void> =>
    post(`/groups/${groupId}/members`, { user_ids: userIds }),

  removeMember: (groupId: number, userId: number): Promise<void> =>
    del(`/groups/${groupId}/members/${userId}`),

  leave: (groupId: number): Promise<void> =>
    post(`/groups/${groupId}/leave`),

  update: (groupId: number, data?: { name?: string; description?: string }): Promise<Group> =>
    put(`/groups/${groupId}`, data),

  setAdmin: (groupId: number, userId: number, isAdmin?: boolean): Promise<void> =>
    put(`/groups/${groupId}/members/${userId}/admin`, { is_admin: isAdmin ?? true }),

  dissolve: (groupId: number): Promise<void> =>
    del(`/groups/${groupId}`),

  getAnnouncements: (groupId: number): Promise<GroupAnnouncement[]> =>
    get(`/groups/${groupId}/announcements`),

  createAnnouncement: (groupId: number, content: string): Promise<GroupAnnouncement> =>
    post(`/groups/${groupId}/announcements`, { content }),

  updateAnnouncement: (announcementId: number, content: string, status?: string): Promise<GroupAnnouncement> =>
    put(`/groups/announcements/${announcementId}`, { content, status }),

  deactivateAnnouncement: (announcementId: number): Promise<void> =>
    del(`/groups/announcements/${announcementId}`),

  getJoinApplications: (groupId?: number): Promise<GroupJoinApplication[]> =>
    get("/groups/join-applications", groupId ? { group_id: groupId } : undefined),

  applyToJoin: (groupId: number, message?: string): Promise<void> =>
    post(`/groups/${groupId}/apply`, { message }),

  acceptJoinApplication: (groupId: number, applicationId: number): Promise<void> =>
    post(`/groups/${groupId}/join-applications/${applicationId}/accept`),

  rejectJoinApplication: (groupId: number, applicationId: number): Promise<void> =>
    post(`/groups/${groupId}/join-applications/${applicationId}/reject`),

  getInvitations: (groupId?: number): Promise<GroupInvitation[]> =>
    get("/groups/invitations", groupId ? { group_id: groupId } : undefined),

  inviteToGroup: (groupId: number, inviteeIds: number[], message?: string): Promise<void> =>
    post(`/groups/${groupId}/invite`, { invitee_ids: inviteeIds, message }),

  acceptInvitation: (invitationId: number): Promise<void> =>
    post(`/groups/invitations/${invitationId}/accept`),

  rejectInvitation: (invitationId: number): Promise<void> =>
    post(`/groups/invitations/${invitationId}/reject`),

  muteMember: (groupId: number, userId: number, durationMinutes?: number): Promise<void> =>
    post(`/groups/${groupId}/members/${userId}/mute`, { duration_minutes: durationMinutes }),

  unmuteMember: (groupId: number, userId: number): Promise<void> =>
    post(`/groups/${groupId}/members/${userId}/unmute`),
};

export const userApi = {
  getList: (params?: { page?: number; page_size?: number }): Promise<PaginatedData<User>> =>
    get("/users", params),

  search: (keyword: string, params?: { page?: number; page_size?: number }): Promise<PaginatedData<User>> =>
    get("/users/search", { keyword, ...params }),

  getDetail: (userId: number): Promise<User> =>
    get(`/users/${userId}`),

  create: (data: unknown): Promise<User> =>
    post("/users", data),

  update: (userId: number, data: unknown): Promise<User> =>
    put(`/users/${userId}`, data),

  assignRoles: (userId: number, roleIds: number[]): Promise<void> =>
    post(`/users/${userId}/roles`, { role_ids: roleIds }),

  delete: (userId: number): Promise<void> =>
    del(`/users/${userId}`),

  enable: (userId: number): Promise<void> =>
    post(`/users/${userId}/enable`),

  unban: (userId: number): Promise<void> =>
    post(`/users/${userId}/unban`),

  disable: (userId: number): Promise<void> =>
    post(`/users/${userId}/disable`),

  ban: (userId: number): Promise<void> =>
    post(`/users/${userId}/ban`),
};

export const agentApi = {
  getList: (params?: { page?: number; page_size?: number }): Promise<PaginatedData<Agent>> =>
    get("/agents", params),

  getDetail: (agentId: number): Promise<Agent> =>
    get(`/agents/${agentId}`),

  create: (data: unknown): Promise<Agent> =>
    post("/agents", data),

  update: (agentId: number, data: unknown): Promise<Agent> =>
    put(`/agents/${agentId}`, data),

  delete: (agentId: number): Promise<void> =>
    del(`/agents/${agentId}`),

  run: (agentId: number, inputData?: unknown): Promise<AgentRun> =>
    post(`/agents/${agentId}/run`, inputData ? { input_data: inputData } : undefined),

  getRuns: (agentId: number, params?: { page?: number; page_size?: number }): Promise<PaginatedData<AgentRun>> =>
    get(`/agents/${agentId}/runs`, params),

  getRunDetail: (runId: number): Promise<AgentRun> =>
    get(`/agents/runs/${runId}`),
};

export const skillApi = {
  getList: (params?: { skill_type?: string; page?: number; page_size?: number }): Promise<PaginatedData<Skill>> =>
    get("/skills", params),

  getDetail: (skillId: number): Promise<Skill> =>
    get(`/skills/${skillId}`),

  create: (data: unknown): Promise<Skill> =>
    post("/skills", data),

  update: (skillId: number, data: unknown): Promise<Skill> =>
    put(`/skills/${skillId}`, data),

  delete: (skillId: number): Promise<void> =>
    del(`/skills/${skillId}`),

  approve: (skillId: number): Promise<void> =>
    post(`/skills/${skillId}/approve`),

  reject: (skillId: number): Promise<void> =>
    post(`/skills/${skillId}/reject`),
};

export const knowledgeApi = {
  getList: (params?: { kb_type?: string; page?: number; page_size?: number }): Promise<PaginatedData<KnowledgeBase>> =>
    get("/knowledge", params),

  getDetail: (kbId: number): Promise<KnowledgeBase> =>
    get(`/knowledge/${kbId}`),

  create: (data: unknown): Promise<KnowledgeBase> =>
    post("/knowledge", data),

  update: (kbId: number, data: unknown): Promise<KnowledgeBase> =>
    put(`/knowledge/${kbId}`, data),

  delete: (kbId: number): Promise<void> =>
    del(`/knowledge/${kbId}`),

  getFiles: (kbId: number, params?: { page?: number; page_size?: number }): Promise<PaginatedData<KnowledgeFile>> =>
    get(`/knowledge/${kbId}/files`, params),

  addFile: (kbId: number, fileId: number): Promise<KnowledgeFile> =>
    post(`/knowledge/${kbId}/files`, { file_id: fileId }),

  deleteFile: (kbId: number, fileId: number): Promise<void> =>
    del(`/knowledge/${kbId}/files/${fileId}`),

  getChunks: (kbId: number, params?: { file_id?: number; page?: number; page_size?: number }): Promise<unknown[]> =>
    get(`/knowledge/${kbId}/chunks`, params),
};

export const workflowApi = {
  getList: (params?: { status?: string; page?: number; page_size?: number }): Promise<PaginatedData<Workflow>> =>
    get("/workflows", params),

  getDetail: (workflowId: number): Promise<Workflow> =>
    get(`/workflows/${workflowId}`),

  create: (data: unknown): Promise<Workflow> =>
    post("/workflows", data),

  update: (workflowId: number, data: unknown): Promise<Workflow> =>
    put(`/workflows/${workflowId}`, data),

  delete: (workflowId: number): Promise<void> =>
    del(`/workflows/${workflowId}`),

  enable: (workflowId: number): Promise<void> =>
    post(`/workflows/${workflowId}/enable`),

  disable: (workflowId: number): Promise<void> =>
    post(`/workflows/${workflowId}/disable`),

  run: (workflowId: number, inputData?: unknown): Promise<WorkflowRun> =>
    post(`/workflows/${workflowId}/run`, inputData ? { input_data: inputData } : undefined),

  getRuns: (workflowId: number, params?: { page?: number; page_size?: number }): Promise<PaginatedData<WorkflowRun>> =>
    get(`/workflows/${workflowId}/runs`, params),

  getRunDetail: (runId: number): Promise<WorkflowRun> =>
    get(`/workflows/runs/${runId}`),

  getTasks: (params?: { page?: number; page_size?: number }): Promise<PaginatedData<WorkflowRun>> =>
    get("/workflows/runs", params),
};

export const collectApi = {
  // 平台管理
  getPlatforms: (params?: { status?: string }): Promise<{ items: CollectPlatform[]; total: number }> =>
    get("/collect/platforms", params),

  getPlatformDetail: (platformId: number): Promise<CollectPlatform> =>
    get(`/collect/platforms/${platformId}`),

  createPlatform: (data: unknown): Promise<CollectPlatform> =>
    post("/collect/platforms", data),

  updatePlatform: (platformId: number, data: unknown): Promise<CollectPlatform> =>
    put(`/collect/platforms/${platformId}`, data),

  deletePlatform: (platformId: number): Promise<void> =>
    del(`/collect/platforms/${platformId}`),

  // 任务管理
  getTasks: (params?: { status?: string; is_public?: boolean; page?: number; page_size?: number }): Promise<PaginatedData<CollectTask>> =>
    get("/collect/tasks", params),

  getTaskDetail: (taskId: number): Promise<CollectTask> =>
    get(`/collect/tasks/${taskId}`),

  createTask: (data: unknown): Promise<CollectTask> =>
    post("/collect/tasks", data),

  updateTask: (taskId: number, data: unknown): Promise<CollectTask> =>
    put(`/collect/tasks/${taskId}`, data),

  deleteTask: (taskId: number): Promise<void> =>
    del(`/collect/tasks/${taskId}`),

  enableTask: (taskId: number): Promise<void> =>
    post(`/collect/tasks/${taskId}/enable`),

  disableTask: (taskId: number): Promise<void> =>
    post(`/collect/tasks/${taskId}/disable`),

  runTask: (taskId: number): Promise<{ message: string }> =>
    post(`/collect/tasks/${taskId}/run`),

  // 采集数据
  getItems: (params?: { task_id?: number; status?: string; keyword?: string; page?: number; page_size?: number }): Promise<PaginatedData<CollectedItem>> =>
    get("/collect/items", params),

  getItemDetail: (itemId: number): Promise<CollectedItemDetail> =>
    get(`/collect/items/${itemId}`),

  updateItem: (itemId: number, data: unknown): Promise<CollectedItem> =>
    put(`/collect/items/${itemId}`, data),

  cleanItem: (itemId: number): Promise<void> =>
    post(`/collect/items/${itemId}/clean`),

  analyzeItem: (itemId: number): Promise<void> =>
    post(`/collect/items/${itemId}/analyze`),

  // 采集日志
  getLogs: (params?: { task_id?: number; status?: string; page?: number; page_size?: number }): Promise<PaginatedData<CollectLog>> =>
    get("/collect/logs", params),
};

export const analysisApi = {
  getTasks: (params?: { analysis_type?: string; page?: number; page_size?: number }): Promise<PaginatedData<AnalysisTask>> =>
    get("/analysis/tasks", params),

  getTaskDetail: (taskId: number): Promise<AnalysisTask> =>
    get(`/analysis/tasks/${taskId}`),

  createTask: (data: unknown): Promise<AnalysisTask> =>
    post("/analysis/tasks", data),

  updateTask: (taskId: number, data: unknown): Promise<AnalysisTask> =>
    put(`/analysis/tasks/${taskId}`, data),

  deleteTask: (taskId: number): Promise<void> =>
    del(`/analysis/tasks/${taskId}`),

  execute: (taskId: number): Promise<AnalysisTask> =>
    post(`/analysis/tasks/${taskId}/execute`),

  getLogs: (params?: { task_id?: number; page?: number; page_size?: number }): Promise<PaginatedData<unknown>> =>
    get("/analysis/logs", params),
};

export const askApi = {
  getList: (params?: { page?: number; page_size?: number }): Promise<PaginatedData<AskRecord>> =>
    get("/ask", params),

  getDetail: (recordId: number): Promise<AskRecord> =>
    get(`/ask/${recordId}`),

  create: (question: string): Promise<AskRecord> =>
    post("/ask", { question }),

  update: (recordId: number, data?: { answer?: string; data_source?: string; chart_type?: string; chart_config?: unknown; result_data?: unknown }): Promise<AskRecord> =>
    put(`/ask/${recordId}`, data),

  save: (recordId: number): Promise<void> =>
    post(`/ask/${recordId}/save`),
};

export const tenantApi = {
  getList: (params?: { page?: number; page_size?: number }): Promise<PaginatedData<Tenant>> =>
    get("/tenants", params),

  getDetail: (tenantId: number): Promise<Tenant> =>
    get(`/tenants/${tenantId}`),

  create: (data: { name: string; tenant_type?: string; description?: string; contact_name?: string; contact_email?: string; contact_phone?: string }): Promise<Tenant> =>
    post("/tenants", data),

  update: (tenantId: number, data: unknown): Promise<Tenant> =>
    put(`/tenants/${tenantId}`, data),

  disable: (tenantId: number): Promise<void> =>
    post(`/tenants/${tenantId}/disable`),
};

export const rbacApi = {
  getRoles: (params?: { page?: number; page_size?: number }): Promise<PaginatedData<Role>> =>
    get("/rbac/roles", params),

  getRoleDetail: (roleId: number): Promise<Role> =>
    get(`/rbac/roles/${roleId}`),

  createRole: (data: { name: string; code: string; description?: string; permission_ids?: number[] }): Promise<Role> =>
    post("/rbac/roles", data),

  updateRole: (roleId: number, data: unknown): Promise<Role> =>
    put(`/rbac/roles/${roleId}`, data),

  assignPermissions: (roleId: number, permissionIds: number[]): Promise<void> =>
    post(`/rbac/roles/${roleId}/permissions`, { permission_ids: permissionIds }),

  getPermissions: (): Promise<Permission[]> =>
    get("/rbac/permissions"),

  getMenuPermissions: (): Promise<Permission[]> =>
    get("/rbac/permissions/menu"),
};

export const auditApi = {
  getOperationLogs: (params?: { module?: string; action?: string; page?: number; page_size?: number }): Promise<PaginatedData<OperationLog>> =>
    get("/audit/operations", params),

  getAuditLogs: (params?: { audit_type?: string; risk_level?: string; page?: number; page_size?: number }): Promise<PaginatedData<unknown>> =>
    get("/audit/logs", params),
};

export const modelApi = {
  getList: (params?: { model_type?: string; page?: number; page_size?: number }): Promise<PaginatedData<ModelConfig>> =>
    get("/models", params),

  getPlatformModels: (): Promise<ModelConfig[]> =>
    get("/models/platform"),

  getEmbeddingModels: (): Promise<ModelConfig[]> =>
    get("/models/embedding"),

  getDetail: (modelId: number): Promise<ModelConfig> =>
    get(`/models/${modelId}`),

  create: (data: unknown): Promise<ModelConfig> =>
    post("/models", data),

  update: (modelId: number, data: unknown): Promise<ModelConfig> =>
    put(`/models/${modelId}`, data),

  delete: (modelId: number): Promise<void> =>
    del(`/models/${modelId}`),

  toggleStatus: (modelId: number, status: string): Promise<ModelConfig> =>
    post(`/models/${modelId}/toggle`, { status }),

  test: (modelId: number): Promise<{ success: boolean; message?: string }> =>
    post(`/models/${modelId}/test`),

  testConnectivity: (data: {
    base_url: string;
    api_key?: string;
    model_key: string;
    api_type?: string;
    max_tokens?: number;
  }): Promise<{ success: boolean; message: string; status_code?: number; response?: unknown }> =>
    post("/models/test-connectivity", data),

  getLogs: (modelId: number, params?: { page?: number; page_size?: number }): Promise<PaginatedData<unknown>> =>
    get(`/models/${modelId}/logs`, params),

  getTokenUsage: (modelId: number): Promise<unknown> =>
    get(`/models/${modelId}/token-usage`),
};

export const notificationSettingApi = {
  getSettings: (): Promise<NotificationSetting> =>
    get("/notifications/settings"),

  updateSettings: (data: Partial<NotificationSetting>): Promise<NotificationSetting> =>
    put("/notifications/settings", data),
};

export const systemEmailConfigApi = {
  getList: (): Promise<SystemEmailConfig[]> =>
    get("/notifications/admin/email-configs"),

  create: (data: Omit<SystemEmailConfig, "id" | "created_at" | "updated_at">): Promise<SystemEmailConfig> =>
    post("/notifications/admin/email-configs", data),

  update: (id: number, data: Partial<SystemEmailConfig>): Promise<SystemEmailConfig> =>
    put(`/notifications/admin/email-configs/${id}`, data),

  delete: (id: number): Promise<void> =>
    del(`/notifications/admin/email-configs/${id}`),

  test: (data: {
    smtp_host: string;
    smtp_port: number;
    smtp_username: string;
    smtp_password: string;
    sender_email: string;
    sender_name?: string;
    security_protocol: string;
  }): Promise<{ message: string }> =>
    post("/notifications/admin/email-configs/test", data),
};

export const adminNotificationApi = {
  send: (data: { title: string; content: string; notification_type?: string; target_type?: string; target_id?: number; target_ids?: number[]; channel?: string; email_config_id?: number; recipient_emails?: string[]; data?: unknown }): Promise<{ sent_count: number }> =>
    post("/notifications/admin/send", data),
};

export const difyApi = {
  getProviders: (params?: { page?: number; page_size?: number }): Promise<PaginatedData<DifyProvider>> =>
    get("/dify/providers", params),

  createProvider: (data: { name: string; base_url: string; api_key: string; visibility?: string; status?: string; remark?: string }): Promise<DifyProvider> =>
    post("/dify/providers", data),

  updateProvider: (id: number, data: Partial<DifyProvider>): Promise<DifyProvider> =>
    put(`/dify/providers/${id}`, data),

  deleteProvider: (id: number): Promise<void> =>
    del(`/dify/providers/${id}`),

  testProvider: (id: number): Promise<{ success: boolean }> =>
    post(`/dify/providers/${id}/test`),

  getApps: (params?: { app_type?: string; page?: number; page_size?: number }): Promise<PaginatedData<DifyApp>> =>
    get("/dify/apps", params),

  getProviderApps: (providerId: number): Promise<PaginatedData<DifyApp>> =>
    get(`/dify/providers/${providerId}/apps`),

  createApp: (data: { name: string; provider_id: number; app_type: string; api_endpoint: string; response_mode?: string; input_schema?: unknown; output_schema?: unknown; default_inputs?: unknown; conversation_enabled?: boolean; visibility?: string; status?: string }): Promise<DifyApp> =>
    post("/dify/apps", data),

  updateApp: (id: number, data: Partial<DifyApp>): Promise<DifyApp> =>
    put(`/dify/apps/${id}`, data),

  deleteApp: (id: number): Promise<void> =>
    del(`/dify/apps/${id}`),

  testApp: (id: number): Promise<{ success: boolean; message?: string }> =>
    post(`/dify/apps/${id}/test`),
};
