import { CalendarDays, ChevronLeft, ChevronRight, Plus, XCircle } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export default function PlannerView() {
  const {
    plannerDb, plannerCalDate, setPlannerCalDate,
    plannerSelectedDate, setPlannerSelectedDate,
    recipes, navigate,
    savePlannerToCloud, setIsPlannerModalOpen,
    showToast,
  } = useApp();

  const changeMonth = (offset: number) => {
    setPlannerCalDate(new Date(plannerCalDate.getFullYear(), plannerCalDate.getMonth() + offset, 1));
  };

  const year = plannerCalDate.getFullYear();
  const month = plannerCalDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().split('T')[0];

  const clearPlan = async (dateStr: string, idx: number) => {
    const updated = { ...plannerDb };
    if (Array.isArray(updated[dateStr])) {
      updated[dateStr] = updated[dateStr].filter((_, i) => i !== idx);
      if (updated[dateStr].length === 0) delete updated[dateStr];
    }
    await savePlannerToCloud(updated);
  };

  const currentPlans = Array.isArray(plannerDb[plannerSelectedDate])
    ? plannerDb[plannerSelectedDate]
    : plannerDb[plannerSelectedDate]
      ? [plannerDb[plannerSelectedDate] as any]
      : [];

  const selectedText = plannerSelectedDate === today ? '今日' : plannerSelectedDate;

  return (
    <main className="bg-white min-h-[90vh] pb-12">
      <div className="p-6">
        <h3 className="font-bold text-2xl mb-2 flex items-center gap-2 text-gray-900">
          <CalendarDays className="w-6 h-6 text-purple-500" /> 餐單日曆
        </h3>
        <p className="text-xs text-gray-500 mb-6">點擊日期安排每日菜式，買餸煮飯更有預算！</p>

        {/* Calendar */}
        <div className="bg-white p-5 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 mb-6">
          <div className="flex justify-between items-center mb-4">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-50 rounded-full transition">
              <ChevronLeft className="w-5 h-5 text-gray-500" />
            </button>
            <span className="font-bold text-lg text-gray-800">{year}年{month + 1}月</span>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-50 rounded-full transition">
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-gray-400 font-bold mb-2">
            {['日','一','二','三','四','五','六'].map((d) => <div key={d}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: firstDay }, (_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const d = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
              const plans = plannerDb[dateStr];
              const hasPlan = plans && Array.isArray(plans) && plans.length > 0;
              const isSelected = dateStr === plannerSelectedDate;
              return (
                <div key={d} onClick={() => setPlannerSelectedDate(dateStr)}
                  className={`aspect-square flex flex-col items-center justify-center rounded-xl cursor-pointer transition-all relative ${isSelected ? 'ring-2 ring-purple-500 shadow-md bg-purple-50 text-purple-700' : 'border border-transparent bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                  <span className="text-[12px] font-bold">{d}</span>
                  {hasPlan && <div className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-purple-500" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Daily plans */}
        <h4 className="font-bold text-sm mb-4 border-t border-gray-100 pt-6 text-gray-800 flex justify-between items-end">
          <span><span className="text-purple-500">{selectedText}</span> 餐單安排</span>
        </h4>
        <div className="space-y-3">
          {currentPlans.map((plan, idx) => {
            if (plan.isManual) {
              return (
                <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-purple-200 flex items-center justify-between">
                  <div className="flex-1 text-left">
                    <p className="font-bold text-sm text-gray-800">{plan.text}</p>
                    <p className="text-[9px] text-gray-400 mt-0.5">✍️ 自訂項目</p>
                  </div>
                  <button onClick={() => clearPlan(plannerSelectedDate, idx)} className="p-2 text-gray-300 hover:text-red-400 transition">
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              );
            }
            if (plan.dishId) {
              const d = recipes.find((x) => x.id === plan.dishId);
              const f = d?.flavors.find((y) => y.id === plan.flavorId);
              if (d && f) {
                return (
                  <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-purple-200 flex items-center justify-between">
                    <div className="flex-1 text-left cursor-pointer" onClick={() => navigate('recipe', d.id, f.id)}>
                      <p className="font-bold text-sm text-gray-800">{d.name} - {f.name}</p>
                      <p className="text-[9px] text-gray-400 mt-0.5">📖 食譜庫</p>
                    </div>
                    <button onClick={() => clearPlan(plannerSelectedDate, idx)} className="p-2 text-gray-300 hover:text-red-400 transition">
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                );
              }
              return (
                <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between opacity-50">
                  <div className="flex-1 text-left"><p className="font-bold text-sm text-gray-500 line-through">食譜已刪除</p></div>
                  <button onClick={() => clearPlan(plannerSelectedDate, idx)} className="p-2 text-gray-300 hover:text-red-400 transition">
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              );
            }
            return null;
          })}

          <div
            className="bg-gray-50/50 p-4 rounded-2xl border border-dashed border-gray-200 flex items-center justify-between cursor-pointer hover:bg-purple-50 hover:border-purple-200 transition"
            onClick={() => setIsPlannerModalOpen(true)}
          >
            <div className="flex-1 text-left"><p className="font-bold text-sm text-gray-400">+ 加入餐單</p></div>
            <Plus className="w-5 h-5 text-gray-300" />
          </div>
        </div>
      </div>
    </main>
  );
}
