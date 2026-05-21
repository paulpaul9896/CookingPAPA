import { useState, useRef } from 'react';
import { Refrigerator, Sparkles, Trash2, RefreshCw } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { fridgeSearch } from '../../lib/gemini';
import { FridgeRecipe } from '../../types';

export default function FridgeView() {
  const {
    fridgeTempRecipes, setFridgeTempRecipes,
    isAiLoading, setIsAiLoading,
    syncToCloud, recipes, navigate,
    showToast, showCustomAlert,
  } = useApp();

  const [textInput, setTextInput] = useState('');
  const [selectedIndexes, setSelectedIndexes] = useState<Set<number>>(new Set());
  const [showResults, setShowResults] = useState(false);
  const [previewImg, setPreviewImg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSearch = async () => {
    const file = fileRef.current?.files?.[0] || null;
    if (!textInput.trim() && !file) { showCustomAlert('請輸入或影低雪櫃淨低嘅食材！'); return; }
    setIsAiLoading(true);
    const apiKey = (localStorage.getItem('geminiApiKey') || '').trim();
    try {
      const result = await fridgeSearch(apiKey, textInput.trim(), file);
      setFridgeTempRecipes(result);
      setSelectedIndexes(new Set());
      setShowResults(true);
      showToast('AI 已經為你準備好 3 個建議！🍳');
    } catch { showCustomAlert('AI 暫時休息中 (請檢查 Key 或 VPN)'); }
    finally { setIsAiLoading(false); }
  };

  const clearResults = () => {
    setShowResults(false);
    setTextInput('');
    setPreviewImg(null);
    setFridgeTempRecipes([]);
    if (fileRef.current) fileRef.current.value = '';
    showToast('已放棄製作並清空 🗑️');
  };

  const toggleSelect = (i: number) => {
    setSelectedIndexes((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const saveSelected = async () => {
    if (selectedIndexes.size === 0) { showCustomAlert('請最少剔選一個食譜！'); return; }
    let added = 0;
    for (const i of selectedIndexes) {
      const r: FridgeRecipe = fridgeTempRecipes[i];
      let dish = recipes.find((d) => d.name === r.name);
      const newF = {
        id: 'f' + Date.now() + i, name: r.flavor, ingredients: r.ingredients,
        steps: r.steps, tags: r.tags || [], kcal: String(r.kcal || ''),
        isPlanning: true, isFavorite: false, records: [],
      };
      if (dish) {
        dish.flavors.push(newF);
        await syncToCloud(dish);
      } else {
        await syncToCloud({ id: 'd' + Date.now() + i, name: r.name, flavors: [newF] });
      }
      added++;
    }
    if (added > 0) {
      showToast(`已加入 ${added} 個食譜至準備挑戰！⏳`);
      clearResults();
      navigate('home');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreviewImg(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreviewImg(null);
    }
  };

  return (
    <main className="bg-white min-h-[90vh] pb-12">
      <div className="p-6">
        <h3 className="font-bold text-2xl mb-2 flex items-center gap-2 text-gray-900">
          <Refrigerator className="w-6 h-6 text-blue-500" /> 雪櫃清垃圾
        </h3>
        <p className="text-xs text-gray-500 mb-6">輸入或影低你雪櫃淨低嘅食材，AI 會提供食譜建議！</p>

        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center bg-white mb-3 relative overflow-hidden transition-all hover:border-blue-300">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
            onChange={handleFileChange}
          />
          {previewImg ? (
            <div className="absolute inset-0 w-full h-full bg-cover bg-center z-10" style={{ backgroundImage: `url(${previewImg})` }} />
          ) : (
            <>
              <span className="text-3xl block mb-1 relative z-0">📷</span>
              <p className="text-[10px] font-bold text-gray-400 relative z-0">影低雪櫃食材 (可選配文字)</p>
            </>
          )}
        </div>

        <textarea
          className="w-full bg-gray-50 p-4 rounded-2xl border border-gray-100 text-sm outline-none focus:border-blue-400 mb-4 transition-all"
          rows={3}
          placeholder="例如：半個椰菜、兩隻雞蛋... (可註明想煮中式/西式等風格)"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
        />

        <button
          onClick={handleSearch}
          disabled={isAiLoading}
          className="w-full py-3.5 bg-blue-500 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-60"
        >
          <Sparkles className="w-4 h-4" /> AI 提供 3 個建議
        </button>

        {showResults && (
          <div className="mt-6 border-t border-gray-100 pt-6">
            <p className="text-sm font-bold mb-3 text-gray-800">請揀選你想儲存嘅食譜 (可多選)：</p>
            <div className="space-y-3 mb-4">
              {fridgeTempRecipes.map((r, i) => (
                <label key={i} className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-gray-100 cursor-pointer shadow-sm hover:border-orange-300 transition">
                  <input
                    type="checkbox"
                    checked={selectedIndexes.has(i)}
                    onChange={() => toggleSelect(i)}
                    className="mt-1 w-5 h-5 accent-orange-500 rounded text-orange-500 focus:ring-orange-500"
                  />
                  <div>
                    <p className="font-bold text-sm text-gray-800">{r.name}</p>
                    <p className="text-[11px] text-gray-500 mt-1">{r.flavor}</p>
                    <div className="flex gap-1 mt-2">
                      {r.kcal && <span className="text-[9px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded">🔥 {r.kcal} kcal</span>}
                      {(r.tags || []).slice(0, 2).map((t) => (
                        <span key={t} className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{t}</span>
                      ))}
                    </div>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={clearResults} className="shrink-0 px-3 sm:px-4 py-3.5 bg-gray-100 text-gray-700 rounded-2xl font-bold shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all hover:bg-gray-200 text-[13px]">
                <Trash2 className="w-4 h-4" /> 放棄
              </button>
              <button onClick={handleSearch} className="shrink-0 px-3 sm:px-4 py-3.5 bg-blue-50 text-blue-600 rounded-2xl font-bold shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all hover:bg-blue-100 text-[13px]">
                <RefreshCw className="w-4 h-4" /> 重做
              </button>
              <button onClick={saveSelected} className="flex-1 py-3.5 bg-orange-500 text-white rounded-2xl font-bold shadow-lg shadow-orange-500/30 flex items-center justify-center gap-1.5 active:scale-95 transition-all text-[13px]">
                儲存選中
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
