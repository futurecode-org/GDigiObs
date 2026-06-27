"""SQL安全校验模块"""
import sqlparse
from sqlparse.tokens import DML, Keyword
from sqlparse.sql import IdentifierList, Identifier, Where, Parenthesis
from typing import Dict, Optional, List, Tuple
import re
from pydantic import BaseModel


class SqlValidationResult(BaseModel):
    """SQL校验结果"""
    is_valid: bool = True
    error_message: str = ""
    sanitized_sql: str = ""
    original_sql: str = ""
    detected_threats: List[str] = []
    has_writing_operation: bool = False


class SqlValidator:
    """SQL安全校验器"""
    
    FORBIDDEN_STATEMENTS = [
        "INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "TRUNCATE",
        "CREATE", "GRANT", "REVOKE", "CALL", "EXEC", "EXECUTE",
        "MERGE", "REPLACE", "LOCK", "UNLOCK"
    ]
    
    DANGEROUS_FUNCTIONS = [
        "LOAD_FILE", "INTO OUTFILE", "DUMPFILE",
        "UNION", "SLEEP", "BENCHMARK", "CONCAT_WS"
    ]
    
    ALLOWED_STATEMENTS = ["SELECT"]
    
    def __init__(self):
        pass
    
    def validate(self, sql: str, tenant_id: int, data_scope: Dict = None) -> SqlValidationResult:
        """校验SQL安全性并注入租户和数据权限条件"""
        result = SqlValidationResult(original_sql=sql)
        
        if not sql or not sql.strip():
            result.is_valid = False
            result.error_message = "SQL语句为空"
            return result
        
        sql = sql.strip()
        
        if not self._check_statement_type(sql, result):
            return result
        
        if not self._check_dangerous_patterns(sql, result):
            return result
        
        if not self._check_comment_injection(sql, result):
            return result
        
        sanitized_sql = self._inject_tenant_condition(sql, tenant_id)
        
        if data_scope:
            sanitized_sql = self._inject_data_scope_condition(sanitized_sql, data_scope)
        
        result.sanitized_sql = sanitized_sql
        return result
    
    def _check_statement_type(self, sql: str, result: SqlValidationResult) -> bool:
        """检查SQL语句类型是否合法"""
        parsed = sqlparse.parse(sql)
        if not parsed:
            result.is_valid = False
            result.error_message = "无法解析SQL语句"
            return False
        
        for stmt in parsed:
            tokens = list(stmt.tokens)
            
            for token in tokens:
                if token.ttype == DML:
                    statement_type = token.value.upper()
                    
                    if statement_type in self.FORBIDDEN_STATEMENTS:
                        result.is_valid = False
                        result.error_message = f"禁止执行{statement_type}语句"
                        result.detected_threats.append(f"forbidden_statement:{statement_type}")
                        result.has_writing_operation = True
                        return False
                    
                    if statement_type not in self.ALLOWED_STATEMENTS:
                        result.is_valid = False
                        result.error_message = f"不支持{statement_type}语句"
                        result.detected_threats.append(f"unsupported_statement:{statement_type}")
                        return False
                    
                    break
        
        return True
    
    def _check_dangerous_patterns(self, sql: str, result: SqlValidationResult) -> bool:
        """检查SQL中是否包含危险模式"""
        upper_sql = sql.upper()
        
        for func in self.DANGEROUS_FUNCTIONS:
            if func in upper_sql:
                result.is_valid = False
                result.error_message = f"检测到危险函数: {func}"
                result.detected_threats.append(f"dangerous_function:{func}")
                return False
        
        dangerous_patterns = [
            r"(\/\*.*?\*\/)|(--.*?$)",
            r"(OR|AND)\s+\d+\s*=\s*\d+",
            r"(UNION\s+ALL)?\s*SELECT\s+.*?FROM\s+INFORMATION_SCHEMA",
            r"@@\w+",
            r"\$\(\w+\)",
        ]
        
        for pattern in dangerous_patterns:
            if re.search(pattern, upper_sql, re.IGNORECASE | re.MULTILINE | re.DOTALL):
                result.is_valid = False
                result.error_message = "检测到SQL注入攻击模式"
                result.detected_threats.append("sql_injection_attempt")
                return False
        
        return True
    
    def _check_comment_injection(self, sql: str, result: SqlValidationResult) -> bool:
        """检查注释注入"""
        comment_patterns = [
            r"--.*",
            r"/\*.*\*/",
            r"#.*",
        ]
        
        for pattern in comment_patterns:
            matches = re.findall(pattern, sql, re.MULTILINE | re.DOTALL)
            if matches:
                for match in matches:
                    if len(match) > 100:
                        result.is_valid = False
                        result.error_message = "检测到超长注释注入"
                        result.detected_threats.append("comment_injection")
                        return False
        
        return True
    
    def _inject_tenant_condition(self, sql: str, tenant_id: int) -> str:
        """向SQL中注入tenant_id条件"""
        parsed = sqlparse.parse(sql)
        if not parsed:
            return sql
        
        stmt = parsed[0]
        
        has_where = False
        where_clause = None
        
        for token in stmt.tokens:
            if isinstance(token, Where):
                has_where = True
                where_clause = token
                break
        
        tenant_condition = f"tenant_id = {tenant_id}"
        
        if has_where and where_clause:
            where_content = str(where_clause).replace("WHERE ", "", 1).strip()
            if where_content:
                new_where = f"WHERE {tenant_condition} AND {where_content}"
            else:
                new_where = f"WHERE {tenant_condition}"
            
            return str(stmt).replace(str(where_clause), new_where)
        else:
            return str(stmt) + f" WHERE {tenant_condition}"
    
    def _inject_data_scope_condition(self, sql: str, data_scope: Dict) -> str:
        """向SQL中注入数据权限条件"""
        scope_type = data_scope.get("scope_type")
        if not scope_type:
            return sql
        
        conditions = []
        
        if scope_type == "current_tenant":
            pass
        elif scope_type == "current_department":
            dept_ids = data_scope.get("department_ids", [])
            if dept_ids:
                ids_str = ",".join(map(str, dept_ids))
                conditions.append(f"department_id IN ({ids_str})")
        elif scope_type == "current_department_and_children":
            dept_ids = data_scope.get("department_ids", [])
            if dept_ids:
                ids_str = ",".join(map(str, dept_ids))
                conditions.append(f"department_id IN ({ids_str})")
        elif scope_type == "self":
            user_id = data_scope.get("user_id")
            if user_id:
                conditions.append(f"created_by = {user_id}")
        elif scope_type == "custom":
            custom_condition = data_scope.get("condition")
            if custom_condition:
                conditions.append(custom_condition)
        
        if conditions:
            condition_str = " AND ".join(conditions)
            parsed = sqlparse.parse(sql)
            if parsed:
                stmt = parsed[0]
                has_where = False
                
                for token in stmt.tokens:
                    if isinstance(token, Where):
                        has_where = True
                        break
                
                if has_where:
                    return str(stmt) + f" AND ({condition_str})"
                else:
                    return str(stmt) + f" WHERE ({condition_str})"
        
        return sql
    
    def extract_tables(self, sql: str) -> List[str]:
        """提取SQL中涉及的表名"""
        parsed = sqlparse.parse(sql)
        tables = []
        
        for stmt in parsed:
            for token in stmt.tokens:
                if isinstance(token, IdentifierList):
                    for identifier in token.get_identifiers():
                        tables.append(str(identifier).strip())
                elif isinstance(token, Identifier):
                    tables.append(str(token).strip())
        
        return tables


sql_validator = SqlValidator()


def validate_sql(sql: str, tenant_id: int, data_scope: Dict = None) -> SqlValidationResult:
    """校验SQL安全性"""
    return sql_validator.validate(sql, tenant_id, data_scope)