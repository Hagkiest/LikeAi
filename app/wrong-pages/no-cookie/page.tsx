import Link from 'next/link';

export default function NoCookie() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center p-8">
        <img
          src="/images/cookies.png"
          alt="Cookie错误"
          className="mx-auto w-32 h-32 mb-8"
        />
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          需要启用Cookie
        </h1>
        <p className="text-gray-600 mb-8">
          本网站需要使用Cookie来保存您的对话记录和登录状态。
          请启用Cookie后重试。
        </p>
        <Link
          href="/login"
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
        >
          返回登录
        </Link>
      </div>
    </div>
  );
} 