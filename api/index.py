from flask import Flask, request, jsonify, send_from_directory
import requests
import json
import base64
from database import db_pool, init_db
from send_code import generate_code, send_email
import re
import bcrypt
from datetime import datetime, timedelta, timezone
import os
import traceback
from flask_cors import CORS

app = Flask(__name__, static_folder='..', static_url_path='')
CORS(app)

# 添加错误处理装饰器
@app.errorhandler(500)
def handle_500_error(e):
    print(f"500 Error: {str(e)}")
    print(traceback.format_exc())
    return jsonify({'error': '服务器错误', 'details': str(e)}), 500

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
@app.route('/api/checkin', methods=['POST'])
def checkin():
    try:
        print("Received checkin request")  # 添加日志
        user_data = request.get_json()
        user_id = user_data.get('userId')
        
        if not user_id:
            return jsonify({'error': '未登录'}), 401

        conn = db_pool.getconn()
        try:
            with conn.cursor() as cur:
                # 检查今天是否已经打卡
                cur.execute("""
                    SELECT created_at 
                    FROM user_checkins 
                    WHERE user_id = %s 
                    AND DATE(created_at AT TIME ZONE 'UTC') = CURRENT_DATE
                """, (user_id,))
                
                if cur.fetchone():
                    return jsonify({'error': '今天已经打卡了，明天再来吧！'}), 400

                # 记录打卡并增加积分
                cur.execute("""
                    WITH checkin_insert AS (
                        INSERT INTO user_checkins (user_id) 
                        VALUES (%s)
                    )
                    UPDATE users 
                    SET normal_points = normal_points + 10 
                    WHERE id = %s 
                    RETURNING normal_points
                """, (user_id, user_id))
                
                result = cur.fetchone()
                if not result:
                    return jsonify({'error': '用户不存在'}), 404
                
                conn.commit()
                return jsonify({
                    'message': '打卡成功',
                    'points': 10,
                    'total_points': result[0]
                }), 200
        finally:
            db_pool.putconn(conn)
            
    except Exception as e:
        print(f"Checkin error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': '服务器错误'}), 500

@app.route('/api/points/exchange', methods=['POST'])
def exchange_points():
    try:
        data = request.json
        user_id = data.get('userId')
        amount = data.get('amount', 0)

        if not user_id:
            return jsonify({'error': '未登录'}), 401

        if amount <= 0:
            return jsonify({'error': '兑换数量必须大于0'}), 400

        conn = db_pool.getconn()
        try:
            with conn.cursor() as cur:
                # 检查用户积分是否足够
                cur.execute("""
                    SELECT normal_points, premium_points
                    FROM users 
                    WHERE id = %s
                """, (user_id,))
                
                result = cur.fetchone()
                if not result:
                    return jsonify({'error': '用户不存在'}), 404

                normal_points, premium_points = result

                if normal_points < amount:
                    return jsonify({'error': '基础积分不足'}), 400

                # 执行兑换
                cur.execute("""
                    UPDATE users 
                    SET normal_points = normal_points - %s,
                        premium_points = premium_points + %s
                    WHERE id = %s
                    RETURNING normal_points, premium_points
                """, (amount, amount // 2, user_id))

                new_points = cur.fetchone()
                conn.commit()

                return jsonify({
                    'message': '兑换成功',
                    'normal_points': new_points[0],
                    'premium_points': new_points[1]
                }), 200
        finally:
            db_pool.putconn(conn)

    except Exception as e:
        print(f"Exchange error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': '服务器错误'}), 500

# 添加登录路由
@app.route('/api/login', methods=['POST'])
def login():
    try:
        print("Received login request")
        data = request.json
        print(f"Login data: {data}")

        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({'error': '请输入邮箱和密码'}), 400

        conn = db_pool.getconn()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT id, email, password, normal_points, premium_points 
                    FROM users 
                    WHERE email = %s
                """, (email,))
                user = cur.fetchone()
                print(f"Found user: {user}")

                if not user:
                    return jsonify({'error': '邮箱或密码错误'}), 400

                if not bcrypt.checkpw(password.encode('utf-8'), user[2].encode('utf-8')):
                    return jsonify({'error': '邮箱或密码错误'}), 400

                return jsonify({
                    'message': '登录成功',
                    'user': {
                        'id': user[0],
                        'email': user[1],
                        'normal_points': user[3],
                        'premium_points': user[4]
                    }
                }), 200
        finally:
            db_pool.putconn(conn)

    except Exception as e:
        print(f"Login error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': '服务器错误'}), 500

# 添加发送验证码路由
@app.route('/api/send-verification', methods=['POST'])
def send_verification():
    try:
        print("=== Starting send verification process ===")
        
        # 获取请求数据
        data = request.get_json()
        if not data:
            print("Error: No JSON data received")
            return jsonify({'error': '无效的请求数据'}), 400
            
        email = data.get('email')
        print(f"Received email: {email}")

        if not email or not re.match(r'^[\w\.-]+@[\w\.-]+\.\w+$', email):
            print(f"Error: Invalid email format: {email}")
            return jsonify({'error': '请输入有效的邮箱地址'}), 400

        # 生成验证码
        try:
            code = generate_code()
            print(f"Generated verification code: {code}")
        except Exception as e:
            print(f"Error generating code: {str(e)}")
            return jsonify({'error': '生成验证码失败'}), 500

        # 保存验证码到数据库
        conn = db_pool.getconn()
        try:
            with conn.cursor() as cur:
                print("Saving verification code to database...")
                cur.execute("""
                    INSERT INTO verification_codes (email, code, created_at)
                    VALUES (%s, %s, CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
                    ON CONFLICT (email) 
                    DO UPDATE SET 
                        code = EXCLUDED.code, 
                        created_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
                """, (email, code))
                conn.commit()
                print("Verification code saved successfully")
        except Exception as e:
            print(f"Database error: {str(e)}")
            return jsonify({'error': '数据库错误'}), 500
        finally:
            db_pool.putconn(conn)

        # 发送验证码邮件
        try:
            print("Attempting to send email...")
            if send_email(email, code):
                print("Email sent successfully")
                return jsonify({'message': '验证码已发送'}), 200
            else:
                print("Failed to send email")
                return jsonify({'error': '发送验证码失败'}), 500
        except Exception as e:
            print(f"Email sending error: {str(e)}")
            print(f"Traceback: {traceback.format_exc()}")
            return jsonify({'error': '发送邮件时出错'}), 500

    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': '服务器错误'}), 500

# 添加注册路由
@app.route('/api/register', methods=['POST'])
def register():
    try:
        print("Received register request")
        data = request.json
        print(f"Register data: {data}")

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

                # 检查验证码是否过期（30分钟）
                code_time = result[1].replace(tzinfo=timezone.utc)
                if datetime.now(timezone.utc) - code_time > timedelta(minutes=30):
                    return jsonify({'error': '验证码已过期'}), 400

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
                    RETURNING id
                """, (email, hashed.decode('utf-8')))
                
                conn.commit()
                return jsonify({'message': '注册成功'}), 200
        finally:
            db_pool.putconn(conn)

    except Exception as e:
        print(f"Register error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': '服务器错误'}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        messages = data.get('messages', [])
        model = data.get('model', 'lite')
        user_id = data.get('userId')

        if not user_id:
            return jsonify({'error': '未登录'}), 401

        # 检查用户积分
        conn = db_pool.getconn()
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT normal_points, premium_points 
                    FROM users 
                    WHERE id = %s
                """, (user_id,))
                result = cur.fetchone()
                
                if not result:
                    return jsonify({'error': '用户不存在'}), 404

                normal_points, premium_points = result
                points_needed = 1 if model == 'lite' else 2

                if normal_points < points_needed:
                    return jsonify({'error': '积分不足'}), 400

                # 构建星火 API 请求
                api_url = "https://spark-api-open.xf-yun.com/v1/chat/completions"
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer fhjXaCsmBduoQHEWasvW:RUkiuTCkAjvfkMLryqVT"
                }
                
                # 添加系统提示，支持数学公式
                system_message = {
                    "role": "system",
                    "content": "你是一个智能助手。当需要表达数学公式时，请使用LaTeX格式，用 $...$ 包裹行内公式，用 $$...$$ 包裹独立公式。"
                }
                
                # 在用户消息前添加系统提示
                all_messages = [system_message] + messages

                payload = {
                    "model": model,
                    "messages": all_messages,
                    "temperature": 0.7
                }

                print("Sending request to Spark API...")
                response = requests.post(api_url, json=payload, headers=headers)
                response_data = response.json()

                if response.status_code == 200:
                    # 扣除积分
                    cur.execute("""
                        UPDATE users 
                        SET normal_points = normal_points - %s 
                        WHERE id = %s
                    """, (points_needed, user_id))
                    conn.commit()

                    # 处理 AI 响应
                    ai_response = response_data.get('choices', [{}])[0].get('message', {}).get('content', '')
                    if not ai_response:
                        ai_response = response_data.get('payload', {}).get('choices', [{}])[0].get('text', '')

                    return jsonify({
                        'code': 0,
                        'choices': [{
                            'message': {
                                'content': ai_response,
                                'role': 'assistant'
                            }
                        }]
                    }), 200
                else:
                    error_msg = response_data.get('error', {}).get('message', 'AI服务异常')
                    print(f"Spark API error: {error_msg}")
                    return jsonify({'error': error_msg}), response.status_code

        finally:
            db_pool.putconn(conn)

    except Exception as e:
        print(f"Chat error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': '服务器错误'}), 500

# ... 其他现有路由保持不变 ...

if __name__ == '__main__':
    app.run(debug=True) 