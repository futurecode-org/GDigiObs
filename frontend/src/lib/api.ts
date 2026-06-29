import type { PaginatedData, TokenResponse, CurrentUserResponse } from "./types";

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
  refreshPromise = new Promise(async (resolve, reject) => {
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearAuthStorage();
        reject(new Error("No refresh token"));
        return;
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
        reject(new Error(result.message || "Failed to refresh token"));
        return;
      }

      const data = result.data as TokenResponse;
      setAccessToken(data.access_token);
      setRefreshToken(data.refresh_token);
      setExpiresAt(data.expires_in);
      resolve();
    } catch (error) {
      clearAuthStorage();
      reject(error);
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  });

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
  getList: (params?: { notification_type?: string; page?: number; page_size?: number }): Promise<PaginatedData<unknown>> =>
    get("/notifications", params),

  getDetail: (notificationId: number): Promise<unknown> =>
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
  getList: (): Promise<unknown[]> =>
    get("/conversations"),

  getDetail: (conversationId: number): Promise<unknown> =>
    get(`/conversations/${conversationId}`),

  create: (targetUserId: number): Promise<unknown> =>
    post("/conversations", { target_user_id: targetUserId }),

  getMessages: (conversationId: number, params?: { page?: number; page_size?: number }): Promise<unknown[]> =>
    get(`/conversations/${conversationId}/messages`, params),

  sendMessage: (conversationId: number, messageType: string, content: string, fileId?: number): Promise<unknown> =>
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
};

export const friendApi = {
  getList: (): Promise<unknown[]> =>
    get("/friends"),

  apply: (toUserId: number, message?: string): Promise<void> =>
    post("/friends/apply", { to_user_id: toUserId, message }),

  getApplications: (): Promise<unknown[]> =>
    get("/friends/applications"),

  getRequests: (): Promise<unknown[]> =>
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
};

export const groupApi = {
  getList: (): Promise<unknown[]> =>
    get("/groups"),

  getDetail: (groupId: number): Promise<unknown> =>
    get(`/groups/${groupId}`),

  create: (name: string, description?: string, maxMembers?: number): Promise<unknown> =>
    post("/groups", { name, description, max_members: maxMembers }),

  addMembers: (groupId: number, userIds: number[]): Promise<void> =>
    post(`/groups/${groupId}/members`, { user_ids: userIds }),

  removeMember: (groupId: number, userId: number): Promise<void> =>
    del(`/groups/${groupId}/members/${userId}`),

  leave: (groupId: number): Promise<void> =>
    post(`/groups/${groupId}/leave`),

  update: (groupId: number, data?: { name?: string; description?: string }): Promise<unknown> =>
    put(`/groups/${groupId}`, data),

  setAdmin: (groupId: number, userId: number, isAdmin?: boolean): Promise<void> =>
    put(`/groups/${groupId}/members/${userId}/admin`, { is_admin: isAdmin ?? true }),

  dissolve: (groupId: number): Promise<void> =>
    del(`/groups/${groupId}`),
};

export const userApi = {
  getList: (params?: { page?: number; page_size?: number }): Promise<PaginatedData<unknown>> =>
    get("/users", params),

  getDetail: (userId: number): Promise<unknown> =>
    get(`/users/${userId}`),

  update: (userId: number, data: unknown): Promise<unknown> =>
    put(`/users/${userId}`, data),

  assignRoles: (userId: number, roleIds: number[]): Promise<void> =>
    post(`/users/${userId}/roles`, { role_ids: roleIds }),

  disable: (userId: number): Promise<void> =>
    post(`/users/${userId}/disable`),

  ban: (userId: number): Promise<void> =>
    post(`/users/${userId}/ban`),
};

export const agentApi = {
  getList: (params?: { page?: number; page_size?: number }): Promise<PaginatedData<unknown>> =>
    get("/agents", params),

  getDetail: (agentId: number): Promise<unknown> =>
    get(`/agents/${agentId}`),

  create: (data: unknown): Promise<unknown> =>
    post("/agents", data),

  update: (agentId: number, data: unknown): Promise<unknown> =>
    put(`/agents/${agentId}`, data),

  delete: (agentId: number): Promise<void> =>
    del(`/agents/${agentId}`),

  run: (agentId: number, inputData?: unknown): Promise<unknown> =>
    post(`/agents/${agentId}/run`, inputData ? { input_data: inputData } : undefined),

  getRuns: (agentId: number, params?: { page?: number; page_size?: number }): Promise<PaginatedData<unknown>> =>
    get(`/agents/${agentId}/runs`, params),

  getRunDetail: (runId: number): Promise<unknown> =>
    get(`/agents/runs/${runId}`),
};

