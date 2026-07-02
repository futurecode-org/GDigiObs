"""数据库自动迁移工具 - 自动创建表并添加缺失的列"""

import logging
from sqlalchemy import inspect
from sqlalchemy.schema import CreateColumn
from database.session import Base, engine

logger = logging.getLogger(__name__)


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

            table = table_cls
            preparer = engine.dialect.identifier_preparer
            table_identifier = preparer.format_table(table)
            column_sql = str(CreateColumn(column).compile(dialect=engine.dialect))
            sql = f"ALTER TABLE {table_identifier} ADD COLUMN {column_sql}"

            try:
                logger.info(f"添加列: {table_name}.{column.name}")
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
