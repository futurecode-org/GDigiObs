"""邮件发送服务"""
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from sqlalchemy.orm import Session
from typing import List, Optional

from dao.notification_dao import get_system_email_config_by_id
from core.exceptions import BadRequestException
from core.security import decrypt_api_key

logger = logging.getLogger(__name__)


def send_email_with_config(
    db: Session,
    tenant_id: int,
    config_id: Optional[int],
    recipient: str,
    subject: str,
    body: str,
    html_body: str = None
) -> bool:
    """使用指定邮件配置发送邮件
    
    Args:
        db: 数据库会话
        tenant_id: 租户ID
        config_id: 邮件配置ID，None则使用租户默认配置
        recipient: 收件人邮箱
        subject: 邮件主题
        body: 纯文本内容
        html_body: HTML内容（可选）
    """
    config = None
    if config_id:
        config = get_system_email_config_by_id(db, config_id)
    
    # 如果指定ID未找到，尝试获取租户默认配置
    if not config:
        from dao.notification_dao import get_system_email_configs
        configs = get_system_email_configs(db, tenant_id)
        enabled_configs = [c for c in configs if c.status == "enabled"]
        if enabled_configs:
            config = enabled_configs[0]
    
    if not config:
        raise BadRequestException("未找到可用的邮件配置")
    
    # 解密密码
    password = decrypt_api_key(config.smtp_password)
    
    try:
        if config.security_protocol == "ssl":
            server = smtplib.SMTP_SSL(config.smtp_host, config.smtp_port, timeout=30)
        else:
            server = smtplib.SMTP(config.smtp_host, config.smtp_port, timeout=30)
            if config.security_protocol == "starttls":
                server.starttls()
        
        if config.security_protocol != "none":
            server.login(config.smtp_username, password)
        
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{config.sender_name or config.sender_email} <{config.sender_email}>"
        msg["To"] = recipient
        
        msg.attach(MIMEText(body, "plain", "utf-8"))
        if html_body:
            msg.attach(MIMEText(html_body, "html", "utf-8"))
        
        server.sendmail(config.sender_email, recipient, msg.as_string())
        server.quit()
        
        logger.info(f"邮件发送成功: to={recipient}, subject={subject}, config={config.id}")
        return True
    except Exception as e:
        logger.error(f"邮件发送失败: to={recipient}, error={e}")
        raise BadRequestException(f"邮件发送失败: {str(e)}")
