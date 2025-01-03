from flask import Flask, request, jsonify, render_template, send_from_directory
import os
from database import db_pool, init_db
from email_service import generate_verification_code, send_verification_email
# ... 其他导入保持不变 ...

app = Flask(__name__, static_folder='..', static_url_path='')

# ... 其他代码保持不变 ...

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)

# ... 其他路由保持不变 ...

if __name__ == '__main__':
    app.run(debug=True) 