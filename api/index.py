from flask import Flask, request, send_from_directory, jsonify
from flask_cors import CORS
import requests
import json
import os

app = Flask(__name__)
CORS(app)  # 启用CORS

# 静态文件服务
@app.route('/')
def index():
    return send_from_directory('../', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('../', path)

# AI API 代理
@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        
        # 构建讯飞API所需的请求格式
        payload = {
            "header": {
                "app_id": os.environ.get('XF_APP_ID'),
                "uid": "12345"
            },
            "parameter": {
                "chat": {
                    "domain": "general",
                    "temperature": 0.5,
                    "max_tokens": 2048
                }
            },
            "payload": {
                "message": {
                    "text": data['messages']
                }
            }
        }
        
        # 发送请求到讯飞API
        response = requests.post(
            'https://spark-api.xf-yun.com/v2.1/chat',
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {os.environ.get("XF_API_KEY")}'
            },
            json=payload
        )
        
        # 解析响应
        result = response.json()
        
        # 转换为前端期望的格式
        return jsonify({
            'code': 0,
            'choices': [{
                'message': {
                    'content': result.get('payload', {}).get('text', '抱歉，我暂时无法回答。')
                }
            }]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Vercel 需要的入口函数
def handler(event, context):
    return app(event, context) 