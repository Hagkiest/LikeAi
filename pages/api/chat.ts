import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const response = await axios.post(
      'https://spark-api-open.xf-yun.com/v1/chat/completions',
      req.body,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.API_KEY}`
        }
      }
    )
    res.status(200).json(response.data)
  } catch (error) {
    console.error('API请求错误:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
} 