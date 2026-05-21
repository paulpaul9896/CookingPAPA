import { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export default function PlannerModal() {
  const {
    isPlannerModalOpen, setIsPlannerModalOpen,
    recipes, plannerDb, plannerSelectedDate,
    savePlannerToCloud, showToast, showCustomAlert,
  } = useApp();
  const [manualInput, setManualInput] = useState('');

  if (!isPlannerModalOpen) return null;

  const addManual = async () => {
    const text = manualInput.trim();
    if (!text) { showCustomAlert('請輸入菜式或餐廳名稱！'); return; }
    const updated = { ...plannerDb };
    if (!Array.isArray(updated[plannerSelectedDate])) updated[plannerSelectedDate] = [];
    updated[plannerSelectedDate] = [...updated[plannerSelectedDate], { isManual: true as const, text }];
    await savePlannerToCloud(updated);
    setIsPlannerModalOpen(false);
    setManualInput('');
    showToast('已自訂餐單項目 ✍️');
  };

  const selectRecipe = async (dishId: string, flavorId: string) => {
    const updated = { ...plannerDb };
    if (!Array.isArray(updated[plannerSelectedDate])) updated[plannerSelectedDate] = [];
    updated[plannerSelectedDate] = [...updated[plannerSelectedDate], { dishId, flavorId }];
    await savePlannerToCloud(updated);
    setIsPlannerModalOpen(false);
    showToast('已從庫內加入餐單 🗓️');
  };

  const hasRecipes = recipes.some((d) => (d.flavors || []).length > 0);

  return (
    <div className="fixed inset-0 bg-black/60 z-[80] flex flex-col items-center justify-end sm:justify-center">
      <div className="absolute inset-0" onClick={() => setIsPlannerModalOpen(false)} />
      <div className="bg-white w-full max-w-lg sm:rounded-3xl rounded-t-3xl p-6 shadow-2xl relative z-10 flex flex-col max-h-[85vh]">
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4 sm:hidden shrink-0" />
        <h3 className="text-lg font-bold mb-4 text-center shrink-0">加入餐單項目</h3>
        <div className="flex gap-2 mb-5 shrink-0 h-12 w-full">
          <input
            type="text"
            placeholder="手寫菜式 / 餐廳..."
            className="flex-1 min-w-0 px-4 h-full bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addManual(); }}
          />
          <button onClick={addManual} className="shrink-0 px-5 h-full bg-blue-500 text-white rounded-xl text-sm font-bold shadow-md active:scale-95 transition flex items-center justify-center">加入</button>
        </div>
        <p className="text-[11px] font-bold text-gray-400 uppercase mb-3 shrink-0 tracking-wider">或從食譜庫選擇</p>
        <div className="flex-1 overflow-y-auto pr-2 space-y-2 scroll-container text-left pb-4">
          {!hasRecipes ? (
            <p className="text-center text-gray-400 py-10 text-sm">庫內仲未有食譜，可以上面手寫加入先！</p>
          ) : (
            recipes.flatMap((d) =>
              (d.flavors || []).map((f) => (
                <div
                  key={`${d.id}-${f.id}`}
                  className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex justify-between items-center cursor-pointer hover:bg-purple-50 hover:border-purple-200 transition"
                  onClick={() => selectRecipe(d.id, f.id)}
                >
                  <span className="font-bold text-sm text-gray-700">
                    {d.name} <span className="text-gray-400 text-xs">- {f.name}</span>
                  </span>
                  <PlusCircle className="w-5 h-5 text-purple-500" />
                </div>
              ))
            )
          )}
        </div>
        <button onClick={() => setIsPlannerModalOpen(false)} className="w-full py-3.5 bg-gray-100 rounded-2xl font-bold text-gray-600 transition mt-2 shrink-0 hover:bg-gray-200">取消</button>
      </div>
    </div>
  );
}
