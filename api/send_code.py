import resend
import random
import traceback

# 设置 API key
resend.api_key = "re_59NidMq9_NvUuNhC3GxQVWeJVHv1WuGWn"

# 使用自定义域名的发件人邮箱
SENDER_EMAIL = "login@hagkiest.top"

def generate_code():
    """生成6位数字验证码"""
    return ''.join(random.choices('0123456789', k=6))

def send_email(to_email, code):
    """使用 Resend API 发送验证码邮件"""
    try:
        print(f"=== Starting email send process ===")
        print(f"To: {to_email}")
        print(f"From: {SENDER_EMAIL}")

        params = {
            "from": f"LikeAi <{SENDER_EMAIL}>",  # 使用自定义域名邮箱
            "to": [to_email],
            "subject": "LikeAi 验证码",
            "html": f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #333;">验证码</h2>
                    <p style="font-size: 16px; color: #666;">您的验证码是：</p>
                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <strong style="font-size: 24px; color: #1a73e8;">{code}</strong>
                    </div>
                    <p style="color: #666;">验证码10分钟内有效。</p>
                    <p style="color: #999; font-size: 14px;">如果您没有请求此验证码，请忽略此邮件。</p>
                </div>
            """
        }

        print("Sending email with params...")
        result = resend.Emails.send(params)
        print(f"Email sent, result: {result}")
        return True

    except Exception as e:
        print("=== Email Send Error ===")
        print(f"Error type: {type(e)}")
        print(f"Error message: {str(e)}")
        print(f"Traceback:\n{traceback.format_exc()}")
        return False

# 在 api/index.py 中修改发送验证码的路由 