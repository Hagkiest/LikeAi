import os
import psycopg2
from psycopg2 import pool
import base64

def decrypt_connection_string(encrypted):
    try:
        return base64.b64decode(encrypted).decode('utf-8')
    except:
        return None

# 加密后的数据库连接字符串
ENCRYPTED_DB_URL = "cG9zdGdyZXNxbDovL25lb25kYl9vd25lcjpKT1p2NEIzaVBZdUZAZXAtc29mdC1jbG91ZC1hMXR5ZGJqci5hcC1zb3V0aGVhc3QtMS5hd3MubmVvbi50ZWNoL25lb25kYj9zc2xtb2RlPXJlcXVpcmU="

# 解密数据库连接字符串
DATABASE_URL = decrypt_connection_string(ENCRYPTED_DB_URL)

print(f"Connecting to database...")  # 不打印连接字符串，避免泄露

try:
    # 数据库连接池
    db_pool = psycopg2.pool.SimpleConnectionPool(
        1, 20,
        DATABASE_URL,
        sslmode='require'  # 确保使用 SSL 连接
    )
    print("Database pool created successfully")
except Exception as e:
    print(f"Error creating database pool: {str(e)}")
    raise

def init_db():
    """初始化数据库表"""
    print("Initializing database tables...")  # 添加日志
    conn = db_pool.getconn()
    try:
        with conn.cursor() as cur:
            # 创建用户表
            cur.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    normal_points INTEGER DEFAULT 10,
                    premium_points INTEGER DEFAULT 0,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # 创建验证码表
            cur.execute("""
                CREATE TABLE IF NOT EXISTS verification_codes (
                    email VARCHAR(255) PRIMARY KEY,
                    code VARCHAR(6) NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE NOT NULL
                )
            """)

            # 创建打卡记录表
            cur.execute("""
                CREATE TABLE IF NOT EXISTS user_checkins (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            """)

            conn.commit()
            print("Database tables initialized successfully")  # 添加日志
    except Exception as e:
        print(f"Error initializing database: {str(e)}")  # 添加错误日志
        raise
    finally:
        db_pool.putconn(conn) 