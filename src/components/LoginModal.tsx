import { useState } from 'react';
import { Mail, Lock, User, X, AlertCircle, Info, Check, Sparkles, Chrome } from 'lucide-react';
import { loginUser, registerUser } from '../clientApi';

interface LoginModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function LoginModal({ onClose, onSuccess }: LoginModalProps) {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleEmailAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('请完整填写邮箱地址与密码。');
      return;
    }
    if (activeTab === 'signup' && !displayName.trim()) {
      setErrorMsg('请优雅地输入一个您的称呼或昵称，方便我们在互动中称呼您：）');
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (activeTab === 'signin') {
        await loginUser(email, password);
        setSuccessMsg('账户登录并同步成功！已为您刷新系统状态。');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1200);
      } else {
        await registerUser(email, password, displayName.trim());
        setSuccessMsg('读者账户建立成功！请在此输入密码完成快捷登录：）');
        setActiveTab('signin');
        setPassword('');
      }
    } catch (err: any) {
      console.error('Login action error:', err);
      setErrorMsg(err.message || '操作目前被拦截，请确认网络连接或重试。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div 
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl transition-all"
        id="login-modal-box"
      >
        {/* Decorative ambient color bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-gray-900 via-gray-700 to-amber-500" />

        {/* Modal headers */}
        <div className="p-6 pb-2">
          <button 
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-700 transition-colors cursor-pointer"
            id="close-login-btn"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500 fill-amber-500" />
            <span className="font-mono text-xs font-bold tracking-wider text-amber-600 uppercase">
              Security Protocol
            </span>
          </div>
          <h3 className="mt-1 font-display text-lg font-bold text-gray-900">
            登录因爱而美小雨如酥生活美学馆
          </h3>
          <p className="mt-1 font-sans text-xs text-gray-400">
            本站专为中国大陆发布进行高速优化。直连高速通道已开启。
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6">
          <button
            type="button"
            onClick={() => { setActiveTab('signin'); setErrorMsg(null); }}
            className={`flex-1 py-2.5 font-sans text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'signin' 
                ? 'border-gray-900 text-gray-900' 
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            邮箱快捷登录
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('signup'); setErrorMsg(null); }}
            className={`flex-1 py-2.5 font-sans text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'signup' 
                ? 'border-gray-900 text-gray-900' 
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            新读者注册
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="flex gap-2.5 rounded-xl border border-red-100 bg-red-50/50 p-3 text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-0.5 w-full">
                <span className="font-sans text-xs font-bold">操作失败</span>
                <span className="font-sans text-[11px] leading-normal font-medium">{errorMsg}</span>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="flex gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 text-emerald-700">
              <Check className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-0.5">
                <span className="font-sans text-xs font-bold">成功</span>
                <span className="font-sans text-[11px] leading-normal font-medium">{successMsg}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleEmailAction} className="space-y-3.5">
            {activeTab === 'signup' && (
              <div>
                <label className="block font-sans text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  读者雅致昵称 / 姓名 (Your Name)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="例如：林深见鹿 / 墨染茶香"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-4 font-sans text-sm tracking-tight text-gray-800 placeholder-gray-400 shadow-3xs outline-hidden focus:border-gray-900 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block font-sans text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                常用电子邮箱 (Email)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-4 font-sans text-sm tracking-tight text-gray-800 placeholder-gray-400 shadow-3xs outline-hidden focus:border-gray-900 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block font-sans text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                安全保障密码 (Password)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="输入至少 6 位安全登录密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-4 font-sans text-sm tracking-tight text-gray-800 placeholder-gray-400 shadow-3xs outline-hidden focus:border-gray-900 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center rounded-xl bg-gray-900 py-2.5 font-sans text-xs font-bold text-white shadow-md hover:bg-gray-800 active:scale-99 transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? '核心服务执行中...' : activeTab === 'signin' ? '立刻登录美学空间' : '建立新读者账户'}
            </button>
          </form>

          {/* Quick Info message about direct access for local database connection */}
          <div className="rounded-xl border border-amber-50 bg-amber-50/30 p-3 flex gap-2 text-amber-800">
            <Info className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
            <div className="font-sans text-[11px] leading-normal font-medium">
              <span className="font-bold">安全建议 & 站长提示：</span>
              本平台由国内高速代管线路进行直连优化。
              小雨如酥本站长请使用专用邮箱 <code className="bg-amber-100/50 px-1 py-0.5 rounded-sm font-mono text-amber-950 font-semibold select-all">yinaiermei4431@outlook.com</code> 登录激活创作者控制台。
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
