import { useState } from 'react';
import { Flame, Info, ChevronLeft, ChevronRight, PlusCircle, Activity, Edit3, Trash2 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { calculateCalorie } from '../../lib/gemini';

export default function CalorieView() {
  const {
    calorieDb, calDate, setCalDate, calSelectedDate, setCalSelectedDate,
    addCalorieRecord, deleteCalorieRecord,
    setIsCalorieRefModalOpen, setIsCalorieEditModalOpen, setEditCalorieItem,
    isAiLoading, setIsAiLoading,
    showToast, showCustomAlert,
  } = useApp();

  const [calorieText, setCalorieText] = useState('');
  const [calorieWeight, setCalorieWeight] = useState('');
  const [previewImg, setPreviewImg] = useState<string | null>(null);
  const [calorieFile, setCalorieFile] = useState<File | null>(null);
  const calorieLimit = parseInt(localStorage.getItem('calorieLimit') || '2000');
  const [limit, setLimit] = useState(calorieLimit);

  const changeMonth = (offset: number) => {
    setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() + offset, 1));
  };

  const saveLimit = (val: number) => {
    setLimit(val);
    localStorage.setItem('calorieLimit', String(val));
  };

  const year = calDate.getFullYear();
  const month = calDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const dailySums: Record<string, number> = {};
  calorieDb.forEach((item) => {
    const d = item.dateStr || new Date(item.timestamp || Date.now()).toISOString().split('T')[0];
    dailySums[d] = (dailySums[d] || 0) + (item.kcal || 0);
  });

  const today = new Date().toISOString().split('T')[0];

  const handleCalculate = async () => {
    if (!calorieText.trim() && !calorieFile) { showCustomAlert('請輸入食物名稱或上載相片！'); return; }
    setIsAiLoading(true);
    const apiKey = (localStorage.getItem('geminiApiKey') || '').trim();
    try {
      const result = await calculateCalorie(apiKey, calorieText.trim(), calorieWeight.trim(), calorieFile);
      await addCalorieRecord({ name: result.name, kcal: result.kcal, desc: result.desc, dateStr: calSelectedDate, timestamp: Date.now() });
      showToast(`🔥 ${result.name}: 約 ${result.kcal} kcal!`);
      setCalorieText('');
      setCalorieWeight('');
      setCalorieFile(null);
      setPreviewImg(null);
    } catch { showCustomAlert('AI 估算失敗，請確保金鑰有效及網絡正常。'); }
    finally { setIsAiLoading(false); }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setCalorieFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreviewImg(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else { setPreviewImg(null); }
  };

  const dayItems = calorieDb.filter((item) => {
    const d = item.dateStr || new Date(item.timestamp || Date.now()).toISOString().split('T')[0];
    return d === calSelectedDate;
  });
  const dayTotal = dayItems.reduce((a, i) => a + (i.kcal || 0), 0);
  const selectedText = calSelectedDate === today ? '今日' : calSelectedDate;

  return (
    <main className="bg-white min-h-[90vh] pb-12">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-2xl flex items-center gap-2 text-gray-900">
            <Flame className="w-6 h-6 text-red-500" /> 卡路里記帳
          </h3>
          <button onClick={() => setIsCalorieRefModalOpen(true)} className="text-xs bg-red-50 text-red-500 px-3 py-2 rounded-xl font-bold flex items-center gap-1 hover:bg-red-100 transition shadow-sm">
            <Info className="w-3.5 h-3.5" /> 攝取建議
          </button>
        </div>

        {/* Calendar */}
        <div className="bg-white p-5 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 mb-6">
          <div className="flex justify-between items-center mb-4">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-50 rounded-full transition">
              <ChevronLeft className="w-5 h-5 text-gray-500" />
            </button>
            <div className="text-center">
              <span className="font-bold text-lg text-gray-800">{year}年{month + 1}月</span>
              <div className="text-[10px] text-gray-400 mt-1 flex items-center justify-center gap-1">
                每日上限:
                <input type="number" className="w-12 text-center bg-gray-50 border border-gray-200 rounded font-bold text-gray-600 text-[10px]" value={limit} onChange={(e) => saveLimit(parseInt(e.target.value) || 2000)} />
                kcal
              </div>
            </div>
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
              const sum = dailySums[dateStr] || 0;
              const isSelected = dateStr === calSelectedDate;
              let colorClass = 'bg-gray-50 text-gray-500 hover:bg-gray-100';
              if (sum > 0) {
                colorClass = sum > limit
                  ? 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100'
                  : 'bg-green-50 text-green-600 border border-green-100 hover:bg-green-100';
              }
              return (
                <div key={d} onClick={() => setCalSelectedDate(dateStr)}
                  className={`aspect-square flex flex-col items-center justify-center rounded-xl cursor-pointer transition-all ${colorClass} ${isSelected ? 'ring-2 ring-blue-500 shadow-md' : 'border border-transparent'}`}>
                  <span className="text-[12px] font-bold">{d}</span>
                  {sum > 0 && <span className="text-[8px] font-bold tracking-tighter mt-0.5">{sum}</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Add record */}
        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 mb-6">
          <p className="text-xs font-bold text-gray-600 mb-3 flex items-center gap-1.5">
            <PlusCircle className="w-4 h-4" /> 新增 <span className="text-red-500">{selectedText}</span> 記錄
          </p>
          <div className="border-2 border-dashed border-gray-200 rounded-2xl p-5 text-center bg-white mb-3 relative overflow-hidden transition-all hover:border-red-300">
            <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" onChange={handleFileChange} />
            {previewImg ? (
              <div className="absolute inset-0 w-full h-full bg-cover bg-center z-10" style={{ backgroundImage: `url(${previewImg})` }} />
            ) : (
              <>
                <span className="text-2xl block mb-1 relative z-0">📷</span>
                <p className="text-[10px] font-bold text-gray-400 relative z-0">上載食物相片 (選填)</p>
              </>
            )}
          </div>
          <div className="flex gap-2 mb-3 h-12 w-full">
            <input type="text" className="flex-1 min-w-0 bg-white px-4 h-full rounded-xl border border-gray-200 text-sm outline-none focus:border-red-400 transition-all" placeholder="食物名稱 (例如: 雞胸肉)" value={calorieText} onChange={(e) => setCalorieText(e.target.value)} />
            <div className="flex items-center bg-white border border-gray-200 rounded-xl px-3 focus-within:border-red-400 transition-all w-28 shrink-0 h-full">
              <input type="number" className="w-full h-full text-sm outline-none bg-transparent text-center min-w-0" placeholder="重量" value={calorieWeight} onChange={(e) => setCalorieWeight(e.target.value)} />
              <span className="text-gray-500 text-sm font-bold ml-1 shrink-0">g</span>
            </div>
          </div>
          <button onClick={handleCalculate} disabled={isAiLoading} className="w-full py-3.5 bg-red-500 text-white rounded-xl font-bold shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-60">
            <Activity className="w-4 h-4" /> 計算並記錄
          </button>
        </div>

        {/* History */}
        <h4 className="font-bold text-sm mb-4 border-t border-gray-100 pt-6 text-gray-800 flex justify-between items-end">
          <span>當日記錄</span>
          <span className="text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded-md text-xs">{dayTotal} kcal</span>
        </h4>
        <div className="space-y-3">
          {dayItems.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6 border-2 border-dashed border-gray-100 rounded-2xl">呢日暫時無飲食記錄</p>
          ) : (
            [...dayItems].sort((a, b) => b.timestamp - a.timestamp).map((item) => (
              <div key={item.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex justify-between items-center shadow-sm hover:border-red-100 transition">
                <div className="flex-1 pr-2 text-left">
                  <p className="font-bold text-sm text-gray-800">{item.name}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{item.desc || ''}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-red-500 font-bold text-base bg-red-50 px-2 py-1 rounded-lg">🔥 {item.kcal}</span>
                  <button onClick={() => { setEditCalorieItem(item); setIsCalorieEditModalOpen(true); }} className="text-gray-300 hover:text-blue-500 transition p-1">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteCalorieRecord(item.id).then(() => showToast('記錄已刪除'))} className="text-gray-300 hover:text-red-500 transition p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}

import React from 'react';
