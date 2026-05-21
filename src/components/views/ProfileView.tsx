import { useState } from 'react';
import { User, Cloud } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export default function ProfileView() {
  const {
    currentUser, syncTimeDisplay,
    handleAuth, handleLogout, handleChangePassword,
    showToast,
  } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('geminiApiKey') || '');

  const saveApiKey = () => {
    localStorage.setItem('geminiApiKey', apiKey.trim());
    showToast('API 金鑰已儲存 ✅');
  };

  const isLoggedIn = currentUser && !currentUser.isAnonymous;

  return (
    <main className="p-8 bg-white min-h-[70vh] text-left">
      <h2 className="font-bold text-2xl mb-8 text-gray-900">帳號與設定</h2>

      <div className="space-y-8">
        {/* Auth section */}
        <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2 text-gray-700">
            <User className="w-5 h-5 text-blue-500" /> 帳號同步狀態
          </h3>

          {isLoggedIn ? (
            <div className="space-y-4 text-left">
              <p className="text-xs text-gray-600">已登入：<span className="font-bold text-blue-600">{currentUser.email}</span></p>
              <p className="text-[10px] text-gray-400 leading-relaxed">您的食譜已與此帳號同步。更換裝置後只需登入即可找回所有食譜。</p>
              <p className="text-[11px] text-blue-500 font-bold mt-1">{syncTimeDisplay}</p>

              <div className="pt-3 border-t border-gray-200 mt-2">
                <p className="text-[11px] text-gray-500 mb-2 font-bold">修改密碼</p>
                <div className="flex gap-2 mb-4 h-12 w-full">
                  <input
                    type="password"
                    placeholder="新密碼 (最少 6 位)"
                    className="flex-1 min-w-0 px-4 h-full bg-white border border-gray-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-blue-500/20"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button
                    onClick={() => handleChangePassword(newPassword).then(() => setNewPassword(''))}
                    className="shrink-0 w-20 h-full bg-gray-900 text-white rounded-xl text-sm font-bold transition active:scale-95 flex items-center justify-center"
                  >更新</button>
                </div>
                <button onClick={handleLogout} className="w-full py-3.5 bg-white border border-red-200 text-red-500 rounded-xl text-sm font-bold transition active:scale-95 hover:bg-red-50">
                  登出帳號
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-left">
              <p className="text-[11px] text-gray-400 mb-2">註冊/登入後，食譜將永久備份至你的私人帳號。</p>
              <input type="email" placeholder="電郵地址 (Email)" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none text-sm" value={email} onChange={(e) => setEmail(e.target.value)} />
              <input type="password" placeholder="密碼 (最少 6 位)" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none text-sm" value={password} onChange={(e) => setPassword(e.target.value)} />
              <div className="flex gap-2">
                <button onClick={() => handleAuth('login', email, password)} className="flex-1 py-3 bg-gray-900 text-white rounded-xl text-xs font-bold transition">登入</button>
                <button onClick={() => handleAuth('signup', email, password)} className="flex-1 py-3 bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-blue-500/30">註冊</button>
              </div>
            </div>
          )}
        </div>

        {/* API Key section */}
        <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 shadow-sm text-left">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2 text-gray-700">
            <Cloud className="w-5 h-5 text-blue-500" /> AI 大廚 API 金鑰
          </h3>
          <input
            type="password"
            className="w-full px-4 py-3 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/10 mb-4 transition-all"
            placeholder="輸入 Gemini API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <button onClick={saveApiKey} className="w-full py-3 bg-gray-900 text-white rounded-2xl text-xs font-bold shadow-xl active:scale-95 transition">
            儲存 API 設定
          </button>
        </div>

        <div className="text-center pt-12">
          <p className="text-[10px] text-gray-300 font-bold tracking-[0.3em] uppercase">COOKING PAPA v2.19.1 🚀</p>
        </div>
      </div>
    </main>
  );
}
