import { Share2 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export default function ShareModal() {
  const { isShareModalOpen, setIsShareModalOpen, recipes, showToast } = useApp();
  if (!isShareModalOpen) return null;

  const shareRecipe = async (dishId: string, flavorId: string) => {
    const dish = recipes.find((d) => d.id === dishId);
    const flavor = dish?.flavors.find((f) => f.id === flavorId);
    if (!dish || !flavor) return;
    const text = `👨🏻‍🍳 Cooking PAPA\n\n【${dish.name} - ${flavor.name}】\n🛒 材料：\n${flavor.ingredients}\n\n🍳 步驟：\n${flavor.steps}`;
    try {
      await navigator.clipboard.writeText(text);
      showToast('食譜已複製 ✅');
    } catch {
      showToast('複製失敗');
    }
    setIsShareModalOpen(false);
  };

  const hasRecipes = recipes.some((d) => (d.flavors || []).length > 0);

  return (
    <div className="fixed inset-0 bg-black/60 z-[80] flex flex-col items-center justify-end sm:justify-center">
      <div className="absolute inset-0" onClick={() => setIsShareModalOpen(false)} />
      <div className="bg-white w-full max-w-lg sm:rounded-3xl rounded-t-3xl p-6 shadow-2xl relative z-10 flex flex-col max-h-[85vh]">
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4 sm:hidden shrink-0" />
        <h3 className="text-lg font-bold mb-4 text-center shrink-0 flex items-center justify-center gap-2">
          <Share2 className="w-5 h-5 text-blue-500" /> 選擇要匯出嘅食譜
        </h3>
        <p className="text-xs text-gray-500 mb-4 text-center shrink-0">點擊食譜後，系統會自動複製圖文並茂嘅文字，方便你貼上 WhatsApp 或 IG 分享畀朋友！</p>
        <div className="flex-1 overflow-y-auto pr-2 space-y-2 scroll-container text-left pb-4">
          {!hasRecipes ? (
            <p className="text-center text-gray-400 py-10 text-sm">庫內仲未有食譜可以分享！</p>
          ) : (
            recipes.flatMap((d) =>
              (d.flavors || []).map((f) => (
                <div
                  key={`${d.id}-${f.id}`}
                  className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex justify-between items-center cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition"
                  onClick={() => shareRecipe(d.id, f.id)}
                >
                  <span className="font-bold text-sm text-gray-700">
                    {d.name} <span className="text-gray-400 text-xs">- {f.name}</span>
                  </span>
                  <Share2 className="w-5 h-5 text-blue-500" />
                </div>
              ))
            )
          )}
        </div>
        <button onClick={() => setIsShareModalOpen(false)} className="w-full py-3.5 bg-gray-100 rounded-2xl font-bold text-gray-600 transition mt-2 shrink-0 hover:bg-gray-200">取消</button>
      </div>
    </div>
  );
}
