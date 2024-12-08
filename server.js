const express = require('express');
const path = require('path');
const cors = require('cors');
const axios = require('axios');
const app = express();

// 启用CORS和JSON解析
app.use(cors());
app.use(express.json());

// 静态文件服务
app.use(express.static(path.join(__dirname)));

// AI API代理
app.post('/api/chat', async (req, res) => {
    try {
        const response = await axios.post(
            'https://spark-api-open.xf-yun.com/v1/chat/completions',
            req.body,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer FlNLoixiykbsGXdAemOC:rkRUvDmPbNJPBaHboopD'
                }
            }
        );
        res.json(response.data);
    } catch (error) {
        console.error('API请求错误:', error);
        res.status(500).json({ error: error.message });
    }
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
}); 