from flask import Flask, request, jsonify, send_from_directory
import requests
import json
import base64
from database import db_pool, init_db
from email_service import generate_verification_code, send_verification_email
import re
import bcrypt
from datetime import datetime, timedelta, timezone
import os
import traceback
from flask_cors import CORS  # 添加 CORS 支持

app = Flask(__name__, static_folder='..', static_url_path='')
CORS(app)  # 启用 CORS
init_db()  # 初始化数据库

# 添加错误处理装饰器
@app.errorhandler(500)
def handle_500_error(e):
    print(f"500 Error: {str(e)}")
    print(traceback.format_exc())  # 打印完整的错误堆栈
    return jsonify({'error': '服务器错误', 'details': str(e)}), 500

def decrypt_api_key(encrypted_key):
    decoded = base64.b64decode(encrypted_key).decode('utf-8')
    return ''.join(reversed(decoded))

# 静态文件路由
@app.route('/')
def index():
    return send_from_directory('..', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    if path.startswith('api/'):
        return {'error': 'Not Found'}, 404
    if os.path.exists(os.path.join('..', path)):
        return send_from_directory('..', path)
    return send_from_directory('..', 'index.html')

# API 路由
@app.route('/api/send-verification', methods=['POST'])
def send_verification():
    try:
        email = request.json.get('email')
        if not email or not re.match(r'^[\w\.-]+@[\w\.-]+\.\w+$', email):
            return jsonify({'error': '请输入有效的邮箱地址'}), 400

        code = generate_verification_code()
        
        conn = db_pool.getconn()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO verification_codes (email, code, created_at)
                    VALUES (%s, %s, CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
                    ON CONFLICT (email) 
                    DO UPDATE SET 
                        code = EXCLUDED.code, 
                        created_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
                """, (email, code))
                conn.commit()
        finally:
            db_pool.putconn(conn)

        if send_verification_email(email, code):
            return jsonify({'message': '验证码已发送'}), 200
        else:
            return jsonify({'error': '发送验证码失败'}), 500

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': '服务器错误'}), 500

@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        code = data.get('code')

        if not all([email, password, code]):
            return jsonify({'error': '请填写所有必要信息'}), 400

        conn = db_pool.getconn()
        try:
            with conn.cursor() as cur:
                # 验证验证码
                cur.execute("""
                    SELECT code, created_at 
                    FROM verification_codes 
                    WHERE email = %s
                """, (email,))
                result = cur.fetchone()
                
                if not result or result[0] != code:
                    return jsonify({'error': '验证码错误'}), 400

                # 检查邮箱是否已注册
                cur.execute("SELECT id FROM users WHERE email = %s", (email,))
                if cur.fetchone():
                    return jsonify({'error': '该邮箱已注册'}), 400

                # 对密码进行加密
                hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
                
                # 创建用户
                cur.execute("""
                    INSERT INTO users (email, password)
                    VALUES (%s, %s)
                """, (email, hashed.decode('utf-8')))
                
                conn.commit()
                return jsonify({'message': '注册成功'}), 200
        finally:
            db_pool.putconn(conn)

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': '服务器错误'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        print("Received login request")  # 添加日志
        data = request.json
        print(f"Request data: {data}")  # 打印请求数据

        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({'error': '请输入邮箱和密码'}), 400

        print(f"Connecting to database for email: {email}")  # 添加日志
        conn = db_pool.getconn()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT id, email, password, normal_points, premium_points 
                    FROM users 
                    WHERE email = %s
                """, (email,))
                user = cur.fetchone()
                print(f"Database query result: {user}")  # 添加日志
                
                if not user:
                    return jsonify({'error': '邮箱或密码错误'}), 400
                
                if not bcrypt.checkpw(password.encode('utf-8'), user[2].encode('utf-8')):
                    return jsonify({'error': '邮箱或密码错误'}), 400
                
                response_data = {
                    'message': '登录成功',
                    'user': {
                        'id': user[0],
                        'email': user[1],
                        'normal_points': user[3],
                        'premium_points': user[4]
                    }
                }
                print(f"Sending response: {response_data}")  # 添加日志
                return jsonify(response_data), 200
        finally:
            db_pool.putconn(conn)

    except Exception as e:
        print(f"Login error: {str(e)}")  # 添加错误日志
        print(traceback.format_exc())  # 打印完整的错误堆栈
        return jsonify({'error': '服务器错误', 'details': str(e)}), 500

# ... 其他 API 路由保持不变 ...

if __name__ == '__main__':
    app.run(debug=True) 