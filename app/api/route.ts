import { NextResponse } from 'next/server'

export async function GET() {
  // 实现原 server.py 的 GET 逻辑
  return NextResponse.json({ message: 'Hello' })
}

export async function POST() {
  // 实现原 server.py 的 POST 逻辑
  return NextResponse.json({ message: 'Posted' })
} 