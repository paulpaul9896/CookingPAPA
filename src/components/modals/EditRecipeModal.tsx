import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { estimateKcal } from '../../lib/gemini';

const RATING_LABELS: Record<number, string> = { 1: '🤢 中伏', 2: '🤐 試一次', 3: '🙂 得閒整', 4: '🤤 要著兩條褲' };

export default function EditRecipeModal() {
  const {
    isEditModalOpen, setIsEditModalOpen,
    recipes, currentDishId, currentFlavorId,
    syncToCloud, showToast,
    flavorTags, setFlavorTagsAndSave,
    showCustomPrompt, showCustomConfirm,
    isAiLoading, setIsAiLoading,
  } = useApp();

  const [flavor, setFlavor] = useState('');
  const [serving, setServing] = useState('');
  const [cooktime, setCooktime] = useState('');
  const [kcal, setKcal] = useState('');
  const [rating, setRating] = useState(4);
  const [ingredients, setIngredients] = useState('');
  const [steps, setSteps] = useState('');
  const [isPlanning, setIsPlanning] = useState(false);

  const dish = recipes.find((d) => d.id === currentDishId);
  const flavorObj = dish?.flavors.find((f) => f.id === currentFlavorId);

  useEffect(() => {
    if (isEditModalOpen && flavorObj) {
      setFlavor(flavorObj.name || '');
      setServing(flavorObj.serving || '');
      setCooktime(flavorObj.cooktime || '');
      setKcal(flavorObj.kcal || '');
      setRating(flavorObj.rating || 4);
      setIngredients(flavorObj.ingredients || '');
      setSteps(flavorObj.steps || '');
      setIsPlanning(flavorObj.isPlanning === true);
    }
  }, [isEditModalOpen, flavorObj]);

  if (!isEditModalOpen) return null;

  const appendFlavorTag = (tag: string) => {
    const vals = flavor.split(',').map((s) => s.trim()).filter(Boolean);
    if (!vals.includes(tag)) setFlavor([...vals, tag].join(', '));
  };

  const removeFlavorTag = (tag: string) => {
    showCustomConfirm(`確定要刪除「${tag}」預設標籤嗎？`, () => {
      setFlavorTagsAndSave(flavorTags.filter((t) => t !== tag));
    });
  };

  const promptAddTag = () => {
    showCustomPrompt('請輸入新嘅口味或風格：', '例如：節日大餐', (val) => {
      if (val && val.trim() && !flavorTags.includes(val.trim())) {
        setFlavorTagsAndSave([...flavorTags, val.trim()]);
      }
    });
  };

  const estimateKcalAI = async () => {
    if (!ingredients.trim()) { showToast('請先輸入材料！'); return; }
    const apiKey = (localStorage.getItem('geminiApiKey') || '').trim();
    setIsAiLoading(true);
    try {
      const res = await estimateKcal(apiKey, dish?.name || '', ingredients);
      setKcal(String(res.kcal));
      showToast(`🔥 估算約 ${res.kcal} kcal!`);
    } catch { showToast('AI 估算失敗'); }
    finally { setIsAiLoading(false); }
  };

  const handleSave = async () => {
    if (!dish || !flavorObj) return;
    flavorObj.name = flavor;
    flavorObj.serving = serving;
    flavorObj.cooktime = cooktime;
    flavorObj.kcal = kcal.trim();
    flavorObj.ingredients = ingredients;
    flavorObj.steps = steps;
    flavorObj.isPlanning = isPlanning;
    flavorObj.rating = rating;
    await syncToCloud(dish);
    setIsEditModalOpen(false);
    showToast('修改已儲存 💾');
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex flex-col items-center justify-end sm:justify-center">
      <div className="absolute inset-0" onClick={() => setIsEditModalOpen(false)} />
      <div className="bg-white w-full max-w-lg sm:rounded-3xl rounded-t-3xl p-6 shadow-2xl relative z-10 flex flex-col max-h-[90vh]">
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4 sm:hidden shrink-0" />
        <h3 className="text-lg font-bold mb-4 text-center shrink-0">編輯食譜貼文</h3>
        <div className="flex-1 overflow-y-auto pr-2 space-y-5 pb-2 scroll-container text-left">
          <label className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100 cursor-pointer">
            <input type="checkbox" className="w-5 h-5 text-blue-500 rounded border-gray-300 accent-blue-500" checked={isPlanning} onChange={(e) => setIsPlanning(e.target.checked)} />
            <div className="flex-1"><p className="text-[12px] font-bold text-gray-700">設為「準備挑戰」項目 ⏳</p></div>
          </label>
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">口味及風格</label>
              <input type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white text-sm" value={flavor} onChange={(e) => setFlavor(e.target.value)} />
              <div className="flex flex-wrap gap-1.5 mt-2 ml-1">
                {flavorTags.map((tag) => (
                  <div key={tag} className="flex items-center bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold overflow-hidden border border-blue-100">
                    <button type="button" className="px-2.5 py-1 hover:bg-blue-100 transition" onClick={() => appendFlavorTag(tag)}>{tag}</button>
                    <button type="button" className="px-1.5 py-1 hover:bg-blue-100 text-blue-400 hover:text-blue-600 transition border-l border-blue-100" onClick={() => removeFlavorTag(tag)}>✕</button>
                  </div>
                ))}
                <button type="button" onClick={promptAddTag} className="text-[10px] font-bold text-gray-500 bg-gray-100 border border-gray-200 px-2 py-1 rounded-lg hover:bg-gray-200 transition">+ 新增</button>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">份量 / 吋尺</label>
              <input type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white text-sm" placeholder="如: 2人" value={serving} onChange={(e) => setServing(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1">時間(分)</label>
              <input type="number" className="w-full px-3 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm" placeholder="分鐘" value={cooktime} onChange={(e) => setCooktime(e.target.value)} />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1">卡路里</label>
              <div className="flex bg-gray-50 rounded-xl border border-gray-100 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/10 transition-all overflow-hidden h-[46px]">
                <input type="number" placeholder="kcal" className="w-full h-full px-3 bg-transparent outline-none text-sm min-w-0" value={kcal} onChange={(e) => setKcal(e.target.value)} />
                <button type="button" onClick={estimateKcalAI} className="px-2 text-red-400 hover:text-red-500 flex items-center justify-center shrink-0 h-full" title="AI 估算">
                  <Sparkles className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2 ml-1">評分</label>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              {[1, 2, 3, 4].map((v) => (
                <button key={v} type="button" onClick={() => setRating(v)}
                  className={`py-2.5 rounded-xl border font-bold transition ${rating === v ? 'border-blue-500 bg-blue-500 text-white shadow-lg' : 'bg-white border-gray-100 text-gray-500'}`}>
                  {RATING_LABELS[v]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">材料</label>
            <textarea rows={4} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm resize-none" value={ingredients} onChange={(e) => setIngredients(e.target.value)} />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">步驟</label>
            <textarea rows={6} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm resize-none" value={steps} onChange={(e) => setSteps(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-3 mt-4 shrink-0">
          <button onClick={() => setIsEditModalOpen(false)} className="flex-1 py-3 bg-gray-100 rounded-2xl font-bold text-gray-600 transition hover:bg-gray-200">取消</button>
          <button onClick={handleSave} className="flex-1 py-3 bg-blue-500 rounded-2xl font-bold text-white shadow-lg transition hover:bg-blue-600">儲存</button>
        </div>
      </div>
    </div>
  );
}
