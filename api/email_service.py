import resend
import random
import base64

def decrypt_api_key(encrypted):
    try:
        return base64.b64decode(encrypted).decode('utf-8')
    except:
        return None

# 加密后的 API key
ENCRYPTED_RESEND_API_KEY = "cmVfUHpoVGFtVVhfQ3BqQUJUd1lhTHBNczQzb1pYMm1mdVIz"

# 解密 API key
resend.api_key = decrypt_api_key(ENCRYPTED_RESEND_API_KEY)

def generate_verification_code():
    return ''.join(random.choices('0123456789', k=6))

def send_verification_email(to_email, code):
    try:
        resend.Emails.send({
            "from": "AI助手 <onboarding@resend.dev>",
            "to": to_email,
            "subject": "验证码",
            "html": f"<p>您的验证码是：<strong>{code}</strong></p><p>验证码30分钟内有效。</p>"
        })
        return True
    except Exception as e:
        print(f"Error sending email: {str(e)}")
        return False 