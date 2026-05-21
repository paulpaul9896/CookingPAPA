import { useEffect, useRef } from 'react';
import { ShoppingCart, Utensils, Edit3, Trash2, GripVertical } from 'lucide-react';
import Sortable from 'sortablejs';
import { useApp } from '../../contexts/AppContext';

export default function GroceryView() {
  const {
    recipes, customGroceryDb, saveCustomGroceryToCloud,
    currentGroceryMode, setCurrentGroceryMode,
    groceryChecked, toggleGroceryChecked,
    groceryDeleted, markGroceryDeleted,
    groceryOrder, setGroceryOrder,
    currentUser, showToast, showCustomAlert,
  } = useApp();

  const sortableContainerRef = useRef<HTMLDivElement>(null);
  const [manualInput, setManualInput] = React.useState('');

  const addCustom = async () => {
    const text = manualInput.trim();
    if (!text) return;
    if (!currentUser) { showCustomAlert('請先登入以儲存自訂項目'); return; }
    const newItem = { id: 'cg_' + Date.now(), text };
    await saveCustomGroceryToCloud([...customGroceryDb, newItem]);
    setManualInput('');
    showToast('已加入購物清單 🛒');
  };

  const deleteCustom = async (id: string) => {
    await saveCustomGroceryToCloud(customGroceryDb.filter((item) => item.id !== id));
    showToast('已刪除項目 🗑️');
  };

  // Build flat items list
  const recipeItems: Array<{ id: string; recipeName: string; item: string; key: string; isCustom: boolean }> = [];
  recipes.forEach((d) => {
    (d.flavors || []).forEach((f) => {
      if (f.isPlanning && (!f.records || f.records.length === 0) && f.ingredients) {
        f.ingredients.split(/[\n、,，]+/).map((i) => i.trim()).filter(Boolean).forEach((item, idx) => {
          const key = `${f.id}-${idx}`;
          if (!groceryDeleted[key]) {
            recipeItems.push({ id: key, recipeName: `${d.name} - ${f.name}`, item, key, isCustom: false });
          }
        });
      }
    });
  });

  customGroceryDb.forEach((cItem) => {
    recipeItems.push({ id: cItem.id, recipeName: '自訂項目', item: cItem.text, key: cItem.id, isCustom: true });
  });

  // Sort flat items by groceryOrder
  const sortedFlatItems = [...recipeItems].sort((a, b) => {
    const ai = groceryOrder.indexOf(a.key);
    const bi = groceryOrder.indexOf(b.key);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  // SortableJS integration
  useEffect(() => {
    if (currentGroceryMode !== 'flat' || !sortableContainerRef.current) return;
    const sortable = new Sortable(sortableContainerRef.current, {
      handle: '.grocery-handle',
      animation: 150,
      ghostClass: 'bg-orange-50',
      onEnd: () => {
        const newOrder = Array.from(sortableContainerRef.current!.querySelectorAll('[data-key]'))
          .map((el) => (el as HTMLElement).dataset.key!);
        setGroceryOrder(newOrder);
      },
    });
    return () => sortable.destroy();
  }, [currentGroceryMode, sortedFlatItems.length]);

  // Group recipe items by section
  const recipeSections: Record<string, { name: string; items: typeof recipeItems }> = {};
  recipes.forEach((d) => {
    (d.flavors || []).forEach((f) => {
      if (f.isPlanning && (!f.records || f.records.length === 0) && f.ingredients) {
        const sectionItems: typeof recipeItems = [];
        f.ingredients.split(/[\n、,，]+/).map((i) => i.trim()).filter(Boolean).forEach((item, idx) => {
          const key = `${f.id}-${idx}`;
          if (!groceryDeleted[key]) sectionItems.push({ id: key, recipeName: `${d.name} - ${f.name}`, item, key, isCustom: false });
        });
        if (sectionItems.length > 0) {
          recipeSections[`${d.id}-${f.id}`] = { name: `${d.name} - ${f.name}`, items: sectionItems };
        }
      }
    });
  });

  const hasItems = recipeItems.length > 0;

  return (
    <main className="bg-white min-h-[90vh] pb-12">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-2xl flex items-center gap-2 text-gray-900">
            <ShoppingCart className="w-6 h-6 text-orange-500" /> 購物清單
          </h3>
        </div>

        <div className="flex gap-2 mb-4 h-12 w-full">
          <input
            type="text"
            placeholder="新增購買項目 (如: 洗潔精)"
            className="flex-1 min-w-0 px-4 h-full bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addCustom(); }}
          />
          <button onClick={addCustom} className="shrink-0 px-5 h-full bg-orange-500 text-white rounded-xl text-sm font-bold shadow-md active:scale-95 transition flex items-center justify-center whitespace-nowrap">加入</button>
        </div>

        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setCurrentGroceryMode('recipe')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${currentGroceryMode === 'recipe' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-600'}`}
          >按食譜分類</button>
          <button
            onClick={() => setCurrentGroceryMode('flat')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${currentGroceryMode === 'flat' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-600'}`}
          >合併清單 (可排序)</button>
        </div>

        {!hasItems ? (
          <p className="text-center text-gray-400 py-10 text-sm">目前無待買項目，清單空空如也！</p>
        ) : currentGroceryMode === 'recipe' ? (
          <div className="space-y-4">
            {Object.entries(recipeSections).map(([key, section]) => (
              <div key={key} className="mb-5 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <h4 className="font-bold text-sm text-gray-800 mb-3 border-b border-gray-100 pb-2 flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-orange-400" /> {section.name}
                </h4>
                <div className="space-y-2">
                  {section.items.map(({ item, key: k }) => (
                    <div key={k} className="flex items-center justify-between transition-all hover:bg-gray-50 rounded-lg pr-2">
                      <label className="flex items-start gap-3 cursor-pointer p-1 flex-1">
                        <input type="checkbox" onChange={() => toggleGroceryChecked(k)} checked={!!groceryChecked[k]} className="mt-0.5 w-5 h-5 text-orange-500 rounded border-gray-300 accent-orange-500 flex-shrink-0" />
                        <span className={`text-sm font-medium transition-colors ${groceryChecked[k] ? 'line-through text-gray-300' : 'text-gray-700'}`}>{item}</span>
                      </label>
                      <button onClick={() => markGroceryDeleted(k)} className="text-gray-300 hover:text-red-500 transition-colors p-2">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {customGroceryDb.length > 0 && (
              <div className="mb-5 bg-white p-4 rounded-2xl shadow-sm border border-orange-100">
                <h4 className="font-bold text-sm text-gray-800 mb-3 border-b border-gray-100 pb-2 flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-orange-400" /> 自訂購買項目
                </h4>
                <div className="space-y-2">
                  {customGroceryDb.map((cItem) => (
                    <div key={cItem.id} className="flex items-center justify-between transition-all hover:bg-gray-50 rounded-lg pr-2">
                      <label className="flex items-start gap-3 cursor-pointer p-1 flex-1">
                        <input type="checkbox" onChange={() => toggleGroceryChecked(cItem.id)} checked={!!groceryChecked[cItem.id]} className="mt-0.5 w-5 h-5 text-orange-500 rounded border-gray-300 accent-orange-500 flex-shrink-0" />
                        <span className={`text-sm font-medium transition-colors ${groceryChecked[cItem.id] ? 'line-through text-gray-300' : 'text-gray-700'}`}>{cItem.text}</span>
                      </label>
                      <button onClick={() => deleteCustom(cItem.id)} className="text-gray-300 hover:text-red-500 transition-colors p-2">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div ref={sortableContainerRef} className="space-y-2 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            {sortedFlatItems.map(({ key: k, item, recipeName, isCustom }) => (
              <div key={k} data-key={k} className="grocery-item flex items-center justify-between border-b border-gray-50 last:border-0 transition hover:bg-gray-50 rounded-xl pr-2 bg-white">
                <div className="grocery-handle p-2 cursor-grab text-gray-300 hover:text-orange-500 active:cursor-grabbing touch-none flex items-center justify-center">
                  <GripVertical className="w-5 h-5" />
                </div>
                <label className="flex items-start gap-3 cursor-pointer p-2 flex-1">
                  <input type="checkbox" onChange={() => toggleGroceryChecked(k)} checked={!!groceryChecked[k]} className="mt-0.5 w-5 h-5 text-orange-500 rounded border-gray-300 accent-orange-500 flex-shrink-0" />
                  <div className="flex-1">
                    <span className={`block text-sm font-medium transition-colors ${groceryChecked[k] ? 'line-through text-gray-300' : 'text-gray-700'}`}>{item}</span>
                    <span className="text-[9px] text-gray-400 block mt-0.5">{recipeName}</span>
                  </div>
                </label>
                <button onClick={() => isCustom ? deleteCustom(k) : markGroceryDeleted(k)} className="text-gray-300 hover:text-red-500 transition-colors p-2">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

import React from 'react';
