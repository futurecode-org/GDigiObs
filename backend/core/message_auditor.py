"""消息审计模块"""
import re
from typing import List, Dict, Optional, Tuple
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)


class AuditResult(BaseModel):
    """审计结果"""
    is_passed: bool = True
    risk_level: str = "low"
    risk_tags: List[str] = []
    audit_action: str = "allow"
    content_summary: str = ""
    blocked_reason: str = ""


class MessageAuditor:
    """消息审计器"""
    
    SENSITIVE_KEYWORDS = [
        ("政治敏感", ["习近平", "胡锦涛", "江泽民", "毛泽东", "邓小平",
                      "党中央", "国务院", "中央军委", "中南海", "天安门"]),
        ("色情低俗", ["色情", "裸体", "性爱", "性交", "手淫", "嫖娼", "卖淫",
                      "AV", "三级片", "露点", "艳照"]),
        ("暴力恐怖", ["杀人", "自杀", "爆炸", "恐怖", "袭击", "枪支", "弹药",
                      "毒品", "贩毒", "吸毒"]),
        ("赌博诈骗", ["赌博", "彩票", "博彩", "诈骗", "传销", "洗钱",
                      "中奖", "红包", "返利"]),
        ("恶意攻击", ["傻逼", "草泥马", "操你妈", "去死", "滚", "垃圾", "脑残"]),
        ("广告推销", ["广告", "推广", "促销", "优惠", "打折", "免费",
                      "加盟", "代理", "微商"]),
        ("违法信息", ["违法", "犯罪", "法院", "警察", "逮捕", "判刑",
                      "通缉", "逃犯"])
    ]
    
    MAX_CONTENT_LENGTH = 5000
    
    AUDIT_ACTIONS = {
        "allow": "放行",
        "block": "拦截",
        "review": "人工审核"
    }
    
    def __init__(self):
        self._build_patterns()
    
    def _build_patterns(self):
        """构建敏感词匹配模式"""
        self.patterns = []
        for category, keywords in self.SENSITIVE_KEYWORDS:
            pattern = re.compile(r'|'.join(re.escape(k) for k in keywords), re.IGNORECASE)
            self.patterns.append((category, pattern))
    
    def audit(self, message: str, sender_id: int = None, tenant_id: int = None) -> AuditResult:
        """审计消息内容"""
        result = AuditResult()
        
        if not message or not message.strip():
            result.is_passed = True
            result.content_summary = "空消息"
            return result
        
        message = message.strip()
        
        if len(message) > self.MAX_CONTENT_LENGTH:
            result.is_passed = False
            result.risk_level = "high"
            result.risk_tags.append("content_too_long")
            result.audit_action = "block"
            result.blocked_reason = "消息内容过长"
            result.content_summary = message[:100] + "..."
            return result
        
        risk_count = 0
        detected_categories = []
        
        for category, pattern in self.patterns:
            if pattern.search(message):
                risk_count += 1
                detected_categories.append(category)
                result.risk_tags.append(f"sensitive_{category}")
        
        if risk_count > 0:
            result.is_passed = False
            result.content_summary = message[:200]
            
            if risk_count >= 3:
                result.risk_level = "high"
                result.audit_action = "block"
                result.blocked_reason = f"检测到{risk_count}类敏感内容: {', '.join(detected_categories)}"
            elif risk_count == 2:
                result.risk_level = "medium"
                result.audit_action = "review"
                result.blocked_reason = f"检测到{risk_count}类敏感内容: {', '.join(detected_categories)}"
            else:
                result.risk_level = "medium"
                result.audit_action = "review"
                result.blocked_reason = f"检测到敏感内容: {detected_categories[0]}"
        
        else:
            result.is_passed = True
            result.risk_level = "low"
            result.audit_action = "allow"
            result.content_summary = message[:200] if len(message) > 200 else message
        
        result.content_summary = result.content_summary.replace("\n", " ").replace("\r", "")
        
        return result
    
    def detect_sensitive_words(self, message: str) -> List[Dict]:
        """检测消息中的敏感词"""
        detections = []
        
        for category, pattern in self.patterns:
            matches = pattern.findall(message)
            if matches:
                detections.append({
                    "category": category,
                    "words": list(set(matches))
                })
        
        return detections
    
    def classify_content(self, message: str) -> str:
        """对消息内容进行分类"""
        if self._is_normal_chat(message):
            return "normal_chat"
        elif self._is_question(message):
            return "question"
        elif self._is_command(message):
            return "command"
        elif self._is_url(message):
            return "url"
        elif self._is_code(message):
            return "code"
        else:
            return "other"
    
    def _is_normal_chat(self, message: str) -> bool:
        """判断是否为普通聊天"""
        normal_patterns = [
            r'^你好|^您好|^嗨|^哈喽',
            r'谢谢|感谢|不客气',
            r'好的|知道了|明白了',
            r'在吗|在不在|在线吗',
            r'今天|明天|昨天',
            r'吃饭|睡觉|工作',
        ]
        return any(re.search(p, message, re.IGNORECASE) for p in normal_patterns)
    
    def _is_question(self, message: str) -> bool:
        """判断是否为问题"""
        return message.endswith("?") or message.endswith("？") or \
               re.search(r'[？?]', message) or \
               re.search(r'(什么|怎么|为什么|如何|哪个|谁|多少|是否|有没有)', message)
    
    def _is_command(self, message: str) -> bool:
        """判断是否为命令"""
        command_patterns = [
            r'^/[a-zA-Z]+',
            r'^命令:',
            r'^执行:',
            r'^运行:',
        ]
        return any(re.search(p, message) for p in command_patterns)
    
    def _is_url(self, message: str) -> bool:
        """判断是否包含URL"""
        url_pattern = r'https?://[^\s]+'
        return bool(re.search(url_pattern, message))
    
    def _is_code(self, message: str) -> bool:
        """判断是否包含代码"""
        code_patterns = [
            r'```[\s\S]*```',
            r'`[^`]+`',
            r'(SELECT|INSERT|UPDATE|DELETE)\s+\w+',
            r'function\s+\w+\(',
            r'def\s+\w+\(',
        ]
        return any(re.search(p, message, re.IGNORECASE) for p in code_patterns)


message_auditor = MessageAuditor()


def audit_message(message: str, sender_id: int = None, tenant_id: int = None) -> AuditResult:
    """审计消息内容"""
    return message_auditor.audit(message, sender_id, tenant_id)