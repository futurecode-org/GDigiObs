from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, JSON, DateTime
from database.session import Base
from model.base import BaseModelMixin


class DigitalAgent(Base, BaseModelMixin):
    """数字员工表"""
    __tablename__ = "digital_agents"
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True, comment="租户ID")
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, comment="创建人ID")
    name = Column(String(100), nullable=False, comment="名称")
    avatar_file_id = Column(Integer, ForeignKey("file_assets.id"), nullable=True, comment="头像文件ID")
    role_description = Column(Text, nullable=True, comment="角色描述")
    system_prompt = Column(Text, nullable=True, comment="系统提示词")
    model_id = Column(Integer, ForeignKey("model_configs.id"), nullable=True, comment="默认模型ID")
    skill_ids = Column(JSON, nullable=True, comment="绑定的技能ID列表")
    knowledge_base_ids = Column(JSON, nullable=True, comment="绑定的知识库ID列表")
    workflow_ids = Column(JSON, nullable=True, comment="绑定的工作流ID列表")
    trigger_config = Column(JSON, nullable=True, comment="触发配置")
    push_config = Column(JSON, nullable=True, comment="推送配置")
    visibility = Column(String(20), default="personal", comment="可见范围: personal/tenant/public")
    status = Column(String(20), default="enabled", comment="状态")
    deleted_at = Column(DateTime, nullable=True, comment="删除时间")
    agent_engine = Column(String(20), default="native", comment="执行引擎: native/dify/hybrid")
    dify_app_id = Column(Integer, ForeignKey("dify_apps.id"), nullable=True, index=True, comment="绑定的Dify App ID")
    dify_app_type = Column(String(30), nullable=True, comment="Dify应用类型")
    dify_conversation_strategy = Column(String(20), default="reuse", comment="会话策略: reuse/new")
    dify_input_mapping = Column(JSON, nullable=True, comment="输入映射")
    dify_output_mapping = Column(JSON, nullable=True, comment="输出映射")


class AgentRun(Base, BaseModelMixin):
    """数字员工执行记录表"""
    __tablename__ = "agent_runs"
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True, comment="租户ID")
    agent_id = Column(Integer, ForeignKey("digital_agents.id"), nullable=False, index=True, comment="数字员工ID")
    trigger_type = Column(String(20), nullable=False, comment="触发类型: manual/schedule/chat_command/webhook")
    trigger_user_id = Column(Integer, ForeignKey("users.id"), nullable=True, comment="触发用户ID")
    input_data = Column(JSON, nullable=True, comment="输入数据")
    output_data = Column(JSON, nullable=True, comment="输出数据")
    status = Column(String(20), default="running", comment="状态: running/success/failed/canceled")
    started_at = Column(DateTime, nullable=False, comment="开始时间")
    finished_at = Column(DateTime, nullable=True, comment="完成时间")
    error_message = Column(Text, nullable=True, comment="错误信息")
    steps_log = Column(JSON, nullable=True, comment="执行步骤日志")