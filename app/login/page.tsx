'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 游客登录不需要密码
    if (username === 'guest' || (username === 'admin' && password === 'admin')) {
      // 设置登录状态
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('username', username);
      // 设置cookie
      document.cookie = 'isLoggedIn=true; path=/';
      router.push('/');
    } else {
      alert('用户名或密码错误！');
    }
  };

  const handleGuestLogin = () => {
    setUsername('guest');
    setPassword('');
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('username', 'guest');
    document.cookie = 'isLoggedIn=true; path=/';
    router.push('/');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-3xl font-bold">登录到 LikeAI</h1>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                type="text"
                required
                className="appearance-none rounded-t-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <input
                type="password"
                className="appearance-none rounded-b-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              登录
            </button>
          </div>
        </form>

        <div className="text-center">
          <button
            onClick={handleGuestLogin}
            className="text-blue-600 hover:text-blue-500 text-sm font-medium"
          >
            以游客身份登录
          </button>
        </div>
      </div>
    </div>
  );
} 