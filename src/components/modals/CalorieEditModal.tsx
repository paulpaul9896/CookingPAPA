import { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';

export default function CalorieEditModal() {
  const { isCalorieEditModalOpen, setIsCalorieEditModalOpen, editCalorieItem, updateCalorieRecord, showToast, showCustomAlert } = useApp();
  const [name, setName] = useState('');
  const [kcal, setKcal] = useState('');

  useEffect(() => {
    if (editCalorieItem) {
      setName(editCalorieItem.name);
      setKcal(String(editCalorieItem.kcal));
    }
  }, [editCalorieItem]);

  if (!isCalorieEditModalOpen || !editCalorieItem) return null;

  const handleSave = async () => {
    if (!name.trim() || isNaN(Number(kcal))) { showCustomAlert('請輸入有效名稱及卡路里！'); return; }
    await updateCalorieRecord({ ...editCalorieItem, name: name.trim(), kcal: parseInt(kcal) });
    setIsCalorieEditModalOpen(false);
    showToast('記錄已更新 ✅');
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex flex-col items-center justify-center p-4 text-left">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl text-center relative">
        <h3 className="text-lg font-bold mb-4 text-gray-900">修改卡路里記錄</h3>
        <div className="space-y-3 mb-6">
          <input
            type="text"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-red-400 text-sm"
            placeholder="食物名稱"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 focus-within:border-red-400 transition-all h-12">
            <input
              type="number"
              className="w-full h-full bg-transparent outline-none text-sm text-center min-w-0"
              placeholder="卡路里數值"
              value={kcal}
              onChange={(e) => setKcal(e.target.value)}
            />
            <span className="text-gray-500 text-sm font-bold ml-1 shrink-0">kcal</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setIsCalorieEditModalOpen(false)} className="flex-1 py-3 bg-gray-100 rounded-2xl font-bold text-gray-600 transition hover:bg-gray-200">取消</button>
          <button onClick={handleSave} className="flex-1 py-3 bg-red-500 rounded-2xl font-bold text-white shadow-lg transition hover:bg-red-600">確定</button>
        </div>
      </div>
    </div>
  );
}
