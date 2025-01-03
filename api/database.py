import os
import psycopg2
from psycopg2 import pool

# 从环境变量获取数据库 URL
DATABASE_URL = os.getenv('DATABASE_URL')

# 数据库连接池
db_pool = psycopg2.pool.SimpleConnectionPool(
    1, 20,
    DATABASE_URL
) 