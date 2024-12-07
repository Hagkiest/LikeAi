require('dotenv').config();

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 使用环境变量
const API_KEY = process.env.API_KEY;
const PORT = process.env.PORT || 3000;

// AI API 代理
app.post('/api/chat', async (req, res) => {
    try {
        const response = await axios.post(
            'https://spark-api-open.xf-yun.com/v1/chat/completions',
            req.body,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + API_KEY
                }
            }
        );
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 添加错误处理中间件
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: '服务器内部错误' });
});

// 添加请求日志
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
});

app.listen(PORT, () => {
    console.log('Server running on port ' + PORT);
}); 