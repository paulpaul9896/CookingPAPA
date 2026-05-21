        import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
        import { getAuth, signInAnonymously, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
        import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

        // --- 1. Firebase 初始化 ---
        const firebaseConfig = {
          apiKey: "AIzaSyAEmsDD6_Y1sfX7lIcordEpmrr0uMA_nEM",
          authDomain: "cooking-papa-51c66.firebaseapp.com",
          projectId: "cooking-papa-51c66",
          storageBucket: "cooking-papa-51c66.firebasestorage.app",
          messagingSenderId: "410761551111",
          appId: "1:410761551111:web:dc11932400d524615739a2",
          measurementId: "G-3B1ZTPXBZE"
        };
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const dbFirestore = getFirestore(app);
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'cooking-papa-app';
        
        let currentUser = null;
        let db = []; 
        let calorieDb = []; 
        let plannerDb = {};
        let customGroceryDb = [];
        
        let currentDishId = null;
        let currentFlavorId = null;
        let unsubscribeSnapshot = null;
        let unsubscribeCalorie = null;
        let unsubscribePlanner = null;
        let unsubscribeCustomGrocery = null;

        // 安全地讀取 localStorage 嘅輔助函數，防止解析出錯導致停止執行
        const safeGetItem = (key, fallback) => {
            try { 
                const val = localStorage.getItem(key);
                return val ? JSON.parse(val) : fallback;
            } catch (e) { 
                return fallback; 
            }
        };

        let groceryChecked = safeGetItem('groceryChecked', {});
        let groceryDeleted = safeGetItem('groceryDeleted', {});
        let groceryOrder = safeGetItem('groceryOrder', []);

        // 口味標籤庫
        window.flavorTags = safeGetItem('cookingPapaFlavorTags', ['減肥餐', '兒童至愛', '快手15分鐘', '惹味大排檔', '清淡健康']);

        const defaultAvatar = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect fill='%23FFF3E0' width='100' height='100'/><text x='50' y='55' font-size='45' text-anchor='middle' dominant-baseline='middle'>👨🏻‍🍳</text></svg>";
        
        // 準備挑戰 預設背景圖 (大廚與火 Emoji)
        const planningBgImg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 800'><rect width='800' height='800' fill='%23fff7ed'/><text x='400' y='350' font-size='280' text-anchor='middle' dominant-baseline='middle'>👨🏻‍🍳</text><text x='400' y='620' font-size='120' text-anchor='middle' dominant-baseline='middle'>🔥</text></svg>";

        window.userAvatar = defaultAvatar;
        try {
            window.userAvatar = localStorage.getItem('cookingPapaAvatar') || defaultAvatar;
        } catch(e) {}

        function updateAvatarDisplays() {
            const hAv = document.getElementById('home-avatar-img');
            const nAv = document.getElementById('nav-avatar-img');
            if (hAv) hAv.src = window.userAvatar;
            if (nAv) nAv.src = window.userAvatar;
        }

        // --- 公共工具函數 ---
        window.customAlert = function(msg) {
            const titleEl = document.getElementById('custom-modal-title');
            const msgEl = document.getElementById('custom-modal-msg');
            const inputEl = document.getElementById('custom-modal-input');
            const cancelBtn = document.getElementById('custom-modal-cancel');
            const confirmBtn = document.getElementById('custom-modal-confirm');
            const modal = document.getElementById('custom-modal');

            if(titleEl) titleEl.innerText = "提示";
            if(msgEl) msgEl.innerText = msg;
            if(inputEl) inputEl.classList.add('hidden');
            if(cancelBtn) cancelBtn.classList.add('hidden');
            if(confirmBtn) {
                confirmBtn.onclick = () => { if(modal) modal.classList.add('hidden'); };
            }
            if(modal) {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            }
        };

        window.customConfirm = function(msg, fn) {
            const titleEl = document.getElementById('custom-modal-title');
            const msgEl = document.getElementById('custom-modal-msg');
            const inputEl = document.getElementById('custom-modal-input');
            const cancelBtn = document.getElementById('custom-modal-cancel');
            const confirmBtn = document.getElementById('custom-modal-confirm');
            const modal = document.getElementById('custom-modal');

            if(titleEl) titleEl.innerText = "確認操作";
            if(msgEl) msgEl.innerText = msg;
            if(inputEl) inputEl.classList.add('hidden');
            if(cancelBtn) {
                cancelBtn.classList.remove('hidden');
                cancelBtn.onclick = () => { if(modal) modal.classList.add('hidden'); };
            }
            if(confirmBtn) {
                confirmBtn.onclick = () => { if(modal) modal.classList.add('hidden'); fn(); };
            }
            if(modal) {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            }
        };

        window.customPrompt = function(msg, placeholder, fn, defaultValue = '') {
            const titleEl = document.getElementById('custom-modal-title');
            const msgEl = document.getElementById('custom-modal-msg');
            const inputEl = document.getElementById('custom-modal-input');
            const cancelBtn = document.getElementById('custom-modal-cancel');
            const confirmBtn = document.getElementById('custom-modal-confirm');
            const modal = document.getElementById('custom-modal');

            if(titleEl) titleEl.innerText = "請輸入";
            if(msgEl) msgEl.innerText = msg;
            if(inputEl) {
                inputEl.classList.remove('hidden');
                inputEl.value = defaultValue;
                inputEl.placeholder = placeholder || '';
            }
            if(cancelBtn) {
                cancelBtn.classList.remove('hidden');
                cancelBtn.onclick = () => { if(modal) modal.classList.add('hidden'); };
            }
            if(confirmBtn) {
                confirmBtn.onclick = () => { 
                    if(modal) modal.classList.add('hidden'); 
                    fn(inputEl.value); 
                };
            }
            if(modal) {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            }
        };

        window.showToast = function(msg) {
            const t = document.getElementById('toast-notification');
            if(!t) return;
            t.innerText = msg; 
            t.style.opacity = '1'; 
            t.style.transform = 'translateX(-50%) translateY(0)';
            setTimeout(() => { 
                t.style.opacity = '0'; 
                t.style.transform = 'translateX(-50%) translateY(-20px)'; 
            }, 2500);
        };

        window.previewFridgeImage = function(input) {
            if (input.files && input.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const preview = input.parentElement.querySelector('.fridge-image-preview');
                    if(preview) {
                        preview.style.backgroundImage = `url(${e.target.result})`;
                        preview.classList.remove('hidden');
                    }
                }
                reader.readAsDataURL(input.files[0]);
            }
        };

        window.resizeImage = function(file, cb) {
            const r = new FileReader();
            r.onload = e => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let w = img.width, h = img.height;
                    if(w > h) { if(w > 800) { h *= 800/w; w = 800; } } else { if(h > 800) { w *= 800/h; h = 800; } }
                    canvas.width = w; canvas.height = h;
                    canvas.getContext('2d').drawImage(img, 0,0,w,h);
                    cb(canvas.toDataURL('image/jpeg', 0.75));
                };
                img.src = e.target.result;
            };
            r.readAsDataURL(file);
        };

        // --- 標籤渲染邏輯 ---
        window.renderFlavorTags = function() {
            const createHtml = (targetInputId) => {
                return window.flavorTags.map(tag => `
                    <div class="flex items-center bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold overflow-hidden border border-blue-100">
                        <button type="button" class="px-2.5 py-1 hover:bg-blue-100 transition" onclick="window.appendFlavor('${targetInputId}', '${tag}')">${tag}</button>
                        <button type="button" class="px-1.5 py-1 hover:bg-blue-100 text-blue-400 hover:text-blue-600 transition border-l border-blue-100" onclick="window.removeFlavorTag('${tag}')">
                            <i data-lucide="x" class="w-3 h-3"></i>
                        </button>
                    </div>
                `).join('') + `
                    <button type="button" onclick="window.promptAddFlavorTag()" class="text-[10px] font-bold text-gray-500 bg-gray-100 border border-gray-200 px-2 py-1 rounded-lg hover:bg-gray-200 transition">
                        + 新增
                    </button>
                `;
            };

            const addContainer = document.getElementById('flavor-tags-add');
            if (addContainer) addContainer.innerHTML = createHtml('input-flavor');
            
            const editContainer = document.getElementById('flavor-tags-edit');
            if (editContainer) editContainer.innerHTML = createHtml('edit-flavor');
            
            lucide.createIcons();
        };

        window.promptAddFlavorTag = function() {
            window.customPrompt("請輸入新嘅口味或風格：", "例如：節日大餐", (val) => {
                if(val && val.trim() && !window.flavorTags.includes(val.trim())) {
                    window.flavorTags.push(val.trim());
                    localStorage.setItem('cookingPapaFlavorTags', JSON.stringify(window.flavorTags));
                    window.renderFlavorTags();
                }
            });
        };

        window.removeFlavorTag = function(tag) {
            window.customConfirm(`確定要刪除「${tag}」預設標籤嗎？`, () => {
                window.flavorTags = window.flavorTags.filter(t => t !== tag);
                localStorage.setItem('cookingPapaFlavorTags', JSON.stringify(window.flavorTags));
                window.renderFlavorTags();
            });
        };

        window.updateSyncTime = function() {
            const el = document.getElementById('sync-time-display');
            if(el) {
                const now = new Date();
                el.innerText = `🔄 最後同步時間：${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
            }
        };

        // --- 2. 帳號與登入邏輯 ---
        window.handleGoogleSignIn = async function() {
            const provider = new GoogleAuthProvider();
            try {
                await signInWithPopup(auth, provider);
                window.showToast("已登入！👋");
            } catch(e) {
                if (e.code === 'auth/popup-closed-by-user') return;
                else if (e.code === 'auth/operation-not-allowed') window.customAlert("⚠️ Firebase 設定錯誤：\n請前往 Firebase 後台開啟「Google」登入。");
                else window.customAlert("登入失敗：" + e.message);
            }
        };

        window.handleLogout = async function() {
            await signOut(auth);
            window.showToast("已登出，資料將恢復為本地暫存");
        };


        onAuthStateChanged(auth, async (user) => {
            currentUser = user;
            if (!user) { await signInAnonymously(auth); return; }

            const userInfoEl = document.getElementById('user-info');
            const loginFormEl = document.getElementById('login-form');
            const userEmailEl = document.getElementById('user-email');
            const displayNameEl = document.getElementById('display-name');

            if (!user.isAnonymous) {
                if(userInfoEl) userInfoEl.classList.remove('hidden'); 
                if(loginFormEl) loginFormEl.classList.add('hidden');
                if(userEmailEl) userEmailEl.innerText = user.email;
                if(displayNameEl) displayNameEl.innerText = (user.displayName || user.email.split('@')[0]) + " 大廚";
            } else {
                if(userInfoEl) userInfoEl.classList.add('hidden'); 
                if(loginFormEl) loginFormEl.classList.remove('hidden');
                if(displayNameEl) displayNameEl.innerText = "爸爸大廚 cooking_papa";
            }

            // Recipes 監聽
            if (unsubscribeSnapshot) unsubscribeSnapshot();
            unsubscribeSnapshot = onSnapshot(collection(dbFirestore, 'artifacts', appId, 'users', user.uid, 'recipes'), (snap) => {
                db = []; snap.forEach(d => db.push({ id: d.id, ...d.data() }));
                window.updateSyncTime();
                window.refreshCurrentView();
            });

            // Calories 監聽
            if (unsubscribeCalorie) unsubscribeCalorie();
            unsubscribeCalorie = onSnapshot(collection(dbFirestore, 'artifacts', appId, 'users', user.uid, 'calories'), (snap) => {
                calorieDb = []; snap.forEach(d => calorieDb.push({ id: d.id, ...d.data() }));
                if(document.querySelector('.view-section.active')?.id === 'view-calorie') {
                    if (window.renderCalorieHistory) window.renderCalorieHistory();
                }
            });

            // Planner 監聽
            if (unsubscribePlanner) unsubscribePlanner();
            unsubscribePlanner = onSnapshot(doc(dbFirestore, 'artifacts', appId, 'users', user.uid, 'settings', 'planner'), (docSnap) => {
                if (docSnap.exists()) plannerDb = docSnap.data();
                else plannerDb = {};
                if(document.querySelector('.view-section.active')?.id === 'view-planner') {
                    if (window.renderPlanner) window.renderPlanner();
                }
            });

            // Custom Grocery 監聽
            if (unsubscribeCustomGrocery) unsubscribeCustomGrocery();
            unsubscribeCustomGrocery = onSnapshot(doc(dbFirestore, 'artifacts', appId, 'users', user.uid, 'settings', 'grocery'), (docSnap) => {
                if (docSnap.exists() && Array.isArray(docSnap.data().items)) {
                    customGroceryDb = docSnap.data().items;
                } else {
                    customGroceryDb = [];
                }
                if(document.querySelector('.view-section.active')?.id === 'view-grocery' && window.currentHomeTab === 'grocery') {
                    if (window.renderGroceryList) window.renderGroceryList();
                }
            });
        });

        // --- 3. 基礎功能 (導航、手勢、Tab) ---
        window.navigate = function(viewId, dishId = null, flavorId = null) {
            if (viewId === 'search') {
                viewId = 'home';
                setTimeout(() => { if (window.switchHomeTab) window.switchHomeTab('search'); }, 0);
            } else if (viewId === 'favorites') {
                viewId = 'home';
                setTimeout(() => { if (window.switchHomeTab) window.switchHomeTab('favorites'); }, 0);
            }

            document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
            const targetView = document.getElementById('view-' + viewId);
            if(targetView) targetView.classList.add('active');
            
            const navIds = ['home', 'fridge', 'add', 'grocery', 'profile'];
            navIds.forEach(id => {
                const btn = document.getElementById('nav-btn-' + id);
                if (!btn) return;
                const active = (id === viewId || (viewId === 'recipe' && id === 'home'));
                btn.classList.toggle('text-gray-900', active);
                btn.classList.toggle('text-gray-400', !active);
                const ring = btn.querySelector('.avatar-ring');
                if(id === 'profile' && ring) ring.classList.toggle('ring-black', active);
            });

            if (viewId === 'home') {
                if (window.switchHomeTab && !['search', 'favorites'].includes(window.currentHomeTab)) {
                    window.switchHomeTab('grid');
                } else if (window.switchHomeTab && window.currentHomeTab) {
                    window.switchHomeTab(window.currentHomeTab);
                }
            }
            else if (viewId === 'recipe') {
                if(window.renderPost) window.renderPost(dishId, flavorId);
            }
            else if (viewId === 'grocery') {
                if(window.renderGroceryList) window.renderGroceryList();
            }
            else if (viewId === 'calorie') {
                if(window.renderCalorieCalendar) window.renderCalorieCalendar(); 
            }
            else if (viewId === 'planner') {
                if(window.renderPlanner) window.renderPlanner();
            }
            
            if (viewId === 'add') {
                window.renderFlavorTags();
            }

            lucide.createIcons();
            window.scrollTo(0,0);
        };

        window.currentHomeTab = 'grid';
        window.switchHomeTab = function(tabName) {
            window.currentHomeTab = tabName;
            const tabs = ['grid', 'search', 'favorites'];
            tabs.forEach(t => {
                const btn = document.getElementById(`tab-btn-${t}`);
                const content = document.getElementById(`home-content-${t}`);
                if (!btn || !content) return;
                
                if (t === tabName) {
                    btn.classList.remove('border-transparent', 'text-gray-400');
                    btn.classList.add('border-black', 'text-gray-900');
                    content.classList.remove('hidden');
                    content.classList.add('block');
                } else {
                    btn.classList.add('border-transparent', 'text-gray-400');
                    btn.classList.remove('border-black', 'text-gray-900');
                    content.classList.add('hidden');
                    content.classList.remove('block');
                }
            });

            if (tabName === 'grid' && window.renderHome) window.renderHome();
            if (tabName === 'search' && window.performSearch) window.performSearch();
            if (tabName === 'favorites' && window.renderFavorites) window.renderFavorites();
        };

        // --- 搜尋與過濾 ---
        window.searchFilterPlanning = false;
        window.toggleSearchFilterPlanning = function() {
            window.searchFilterPlanning = !window.searchFilterPlanning;
            const btn = document.getElementById('filter-planning-btn');
            if(btn) {
                if (window.searchFilterPlanning) {
                    btn.classList.replace('bg-gray-50', 'bg-orange-500');
                    btn.classList.replace('border-gray-200', 'border-orange-500');
                    btn.classList.replace('text-gray-500', 'text-white');
                } else {
                    btn.classList.replace('bg-orange-500', 'bg-gray-50');
                    btn.classList.replace('border-orange-500', 'border-gray-200');
                    btn.classList.replace('text-white', 'text-gray-500');
                }
            }
            if (window.performSearch) window.performSearch();
        };

        window.performSearch = function() {
            const searchInput = document.getElementById('search-input');
            const keyword = searchInput ? searchInput.value.toLowerCase().trim() : '';
            const grid = document.getElementById('search-results');
            if(!grid) return;

            grid.innerHTML = '';
            
            if(!keyword && !window.searchFilterPlanning) { 
                grid.innerHTML = '<div class="col-span-3 py-20 text-center text-gray-400 text-xs">輸入搜尋關鍵字或點擊篩選</div>'; 
                return; 
            }

            let res = [];
            db.forEach(d => (d.flavors||[]).forEach(f => {
                const isPlanningActive = f.isPlanning && (!f.records || f.records.length === 0);
                
                if (window.searchFilterPlanning && !isPlanningActive) return;

                if (!keyword || d.name.toLowerCase().includes(keyword) || f.name.toLowerCase().includes(keyword)) {
                    let img = isPlanningActive ? planningBgImg : 'https://images.unsplash.com/photo-1495195134817-aeb325a55b65?auto=format&fit=crop&w=800&q=80';
                    if (f.coverImage) {
                        img = f.coverImage;
                    } else if (f.records && f.records.length > 0) {
                        img = (f.records[0].images && f.records[0].images.length > 0) ? f.records[0].images[0] : (f.records[0].image || img);
                    }
                    res.push({ dishId: d.id, flavorId: f.id, img, isPlanningActive });
                }
            }));

            if (!res.length) { 
                grid.innerHTML = '<div class="col-span-3 py-20 text-center text-gray-400 text-xs">搵唔到相關食譜 😢</div>'; 
                return; 
            }
            res.reverse().forEach(p => {
                grid.innerHTML += `<div class="grid-img-container cursor-pointer" onclick="navigate('recipe', '${p.dishId}', '${p.flavorId}')">
                    <img src="${p.img}">
                    ${p.isPlanningActive ? '<div class="absolute top-2 left-2 bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">⏳</div>' : ''}
                </div>`;
            });
        };

        const viewRecipeEl = document.getElementById('view-recipe');
        if(viewRecipeEl) {
            let touchStartX = 0;
            viewRecipeEl.addEventListener('touchstart', e => touchStartX = e.changedTouches[0].screenX);
            viewRecipeEl.addEventListener('touchend', e => {
                if (e.changedTouches[0].screenX - touchStartX > 130) window.navigate('home');
            });
        }

        // --- 4. 數據操作 ---
        window.syncToCloud = async function(data) {
            if (!currentUser) return;
            await setDoc(doc(dbFirestore, 'artifacts', appId, 'users', currentUser.uid, 'recipes', data.id), data);
        };

        window.deleteFromCloud = async function(id) {
            if (!currentUser) return;
            await deleteDoc(doc(dbFirestore, 'artifacts', appId, 'users', currentUser.uid, 'recipes', id));
        };

        window.refreshCurrentView = function() {
            const activeEl = document.querySelector('.view-section.active');
            if(!activeEl) return;
            if (activeEl.id === 'view-home') {
                if(window.renderHome) window.renderHome();
                if(window.renderGroceryList) window.renderGroceryList();
            }
            else if (activeEl.id === 'view-recipe') {
                if(window.renderPost) window.renderPost(currentDishId, currentFlavorId);
            }
            else if (activeEl.id === 'view-favorites') {
                if(window.renderFavorites) window.renderFavorites();
            }
            else if (activeEl.id === 'view-search') {
                if(window.performSearch) window.performSearch();
            }
            updateAvatarDisplays();
        };

        window.renderHome = function() {
            const grid = document.getElementById('dishes-grid');
            if(!grid) return; 
            grid.innerHTML = '';
            let posts = [];
            db.forEach(d => (d.flavors||[]).forEach(f => {
                const isPlanningActive = f.isPlanning && (!f.records || f.records.length === 0);
                let img = isPlanningActive ? planningBgImg : 'https://images.unsplash.com/photo-1495195134817-aeb325a55b65?auto=format&fit=crop&w=800&q=80';
                if (f.coverImage) {
                    img = f.coverImage;
                } else if (f.records && f.records.length > 0) {
                    img = (f.records[0].images && f.records[0].images.length > 0) ? f.records[0].images[0] : (f.records[0].image || img);
                }
                posts.push({ dishId: d.id, flavorId: f.id, img, isPlanningActive });
            }));
            
            if(document.getElementById('stat-dishes')) {
                document.getElementById('stat-dishes').innerText = db.length;
                document.getElementById('stat-flavors').innerText = posts.length;
                document.getElementById('stat-records').innerText = db.reduce((a, b) => a + (b.flavors||[]).reduce((x, y) => x + (y.records?.length || 0), 0), 0);
            }
            
            if (!posts.length) { 
                grid.innerHTML = '<div class="col-span-3 py-24 text-center text-gray-300 text-xs">尚無食譜</div>'; 
                return; 
            }
            posts.reverse().forEach(p => {
                grid.innerHTML += `
                    <div class="grid-img-container cursor-pointer" onclick="navigate('recipe', '${p.dishId}', '${p.flavorId}')">
                        <img src="${p.img}">
                        ${p.isPlanningActive ? '<div class="absolute top-2 left-2 bg-orange-500/90 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">⏳ 挑戰</div>' : ''}
                    </div>
                `;
            });
        };

        // --- 份量動態縮放器 ---
        window.scaleIngredients = function(multiplier) {
            const ingredientsEl = document.getElementById('post-ingredients-text');
            if (!ingredientsEl) return;
            
            if (!ingredientsEl.hasAttribute('data-original')) {
                ingredientsEl.setAttribute('data-original', ingredientsEl.innerText);
            }
            
            const originalText = ingredientsEl.getAttribute('data-original');
            const newText = originalText.replace(/\b(\d+(?:\.\d+)?)\b/g, (match) => {
                let num = Number(match) * multiplier;
                return Number.isInteger(num) ? num : parseFloat(num.toFixed(1));
            });
            
            ingredientsEl.innerText = newText;
            window.showToast(`已切換為 ${multiplier} 倍份量 ⚖️`);
        };

        // --- 設定代表照 ---
        window.setCoverImage = async function(imgUrl) {
            const dish = db.find(d => d.id === currentDishId);
            const flavor = dish?.flavors.find(f => f.id === currentFlavorId);
            if(!dish || !flavor) return;
            
            flavor.coverImage = imgUrl;
            await window.syncToCloud(dish);
            window.showToast("已設定為代表照 ⭐");
            window.renderPost(currentDishId, currentFlavorId);
        };

        window.renderPost = function(dishId, flavorId) {
            currentDishId = dishId; currentFlavorId = flavorId;
            const dish = db.find(d => d.id === dishId);
            const flavor = dish?.flavors.find(f => f.id === flavorId);
            if (!flavor) return;
            
            const isPlanningActive = flavor.isPlanning && (!flavor.records || flavor.records.length === 0);
            let img = isPlanningActive ? planningBgImg : 'https://images.unsplash.com/photo-1495195134817-aeb325a55b65?auto=format&fit=crop&w=800&q=80';
            
            if (flavor.coverImage) {
                img = flavor.coverImage;
            } else if (flavor.records && flavor.records.length > 0) {
                img = (flavor.records[0].images && flavor.records[0].images.length > 0) ? flavor.records[0].images[0] : (flavor.records[0].image || img);
            }
            
            const ratingTexts = { 1: "🤢 中伏", 2: "🤐 試一次", 3: "🙂 得閒整", 4: "🤤 要著兩條褲" };
            
            // 處理份量單位
            let originalNum = 1;
            let unit = '份';
            let match = (flavor.serving || '').match(/(\d+(?:\.\d+)?)\s*(.*)/);
            if (match) {
                originalNum = parseFloat(match[1]) || 1;
                unit = match[2] || '';
            } else if (flavor.serving) {
                unit = flavor.serving;
            }
            
            const postsContainer = document.getElementById('posts-container');
            if(!postsContainer) return;

            postsContainer.innerHTML = `
                <div class="bg-white border-b border-gray-50 text-left">
                    <div class="flex items-center justify-between px-4 py-3">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full border border-gray-100 overflow-hidden"><img src="${window.userAvatar}" class="w-full h-full object-cover"></div>
                            <span class="font-bold text-sm text-gray-900">cooking_papa</span>
                        </div>
                        <button onclick="openEditModal()" class="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 hover:text-blue-500 hover:bg-blue-50 transition-colors shadow-sm"><i data-lucide="edit-3" class="w-4 h-4"></i><span class="text-[11px] font-bold">編輯</span></button>
                    </div>
                    
                    <div class="relative w-full aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                        <img src="${img}" class="w-full h-full object-cover bg-gray-50">
                        ${isPlanningActive ? '<div class="absolute inset-0 bg-black/30 flex flex-col items-center justify-center"><div class="bg-white/95 backdrop-blur-md px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2"><i data-lucide="hourglass" class="w-5 h-5 text-orange-500 animate-pulse"></i><p class="text-orange-600 font-bold text-sm">食譜等待挑戰中</p></div></div>' : ''}
                    </div>
                    
                    <div class="px-4 py-3 flex justify-between">
                        <div class="flex gap-5">
                            <button onclick="toggleFavorite()"><i data-lucide="heart" class="w-7 h-7 ${flavor.isFavorite?'text-red-500 fill-red-500':'text-gray-900'}"></i></button>
                            <button onclick="shareRecipe('${dish.id}', '${flavor.id}')"><i data-lucide="send" class="w-7 h-7 text-gray-900"></i></button>
                        </div>
                        <button onclick="deleteCurrentRecipe()"><i data-lucide="trash-2" class="w-6 h-6 text-red-200 hover:text-red-400 transition-colors"></i></button>
                    </div>
                    <div class="px-5 pb-6 text-sm">
                        
                        ${isPlanningActive ? `
                        <div class="bg-gradient-to-r from-orange-50 to-orange-100/50 border border-orange-200 text-orange-700 text-[11px] p-3 rounded-xl mb-4 flex items-center justify-between shadow-sm">
                            <span class="font-bold flex items-center gap-1.5"><i data-lucide="info" class="w-4 h-4"></i> 上載相片即可解鎖成就！</span>
                        </div>
                        ` : ''}

                        <div class="flex gap-2.5 text-[10px] font-bold mb-3 uppercase items-center flex-wrap">
                            <div class="flex items-center bg-gray-100 rounded-md">
                                <button onclick="adjustServing(-1)" class="px-3 py-1.5 text-gray-400 hover:text-gray-900 transition-colors font-bold text-sm">-</button>
                                <span id="display-serving" data-original-num="${originalNum}" data-current-num="${originalNum}" data-unit="${unit}" class="text-gray-600 px-3 border-x border-gray-200 font-bold text-xs">${flavor.serving || '份量'}</span>
                                <button onclick="adjustServing(1)" class="px-3 py-1.5 text-gray-400 hover:text-gray-900 transition-colors font-bold text-sm">+</button>
                            </div>
                            
                            <span class="bg-blue-50 text-blue-600 px-2 py-1 rounded-md uppercase">${ratingTexts[flavor.rating || 4]}</span>
                            ${flavor.cooktime ? `<span class="bg-gray-100 text-gray-600 px-2 py-1 rounded-md uppercase">⏱️ ${flavor.cooktime}M</span>` : ''}
                            ${flavor.kcal ? `<span class="bg-red-50 text-red-600 px-2 py-1 rounded-md uppercase flex items-center gap-1"><i data-lucide="flame" class="w-3 h-3 text-red-500"></i> ${flavor.kcal}</span>` : ''}
                        </div>
                        <p class="leading-relaxed text-left"><span class="font-bold mr-2 text-gray-900">cooking_papa</span>【${dish.name} - ${flavor.name}】</p>
                        
                        <div class="mt-5 space-y-4 text-left">
                            <div class="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <p class="font-bold text-[10px] text-gray-400 border-b border-gray-200 pb-1.5 mb-2 uppercase text-left">🛒 材料 Ingredients</p>
                                <p id="post-ingredients-text" data-original="${flavor.ingredients}" class="whitespace-pre-line text-gray-700 leading-relaxed text-left">${flavor.ingredients}</p>
                            </div>
                            <div class="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <p class="font-bold text-[10px] text-gray-400 border-b border-gray-200 pb-1.5 mb-2 uppercase text-left">🍳 步驟 Steps</p>
                                <p class="whitespace-pre-line text-gray-700 leading-loose text-left">${flavor.steps}</p>
                            </div>
                        </div>
                    </div>
                    <div class="px-5 mt-4 pb-12 text-left">
                        <h4 class="font-bold text-sm mb-4 border-t pt-6 text-gray-400">製作記錄 相簿</h4>
                        <div class="space-y-4">
                            ${(flavor.records || []).map(r => {
                                let imgsHtml = '';
                                let imagesList = r.images || (r.image ? [r.image] : []);
                                if (imagesList.length > 0) {
                                    if (imagesList.length === 1) {
                                        const isCover = (flavor.coverImage === imagesList[0]);
                                        imgsHtml = `<div class="relative mt-3 group">
                                            <img src="${imagesList[0]}" class="w-full max-h-56 object-cover rounded-xl border border-gray-100">
                                            <button onclick="setCoverImage('${imagesList[0]}')" class="absolute top-2 left-2 p-1.5 bg-white/90 rounded-full shadow-sm backdrop-blur-sm transition-colors ${isCover ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'} z-10" title="設為代表照">
                                                <i data-lucide="star" class="w-4 h-4 ${isCover ? 'fill-yellow-500' : ''}"></i>
                                            </button>
                                        </div>`;
                                    } else {
                                        let gridCols = imagesList.length === 2 ? 'grid-cols-2' : 'grid-cols-3';
                                        imgsHtml = `<div class="grid ${gridCols} gap-1.5 mt-3">` + imagesList.map((img) => {
                                            const isCover = (flavor.coverImage === img);
                                            return `
                                            <div class="relative aspect-square group">
                                                <img src="${img}" class="w-full h-full object-cover rounded-xl border border-gray-100">
                                                <button onclick="setCoverImage('${img}')" class="absolute top-1.5 left-1.5 p-1 bg-white/90 rounded-full shadow-sm backdrop-blur-sm transition-colors ${isCover ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'} z-10" title="設為代表照">
                                                    <i data-lucide="star" class="w-3.5 h-3.5 ${isCover ? 'fill-yellow-500' : ''}"></i>
                                                </button>
                                            </div>
                                            `;
                                        }).join('') + `</div>`;
                                    }
                                }
                                return `
                                    <div class="bg-gray-50 rounded-2xl p-4 relative border text-left mb-4 shadow-sm">
                                        <div class="absolute top-3 right-3 flex gap-2 z-20">
                                            <button onclick="editRecordNote('${r.id}')" class="text-gray-400 hover:text-blue-500 transition-colors p-1 bg-white/80 rounded-full shadow-sm backdrop-blur-sm"><i data-lucide="edit-3" class="w-4 h-4"></i></button>
                                            <button onclick="deleteRecord('${r.id}')" class="text-gray-400 hover:text-red-500 transition-colors p-1 bg-white/80 rounded-full shadow-sm backdrop-blur-sm"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                                        </div>
                                        <span class="text-[10px] font-bold text-blue-500 bg-blue-100/50 px-2 py-0.5 rounded-md border border-blue-100">${r.date}</span>
                                        <p class="text-xs mt-2 text-gray-700 text-left whitespace-pre-line leading-relaxed">${r.note || ''}</p>
                                        ${imgsHtml}
                                    </div>
                                `;
                            }).join('')}
                            <div class="border-2 border-dashed ${isPlanningActive ? 'border-orange-300 bg-orange-50/30' : 'border-gray-200 bg-gray-50/50'} rounded-3xl p-6 text-center">
                                <input type="file" id="rec-img" accept="image/*" multiple class="text-xs mb-3 w-full text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:bg-blue-50 file:text-blue-600">
                                <input type="text" id="rec-note" class="w-full text-xs p-3 bg-white border border-gray-100 rounded-xl mb-3 outline-none focus:ring-1 focus:ring-blue-500" placeholder="分享今次煮成點？心得...">
                                <button onclick="saveRecord(this)" class="w-full ${isPlanningActive ? 'bg-orange-500 shadow-orange-500/20' : 'bg-blue-500 shadow-blue-500/20'} text-white font-bold py-3 rounded-xl shadow-lg active:scale-95 transition-all">
                                    ${isPlanningActive ? '上載相片完成挑戰 🎉' : '發佈新記錄'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            lucide.createIcons();
        };

        // --- 新增：記錄相片多重預覽 ---
        window.previewRecordImages = function(input) {
            const previewContainer = input.parentElement.querySelector('.record-image-preview');
            const placeholder = input.parentElement.querySelector('.upload-placeholder');
            
            if (input.files && input.files.length > 0) {
                previewContainer.innerHTML = '';
                const maxPreview = Math.min(input.files.length, 3); // 最多預覽3張
                
                for(let i=0; i<maxPreview; i++) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        previewContainer.innerHTML += `<div class="aspect-square rounded-lg overflow-hidden border border-gray-200"><img src="${e.target.result}" class="w-full h-full object-cover"></div>`;
                    }
                    reader.readAsDataURL(input.files[i]);
                }
                previewContainer.classList.remove('hidden');
                placeholder.classList.add('hidden');
            } else {
                previewContainer.innerHTML = '';
                previewContainer.classList.add('hidden');
                placeholder.classList.remove('hidden');
            }
        };

        window.renderFavorites = function() {
            const grid = document.getElementById('favorites-grid');
            if(!grid) return; 
            grid.innerHTML = '';
            let favs = [];
            db.forEach(d => (d.flavors||[]).forEach(f => {
                if (f.isFavorite) {
                    const isPlanningActive = f.isPlanning && (!f.records || f.records.length === 0);
                    let img = isPlanningActive ? planningBgImg : 'https://images.unsplash.com/photo-1495195134817-aeb325a55b65?auto=format&fit=crop&w=800&q=80';
                    if (f.coverImage) {
                        img = f.coverImage;
                    } else if (f.records && f.records.length > 0) {
                        img = (f.records[0].images && f.records[0].images.length > 0) ? f.records[0].images[0] : (f.records[0].image || img);
                    }
                    favs.push({ dishId: d.id, flavorId: f.id, img });
                }
            }));
            if (!favs.length) { grid.innerHTML = '<div class="col-span-3 py-24 text-center text-gray-300 text-xs">無收藏 ❤️</div>'; return; }
            favs.reverse().forEach(p => {
                grid.innerHTML += `<div class="grid-img-container cursor-pointer" onclick="navigate('recipe', '${p.dishId}', '${p.flavorId}')"><img src="${p.img}"><div class="absolute top-2 right-2 bg-white/90 p-1 rounded-full"><i data-lucide="heart" class="w-3 h-3 text-red-500 fill-red-500"></i></div></div>`;
            });
            lucide.createIcons();
        };

        // --- 分享功能 ---
        window.openShareModal = function() {
            const listContainer = document.getElementById('share-recipe-list');
            if(!listContainer) return;
            
            let html = '';
            let hasRecipes = false;
            
            db.forEach(d => (d.flavors||[]).forEach(f => {
                hasRecipes = true;
                html += `
                    <div class="p-3 bg-gray-50 rounded-xl border border-gray-100 flex justify-between items-center cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition" onclick="window.shareRecipe('${d.id}', '${f.id}'); window.closeShareModal();">
                        <span class="font-bold text-sm text-gray-700">${d.name} <span class="text-gray-400 text-xs">- ${f.name}</span></span>
                        <i data-lucide="share-2" class="w-5 h-5 text-blue-500"></i>
                    </div>
                `;
            }));
            
            if (!hasRecipes) html = '<p class="text-center text-gray-400 py-10 text-sm">庫內仲未有食譜可以分享！</p>';
            listContainer.innerHTML = html;
            
            const modal = document.getElementById('share-modal');
            if(modal) {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            }
            lucide.createIcons();
        };

        window.closeShareModal = function() {
            const modal = document.getElementById('share-modal');
            if(modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }
        };

        // --- 估算食譜卡路里 ---
        window.estimateRecipeKcal = async function(prefix) {
            let dishName = '';
            if (prefix === 'input') {
                const dishInput = document.getElementById('input-dish');
                dishName = dishInput ? dishInput.value.trim() : '';
            } else {
                const dish = db.find(d => d.id === currentDishId);
                dishName = dish ? dish.name : '';
            }

            const ingEl = document.getElementById(`${prefix}-ingredients`);
            const ingredients = ingEl ? ingEl.value.trim() : '';
            
            if (!ingredients) return window.customAlert("請先輸入材料，AI 先可以幫你計卡路里㗎！");

            const loading = document.getElementById('ai-loading');
            if(loading) { loading.classList.remove('hidden'); loading.classList.add('flex'); }
            const apiKey = (localStorage.getItem('geminiApiKey') || "").trim();
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

            try {
                const res = await fetch(url, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: `請估算「${dishName}」的總卡路里。材料如下：\n${ingredients}` }]}],
                        systemInstruction: { parts: [{ text: `你是一位營養師。只准輸出純 JSON：{"kcal":整數數字}` }]},
                        generationConfig: { responseMimeType: "application/json" }
                    })
                });
                if(!res.ok) throw new Error();
                const data = await res.json();
                const result = JSON.parse(data.candidates[0].content.parts[0].text);
                
                if (result.kcal) {
                    const kcalEl = document.getElementById(`${prefix}-kcal`);
                    if(kcalEl) kcalEl.value = result.kcal;
                    window.showToast(`🔥 估算約 ${result.kcal} kcal!`);
                }
            } catch(e) {
                window.customAlert("AI 估算失敗，請檢查金鑰及網絡。");
            } finally {
                if(loading) { loading.classList.add('hidden'); loading.classList.remove('flex'); }
            }
        };

        // --- 雪櫃清垃圾 (3選項多選) ---
        window.fridgeTempRecipes = [];
        window.aiFridgeSearch = async function(btnEl) {
            const parentContext = btnEl ? btnEl.closest('.view-section') : document.querySelector('.view-section.active');
            const inputEl = parentContext.querySelector('.fridge-input-text');
            const fileInput = parentContext.querySelector('.fridge-image-upload');
            
            const input = inputEl ? inputEl.value.trim() : '';
            const file = fileInput && fileInput.files ? fileInput.files[0] : null;
            
            if (!input && !file) return window.customAlert("請輸入或影低雪櫃淨低嘅食材！");
            
            const loading = document.getElementById('ai-loading');
            if(loading) { loading.classList.remove('hidden'); loading.classList.add('flex'); }
            const apiKey = (localStorage.getItem('geminiApiKey') || "").trim();
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
            
            try {
                let promptMsg = `請幫我諗 3 道唔同嘅家常菜食譜，用廣東話輸出完整資料。`;
                
                if (file && input) {
                    promptMsg = `請根據相片入面嘅食材，加上以下特別要求：「${input}」，` + promptMsg;
                } else if (file) {
                    promptMsg = `請根據相片入面嘅食材，` + promptMsg;
                } else {
                    promptMsg = `我雪櫃有以下食材或要求：${input}。` + promptMsg;
                }
                
                // 加入隨機防緩存編號，確保每次「重新製作」都會有唔同結果
                promptMsg += ` (請提供 3 個與上次唔同嘅全新建議，隨機防緩存編號: ${Math.floor(Math.random()*10000)})`;

                let parts = [{ text: promptMsg }];
                if (file) {
                    const base64 = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result);
                        reader.readAsDataURL(file);
                    });
                    parts.push({ inlineData: { data: base64.split(',')[1], mimeType: file.type } });
                }

                const res = await fetch(url, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        contents: [{ parts }],
                        systemInstruction: { parts: [{ text: `只准輸出純 JSON Array：[{"name":"食譜名","flavor":"口味特色","ingredients":"材料1\\n材料2 (必須用 \\n 分隔每項)","steps":"1. 步驟一\\n2. 步驟二 (必須用 \\n 分隔每個步驟)","tags":["標籤"], "kcal":整數數字}]` }]},
                        generationConfig: { responseMimeType: "application/json" }
                    })
                });
                const data = await res.json();
                window.fridgeTempRecipes = JSON.parse(data.candidates[0].content.parts[0].text);
                
                let html = '';
                window.fridgeTempRecipes.forEach((r, i) => {
                    html += `
                        <label class="flex items-start gap-3 p-4 bg-white rounded-2xl border border-gray-100 cursor-pointer shadow-sm hover:border-orange-300 transition">
                            <input type="checkbox" id="fridge-chk-${i}" class="fridge-checkbox mt-1 w-5 h-5 accent-orange-500 rounded text-orange-500 focus:ring-orange-500">
                            <div>
                                <p class="font-bold text-sm text-gray-800">${r.name}</p>
                                <p class="text-[11px] text-gray-500 mt-1">${r.flavor}</p>
                                <div class="flex gap-1 mt-2">
                                    ${r.kcal ? `<span class="text-[9px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded">🔥 ${r.kcal} kcal</span>` : ''}
                                    ${(r.tags||[]).slice(0,2).map(t => `<span class="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">${t}</span>`).join('')}
                                </div>
                            </div>
                        </label>
                    `;
                });
                const fridgeResults = parentContext.querySelector('.fridge-results');
                if(fridgeResults) fridgeResults.innerHTML = html;
                const container = parentContext.querySelector('.fridge-results-container');
                if(container) container.classList.remove('hidden');

                window.showToast("AI 已經為你準備好 3 個建議！🍳");
            } catch (e) { window.customAlert("AI 暫時休息中 (請檢查 Key 或 VPN)"); }
            finally { if(loading) { loading.classList.add('hidden'); loading.classList.remove('flex'); } }
        };

        window.clearFridgeResults = function(btnEl) {
            const parentContext = btnEl ? btnEl.closest('.view-section') : document.querySelector('.view-section.active');
            
            const container = parentContext.querySelector('.fridge-results-container');
            if(container) container.classList.add('hidden');
            
            const input = parentContext.querySelector('.fridge-input-text');
            if(input) input.value = '';
            
            const fileInput = parentContext.querySelector('.fridge-image-upload');
            if(fileInput) fileInput.value = '';
            
            const preview = parentContext.querySelector('.fridge-image-preview');
            if(preview) {
                preview.classList.add('hidden');
                preview.style.backgroundImage = '';
            }
            
            window.fridgeTempRecipes = [];
            window.showToast("已放棄製作並清空 🗑️");
        };

        window.saveFridgeRecipes = async function() {
            const activeView = document.querySelector('.view-section.active');
            let added = 0;
            for (let i = 0; i < window.fridgeTempRecipes.length; i++) {
                const chk = activeView.querySelector(`#fridge-chk-${i}`);
                if (chk && chk.checked) {
                    const r = window.fridgeTempRecipes[i];
                    let dish = db.find(d => d.name === r.name);
                    const newF = { 
                        id: 'f'+Date.now()+i, name: r.flavor, ingredients: r.ingredients, steps: r.steps, 
                        tags: r.tags||[], kcal: r.kcal||'', isPlanning: true, isFavorite: false, records: [] 
                    };
                    if (dish) { dish.flavors.push(newF); await window.syncToCloud(dish); }
                    else { await window.syncToCloud({ id: 'd'+Date.now()+i, name: r.name, flavors: [newF] }); }
                    added++;
                }
            }
            if (added > 0) {
                window.showToast(`已加入 ${added} 個食譜至準備挑戰！⏳`);
                window.clearFridgeResults(activeView.querySelector('.fridge-results-container'));
                window.navigate('home');
            } else {
                window.customAlert('請最少剔選一個食譜！');
            }
        };

        // --- 購物清單 (雙模式) ---
        window.currentGroceryMode = 'recipe';
        window.renderGroceryList = function(mode = window.currentGroceryMode) {
            window.currentGroceryMode = mode;
            
            // 同時更新兩個視圖中的清單以保持一致性
            const containers = document.querySelectorAll('#grocery-list-container');
            
            document.querySelectorAll('#grocery-tab-recipe').forEach(btn => {
                btn.className = mode === 'recipe' ? 'flex-1 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold transition' : 'flex-1 py-2 bg-gray-50 text-gray-600 rounded-xl text-xs font-bold transition';
            });
            document.querySelectorAll('#grocery-tab-flat').forEach(btn => {
                btn.className = mode === 'flat' ? 'flex-1 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold transition' : 'flex-1 py-2 bg-gray-50 text-gray-600 rounded-xl text-xs font-bold transition';
            });

            let html = '';
            let hasItems = false;
            let flatItems = [];

            db.forEach(d => (d.flavors||[]).forEach(f => {
                if (f.isPlanning && (!f.records || f.records.length === 0) && f.ingredients) {
                    let sectionHasItems = false;
                    let sectionHtml = `
                        <div class="mb-5 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                            <h4 class="font-bold text-sm text-gray-800 mb-3 border-b border-gray-100 pb-2 flex items-center gap-2"><i data-lucide="utensils" class="w-4 h-4 text-orange-400"></i> ${d.name} - ${f.name}</h4>
                            <div class="space-y-2">
                    `;
                    
                    f.ingredients.split(/[\n、,，]+/).map(i => i.trim()).filter(i => i).forEach((item, idx) => {
                        const key = `${f.id}-${idx}`;
                        if (groceryDeleted[key]) return; 
                        
                        hasItems = true;
                        sectionHasItems = true;
                        
                        if (mode === 'recipe') {
                            const isChecked = groceryChecked[key] ? 'checked' : '';
                            const textClass = groceryChecked[key] ? 'line-through text-gray-300' : 'text-gray-700';
                            sectionHtml += `
                                <div class="flex items-center justify-between transition-all hover:bg-gray-50 rounded-lg pr-2">
                                    <label class="flex items-start gap-3 cursor-pointer p-1 flex-1">
                                        <input type="checkbox" onchange="window.toggleGrocery('${key}')" ${isChecked} class="mt-0.5 w-5 h-5 text-orange-500 rounded border-gray-300 accent-orange-500 flex-shrink-0">
                                        <span class="text-sm font-medium transition-colors ${textClass}" id="g-text-${key}">${item}</span>
                                    </label>
                                    <button onclick="window.deleteGrocery('${key}')" class="text-gray-300 hover:text-red-500 transition-colors p-2"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                                </div>
                            `;
                        } else {
                            flatItems.push({ recipeName: `${d.name} - ${f.name}`, item, key, isCustom: false });
                        }
                    });
                    sectionHtml += `</div></div>`;
                    
                    if (mode === 'recipe' && sectionHasItems) {
                        html += sectionHtml;
                    }
                }
            }));
            
            if (customGroceryDb && customGroceryDb.length > 0) {
                hasItems = true;
                if (mode === 'recipe') {
                    html += `
                        <div class="mb-5 bg-white p-4 rounded-2xl shadow-sm border border-orange-100">
                            <h4 class="font-bold text-sm text-gray-800 mb-3 border-b border-gray-100 pb-2 flex items-center gap-2"><i data-lucide="edit-3" class="w-4 h-4 text-orange-400"></i> 自訂購買項目</h4>
                            <div class="space-y-2">
                    `;
                    customGroceryDb.forEach(cItem => {
                        const key = cItem.id;
                        const isChecked = groceryChecked[key] ? 'checked' : '';
                        const textClass = groceryChecked[key] ? 'line-through text-gray-300' : 'text-gray-700';
                        html += `
                            <div class="flex items-center justify-between transition-all hover:bg-gray-50 rounded-lg pr-2">
                                <label class="flex items-start gap-3 cursor-pointer p-1 flex-1">
                                    <input type="checkbox" onchange="window.toggleGrocery('${key}')" ${isChecked} class="mt-0.5 w-5 h-5 text-orange-500 rounded border-gray-300 accent-orange-500 flex-shrink-0">
                                    <span class="text-sm font-medium transition-colors ${textClass}" id="g-text-${key}">${cItem.text}</span>
                                </label>
                                <button onclick="window.deleteCustomGrocery('${key}')" class="text-gray-300 hover:text-red-500 transition-colors p-2"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                            </div>
                        `;
                    });
                    html += `</div></div>`;
                } else {
                    customGroceryDb.forEach(cItem => {
                        flatItems.push({ recipeName: '自訂項目', item: cItem.text, key: cItem.id, isCustom: true });
                    });
                }
            }
            
            if (!hasItems) {
                containers.forEach(c => c.innerHTML = '<p class="text-center text-gray-400 py-10 text-sm">目前無待買項目，清單空空如也！</p>');
                return;
            }

            if (mode === 'flat') {
                const currentKeys = flatItems.map(i => i.key);
                currentKeys.forEach(k => {
                    if (!groceryOrder.includes(k)) groceryOrder.push(k);
                });
                groceryOrder = groceryOrder.filter(k => currentKeys.includes(k));
                localStorage.setItem('groceryOrder', JSON.stringify(groceryOrder));

                flatItems.sort((a, b) => groceryOrder.indexOf(a.key) - groceryOrder.indexOf(b.key));

                html += `<div class="grocery-sortable-list space-y-2 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">`;
                flatItems.forEach(i => {
                    const isChecked = groceryChecked[i.key] ? 'checked' : '';
                    const textClass = groceryChecked[i.key] ? 'line-through text-gray-300' : 'text-gray-700';
                    const deleteFn = i.isCustom ? `window.deleteCustomGrocery('${i.key}')` : `window.deleteGrocery('${i.key}')`;
                    html += `
                        <div class="grocery-item flex items-center justify-between border-b border-gray-50 last:border-0 transition hover:bg-gray-50 rounded-xl pr-2 bg-white" data-key="${i.key}">
                            <div class="grocery-handle p-2 cursor-grab text-gray-300 hover:text-orange-500 active:cursor-grabbing touch-none flex items-center justify-center">
                                <i data-lucide="grip-vertical" class="w-5 h-5"></i>
                            </div>
                            <label class="flex items-start gap-3 cursor-pointer p-2 flex-1">
                                <input type="checkbox" onchange="window.toggleGrocery('${i.key}')" ${isChecked} class="mt-0.5 w-5 h-5 text-orange-500 rounded border-gray-300 accent-orange-500 flex-shrink-0">
                                <div class="flex-1">
                                    <span class="${textClass} block text-sm font-medium transition-colors" id="g-text-${i.key}">${i.item}</span>
                                    <span class="text-[9px] text-gray-400 block mt-0.5">${i.recipeName}</span>
                                </div>
                            </label>
                            <button onclick="${deleteFn}" class="text-gray-300 hover:text-red-500 transition-colors p-2"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                        </div>
                    `;
                });
                html += `</div>`;
            }
            
            containers.forEach(c => {
                c.innerHTML = html;
                lucide.createIcons();
            });

            if (mode === 'flat') {
                document.querySelectorAll('.grocery-sortable-list').forEach(el => {
                    new Sortable(el, {
                        handle: '.grocery-handle',
                        animation: 150,
                        ghostClass: 'bg-orange-50',
                        onEnd: function () {
                            const newOrder = [];
                            el.querySelectorAll('.grocery-item').forEach(child => {
                                newOrder.push(child.dataset.key);
                            });
                            groceryOrder = newOrder;
                            localStorage.setItem('groceryOrder', JSON.stringify(groceryOrder));
                        }
                    });
                });
            }
        };

        window.toggleGrocery = function(key) {
            groceryChecked[key] = !groceryChecked[key];
            localStorage.setItem('groceryChecked', JSON.stringify(groceryChecked));
            const textEls = document.querySelectorAll(`#g-text-${key}`);
            textEls.forEach(textEl => {
                if(groceryChecked[key]) textEl.className = 'block text-sm font-medium transition-colors line-through text-gray-300';
                else textEl.className = 'block text-sm font-medium transition-colors text-gray-700';
            });
        };

        window.deleteGrocery = function(key) {
            groceryDeleted[key] = true;
            localStorage.setItem('groceryDeleted', JSON.stringify(groceryDeleted));
            window.renderGroceryList();
        };

        window.addCustomGrocery = async function() {
            const activeView = document.querySelector('.view-section.active');
            const input = activeView ? activeView.querySelector('#grocery-manual-input') : document.getElementById('grocery-manual-input');
            const text = input ? input.value.trim() : '';
            if(!text) return;
            if (!currentUser) return window.customAlert("請先登入以儲存自訂項目");

            const newItem = { id: 'cg_' + Date.now(), text: text };
            customGroceryDb.push(newItem);

            await setDoc(doc(dbFirestore, 'artifacts', appId, 'users', currentUser.uid, 'settings', 'grocery'), { items: customGroceryDb });
            if(input) input.value = '';
            window.showToast("已加入購物清單 🛒");
        };

        window.deleteCustomGrocery = async function(id) {
            if (!currentUser) return;
            customGroceryDb = customGroceryDb.filter(item => item.id !== id);
            await setDoc(doc(dbFirestore, 'artifacts', appId, 'users', currentUser.uid, 'settings', 'grocery'), { items: customGroceryDb });
            window.showToast("已刪除項目 🗑️");
        };

        // --- 卡路里日曆 ---
        window.calDate = new Date();
        window.calSelectedDate = new Date().toISOString().split('T')[0];

        window.changeCalMonth = function(offset) {
            window.calDate.setMonth(window.calDate.getMonth() + offset);
            window.renderCalorieCalendar();
        };

        window.saveCalLimit = function() {
            const els = document.querySelectorAll('#cal-limit-input');
            if(els.length > 0) {
                localStorage.setItem('calorieLimit', els[0].value);
                window.renderCalorieCalendar();
                window.showToast("已更新每日上限");
            }
        };

        window.openCalorieRefModal = function() {
            const m = document.getElementById('calorie-ref-modal');
            if(m) { m.classList.remove('hidden'); m.classList.add('flex'); }
        };

        window.closeCalorieRefModal = function() {
            const m = document.getElementById('calorie-ref-modal');
            if(m) { m.classList.add('hidden'); m.classList.remove('flex'); }
        };

        window.renderCalorieCalendar = function() {
            const year = window.calDate.getFullYear();
            const month = window.calDate.getMonth();
            
            document.querySelectorAll('#cal-month-display').forEach(el => el.innerText = `${year}年${month + 1}月`);
            document.querySelectorAll('#cal-limit-input').forEach(el => el.value = localStorage.getItem('calorieLimit') || '2000');

            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            let dailySums = {};
            calorieDb.forEach(item => {
                let d = item.dateStr || new Date(item.timestamp || Date.now()).toISOString().split('T')[0];
                dailySums[d] = (dailySums[d] || 0) + (item.kcal || 0);
            });

            const limit = parseInt(localStorage.getItem('calorieLimit') || '2000');

            let gridHtml = '';
            for(let i=0; i<firstDay; i++) gridHtml += `<div></div>`;

            for(let d=1; d<=daysInMonth; d++) {
                let dateStr = `${year}-${String(month+1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                let sum = dailySums[dateStr] || 0;
                let isSelected = (dateStr === window.calSelectedDate);

                let bgClass = isSelected ? 'ring-2 ring-blue-500 shadow-md' : 'border border-transparent';
                let colorClass = 'bg-gray-50 text-gray-500 hover:bg-gray-100';

                if(sum > 0) {
                    if(sum > limit) colorClass = 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100';
                    else colorClass = 'bg-green-50 text-green-600 border border-green-100 hover:bg-green-100';
                }

                gridHtml += `
                    <div onclick="window.selectCalDate('${dateStr}')" class="aspect-square flex flex-col items-center justify-center rounded-xl cursor-pointer transition-all ${colorClass} ${bgClass}">
                        <span class="text-[12px] font-bold">${d}</span>
                        ${sum > 0 ? `<span class="text-[8px] font-bold tracking-tighter mt-0.5">${sum}</span>` : ''}
                    </div>
                `;
            }
            
            document.querySelectorAll('#cal-grid').forEach(el => el.innerHTML = gridHtml);
            
            const selectedText = window.calSelectedDate === new Date().toISOString().split('T')[0] ? '今日' : window.calSelectedDate;
            document.querySelectorAll('#cal-selected-date-text').forEach(el => el.innerText = selectedText);
            document.querySelectorAll('#calorie-date').forEach(el => el.value = window.calSelectedDate);
            
            if(window.renderCalorieHistory) window.renderCalorieHistory();
        };

        window.selectCalDate = function(dateStr) {
            window.calSelectedDate = dateStr;
            window.renderCalorieCalendar();
        };

        window.previewCalorieImage = function(input) {
            if (input.files && input.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const preview = document.getElementById('calorie-image-preview');
                    if(preview) {
                        preview.style.backgroundImage = `url(${e.target.result})`;
                        preview.classList.remove('hidden');
                        input.nextElementSibling.nextElementSibling.classList.add('hidden');
                        input.nextElementSibling.nextElementSibling.nextElementSibling.classList.add('hidden');
                    }
                }
                reader.readAsDataURL(input.files[0]);
            }
        };

        window.aiCalculateCalorie = async function() {
            const activeView = document.querySelector('.view-section.active');
            const textEl = activeView.querySelector('#calorie-text');
            const weightEl = activeView.querySelector('#calorie-weight');
            const fileEl = activeView.querySelector('#calorie-image');
            
            const textInput = textEl ? textEl.value.trim() : '';
            const weightInput = weightEl ? weightEl.value.trim() : '';
            const fileInput = fileEl ? fileEl.files[0] : null;
            const dateInput = window.calSelectedDate;
            
            if (!textInput && !fileInput) return window.customAlert("請輸入食物名稱或上載相片！");
            
            const loading = document.getElementById('ai-loading');
            if(loading) { loading.classList.remove('hidden'); loading.classList.add('flex'); }
            const apiKey = (localStorage.getItem('geminiApiKey') || "").trim();
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
            
            try {
                let promptMsg = `估算食物卡路里。文字提示：${textInput}。`;
                if (weightInput) promptMsg += `實際份量為：${weightInput}克(g)。`;
                promptMsg += `請以 JSON 輸出。`;
                
                let parts = [{ text: promptMsg }];
                if (fileInput) {
                    const base64 = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result);
                        reader.readAsDataURL(fileInput);
                    });
                    parts.push({ inlineData: { data: base64.split(',')[1], mimeType: fileInput.type } });
                }
                
                const res = await fetch(url, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        contents: [{ parts }],
                        systemInstruction: { parts: [{ text: `你是一位營養師。只准輸出純 JSON：{"name":"食物名","kcal":350,"desc":"簡短說明"}` }]},
                        generationConfig: { responseMimeType: "application/json" }
                    })
                });
                
                if (!res.ok) throw new Error(await res.text());
                const data = await res.json();
                const result = JSON.parse(data.candidates[0].content.parts[0].text);
                
                if (currentUser) {
                    const docRef = doc(collection(dbFirestore, 'artifacts', appId, 'users', currentUser.uid, 'calories'));
                    await setDoc(docRef, { name: result.name, kcal: result.kcal, desc: result.desc, dateStr: dateInput, timestamp: Date.now() });
                }
                window.showToast(`🔥 ${result.name}: 約 ${result.kcal} kcal!`);
                
                if(textEl) textEl.value = '';
                if(weightEl) weightEl.value = '';
                if(fileEl) fileEl.value = '';
                const preview = activeView.querySelector('#calorie-image-preview');
                if(preview) {
                    preview.classList.add('hidden');
                    preview.nextElementSibling.classList.remove('hidden');
                    preview.nextElementSibling.nextElementSibling.classList.remove('hidden');
                }
            } catch (e) {
                window.customAlert("AI 估算失敗，請確保金鑰有效及網絡正常。");
            } finally {
                if(loading) { loading.classList.add('hidden'); loading.classList.remove('flex'); }
            }
        };

        window.renderCalorieHistory = function() {
            const containers = document.querySelectorAll('#calorie-history-container');
            if (containers.length === 0) return;
            
            const dayItems = calorieDb.filter(item => {
                let d = item.dateStr || new Date(item.timestamp || Date.now()).toISOString().split('T')[0];
                return d === window.calSelectedDate;
            });
            
            let total = 0;
            dayItems.forEach(i => total += (i.kcal || 0));
            document.querySelectorAll('#cal-daily-total').forEach(el => el.innerText = `${total} kcal`);
            
            if (dayItems.length === 0) {
                containers.forEach(c => c.innerHTML = '<p class="text-xs text-gray-400 text-center py-6 border-2 border-dashed border-gray-100 rounded-2xl">呢日暫時無飲食記錄</p>');
                return;
            }
            
            let html = '';
            dayItems.sort((a,b) => b.timestamp - a.timestamp).forEach(item => {
                html += `
                    <div class="bg-white p-4 rounded-2xl border border-gray-100 flex justify-between items-center shadow-sm hover:border-red-100 transition">
                        <div class="flex-1 pr-2 text-left">
                            <p class="font-bold text-sm text-gray-800">${item.name}</p>
                            <p class="text-[10px] text-gray-400 mt-1">${item.desc || ''}</p>
                        </div>
                        <div class="flex items-center gap-3">
                            <span class="text-red-500 font-bold text-base bg-red-50 px-2 py-1 rounded-lg">🔥 ${item.kcal}</span>
                            <button onclick="window.openEditCalorieModal('${item.id}')" class="text-gray-300 hover:text-blue-500 transition p-1"><i data-lucide="edit-3" class="w-4 h-4"></i></button>
                            <button onclick="window.deleteCalorie('${item.id}')" class="text-gray-300 hover:text-red-500 transition p-1"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                        </div>
                    </div>
                `;
            });
            containers.forEach(c => {
                c.innerHTML = html;
                lucide.createIcons();
            });
        };

        window.openEditCalorieModal = function(id) {
            const item = calorieDb.find(i => i.id === id);
            if (!item) return;
            const idEl = document.getElementById('edit-cal-id');
            const nameEl = document.getElementById('edit-cal-name');
            const kcalEl = document.getElementById('edit-cal-kcal');
            if (idEl) idEl.value = item.id;
            if (nameEl) nameEl.value = item.name;
            if (kcalEl) kcalEl.value = item.kcal;
            
            const modal = document.getElementById('calorie-edit-modal');
            if (modal) {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            }
        };

        window.closeEditCalorieModal = function() {
            const modal = document.getElementById('calorie-edit-modal');
            if(modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }
        };

        window.saveCalorieEdit = async function() {
            const id = document.getElementById('edit-cal-id').value;
            const name = document.getElementById('edit-cal-name').value.trim();
            const kcal = parseInt(document.getElementById('edit-cal-kcal').value);
            
            if(!name || isNaN(kcal)) return window.customAlert("請輸入有效名稱及卡路里！");
            
            const item = calorieDb.find(i => i.id === id);
            if(item && currentUser) {
                item.name = name;
                item.kcal = kcal;
                const docRef = doc(dbFirestore, 'artifacts', appId, 'users', currentUser.uid, 'calories', id);
                await setDoc(docRef, item);
                window.closeEditCalorieModal();
                window.showToast("記錄已更新 ✅");
            }
        };

        window.deleteCalorie = async function(id) {
            if (!currentUser) return;
            await deleteDoc(doc(dbFirestore, 'artifacts', appId, 'users', currentUser.uid, 'calories', id));
            window.showToast("記錄已刪除");
        };

        // --- 每週餐單 (Meal Planner Calendar Version) ---
        window.plannerCalDate = new Date();
        window.plannerSelectedDate = new Date().toISOString().split('T')[0];

        window.changePlannerMonth = function(offset) {
            window.plannerCalDate.setMonth(window.plannerCalDate.getMonth() + offset);
            window.renderPlanner();
        };

        window.selectPlannerDate = function(dateStr) {
            window.plannerSelectedDate = dateStr;
            window.renderPlanner();
        };

        window.renderPlanner = function() {
            const containers = document.querySelectorAll('#planner-grid');
            if(containers.length === 0) return;
            
            const year = window.plannerCalDate.getFullYear();
            const month = window.plannerCalDate.getMonth();
            document.querySelectorAll('#planner-month-display').forEach(el => el.innerText = `${year}年${month + 1}月`);
            
            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            let gridHtml = '';
            for(let i=0; i<firstDay; i++) gridHtml += `<div></div>`;

            for(let d=1; d<=daysInMonth; d++) {
                let dateStr = `${year}-${String(month+1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                
                let plans = plannerDb[dateStr];
                let hasPlan = plans && Array.isArray(plans) && plans.length > 0;
                let isSelected = (dateStr === window.plannerSelectedDate);

                let bgClass = isSelected ? 'ring-2 ring-purple-500 shadow-md bg-purple-50 text-purple-700' : 'border border-transparent bg-gray-50 text-gray-500 hover:bg-gray-100';

                gridHtml += `
                    <div onclick="window.selectPlannerDate('${dateStr}')" class="aspect-square flex flex-col items-center justify-center rounded-xl cursor-pointer transition-all ${bgClass} relative">
                        <span class="text-[12px] font-bold">${d}</span>
                        ${hasPlan ? `<div class="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-purple-500"></div>` : ''}
                    </div>
                `;
            }
            containers.forEach(c => c.innerHTML = gridHtml);

            const selectedText = window.plannerSelectedDate === new Date().toISOString().split('T')[0] ? '今日' : window.plannerSelectedDate;
            document.querySelectorAll('#planner-selected-date-text').forEach(el => el.innerText = selectedText);

            let dailyHtml = '';
            let currentPlans = plannerDb[window.plannerSelectedDate];
            if (!Array.isArray(currentPlans)) {
                currentPlans = currentPlans ? [currentPlans] : [];
            }

            if (currentPlans.length > 0) {
                currentPlans.forEach((plan, idx) => {
                    if (plan.isManual) {
                        dailyHtml += `
                            <div class="bg-white p-4 rounded-2xl shadow-sm border border-purple-200 flex items-center justify-between">
                                <div class="flex-1 text-left">
                                    <p class="font-bold text-sm text-gray-800">${plan.text}</p>
                                    <p class="text-[9px] text-gray-400 mt-0.5">✍️ 自訂項目</p>
                                </div>
                                <button onclick="window.clearPlannerRecipe('${window.plannerSelectedDate}', ${idx})" class="p-2 text-gray-300 hover:text-red-400 transition"><i data-lucide="x-circle" class="w-5 h-5"></i></button>
                            </div>
                        `;
                    } else if (plan.dishId) {
                        const d = db.find(x => x.id === plan.dishId);
                        const f = d?.flavors.find(y => y.id === plan.flavorId);
                        if (d && f) {
                            dailyHtml += `
                                <div class="bg-white p-4 rounded-2xl shadow-sm border border-purple-200 flex items-center justify-between">
                                    <div class="flex-1 text-left cursor-pointer" onclick="navigate('recipe', '${d.id}', '${f.id}')">
                                        <p class="font-bold text-sm text-gray-800">${d.name} - ${f.name}</p>
                                        <p class="text-[9px] text-gray-400 mt-0.5">📖 食譜庫</p>
                                    </div>
                                    <button onclick="window.clearPlannerRecipe('${window.plannerSelectedDate}', ${idx})" class="p-2 text-gray-300 hover:text-red-400 transition"><i data-lucide="x-circle" class="w-5 h-5"></i></button>
                                </div>
                            `;
                        } else {
                            dailyHtml += `
                                <div class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between opacity-50">
                                    <div class="flex-1 text-left">
                                        <p class="font-bold text-sm text-gray-500 line-through">食譜已刪除</p>
                                    </div>
                                    <button onclick="window.clearPlannerRecipe('${window.plannerSelectedDate}', ${idx})" class="p-2 text-gray-300 hover:text-red-400 transition"><i data-lucide="x-circle" class="w-5 h-5"></i></button>
                                </div>
                            `;
                        }
                    }
                });
            }
            
            dailyHtml += `
                <div class="bg-gray-50/50 p-4 rounded-2xl border border-dashed border-gray-200 flex items-center justify-between cursor-pointer hover:bg-purple-50 hover:border-purple-200 transition" onclick="window.openPlannerModal()">
                    <div class="flex-1 text-left">
                        <p class="font-bold text-sm text-gray-400">+ 加入餐單</p>
                    </div>
                    <i data-lucide="plus" class="w-5 h-5 text-gray-300"></i>
                </div>
            `;
            
            document.querySelectorAll('#planner-daily-container').forEach(c => {
                c.innerHTML = dailyHtml;
                lucide.createIcons();
            });
        };

        window.openPlannerModal = function() {
            const manualInput = document.getElementById('planner-manual-input');
            if(manualInput) manualInput.value = '';
            
            const listContainer = document.getElementById('planner-recipe-list');
            if(!listContainer) return;
            
            let html = '';
            let hasRecipes = false;
            
            db.forEach(d => (d.flavors||[]).forEach(f => {
                hasRecipes = true;
                html += `
                    <div class="p-3 bg-gray-50 rounded-xl border border-gray-100 flex justify-between items-center cursor-pointer hover:bg-purple-50 hover:border-purple-200 transition" onclick="window.selectPlannerRecipe('${d.id}', '${f.id}')">
                        <span class="font-bold text-sm text-gray-700">${d.name} <span class="text-gray-400 text-xs">- ${f.name}</span></span>
                        <i data-lucide="plus-circle" class="w-5 h-5 text-purple-500"></i>
                    </div>
                `;
            }));
            
            if (!hasRecipes) html = '<p class="text-center text-gray-400 py-10 text-sm">庫內仲未有食譜，可以上面手寫加入先！</p>';
            listContainer.innerHTML = html;
            
            const modal = document.getElementById('planner-modal');
            if(modal) {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            }
            lucide.createIcons();
        };

        window.closePlannerModal = function() {
            const modal = document.getElementById('planner-modal');
            if(modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }
        };

        window.addManualPlanner = async function() {
            const input = document.getElementById('planner-manual-input');
            const text = input ? input.value.trim() : '';
            if(!text) return window.customAlert("請輸入菜式或餐廳名稱！");
            if (!currentUser) return;
            
            if (!Array.isArray(plannerDb[window.plannerSelectedDate])) plannerDb[window.plannerSelectedDate] = [];
            plannerDb[window.plannerSelectedDate].push({ isManual: true, text: text });
            
            await setDoc(doc(dbFirestore, 'artifacts', appId, 'users', currentUser.uid, 'settings', 'planner'), plannerDb);
            window.closePlannerModal();
            window.showToast("已自訂餐單項目 ✍️");
        };

        window.selectPlannerRecipe = async function(dishId, flavorId) {
            if (!currentUser) return;
            
            if (!Array.isArray(plannerDb[window.plannerSelectedDate])) plannerDb[window.plannerSelectedDate] = [];
            plannerDb[window.plannerSelectedDate].push({ dishId, flavorId });
            
            await setDoc(doc(dbFirestore, 'artifacts', appId, 'users', currentUser.uid, 'settings', 'planner'), plannerDb);
            window.closePlannerModal();
            window.showToast("已從庫內加入餐單 🗓️");
        };

        window.clearPlannerRecipe = async function(dateStr, idx) {
            if (!currentUser) return;
            
            if (Array.isArray(plannerDb[dateStr])) {
                plannerDb[dateStr].splice(idx, 1);
                if (plannerDb[dateStr].length === 0) delete plannerDb[dateStr];
            }
            
            await setDoc(doc(dbFirestore, 'artifacts', appId, 'users', currentUser.uid, 'settings', 'planner'), plannerDb);
        };

        // --- 其他工具與食譜操作 ---
        window.setRating = function(id, val) {
            const el = document.getElementById(id);
            if(el) el.value = val;
            for(let i=1; i<=4; i++) {
                const b = document.getElementById(`btn-rating-${id}-${i}`);
                if (!b) continue;
                b.className = (i == val) ? "py-3 rounded-xl border-blue-500 bg-blue-500 text-white font-bold transition shadow-lg" : "py-3 rounded-xl border border-gray-100 bg-white text-gray-400 font-bold transition hover:bg-gray-50";
            }
        };

        window.appendFlavor = function(id, txt) {
            const el = document.getElementById(id);
            if (!el) return;
            let vals = el.value.split(',').map(s => s.trim()).filter(s => s);
            if (!vals.includes(txt)) { vals.push(txt); el.value = vals.join(', '); }
        };

        window.generateAI = async function() {
            const nameEl = document.getElementById('input-dish');
            if(!nameEl) return;
            const name = nameEl.value.trim();
            const style = document.getElementById('input-flavor') ? document.getElementById('input-flavor').value.trim() : '';
            const serving = document.getElementById('input-serving') ? document.getElementById('input-serving').value.trim() : '';
            
            if (!name) return window.customAlert("請先輸入菜名！");
            
            const loading = document.getElementById('ai-loading');
            if(loading) { loading.classList.remove('hidden'); loading.classList.add('flex'); }
            
            const apiKey = (localStorage.getItem('geminiApiKey') || "").trim();
            
            // 防呆：錯誤使用 Firebase 金鑰
            if (apiKey === firebaseConfig.apiKey) {
                if(loading) { loading.classList.add('hidden'); loading.classList.remove('flex'); }
                return window.customAlert("⚠️ 錯誤：你輸入咗 Firebase 嘅金鑰！\n\nFirebase 同 Gemini AI 係兩套獨立系統，請前往 Google AI Studio 申請一條全新嘅 Gemini API 金鑰。");
            }
            
            // 自動切換模型
            const modelName = apiKey ? "gemini-1.5-flash" : "gemini-2.5-flash-preview-09-2025";
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
            
            try {
                let promptTxt = `請用廣東話提供「${name}」詳細食譜。`;
                if (style) promptTxt += `風格：${style}。`;
                if (serving) promptTxt += `份量要求：${serving}。`;

                // 實現重試機制
                let res;
                for(let i=0; i<3; i++) {
                    res = await fetch(url, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: promptTxt }]}],
                            systemInstruction: { parts: [{ text: `只准輸出純 JSON，格式：{"flavor":"風格名","ingredients":"材料1\\n材料2 (必須用 \\n 分隔每項)","steps":"1. 步驟一\\n2. 步驟二 (必須用 \\n 分隔每個步驟)","tags":["標籤"],"kcal":350}` }]},
                            generationConfig: { responseMimeType: "application/json" }
                        })
                    });
                    if (res.ok) break;
                    if (i === 2) throw new Error(await res.text());
                    await new Promise(r => setTimeout(r, 1000 * (i+1)));
                }

                const data = await res.json();
                const recipe = JSON.parse(data.candidates[0].content.parts[0].text);
                
                const fEl = document.getElementById('input-flavor'); if(fEl) fEl.value = recipe.flavor || style;
                const iEl = document.getElementById('input-ingredients'); if(iEl) iEl.value = recipe.ingredients || '';
                const sEl = document.getElementById('input-steps'); if(sEl) sEl.value = recipe.steps || '';
                const tEl = document.getElementById('input-tags'); if(tEl) tEl.value = (recipe.tags||[]).join(', ');
                const kEl = document.getElementById('input-kcal'); if(kEl && recipe.kcal) kEl.value = recipe.kcal;
                
                window.showToast("AI 已構思完畢！✨");
            } catch (e) { 
                let friendlyMsg = "未能連接 AI 大廚！";
                if(e.message && (e.message.includes("leaked") || e.message.includes("API key not valid"))) {
                    friendlyMsg += "\n你輸入嘅 API 金鑰無效，或者已被 Google 停用。";
                } else if(e.message && e.message.includes("location is not supported")) {
                    friendlyMsg += "\n請確保你已開啟 VPN，並設定為全局模式 (Global)。";
                } else if(!apiKey) {
                    friendlyMsg += "\n由於公用配額已滿，請去「設定」輸入你自己嘅 API 金鑰。";
                }
                window.customAlert(friendlyMsg); 
            }
            finally { if(loading) { loading.classList.add('hidden'); loading.classList.remove('flex'); } }
        };

        window.shareRecipe = async function(dishId, flavorId) {
            const dish = db.find(d => d.id === dishId);
            const flavor = dish?.flavors.find(f => f.id === flavorId);
            if(!dish || !flavor) return;
            const text = `👨🏻‍🍳 Cooking PAPA\n\n【${dish.name} - ${flavor.name}】\n🛒 材料：\n${flavor.ingredients}\n\n🍳 步驟：\n${flavor.steps}`;
            try {
                await navigator.clipboard.writeText(text);
                window.showToast("食譜已複製 ✅");
            } catch (e) { window.showToast("複製失敗"); }
        };

        window.saveRecord = async function(btnEl) {
            const parentContext = btnEl ? btnEl.closest('.bg-gray-50') || document : document;
            const fileInput = parentContext.querySelector('#rec-img');
            const noteInput = parentContext.querySelector('#rec-note');
            
            const files = fileInput && fileInput.files ? Array.from(fileInput.files) : [];
            const note = noteInput ? noteInput.value : '';
            
            const dish = db.find(d => d.id === currentDishId);
            const flavor = dish?.flavors.find(f => f.id === currentFlavorId);
            if(!dish || !flavor) return;
            
            flavor.records = flavor.records || [];
            let challengeCompleted = false;
            if(flavor.isPlanning) { flavor.isPlanning = false; challengeCompleted = true; }
            
            if (files.length > 0) {
                let processed = 0;
                let imagesArray = [];
                for (let i = 0; i < files.length; i++) {
                    window.resizeImage(files[i], (imgData) => {
                        imagesArray.push(imgData);
                        processed++;
                        if (processed === files.length) {
                            flavor.records.push({ id: 'r'+Date.now(), date: new Date().toLocaleDateString(), images: imagesArray, note: note });
                            finishSave();
                        }
                    });
                }
            } else {
                flavor.records.push({ id: 'r'+Date.now(), date: new Date().toLocaleDateString(), images: null, note: note });
                finishSave();
            }

            async function finishSave() {
                await window.syncToCloud(dish);
                if(noteInput) noteInput.value = '';
                if(fileInput) fileInput.value = '';
                
                if (challengeCompleted) window.showToast("🎉 挑戰完成！記錄已上傳");
                else window.showToast("記錄已上傳 📸");
                window.renderPost(currentDishId, currentFlavorId);
            }
        };

        window.editRecordNote = function(id) {
            const dish = db.find(d => d.id === currentDishId);
            const flavor = dish?.flavors.find(f => f.id === currentFlavorId);
            if(!flavor) return;
            const record = flavor.records.find(r => r.id === id);
            if(!record) return;

            window.customPrompt("修改記錄心得：", "輸入心得...", async (newNote) => {
                if (newNote !== null) {
                    record.note = newNote;
                    await window.syncToCloud(dish);
                    window.renderPost(currentDishId, currentFlavorId);
                    window.showToast("記錄心得已更新 ✅");
                }
            }, record.note);
        };

        window.deleteRecord = async function(id) {
            window.customConfirm("確定要刪除呢個製作記錄？", async () => {
                const dish = db.find(d => d.id === currentDishId);
                const flavor = dish?.flavors.find(f => f.id === currentFlavorId);
                if(!flavor) return;
                flavor.records = flavor.records.filter(r => r.id !== id);
                await window.syncToCloud(dish);
                window.showToast("記錄已刪除");
                window.renderPost(currentDishId, currentFlavorId);
            });
        };

        window.deleteCurrentRecipe = function() {
            window.customConfirm("確定要永久刪除呢個食譜？此動作無法還原。", async () => {
                const dish = db.find(d => d.id === currentDishId);
                if(!dish) return;
                dish.flavors = dish.flavors.filter(f => f.id !== currentFlavorId);
                if(dish.flavors.length === 0) {
                    await window.deleteFromCloud(currentDishId);
                } else {
                    await window.syncToCloud(dish);
                }
                window.navigate('home');
                window.showToast("食譜已刪除 🗑️");
            });
        };

        window.toggleFavorite = async function() {
            const dish = db.find(d => d.id === currentDishId);
            const flavor = dish?.flavors.find(f => f.id === currentFlavorId);
            if(!flavor) return;
            flavor.isFavorite = !flavor.isFavorite;
            await window.syncToCloud(dish);
            window.renderPost(currentDishId, currentFlavorId);
        };

        window.saveNewRecipe = async function(e) {
            if(e) e.preventDefault();
            const nameEl = document.getElementById('input-dish');
            const flavorEl = document.getElementById('input-flavor');
            if(!nameEl || !flavorEl) return;
            
            const name = nameEl.value.trim();
            const flavor = flavorEl.value.trim();
            const planningEl = document.getElementById('input-is-planning');
            const isPlanning = planningEl ? planningEl.checked : false;
            
            let dish = db.find(d => d.name.toLowerCase() === name.toLowerCase());
            
            const ingEl = document.getElementById('input-ingredients');
            const stEl = document.getElementById('input-steps');
            const srvEl = document.getElementById('input-serving');
            const cookEl = document.getElementById('input-cooktime');
            const ratEl = document.getElementById('input-rating');
            const kcalEl = document.getElementById('input-kcal');
            
            const newF = { 
                id: 'f'+Date.now(), name: flavor, 
                ingredients: ingEl ? ingEl.value : '', 
                steps: stEl ? stEl.value : '', 
                serving: srvEl ? srvEl.value : '', 
                cooktime: cookEl ? cookEl.value : '', 
                kcal: kcalEl ? kcalEl.value.trim() : '',
                rating: ratEl ? parseInt(ratEl.value) : 4, 
                isPlanning: isPlanning, isFavorite: false, records: [] 
            };
            if(dish) { 
                dish.flavors.push(newF); 
                await window.syncToCloud(dish); 
                window.navigate('recipe', dish.id, newF.id); 
            } else { 
                const nDish = { id: 'd'+Date.now(), name, flavors: [newF] }; 
                await window.syncToCloud(nDish); 
                setTimeout(()=>window.navigate('recipe', nDish.id, newF.id), 500); 
            }
            window.showToast("食譜已發佈！🍳");
        };

        window.openEditModal = function() {
            const dish = db.find(d => d.id === currentDishId);
            const flavor = dish?.flavors.find(f => f.id === currentFlavorId);
            if(!flavor) return;
            
            const fEl = document.getElementById('edit-flavor'); if(fEl) fEl.value = flavor.name;
            const sEl = document.getElementById('edit-serving'); if(sEl) sEl.value = flavor.serving || '';
            const cEl = document.getElementById('edit-cooktime'); if(cEl) cEl.value = flavor.cooktime || '';
            const iEl = document.getElementById('edit-ingredients'); if(iEl) iEl.value = flavor.ingredients;
            const stEl = document.getElementById('edit-steps'); if(stEl) stEl.value = flavor.steps;
            const pEl = document.getElementById('edit-is-planning'); if(pEl) pEl.checked = flavor.isPlanning === true;
            const kEl = document.getElementById('edit-kcal'); if(kEl) kEl.value = flavor.kcal || '';
            
            window.setRating('edit-rating', flavor.rating || 4);
            const modal = document.getElementById('edit-modal');
            if(modal) {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            }
        };

        window.closeEditModal = function() { 
            const modal = document.getElementById('edit-modal');
            if(modal) {
                modal.classList.add('hidden'); 
                modal.classList.remove('flex');
            }
        };

        window.saveEdit = async function() {
            const dish = db.find(d => d.id === currentDishId);
            const flavor = dish?.flavors.find(f => f.id === currentFlavorId);
            if(!flavor) return;
            
            const fEl = document.getElementById('edit-flavor'); if(fEl) flavor.name = fEl.value;
            const sEl = document.getElementById('edit-serving'); if(sEl) flavor.serving = sEl.value;
            const cEl = document.getElementById('edit-cooktime'); if(cEl) flavor.cooktime = cEl.value;
            const iEl = document.getElementById('edit-ingredients'); if(iEl) flavor.ingredients = iEl.value;
            const stEl = document.getElementById('edit-steps'); if(stEl) flavor.steps = stEl.value;
            const pEl = document.getElementById('edit-is-planning'); if(pEl) flavor.isPlanning = pEl.checked;
            const ratEl = document.getElementById('edit-rating'); if(ratEl) flavor.rating = parseInt(ratEl.value);
            const kcalEl = document.getElementById('edit-kcal'); if(kcalEl) flavor.kcal = kcalEl.value.trim();
            
            await window.syncToCloud(dish);
            window.closeEditModal();
            window.showToast("修改已儲存 💾");
            window.renderPost(currentDishId, currentFlavorId);
        };

        window.saveApiKey = function() { 
            const keyEl = document.getElementById('setting-api-key');
            if(keyEl) {
                localStorage.setItem('geminiApiKey', keyEl.value.trim()); 
                window.showToast("API 金鑰已儲存 ✅"); 
            }
        };

        window.forceSync = function() { 
            window.refreshCurrentView(); 
            window.showToast("強制同步完成 ✅"); 
        };

        window.handleAvatarUpload = function(e) {
            const file = e.target.files[0];
            if(file) {
                window.resizeImage(file, data => { 
                    window.userAvatar = data; 
                    localStorage.setItem('cookingPapaAvatar', data); 
                    window.updateAvatarDisplays(); 
                    window.showToast("頭像已更新 ✨"); 
                });
            }
        };

        document.addEventListener('DOMContentLoaded', () => { 
            lucide.createIcons(); 
            
            const recipeForm = document.getElementById('recipe-form');
            if(recipeForm) {
                // 將事件綁定直接交由 JS 處理，避免 HTML inline onsubmit 搵唔到 function
                recipeForm.addEventListener('submit', window.saveNewRecipe);
            }

            if(window.updateAvatarDisplays) window.updateAvatarDisplays(); 
            const keyEl = document.getElementById('setting-api-key');
            if(keyEl) keyEl.value = localStorage.getItem('geminiApiKey') || "";
            
            if(window.renderFlavorTags) window.renderFlavorTags();
            if (window.renderCalorieCalendar) window.renderCalorieCalendar();
            if(window.navigate) window.navigate('home'); 
        });
