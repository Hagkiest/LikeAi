from flask import Flask, request, send_from_directory, jsonify
from flask_cors import CORS
import requests

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
        # 从请求中获取数据
        data = request.json
        
        # 转发请求到讯飞API
        response = requests.post(
            'https://spark-api-open.xf-yun.com/v1/chat/completions',
            headers={
                'Content-Type': 'application/json',
                'Authorization': 'Bearer FlNLoixiykbsGXdAemOC:rkRUvDmPbNJPBaHboopD'
            },
            json=data
        )
        
        return jsonify(response.json())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=3000, debug=True) 