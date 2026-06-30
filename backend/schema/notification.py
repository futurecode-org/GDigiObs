"""通知相关数据模型"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime


class NotificationResponse(BaseModel):
    """通知响应"""
    id: int
    tenant_id: int
    user_id: int
    notification_type: str
    title: str
    content: Optional[str] = None
    data: Optional[Dict] = None
    read_at: Optional[datetime] = None
    channel: str
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    """通知列表响应"""
    items: List[NotificationResponse]
    total: int
    page: int
    page_size: int


class NotificationSettingResponse(BaseModel):
    """用户通知设置响应"""
    id: int
    user_id: int
    browser_enabled: bool
    email_enabled: bool
    scene_settings: Optional[Dict] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class NotificationSettingUpdate(BaseModel):
    """更新用户通知设置"""
    browser_enabled: Optional[bool] = Field(None, description="是否开启浏览器通知")
    email_enabled: Optional[bool] = Field(None, description="是否开启邮件通知")
    scene_settings: Optional[Dict] = Field(None, description="各场景通知偏好")


class SystemEmailConfigResponse(BaseModel):
    """系统邮件配置响应"""
    id: int
    tenant_id: Optional[int] = None
    smtp_host: str
    smtp_port: int
    smtp_username: str
    smtp_password: str
    sender_email: str
    sender_name: Optional[str] = None
    security_protocol: str
    status: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class SystemEmailConfigCreate(BaseModel):
    """创建系统邮件配置"""
    tenant_id: Optional[int] = Field(None, description="租户ID，空表示平台级")
    smtp_host: str = Field(..., description="SMTP服务器")
    smtp_port: int = Field(587, description="SMTP端口")
    smtp_username: str = Field(..., description="SMTP用户名")
    smtp_password: str = Field(..., description="SMTP密码")
    sender_email: str = Field(..., description="发件人邮箱")
    sender_name: Optional[str] = Field(None, description="发件人名称")
    security_protocol: str = Field("tls", description="安全协议: none/ssl/tls/starttls")
    status: str = Field("enabled", description="状态: enabled/disabled")


class SystemEmailConfigUpdate(BaseModel):
    """更新系统邮件配置"""
    smtp_host: Optional[str] = Field(None, description="SMTP服务器")
    smtp_port: Optional[int] = Field(None, description="SMTP端口")
    smtp_username: Optional[str] = Field(None, description="SMTP用户名")
    smtp_password: Optional[str] = Field(None, description="SMTP密码")
    sender_email: Optional[str] = Field(None, description="发件人邮箱")
    sender_name: Optional[str] = Field(None, description="发件人名称")
    security_protocol: Optional[str] = Field(None, description="安全协议: none/ssl/tls/starttls")
    status: Optional[str] = Field(None, description="状态: enabled/disabled")


class TestEmailConnectionRequest(BaseModel):
    """测试邮件连接请求"""
    smtp_host: str = Field(..., description="SMTP服务器")
    smtp_port: int = Field(587, description="SMTP端口")
    smtp_username: str = Field(..., description="SMTP用户名")
    smtp_password: str = Field(..., description="SMTP密码")
    sender_email: str = Field(..., description="发件人邮箱")
    sender_name: Optional[str] = Field(None, description="发件人名称")
    security_protocol: str = Field("tls", description="安全协议: none/ssl/tls/starttls")


class SendNotificationRequest(BaseModel):
    """管理员发送系统通知请求"""
    title: str = Field(..., description="通知标题")
    content: str = Field(..., description="通知内容")
    notification_type: str = Field("system", description="通知类型")
    target_type: str = Field("all", description="目标类型: all/tenant/role/user")
    target_ids: Optional[List[int]] = Field(None, description="目标用户ID列表（多选）")
    channel: str = Field("in_app", description="渠道: in_app/browser/email")
    email_config_id: Optional[int] = Field(None, description="邮件配置ID（邮件渠道必填）")
    recipient_emails: Optional[List[str]] = Field(None, description="额外收件邮箱列表（邮件渠道选填）")
    data: Optional[Dict] = Field(None, description="附加数据")
