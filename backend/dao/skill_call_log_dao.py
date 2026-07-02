"""技能调用记录数据访问层"""
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional

from model.skill_call_log import SkillCallLog


def create_call_log(db: Session, skill_id: int, tenant_id: Optional[int],
                    caller_id: Optional[int], source: str, input_data: Optional[dict],
                    output_data: Optional[dict], status: str,
                    duration_ms: Optional[int] = None,
                    error_message: Optional[str] = None) -> SkillCallLog:
    """创建调用记录"""
    log = SkillCallLog(
        skill_id=skill_id,
        tenant_id=tenant_id,
        caller_id=caller_id,
        source=source,
        input_data=input_data,
        output_data=output_data,
        status=status,
        duration_ms=duration_ms,
        error_message=error_message
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


def get_call_logs(db: Session, skill_id: int, page: int = 1,
                  page_size: int = 20) -> List[SkillCallLog]:
    """获取技能调用记录"""
    return db.query(SkillCallLog).filter(
        SkillCallLog.skill_id == skill_id
    ).order_by(desc(SkillCallLog.created_at)).offset(
        (page - 1) * page_size
    ).limit(page_size).all()


def count_call_logs(db: Session, skill_id: int) -> int:
    """统计技能调用记录数量"""
    return db.query(SkillCallLog).filter(
        SkillCallLog.skill_id == skill_id
    ).count()
