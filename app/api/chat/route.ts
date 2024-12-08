import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const response = await axios.post(
      'https://spark-api-open.xf-yun.com/v1/chat/completions',
      body,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer FlNLoixiykbsGXdAemOC:rkRUvDmPbNJPBaHboopD'
        }
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 