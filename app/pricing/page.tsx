export default function Pricing() {
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            选择适合您的套餐
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            我们提供多种套餐以满足不同需求
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          {/* 基础套餐 */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-8">
              <h3 className="text-2xl font-bold text-gray-900">基础版</h3>
              <p className="mt-4 text-gray-600">适合个人使用</p>
              <p className="mt-8">
                <span className="text-4xl font-bold">¥0</span>
                <span className="text-gray-600">/月</span>
              </p>
              <ul className="mt-8 space-y-4">
                <li className="flex items-center">
                  <span className="text-green-500">✓</span>
                  <span className="ml-3">每天3条消息</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500">✓</span>
                  <span className="ml-3">基础AI模型</span>
                </li>
              </ul>
            </div>
            <div className="px-6 py-4 bg-gray-50">
              <button className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                当前版本
              </button>
            </div>
          </div>

          {/* 专业套餐 */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-blue-500">
            <div className="px-6 py-8">
              <h3 className="text-2xl font-bold text-gray-900">专业版</h3>
              <p className="mt-4 text-gray-600">适合专业用户</p>
              <p className="mt-8">
                <span className="text-4xl font-bold">¥29</span>
                <span className="text-gray-600">/月</span>
              </p>
              <ul className="mt-8 space-y-4">
                <li className="flex items-center">
                  <span className="text-green-500">✓</span>
                  <span className="ml-3">无限消息</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500">✓</span>
                  <span className="ml-3">高级AI模型</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500">✓</span>
                  <span className="ml-3">优先响应</span>
                </li>
              </ul>
            </div>
            <div className="px-6 py-4 bg-gray-50">
              <button className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                升级到专业版
              </button>
            </div>
          </div>

          {/* 企业套餐 */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-8">
              <h3 className="text-2xl font-bold text-gray-900">企业版</h3>
              <p className="mt-4 text-gray-600">适合团队使用</p>
              <p className="mt-8">
                <span className="text-4xl font-bold">¥99</span>
                <span className="text-gray-600">/月</span>
              </p>
              <ul className="mt-8 space-y-4">
                <li className="flex items-center">
                  <span className="text-green-500">✓</span>
                  <span className="ml-3">所有专业版功能</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500">✓</span>
                  <span className="ml-3">团队协作功能</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500">✓</span>
                  <span className="ml-3">专属客服支持</span>
                </li>
              </ul>
            </div>
            <div className="px-6 py-4 bg-gray-50">
              <button className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                联系销售
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 