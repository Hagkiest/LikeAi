from flask import Flask, request, jsonify, render_template, send_from_directory
import os
from database import db_pool, init_db
from email_service import generate_verification_code, send_verification_email
# ... 其他导入保持不变 ...

app = Flask(__name__, static_folder='..', static_url_path='')

<<<<<<< HEAD
# ... 其他代码保持不变 ...

=======
# Vercel 环境配置
if os.environ.get('VERCEL_ENV') == 'production':
    app = Flask(__name__, static_folder='../')
else:
    app = Flask(__name__)

CORS(app)

# Resend API 配置
resend.api_key = os.environ.get('RESEND_API_KEY')

# 数据库配置
DATABASE_URL = os.environ.get('DATABASE_URL')
if not DATABASE_URL:
    raise ValueError("No DATABASE_URL environment variable set")

# 存储验证码的字典（实际应用中应该使用数据库）
verification_codes = {}

# 验证码类型
VERIFICATION_TYPE_REGISTER = 'register'
VERIFICATION_TYPE_RESET = 'reset'

# 获取数据库会话
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.route('/api/send-verification', methods=['POST'])
def send_verification():
    try:
        data = request.json
        email = data.get('email')
        verification_type = data.get('type', VERIFICATION_TYPE_REGISTER)
        
        if not email:
            return jsonify({'error': 'Email is required'}), 400
            
        # 如果是重置密码，验证邮箱是否存在
        if verification_type == VERIFICATION_TYPE_RESET:
            db = next(get_db())
            user = db.query(User).filter(User.email == email).first()
            if not user:
                return jsonify({'error': 'Email not found'}), 404
        
        # 生成6位验证码
        code = str(random.randint(100000, 999999))
        verification_codes[email] = {
            'code': code,
            'type': verification_type,
            'timestamp': time.time()
        }
        
        # 发送验证码邮件
        subject = "LikeAI - 验证码" if verification_type == VERIFICATION_TYPE_REGISTER else "LikeAI - 重置密码"
        message = "注册" if verification_type == VERIFICATION_TYPE_REGISTER else "重置密码"
        params = {
            "from": "login@hagkiest.top",
            "to": [email],
            "subject": subject,
            "html": f"""
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
                    <h2 style="color: #333; text-align: center;">LikeAI {message}验证码</h2>
                    <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p style="font-size: 16px; color: #666;">您的验证码是：</p>
                        <h1 style="color: #1a8cff; text-align: center; font-size: 32px;">{code}</h1>
                        <p style="font-size: 14px; color: #999; margin-top: 20px;">验证码有效期为10分钟，请尽快使用。</p>
                    </div>
                    <p style="color: #666; font-size: 14px; text-align: center;">
                        如果这不是您的操作，请忽略此邮件。
                    </p>
                </div>
            """
        }
        
        email_result = resend.Emails.send(params)
        return jsonify({'message': 'Verification code sent successfully'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.json
        email = data.get('email')
        code = data.get('code')
        password = data.get('password')
        
        if not email or not code or not password:
            return jsonify({'error': 'Missing required fields'}), 400
        
        # 验证验证码
        if not email in verification_codes or verification_codes[email] != code:
            return jsonify({'error': 'Invalid verification code'}), 400
            
        # 创建用户
        db = next(get_db())
        
        # 检查邮箱是否已注册
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            return jsonify({'error': 'Email already registered'}), 400
        
        # 密码加密
        hashed_password = hashlib.sha256(password.encode()).hexdigest()
        username = email.split('@')[0]
        
        # 创建新用户
        new_user = User(
            email=email,
            username=username,
            password=hashed_password,
            points_basic=10,  # 初始积分
            points_advanced=1,
            is_active=True
        )
        
        db.add(new_user)
        db.commit()
        
        # 清除验证码
        del verification_codes[email]
        
        return jsonify({
            'message': 'Registration successful',
            'user': {
                'username': username,
                'email': email,
                'points_basic': 10,
                'points_advanced': 1
            }
        })
        
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'error': 'Missing email or password'}), 400
        
        db = next(get_db())
        hashed_password = hashlib.sha256(password.encode()).hexdigest()
        
        # 查询用户
        user = db.query(User).filter(User.email == email).first()
        
        if not user or user.password != hashed_password:
            return jsonify({'error': 'Invalid credentials'}), 401
            
        if not user.is_active:
            return jsonify({'error': 'Account is disabled'}), 403
            
        return jsonify({
            'message': 'Login successful',
            'user': {
                'username': user.username,
                'email': user.email,
                'points_basic': user.points_basic,
                'points_advanced': user.points_advanced
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# 添加积分更新接口
@app.route('/api/update-points', methods=['POST'])
def update_points():
    try:
        data = request.json
        email = data.get('email')
        points_basic = data.get('points_basic')
        points_advanced = data.get('points_advanced')
        
        db = next(get_db())
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        if points_basic is not None:
            user.points_basic = points_basic
        if points_advanced is not None:
            user.points_advanced = points_advanced
            
        db.commit()
        
        return jsonify({
            'message': 'Points updated successfully',
            'points_basic': user.points_basic,
            'points_advanced': user.points_advanced
        })
        
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500

# 静态文件服务
>>>>>>> 9aa49f89d69bf495d185b35fc09c3575edd716a6
@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)

# ... 其他路由保持不变 ...

if __name__ == '__main__':
    app.run(debug=True) 