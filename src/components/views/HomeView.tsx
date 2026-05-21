import { Grid2X2, Search, Heart, Hourglass } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const PLANNING_BG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 800'><rect width='800' height='800' fill='%23fff7ed'/><text x='400' y='350' font-size='280' text-anchor='middle' dominant-baseline='middle'>👨🏻‍🍳</text><text x='400' y='620' font-size='120' text-anchor='middle' dominant-baseline='middle'>🔥</text></svg>";
const DEFAULT_IMG = 'https://images.unsplash.com/photo-1495195134817-aeb325a55b65?auto=format&fit=crop&w=800&q=80';

function getPostImg(f: any): string {
  if (f.coverImage) return f.coverImage;
  const isPlanningActive = f.isPlanning && (!f.records || f.records.length === 0);
  if (isPlanningActive) return PLANNING_BG;
  if (f.records && f.records.length > 0) {
    return (f.records[0].images && f.records[0].images.length > 0)
      ? f.records[0].images[0]
      : (f.records[0].image || DEFAULT_IMG);
  }
  return DEFAULT_IMG;
}

export default function HomeView() {
  const {
    recipes, navigate, currentHomeTab, setCurrentHomeTab,
    userAvatar, setUserAvatarAndSave, setIsShareModalOpen,
    searchFilterPlanning, setSearchFilterPlanning,
  } = useApp();

  const posts = recipes.flatMap((d) =>
    (d.flavors || []).map((f) => ({
      dishId: d.id, flavorId: f.id,
      img: getPostImg(f),
      isPlanningActive: f.isPlanning && (!f.records || f.records.length === 0),
    }))
  ).reverse();

  const favPosts = posts.filter((p) => {
    const d = recipes.find((x) => x.id === p.dishId);
    const f = d?.flavors.find((x) => x.id === p.flavorId);
    return f?.isFavorite;
  });

  const [searchQuery, setSearchQuery] = React.useState('');

  const searchResults = recipes.flatMap((d) =>
    (d.flavors || []).flatMap((f) => {
      const isPlanningActive = f.isPlanning && (!f.records || f.records.length === 0);
      if (searchFilterPlanning && !isPlanningActive) return [];
      if (!searchQuery && !searchFilterPlanning) return [];
      const kw = searchQuery.toLowerCase().trim();
      if (kw && !d.name.toLowerCase().includes(kw) && !f.name.toLowerCase().includes(kw)) return [];
      return [{ dishId: d.id, flavorId: f.id, img: getPostImg(f), isPlanningActive }];
    })
  ).reverse();

  const totalRecords = recipes.reduce((a, d) => a + (d.flavors || []).reduce((x, f) => x + (f.records?.length || 0), 0), 0);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { resizeImage } = require('../../lib/gemini');
    resizeImage(file, (data: string) => {
      setUserAvatarAndSave(data);
    });
  };

  const tabBtn = (tab: string, icon: React.ReactNode) => (
    <div
      key={tab}
      onClick={() => setCurrentHomeTab(tab as any)}
      className={`flex-1 flex justify-center py-3.5 border-t-2 -mt-[2px] cursor-pointer transition-colors ${currentHomeTab === tab ? 'border-black text-gray-900' : 'border-transparent text-gray-400'}`}
    >
      {icon}
    </div>
  );

  return (
    <main className="text-left">
      {/* Profile section */}
      <div className="px-5 py-8 flex items-center gap-6 sm:gap-12">
        <div
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1 bg-gradient-to-tr from-yellow-400 via-orange-500 to-fuchsia-600 flex-shrink-0 cursor-pointer shadow-md"
          onClick={() => document.getElementById('avatar-upload-react')?.click()}
        >
          <div className="w-full h-full rounded-full bg-white p-0.5">
            <img src={userAvatar} className="w-full h-full rounded-full object-cover bg-orange-50" alt="avatar" />
          </div>
        </div>
        <input type="file" id="avatar-upload-react" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        <div className="flex-1 flex justify-around text-center">
          <div className="flex flex-col"><span className="font-bold text-lg">{recipes.length}</span><span className="text-[10px] text-gray-400 font-bold uppercase">菜式</span></div>
          <div className="flex flex-col"><span className="font-bold text-lg">{posts.length}</span><span className="text-[10px] text-gray-400 font-bold uppercase">口味</span></div>
          <div className="flex flex-col"><span className="font-bold text-lg">{totalRecords}</span><span className="text-[10px] text-gray-400 font-bold uppercase">記錄</span></div>
        </div>
      </div>

      <div className="px-6 pb-6 text-left">
        <h2 className="font-bold text-sm tracking-tight text-gray-900">爸爸大廚 cooking_papa</h2>
        <p className="text-[13px] text-gray-600 mt-1 whitespace-pre-line leading-relaxed">紀錄為屋企人煮嘅每一餐😋🍽️</p>
        <div className="mt-5 flex gap-3 w-full">
          <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-black font-bold text-[12px] py-2.5 rounded-xl transition" onClick={() => navigate('profile')}>設定與備份</button>
          <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-black font-bold text-[12px] py-2.5 rounded-xl transition" onClick={() => setIsShareModalOpen(true)}>匯出分享食譜</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-t border-b border-gray-100 mt-2 bg-white sticky top-[58px] z-30">
        {tabBtn('grid', <Grid2X2 className="w-5 h-5" />)}
        {tabBtn('search', <Search className="w-5 h-5" />)}
        {tabBtn('favorites', <Heart className="w-5 h-5" />)}
      </div>

      {/* Grid tab */}
      {currentHomeTab === 'grid' && (
        <div className="block pb-10">
          <div className="grid grid-cols-3 gap-0.5 bg-gray-100">
            {posts.length === 0 ? (
              <div className="col-span-3 py-24 text-center text-gray-300 text-xs">尚無食譜</div>
            ) : posts.map((p) => (
              <div key={`${p.dishId}-${p.flavorId}`} className="grid-img-container cursor-pointer" onClick={() => navigate('recipe', p.dishId, p.flavorId)}>
                <img src={p.img} alt="" />
                {p.isPlanningActive && <div className="absolute top-2 left-2 bg-orange-500/90 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">⏳ 挑戰</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search tab */}
      {currentHomeTab === 'search' && (
        <div className="pb-10">
          <div className="px-5 py-4 border-b border-gray-50 bg-white">
            <div className="relative flex-1 h-10 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-full bg-gray-100 rounded-2xl py-2 pl-10 pr-4 outline-none text-sm transition-all focus:bg-gray-200/50"
                placeholder="搜尋菜式、口味或風格..."
                autoFocus
              />
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setSearchFilterPlanning(!searchFilterPlanning)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center gap-1 border ${searchFilterPlanning ? 'bg-orange-500 border-orange-500 text-white' : 'bg-gray-50 border-gray-200 text-gray-500'}`}
              >
                <Hourglass className="w-3 h-3" /> 只顯示「準備挑戰」
              </button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-0.5 bg-gray-100">
            {!searchQuery && !searchFilterPlanning ? (
              <div className="col-span-3 py-20 text-center text-gray-400 text-xs">輸入搜尋關鍵字或點擊篩選</div>
            ) : searchResults.length === 0 ? (
              <div className="col-span-3 py-20 text-center text-gray-400 text-xs">搵唔到相關食譜 😢</div>
            ) : searchResults.map((p) => (
              <div key={`${p.dishId}-${p.flavorId}`} className="grid-img-container cursor-pointer" onClick={() => navigate('recipe', p.dishId, p.flavorId)}>
                <img src={p.img} alt="" />
                {p.isPlanningActive && <div className="absolute top-2 left-2 bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">⏳</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Favorites tab */}
      {currentHomeTab === 'favorites' && (
        <div className="pb-10">
          <div className="p-6 border-b border-gray-50 flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500 fill-red-500" />
            <h2 className="font-bold text-lg text-gray-900">我的收藏 ❤️</h2>
          </div>
          <div className="grid grid-cols-3 gap-0.5 bg-gray-100">
            {favPosts.length === 0 ? (
              <div className="col-span-3 py-24 text-center text-gray-300 text-xs">無收藏 ❤️</div>
            ) : favPosts.map((p) => (
              <div key={`${p.dishId}-${p.flavorId}`} className="grid-img-container cursor-pointer" onClick={() => navigate('recipe', p.dishId, p.flavorId)}>
                <img src={p.img} alt="" />
                <div className="absolute top-2 right-2 bg-white/90 p-1 rounded-full">
                  <Heart className="w-3 h-3 text-red-500 fill-red-500" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

import React from 'react';
