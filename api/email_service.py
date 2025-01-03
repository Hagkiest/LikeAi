import os
import resend

# 从环境变量获取 API key
resend.api_key = os.getenv('RESEND_API_KEY')

# ... 其他代码保持不变 ... 