export const skillApi = {
  getList: (params?: { skill_type?: string; page?: number; page_size?: number }): Promise<PaginatedData<unknown>> =>
    get("/skills", params),

  getDetail: (skillId: number): Promise<unknown> =>
    get(`/skills/${skillId}`),

  create: (data: unknown): Promise<unknown> =>
    post("/skills", data),

  update: (skillId: number, data: unknown): Promise<unknown> =>
    put(`/skills/${skillId}`, data),

  delete: (skillId: number): Promise<void> =>
    del(`/skills/${skillId}`),

  approve: (skillId: number): Promise<void> =>
    post(`/skills/${skillId}/approve`),

  reject: (skillId: number): Promise<void> =>
    post(`/skills/${skillId}/reject`),
};

export const knowledgeApi = {
  getList: (params?: { kb_type?: string; page?: number; page_size?: number }): Promise<PaginatedData<unknown>> =>
    get("/knowledge", params),

  getDetail: (kbId: number): Promise<unknown> =>
    get(`/knowledge/${kbId}`),

  create: (data: unknown): Promise<unknown> =>
    post("/knowledge", data),

  update: (kbId: number, data: unknown): Promise<unknown> =>
    put(`/knowledge/${kbId}`, data),

  delete: (kbId: number): Promise<void> =>
    del(`/knowledge/${kbId}`),

  getFiles: (kbId: number, params?: { page?: number; page_size?: number }): Promise<PaginatedData<unknown>> =>
    get(`/knowledge/${kbId}/files`, params),

  addFile: (kbId: number, fileId: number): Promise<unknown> =>
    post(`/knowledge/${kbId}/files`, { file_id: fileId }),

  deleteFile: (kbId: number, fileId: number): Promise<void> =>
    del(`/knowledge/${kbId}/files/${fileId}`),

  getChunks: (kbId: number, params?: { file_id?: number; page?: number; page_size?: number }): Promise<unknown[]> =>
    get(`/knowledge/${kbId}/chunks`, params),
};

export const workflowApi = {
  getList: (params?: { status?: string; page?: number; page_size?: number }): Promise<PaginatedData<unknown>> =>
    get("/workflows", params),

  getDetail: (workflowId: number): Promise<unknown> =>
    get(`/workflows/${workflowId}`),

  create: (data: unknown): Promise<unknown> =>
    post("/workflows", data),

  update: (workflowId: number, data: unknown): Promise<unknown> =>
    put(`/workflows/${workflowId}`, data),

  delete: (workflowId: number): Promise<void> =>
    del(`/workflows/${workflowId}`),

  enable: (workflowId: number): Promise<void> =>
    post(`/workflows/${workflowId}/enable`),

  disable: (workflowId: number): Promise<void> =>
    post(`/workflows/${workflowId}/disable`),

  run: (workflowId: number, inputData?: unknown): Promise<unknown> =>
    post(`/workflows/${workflowId}/run`, inputData ? { input_data: inputData } : undefined),

  getRuns: (workflowId: number, params?: { page?: number; page_size?: number }): Promise<PaginatedData<unknown>> =>
    get(`/workflows/${workflowId}/runs`, params),

  getRunDetail: (runId: number): Promise<unknown> =>
    get(`/workflows/runs/${runId}`),

  getTasks: (params?: { page?: number; page_size?: number }): Promise<PaginatedData<unknown>> =>
    get("/workflows/runs", params),
};

export const collectApi = {
  getPlatforms: (): Promise<unknown[]> =>
    get("/collect/platforms"),

  createPlatform: (data: unknown): Promise<unknown> =>
    post("/collect/platforms", data),

  getTasks: (params?: { is_public?: boolean; page?: number; page_size?: number }): Promise<PaginatedData<unknown>> =>
    get("/collect/tasks", params),

  getTaskDetail: (taskId: number): Promise<unknown> =>
    get(`/collect/tasks/${taskId}`),

  createTask: (data: unknown): Promise<unknown> =>
    post("/collect/tasks", data),

  updateTask: (taskId: number, data: unknown): Promise<unknown> =>
    put(`/collect/tasks/${taskId}`, data),

  deleteTask: (taskId: number): Promise<void> =>
    del(`/collect/tasks/${taskId}`),

  enableTask: (taskId: number): Promise<void> =>
    post(`/collect/tasks/${taskId}/enable`),

  disableTask: (taskId: number): Promise<void> =>
    post(`/collect/tasks/${taskId}/disable`),

  getItems: (params?: { task_id?: number; status?: string; page?: number; page_size?: number }): Promise<PaginatedData<unknown>> =>
    get("/collect/items", params),

  getItemDetail: (itemId: number): Promise<unknown> =>
    get(`/collect/items/${itemId}`),

  updateItem: (itemId: number, data: unknown): Promise<unknown> =>
    put(`/collect/items/${itemId}`, data),

  cleanItem: (itemId: number): Promise<void> =>
    post(`/collect/items/${itemId}/clean`),

  analyzeItem: (itemId: number): Promise<void> =>
    post(`/collect/items/${itemId}/analyze`),

  getLogs: (params?: { task_id?: number; page?: number; page_size?: number }): Promise<unknown[]> =>
    get("/collect/logs", params),
};

