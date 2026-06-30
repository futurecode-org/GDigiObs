"""数据库自动迁移工具 - 自动创建表并添加缺失的列"""

import logging
from sqlalchemy import inspect, Column, Integer, String, Boolean, DateTime, Text, JSON
from sqlalchemy.types import TypeEngine
from database.session import Base, engine

logger = logging.getLogger(__name__)

# 类型映射：SQLAlchemy 类型 -> MySQL 类型
_TYPE_MAP = {
    Integer: "INT",
    String: "VARCHAR",
    Boolean: "TINYINT",
    DateTime: "DATETIME",
    Text: "TEXT",
    JSON: "JSON",
}


def _get_column_type(column: Column) -> str:
    """根据 SQLAlchemy 列定义生成 MySQL 类型字符串"""
    sql_type = column.type

    if isinstance(sql_type, String):
        length = sql_type.length
        return f"VARCHAR({length})" if length else "TEXT"
    elif isinstance(sql_type, Integer):
        return "INT"
    elif isinstance(sql_type, Boolean):
        return "TINYINT(1)"
    elif isinstance(sql_type, DateTime):
        return "DATETIME"
    elif isinstance(sql_type, Text):
        return "TEXT"
    elif isinstance(sql_type, JSON):
        return "JSON"

    # 兜底：用编译后的类型名
    from sqlalchemy.dialects import mysql

    return sql_type.compile(dialect=mysql.dialect())


def _get_column_default(column: Column) -> str:
    """获取列默认值 SQL 片段"""
    if column.default is not None:
        default = column.default.arg
        if callable(default):
            if default.__name__ == "now":
                return " DEFAULT CURRENT_TIMESTAMP"
            return ""
        elif isinstance(default, bool):
            return f" DEFAULT {1 if default else 0}"
        elif isinstance(default, int):
            return f" DEFAULT {default}"
        elif isinstance(default, str):
            return f" DEFAULT '{default}'"
    return ""


def auto_add_missing_columns():
    """
    自动添加模型中定义但数据库表缺失的列。
    遍历所有 SQLAlchemy 模型，对比实际表结构，执行 ALTER TABLE ADD COLUMN。
    """
    inspector = inspect(engine)
    conn = engine.raw_connection()
    cursor = conn.cursor()

    added_count = 0

    for table_name, table_cls in Base.metadata.tables.items():
        # 检查表是否存在
        if not inspector.has_table(table_name):
            logger.info(f"表 {table_name} 不存在，将由 create_all 自动创建")
            continue

        # 获取表已有列名
        existing_cols = {col["name"] for col in inspector.get_columns(table_name)}

        for column in table_cls.columns:
            if column.name in existing_cols:
                continue

            # 构建 ALTER TABLE 语句
            col_type = _get_column_type(column)
            nullable = "" if not column.nullable else " NULL"
            default = _get_column_default(column)
            comment = f" COMMENT '{column.comment}'" if column.comment else ""

            sql = (
                f"ALTER TABLE {table_name} "
                f"ADD COLUMN {column.name} {col_type}{nullable}{default}{comment}"
            )

            try:
                logger.info(f"添加列: {table_name}.{column.name} ({col_type})")
                cursor.execute(sql)
                added_count += 1
            except Exception as e:
                logger.error(f"添加列失败: {table_name}.{column.name} - {e}")
                # 不 raise，继续处理其他列

    conn.commit()
    cursor.close()
    conn.close()

    if added_count > 0:
        logger.info(f"共自动添加 {added_count} 个缺失的列")
    else:
        logger.info("所有表结构已是最新，无需添加列")


def init_database():
    """初始化数据库：创建缺失的表 + 添加缺失的列"""
    # 第一步：创建不存在的表
    Base.metadata.create_all(bind=engine)
    logger.info("表结构检查完成（缺失的表已创建）")

    # 第二步：为已存在但缺少新列的表添加列
    auto_add_missing_columns()
