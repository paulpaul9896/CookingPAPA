import { useState, useEffect, useRef } from 'react';
import { Heart, Send, Trash2, Edit3, Star, Flame, Hourglass, Info } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { resizeImage } from '../../lib/gemini';

const PLANNING_BG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 800'><rect width='800' height='800' fill='%23fff7ed'/><text x='400' y='350' font-size='280' text-anchor='middle' dominant-baseline='middle'>👨🏻‍🍳</text><text x='400' y='620' font-size='120' text-anchor='middle' dominant-baseline='middle'>🔥</text></svg>";
const DEFAULT_IMG = 'https://images.unsplash.com/photo-1495195134817-aeb325a55b65?auto=format&fit=crop&w=800&q=80';
const RATING_TEXTS: Record<number, string> = { 1: '🤢 中伏', 2: '🤐 試一次', 3: '🙂 得閒整', 4: '🤤 要著兩條褲' };

export default function RecipeView() {
  const {
    recipes, currentDishId, currentFlavorId, navigate,
    syncToCloud, showToast, showCustomConfirm, showCustomPrompt,
    setIsEditModalOpen, setIsShareModalOpen,
    userAvatar,
  } = useApp();

  const [servingMultiplier, setServingMultiplier] = useState(1);
  const viewRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);

  const dish = recipes.find((d) => d.id === currentDishId);
  const flavor = dish?.flavors.find((f) => f.id === currentFlavorId);

  useEffect(() => { setServingMultiplier(1); }, [currentDishId, currentFlavorId]);

  if (!dish || !flavor) return null;

  const isPlanningActive = flavor.isPlanning && (!flavor.records || flavor.records.length === 0);

  let img = isPlanningActive ? PLANNING_BG : DEFAULT_IMG;
  if (flavor.coverImage) img = flavor.coverImage;
  else if (flavor.records && flavor.records.length > 0) {
        img = (flavor.records[0].images && flavor.records[0].images.length > 0)
      ? flavor.records[0].images[0]
      : img;
  }

  let originalNum = 1;
  let unit = '份';
  const match = (flavor.serving || '').match(/(\d+(?:\.\d+)?)\s*(.*)/);
  if (match) { originalNum = parseFloat(match[1]) || 1; unit = match[2] || ''; }
  else if (flavor.serving) unit = flavor.serving;

  const currentNum = originalNum * servingMultiplier;
  const servingDisplay = match ? `${Number.isInteger(currentNum) ? currentNum : parseFloat(currentNum.toFixed(1))} ${unit}`.trim() : (flavor.serving || '份量');

  const scaleIngredients = (text: string) =>
    text.replace(/\b(\d+(?:\.\d+)?)\b/g, (m) => {
      const n = Number(m) * servingMultiplier;
      return Number.isInteger(n) ? String(n) : String(parseFloat(n.toFixed(1)));
    });

  const adjustServing = (delta: number) => {
    setServingMultiplier((prev) => {
      const next = Math.max(0.5, parseFloat((prev + delta * 0.5).toFixed(1)));
      showToast(`已切換為 ${next} 倍份量 ⚖️`);
      return next;
    });
  };

  const setCoverImage = async (imgUrl: string) => {
    flavor.coverImage = imgUrl;
    await syncToCloud(dish);
    showToast('已設定為代表照 ⭐');
  };

  const toggleFavorite = async () => {
    flavor.isFavorite = !flavor.isFavorite;
    await syncToCloud(dish);
    showToast(flavor.isFavorite ? '已加入收藏 ❤️' : '已取消收藏');
  };

  const { deleteFromCloud } = useApp();

  const deleteRecipe = () => {
    showCustomConfirm('確定要永久刪除呢個食譜？此動作無法還原。', async () => {
      dish.flavors = dish.flavors.filter((f) => f.id !== currentFlavorId);
      if (dish.flavors.length === 0) {
        await deleteFromCloud(dish.id);
      } else {
        await syncToCloud(dish);
      }
      navigate('home');
      showToast('食譜已刪除 🗑️');
    });
  };

  const deleteRecord = (id: string) => {
    showCustomConfirm('確定要刪除呢個製作記錄？', async () => {
      flavor.records = (flavor.records || []).filter((r) => r.id !== id);
      await syncToCloud(dish);
      showToast('記錄已刪除');
    });
  };

  const editRecordNote = (id: string) => {
    const record = (flavor.records || []).find((r) => r.id === id);
    if (!record) return;
    showCustomPrompt('修改記錄心得：', '輸入心得...', async (newNote) => {
      record.note = newNote;
      await syncToCloud(dish);
      showToast('記錄心得已更新 ✅');
    }, record.note);
  };

  const saveRecord = async (fileInput: HTMLInputElement | null, noteInput: HTMLInputElement | null) => {
    const files = fileInput?.files ? Array.from(fileInput.files) : [];
    const note = noteInput?.value || '';
    flavor.records = flavor.records || [];
    let challengeCompleted = false;
    if (flavor.isPlanning) { flavor.isPlanning = false; challengeCompleted = true; }

    const finishSave = async (imagesArray: string[] | null) => {
      flavor.records!.push({ id: 'r' + Date.now(), date: new Date().toLocaleDateString(), images: imagesArray, note });
      await syncToCloud(dish);
      if (fileInput) fileInput.value = '';
      if (noteInput) noteInput.value = '';
      if (challengeCompleted) showToast('🎉 挑戰完成！記錄已上傳');
      else showToast('記錄已上傳 📸');
    };

    if (files.length > 0) {
      let processed = 0;
      const imagesArray: string[] = [];
      files.forEach((file) => {
        resizeImage(file, (imgData) => {
          imagesArray.push(imgData);
          processed++;
          if (processed === files.length) finishSave(imagesArray);
        });
      });
    } else {
      await finishSave(null);
    }
  };

  return (
    <main
      ref={viewRef}
      className="text-left"
      onTouchStart={(e) => { touchStartX.current = e.changedTouches[0].screenX; }}
      onTouchEnd={(e) => { if (e.changedTouches[0].screenX - touchStartX.current > 130) navigate('home'); }}
    >
      <div className="pb-12 text-left">
        <div className="bg-white border-b border-gray-50 text-left">
          {/* Header row */}
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full border border-gray-100 overflow-hidden">
                <img src={userAvatar} className="w-full h-full object-cover" alt="avatar" />
              </div>
              <span className="font-bold text-sm text-gray-900">cooking_papa</span>
            </div>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 hover:text-blue-500 hover:bg-blue-50 transition-colors shadow-sm"
            >
              <Edit3 className="w-4 h-4" /><span className="text-[11px] font-bold">編輯</span>
            </button>
          </div>

          {/* Cover image */}
          <div className="relative w-full aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
            <img src={img} className="w-full h-full object-cover bg-gray-50" alt="cover" />
            {isPlanningActive && (
              <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center">
                <div className="bg-white/95 backdrop-blur-md px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2">
                  <Hourglass className="w-5 h-5 text-orange-500 animate-pulse" />
                  <p className="text-orange-600 font-bold text-sm">食譜等待挑戰中</p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-4 py-3 flex justify-between">
            <div className="flex gap-5">
              <button onClick={toggleFavorite}>
                <Heart className={`w-7 h-7 ${flavor.isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-900'}`} />
              </button>
              <button onClick={() => setIsShareModalOpen(true)}>
                <Send className="w-7 h-7 text-gray-900" />
              </button>
            </div>
            <button onClick={deleteRecipe}>
              <Trash2 className="w-6 h-6 text-red-200 hover:text-red-400 transition-colors" />
            </button>
          </div>

          {/* Meta info */}
          <div className="px-5 pb-6 text-sm">
            {isPlanningActive && (
              <div className="bg-gradient-to-r from-orange-50 to-orange-100/50 border border-orange-200 text-orange-700 text-[11px] p-3 rounded-xl mb-4 flex items-center justify-between shadow-sm">
                <span className="font-bold flex items-center gap-1.5"><Info className="w-4 h-4" /> 上載相片即可解鎖成就！</span>
              </div>
            )}
            <div className="flex gap-2.5 text-[10px] font-bold mb-3 uppercase items-center flex-wrap">
              <div className="flex items-center bg-gray-100 rounded-md">
                <button onClick={() => adjustServing(-1)} className="px-3 py-1.5 text-gray-400 hover:text-gray-900 transition-colors font-bold text-sm">-</button>
                <span className="text-gray-600 px-3 border-x border-gray-200 font-bold text-xs">{servingDisplay}</span>
                <button onClick={() => adjustServing(1)} className="px-3 py-1.5 text-gray-400 hover:text-gray-900 transition-colors font-bold text-sm">+</button>
              </div>
              <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-md uppercase">{RATING_TEXTS[flavor.rating || 4]}</span>
              {flavor.cooktime && <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md uppercase">⏱️ {flavor.cooktime}M</span>}
              {flavor.kcal && (
                <span className="bg-red-50 text-red-600 px-2 py-1 rounded-md uppercase flex items-center gap-1">
                  <Flame className="w-3 h-3 text-red-500" /> {flavor.kcal}
                </span>
              )}
            </div>
            <p className="leading-relaxed text-left">
              <span className="font-bold mr-2 text-gray-900">cooking_papa</span>
              【{dish.name} - {flavor.name}】
            </p>

            <div className="mt-5 space-y-4 text-left">
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <p className="font-bold text-[10px] text-gray-400 border-b border-gray-200 pb-1.5 mb-2 uppercase text-left">🛒 材料 Ingredients</p>
                <p className="whitespace-pre-line text-gray-700 leading-relaxed text-left">
                  {scaleIngredients(flavor.ingredients || '')}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <p className="font-bold text-[10px] text-gray-400 border-b border-gray-200 pb-1.5 mb-2 uppercase text-left">🍳 步驟 Steps</p>
                <p className="whitespace-pre-line text-gray-700 leading-loose text-left">{flavor.steps}</p>
              </div>
            </div>
          </div>

          {/* Records */}
          <div className="px-5 mt-4 pb-12 text-left">
            <h4 className="font-bold text-sm mb-4 border-t pt-6 text-gray-400">製作記錄 相簿</h4>
            <div className="space-y-4">
              {(flavor.records || []).map((r) => {
                const imagesList: string[] = r.images || [];
                return (
                  <div key={r.id} className="bg-gray-50 rounded-2xl p-4 relative border text-left mb-4 shadow-sm">
                    <div className="absolute top-3 right-3 flex gap-2 z-20">
                      <button onClick={() => editRecordNote(r.id)} className="text-gray-400 hover:text-blue-500 transition-colors p-1 bg-white/80 rounded-full shadow-sm backdrop-blur-sm">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteRecord(r.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1 bg-white/80 rounded-full shadow-sm backdrop-blur-sm">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="text-[10px] font-bold text-blue-500 bg-blue-100/50 px-2 py-0.5 rounded-md border border-blue-100">{r.date}</span>
                    <p className="text-xs mt-2 text-gray-700 text-left whitespace-pre-line leading-relaxed">{r.note || ''}</p>
                    {imagesList.length === 1 && (
                      <div className="relative mt-3 group">
                        <img src={imagesList[0]} className="w-full max-h-56 object-cover rounded-xl border border-gray-100" alt="" />
                        <button onClick={() => setCoverImage(imagesList[0])} className={`absolute top-2 left-2 p-1.5 bg-white/90 rounded-full shadow-sm backdrop-blur-sm transition-colors ${flavor.coverImage === imagesList[0] ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'} z-10`}>
                          <Star className={`w-4 h-4 ${flavor.coverImage === imagesList[0] ? 'fill-yellow-500' : ''}`} />
                        </button>
                      </div>
                    )}
                    {imagesList.length > 1 && (
                      <div className={`grid ${imagesList.length === 2 ? 'grid-cols-2' : 'grid-cols-3'} gap-1.5 mt-3`}>
                        {imagesList.map((imgSrc: string, idx: number) => (
                          <div key={idx} className="relative aspect-square group">
                            <img src={imgSrc} className="w-full h-full object-cover rounded-xl border border-gray-100" alt="" />
                            <button onClick={() => setCoverImage(imgSrc)} className={`absolute top-1.5 left-1.5 p-1 bg-white/90 rounded-full shadow-sm backdrop-blur-sm transition-colors ${flavor.coverImage === imgSrc ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'} z-10`}>
                              <Star className={`w-3.5 h-3.5 ${flavor.coverImage === imgSrc ? 'fill-yellow-500' : ''}`} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Add record form */}
              <RecordForm isPlanningActive={isPlanningActive} onSave={saveRecord} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function RecordForm({ isPlanningActive, onSave }: { isPlanningActive: boolean; onSave: (f: HTMLInputElement | null, n: HTMLInputElement | null) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const noteRef = useRef<HTMLInputElement>(null);
  return (
    <div className={`border-2 border-dashed ${isPlanningActive ? 'border-orange-300 bg-orange-50/30' : 'border-gray-200 bg-gray-50/50'} rounded-3xl p-6 text-center`}>
      <input type="file" ref={fileRef} accept="image/*" multiple className="text-xs mb-3 w-full text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:bg-blue-50 file:text-blue-600" />
      <input ref={noteRef} type="text" className="w-full text-xs p-3 bg-white border border-gray-100 rounded-xl mb-3 outline-none focus:ring-1 focus:ring-blue-500" placeholder="分享今次煮成點？心得..." />
      <button
        onClick={() => onSave(fileRef.current, noteRef.current)}
        className={`w-full ${isPlanningActive ? 'bg-orange-500 shadow-orange-500/20' : 'bg-blue-500 shadow-blue-500/20'} text-white font-bold py-3 rounded-xl shadow-lg active:scale-95 transition-all`}
      >
        {isPlanningActive ? '上載相片完成挑戰 🎉' : '發佈新記錄'}
      </button>
    </div>
  );
}