export const analysisApi = {
  getTasks: (params?: { analysis_type?: string; page?: number; page_size?: number }): Promise<PaginatedData<unknown>> =>
    get("/analysis/tasks", params),

  getTaskDetail: (taskId: number): Promise<unknown> =>
    get(`/analysis/tasks/${taskId}`),

  createTask: (data: unknown): Promise<unknown> =>
    post("/analysis/tasks", data),

  updateTask: (taskId: number, data: unknown): Promise<unknown> =>
    put(`/analysis/tasks/${taskId}`, data),

  deleteTask: (taskId: number): Promise<void> =>
    del(`/analysis/tasks/${taskId}`),

  execute: (taskId: number): Promise<unknown> =>
    post(`/analysis/tasks/${taskId}/execute`),

  getLogs: (params?: { task_id?: number; page?: number; page_size?: number }): Promise<PaginatedData<unknown>> =>
    get("/analysis/logs", params),
};

export const askApi = {
  getList: (params?: { page?: number; page_size?: number }): Promise<PaginatedData<unknown>> =>
    get("/ask", params),

  getDetail: (recordId: number): Promise<unknown> =>
    get(`/ask/${recordId}`),

  create: (question: string): Promise<unknown> =>
    post("/ask", { question }),

  update: (recordId: number, data?: { answer?: string; data_source?: string; chart_type?: string; chart_config?: unknown; result_data?: unknown }): Promise<unknown> =>
    put(`/ask/${recordId}`, data),

  save: (recordId: number): Promise<void> =>
    post(`/ask/${recordId}/save`),
};

export const tenantApi = {
  getList: (params?: { page?: number; page_size?: number }): Promise<PaginatedData<unknown>> =>
    get("/tenants", params),

  getDetail: (tenantId: number): Promise<unknown> =>
    get(`/tenants/${tenantId}`),

  create: (data: { name: string; tenant_type?: string; description?: string; contact_name?: string; contact_email?: string; contact_phone?: string }): Promise<unknown> =>
    post("/tenants", data),

  update: (tenantId: number, data: unknown): Promise<unknown> =>
    put(`/tenants/${tenantId}`, data),

  disable: (tenantId: number): Promise<void> =>
    post(`/tenants/${tenantId}/disable`),
};

export const rbacApi = {
  getRoles: (params?: { page?: number; page_size?: number }): Promise<PaginatedData<unknown>> =>
    get("/rbac/roles", params),

  getRoleDetail: (roleId: number): Promise<unknown> =>
    get(`/rbac/roles/${roleId}`),

  createRole: (data: { name: string; code: string; description?: string; permission_ids?: number[] }): Promise<unknown> =>
    post("/rbac/roles", data),

  updateRole: (roleId: number, data: unknown): Promise<unknown> =>
    put(`/rbac/roles/${roleId}`, data),

  assignPermissions: (roleId: number, permissionIds: number[]): Promise<void> =>
    post(`/rbac/roles/${roleId}/permissions`, { permission_ids: permissionIds }),

  getPermissions: (): Promise<unknown[]> =>
    get("/rbac/permissions"),

  getMenuPermissions: (): Promise<unknown[]> =>
    get("/rbac/permissions/menu"),
};

export const auditApi = {
  getOperationLogs: (params?: { module?: string; action?: string; page?: number; page_size?: number }): Promise<PaginatedData<unknown>> =>
    get("/audit/operations", params),

  getAuditLogs: (params?: { audit_type?: string; risk_level?: string; page?: number; page_size?: number }): Promise<PaginatedData<unknown>> =>
    get("/audit/logs", params),
};

export const modelApi = {
  getList: (params?: { model_type?: string; page?: number; page_size?: number }): Promise<PaginatedData<unknown>> =>
    get("/models", params),

  getPlatformModels: (): Promise<unknown[]> =>
    get("/models/platform"),

  getEmbeddingModels: (): Promise<unknown[]> =>
    get("/models/embedding"),

  getDetail: (modelId: number): Promise<unknown> =>
    get(`/models/${modelId}`),

  create: (data: unknown): Promise<unknown> =>
    post("/models", data),

  update: (modelId: number, data: unknown): Promise<unknown> =>
    put(`/models/${modelId}`, data),

  delete: (modelId: number): Promise<void> =>
    del(`/models/${modelId}`),

  test: (modelId: number): Promise<unknown> =>
    post(`/models/${modelId}/test`),
};