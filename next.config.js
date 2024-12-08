/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://spark-api-open.xf-yun.com/:path*'
      }
    ]
  }
}

module.exports = nextConfig 