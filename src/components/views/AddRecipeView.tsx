import { useState } from 'react';
import { Camera, Sparkles } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { generateRecipe, estimateKcal } from '../../lib/gemini';

const RATING_LABELS: Record<number, string> = { 1: '🤢 中伏', 2: '🤐 試一次', 3: '🙂 得閒整', 4: '🤤 要著兩條褲' };

export default function AddRecipeView() {
  const {
    navigate, syncToCloud, recipes,
    flavorTags, setFlavorTagsAndSave,
    showToast, showCustomAlert, showCustomConfirm, showCustomPrompt,
    isAiLoading, setIsAiLoading,
  } = useApp();

  const [dishName, setDishName] = useState('');
  const [flavor, setFlavor] = useState('');
  const [serving, setServing] = useState('');
  const [cooktime, setCooktime] = useState('');
  const [kcal, setKcal] = useState('');
  const [rating, setRating] = useState(4);
  const [tags, setTags] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [steps, setSteps] = useState('');
  const [isPlanning, setIsPlanning] = useState(false);

  const firebaseConfig_apiKey = 'REMOVED_FIREBASE_API_KEY';

  const handleGenerateAI = async () => {
    if (!dishName.trim()) { showCustomAlert('請先輸入菜名！'); return; }
    const apiKey = (localStorage.getItem('geminiApiKey') || '').trim();
    if (!apiKey) {
      showCustomAlert('請先去「設定」輸入你自己嘅 Gemini API 金鑰。\n\n可前往 Google AI Studio (aistudio.google.com) 免費申請。');
      return;
    }
    if (apiKey === firebaseConfig_apiKey) {
      showCustomAlert('⚠️ 錯誤：你輸入咗 Firebase 嘅金鑰！\n\nFirebase 同 Gemini AI 係兩套獨立系統，請前往 Google AI Studio 申請一條全新嘅 Gemini API 金鑰。');
      return;
    }
    setIsAiLoading(true);
    try {
      const recipe = await generateRecipe(apiKey, dishName.trim(), flavor, serving);
      setFlavor(recipe.flavor || flavor);
      setIngredients(recipe.ingredients || '');
      setSteps(recipe.steps || '');
      setTags((recipe.tags || []).join(', '));
      if (recipe.kcal) setKcal(String(recipe.kcal));
      showToast('AI 已構思完畢！✨');
    } catch (e: any) {
      let msg = '未能連接 AI 大廚！';
      const errText = e.message || '';
      if (errText.includes('leaked') || errText.includes('API key not valid')) msg += '\n你輸入嘅 API 金鑰無效，或者已被 Google 停用。';
      else if (errText.includes('location is not supported')) msg += '\n請確保你已開啟 VPN，並設定為全局模式 (Global)。';
      else if (errText.includes('not found') || errText.includes('NOT_FOUND')) msg += '\nAI 模型已更新，請刷新頁面再試。';
      else if (errText.includes('quota') || errText.includes('RESOURCE_EXHAUSTED')) msg += '\nAPI 配額已用完，請稍後再試或檢查 Google AI Studio 配額。';
      showCustomAlert(msg);
    }
    finally { setIsAiLoading(false); }
  };

  const handleEstimateKcal = async () => {
    if (!ingredients.trim()) { showCustomAlert('請先輸入材料，AI 先可以幫你計卡路里㗎！'); return; }
    const apiKey = (localStorage.getItem('geminiApiKey') || '').trim();
    setIsAiLoading(true);
    try {
      const res = await estimateKcal(apiKey, dishName, ingredients);
      setKcal(String(res.kcal));
      showToast(`🔥 估算約 ${res.kcal} kcal!`);
    } catch { showCustomAlert('AI 估算失敗，請檢查金鑰及網絡。'); }
    finally { setIsAiLoading(false); }
  };

  const appendFlavor = (tag: string) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishName.trim() || !flavor.trim()) { showCustomAlert('請填寫菜式名稱及口味！'); return; }
    const newF = {
      id: 'f' + Date.now(), name: flavor,
      ingredients, steps, serving, cooktime,
      kcal: kcal.trim(),
      tags: tags.split(',').map((s) => s.trim()).filter(Boolean),
      rating, isPlanning, isFavorite: false, records: [],
    };
    const existing = recipes.find((d) => d.name.toLowerCase() === dishName.toLowerCase());
    if (existing) {
      existing.flavors.push(newF);
      await syncToCloud(existing);
      navigate('recipe', existing.id, newF.id);
    } else {
      const nDish = { id: 'd' + Date.now(), name: dishName.trim(), flavors: [newF] };
      await syncToCloud(nDish);
      setTimeout(() => navigate('recipe', nDish.id, newF.id), 500);
    }
    showToast('食譜已發佈！🍳');
  };

  return (
    <main className="p-6 bg-white min-h-[70vh] text-left">
      <div className="flex items-center justify-between mb-8 pb-3 border-b border-gray-100">
        <button onClick={() => navigate('home')} className="p-1">✕</button>
        <h2 className="font-bold text-lg text-gray-900">新增食譜</h2>
        <button form="recipe-form" type="submit" className="text-blue-500 font-bold text-lg">發佈</button>
      </div>

      <form id="recipe-form" onSubmit={handleSubmit} className="space-y-6 text-left">
        <label className="flex items-center gap-3 bg-orange-50/50 p-3.5 rounded-2xl border border-orange-100 cursor-pointer">
          <input type="checkbox" className="w-5 h-5 text-orange-500 rounded border-orange-300 accent-orange-500" checked={isPlanning} onChange={(e) => setIsPlanning(e.target.checked)} />
          <div className="flex-1">
            <p className="text-[13px] font-bold text-orange-700">加入「準備挑戰」清單 ⏳</p>
            <p className="text-[10px] text-orange-500 mt-0.5">勾選後，上載首次製作記錄即自動解鎖成就</p>
          </div>
        </label>

        <div className="flex gap-5">
          <div className="w-20 h-20 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center text-gray-300 flex-shrink-0">
            <Camera className="w-8 h-8" />
          </div>
          <div className="flex-1 space-y-3">
            <input type="text" required className="w-full text-base py-1.5 border-b border-gray-100 outline-none focus:border-blue-400 transition-colors" placeholder="菜式名稱" value={dishName} onChange={(e) => setDishName(e.target.value)} />
            <input type="text" required className="w-full text-sm py-1.5 border-b border-gray-100 outline-none focus:border-blue-400 transition-colors" placeholder="口味及風格" value={flavor} onChange={(e) => setFlavor(e.target.value)} />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {flavorTags.map((tag) => (
                <div key={tag} className="flex items-center bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold overflow-hidden border border-blue-100">
                  <button type="button" className="px-2.5 py-1 hover:bg-blue-100 transition" onClick={() => appendFlavor(tag)}>{tag}</button>
                  <button type="button" className="px-1.5 py-1 hover:bg-blue-100 text-blue-400 hover:text-blue-600 transition border-l border-blue-100" onClick={() => removeFlavorTag(tag)}>✕</button>
                </div>
              ))}
              <button type="button" onClick={promptAddTag} className="text-[10px] font-bold text-gray-500 bg-gray-100 border border-gray-200 px-2 py-1 rounded-lg hover:bg-gray-200 transition">+ 新增</button>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-gray-400 uppercase ml-1">份量 / 吋尺</label>
          <input type="text" className="w-full text-sm py-2.5 px-3 bg-gray-50 rounded-xl border border-transparent outline-none focus:bg-white focus:border-blue-200 transition-colors" placeholder="如: 2人 或 6吋" value={serving} onChange={(e) => setServing(e.target.value)} />
        </div>

        <button type="button" onClick={handleGenerateAI} disabled={isAiLoading} className="w-full bg-blue-500 text-white text-sm font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-60">
          <Sparkles className="w-4 h-4" /> AI 智能生成食譜
        </button>

        <div className="grid grid-cols-2 gap-3 text-left">
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-gray-400 uppercase ml-1">時間(分)</label>
            <input type="number" className="w-full text-sm py-2.5 px-3 bg-gray-50 rounded-xl border border-transparent outline-none focus:bg-white focus:border-blue-200 transition-colors" placeholder="分鐘" value={cooktime} onChange={(e) => setCooktime(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-gray-400 uppercase ml-1">卡路里</label>
            <div className="flex bg-gray-50 rounded-xl border border-transparent focus-within:bg-white focus-within:border-blue-200 transition-colors overflow-hidden">
              <input type="number" className="w-full text-sm py-2.5 px-3 bg-transparent outline-none min-w-0" placeholder="kcal" value={kcal} onChange={(e) => setKcal(e.target.value)} />
              <button type="button" onClick={handleEstimateKcal} className="px-2 text-red-400 hover:text-red-500 flex items-center justify-center shrink-0" title="AI估算">
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 ml-1">評分推薦 (煮後)</label>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            {[1, 2, 3, 4].map((v) => (
              <button key={v} type="button" onClick={() => setRating(v)}
                className={`py-3 rounded-xl border font-bold transition-all ${rating === v ? 'border-blue-500 bg-blue-500 text-white' : 'bg-white border-gray-200 text-gray-600'}`}>
                {RATING_LABELS[v]}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <input type="text" className="w-full text-sm py-3 border-b border-gray-100 outline-none focus:border-blue-400" placeholder="🏷️ 標籤 (用逗號分隔)" value={tags} onChange={(e) => setTags(e.target.value)} />
          <textarea required rows={4} className="w-full text-sm py-2 border-b border-gray-100 outline-none resize-none focus:border-blue-400" placeholder="🛒 材料清單..." value={ingredients} onChange={(e) => setIngredients(e.target.value)} />
          <textarea required rows={6} className="w-full text-sm py-2 border-b border-gray-100 outline-none resize-none focus:border-blue-400" placeholder="🍳 烹飪步驟..." value={steps} onChange={(e) => setSteps(e.target.value)} />
        </div>
      </form>
    </main>
  );
}
