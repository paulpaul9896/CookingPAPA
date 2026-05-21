import { Info } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export default function CalorieRefModal() {
  const { isCalorieRefModalOpen, setIsCalorieRefModalOpen } = useApp();
  if (!isCalorieRefModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex flex-col items-center justify-center p-4 text-left">
      <div className="absolute inset-0" onClick={() => setIsCalorieRefModalOpen(false)} />
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative z-10 flex flex-col max-h-[85vh]">
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4 shrink-0" />
        <h3 className="text-lg font-bold mb-4 text-center shrink-0 flex items-center justify-center gap-2 text-gray-900">
          <Info className="w-5 h-5 text-red-500" /> 每日攝取量建議
        </h3>
        <div className="flex-1 overflow-y-auto space-y-3 text-sm text-gray-700 scroll-container pr-2">
          <div className="bg-red-50 p-4 rounded-xl border border-red-100">
            <p className="font-bold text-red-700 mb-2 border-b border-red-200 pb-1">👦👧 青年 (18-29歲)</p>
            <div className="flex justify-between"><span className="font-bold">男性：</span><span>約 2400 kcal</span></div>
            <div className="flex justify-between mt-1"><span className="font-bold">女性：</span><span>約 1900 kcal</span></div>
          </div>
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <p className="font-bold text-blue-700 mb-2 border-b border-blue-200 pb-1">👨👩 成年 (30-59歲)</p>
            <div className="flex justify-between"><span className="font-bold">男性：</span><span>約 2350 kcal</span></div>
            <div className="flex justify-between mt-1"><span className="font-bold">女性：</span><span>約 1850 kcal</span></div>
          </div>
          <div className="bg-green-50 p-4 rounded-xl border border-green-100">
            <p className="font-bold text-green-700 mb-2 border-b border-green-200 pb-1">👴👵 老年 (60歲以上)</p>
            <div className="flex justify-between"><span className="font-bold">男性：</span><span>約 2100 kcal</span></div>
            <div className="flex justify-between mt-1"><span className="font-bold">女性：</span><span>約 1650 kcal</span></div>
          </div>
          <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">* 數據僅供參考，實際需求會因個人身高、體重、活動量及新陳代謝而有所不同。</p>
        </div>
        <button
          onClick={() => setIsCalorieRefModalOpen(false)}
          className="w-full py-3.5 bg-gray-100 rounded-2xl font-bold text-gray-600 transition mt-4 shrink-0 hover:bg-gray-200"
        >
          關閉
        </button>
      </div>
    </div>
  );
}
