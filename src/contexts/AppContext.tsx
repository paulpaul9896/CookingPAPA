import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  auth, firestore, APP_ID,
  signInAnonymously, onAuthStateChanged,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, updatePassword,
  collection, doc, setDoc, deleteDoc, onSnapshot, addDoc,
} from '../lib/firebase';
import {
  ViewType, HomeTab, GroceryMode,
  Dish, CalorieItem, PlannerDb, CustomGroceryItem,
  FridgeRecipe, CustomModalState,
} from '../types';

const DEFAULT_AVATAR =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect fill='%23FFF3E0' width='100' height='100'/><text x='50' y='55' font-size='45' text-anchor='middle' dominant-baseline='middle'>👨🏻‍🍳</text></svg>";

const safeGet = <T,>(key: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
};

interface AppContextType {
  currentView: ViewType;
  currentDishId: string | null;
  currentFlavorId: string | null;
  navigate: (view: ViewType | 'search' | 'favorites', dishId?: string, flavorId?: string) => void;
  currentUser: User | null;
  recipes: Dish[];
  calorieDb: CalorieItem[];
  plannerDb: PlannerDb;
  customGroceryDb: CustomGroceryItem[];
  currentHomeTab: HomeTab;
  setCurrentHomeTab: (t: HomeTab) => void;
  currentGroceryMode: GroceryMode;
  setCurrentGroceryMode: (m: GroceryMode) => void;
  searchFilterPlanning: boolean;
  setSearchFilterPlanning: (v: boolean) => void;
  fridgeTempRecipes: FridgeRecipe[];
  setFridgeTempRecipes: (r: FridgeRecipe[]) => void;
  isAiLoading: boolean;
  setIsAiLoading: (v: boolean) => void;
  calDate: Date;
  setCalDate: (d: Date) => void;
  calSelectedDate: string;
  setCalSelectedDate: (s: string) => void;
  plannerCalDate: Date;
  setPlannerCalDate: (d: Date) => void;
  plannerSelectedDate: string;
  setPlannerSelectedDate: (s: string) => void;
  flavorTags: string[];
  setFlavorTagsAndSave: (tags: string[]) => void;
  userAvatar: string;
  setUserAvatarAndSave: (avatar: string) => void;
  groceryChecked: Record<string, boolean>;
  toggleGroceryChecked: (key: string) => void;
  groceryDeleted: Record<string, boolean>;
  markGroceryDeleted: (key: string) => void;
  groceryOrder: string[];
  setGroceryOrder: (order: string[]) => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  customModal: CustomModalState | null;
  showCustomAlert: (msg: string) => void;
  showCustomConfirm: (msg: string, fn: () => void) => void;
  showCustomPrompt: (msg: string, placeholder: string, fn: (val: string) => void, defaultValue?: string) => void;
  dismissCustomModal: () => void;
  isShareModalOpen: boolean;
  setIsShareModalOpen: (v: boolean) => void;
  isPlannerModalOpen: boolean;
  setIsPlannerModalOpen: (v: boolean) => void;
  isEditModalOpen: boolean;
  setIsEditModalOpen: (v: boolean) => void;
  isCalorieEditModalOpen: boolean;
  setIsCalorieEditModalOpen: (v: boolean) => void;
  editCalorieItem: CalorieItem | null;
  setEditCalorieItem: (item: CalorieItem | null) => void;
  isCalorieRefModalOpen: boolean;
  setIsCalorieRefModalOpen: (v: boolean) => void;
  syncTimeDisplay: string;
  syncToCloud: (data: Dish) => Promise<void>;
  deleteFromCloud: (id: string) => Promise<void>;
  addCalorieRecord: (item: Omit<CalorieItem, 'id'>) => Promise<void>;
  updateCalorieRecord: (item: CalorieItem) => Promise<void>;
  deleteCalorieRecord: (id: string) => Promise<void>;
  savePlannerToCloud: (data: PlannerDb) => Promise<void>;
  saveCustomGroceryToCloud: (items: CustomGroceryItem[]) => Promise<void>;
  handleAuth: (type: 'login' | 'signup', email: string, password: string) => Promise<void>;
  handleLogout: () => Promise<void>;
  handleChangePassword: (newPassword: string) => Promise<void>;
}

const AppContext = createContext<AppContextType>(null!);
export const useApp = () => useContext(AppContext);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [currentDishId, setCurrentDishId] = useState<string | null>(null);
  const [currentFlavorId, setCurrentFlavorId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [recipes, setRecipes] = useState<Dish[]>([]);
  const [calorieDb, setCalorieDb] = useState<CalorieItem[]>([]);
  const [plannerDb, setPlannerDb] = useState<PlannerDb>({});
  const [customGroceryDb, setCustomGroceryDb] = useState<CustomGroceryItem[]>([]);
  const [currentHomeTab, setCurrentHomeTab] = useState<HomeTab>('grid');
  const [currentGroceryMode, setCurrentGroceryMode] = useState<GroceryMode>('recipe');
  const [searchFilterPlanning, setSearchFilterPlanning] = useState(false);
  const [fridgeTempRecipes, setFridgeTempRecipes] = useState<FridgeRecipe[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [calDate, setCalDate] = useState(new Date());
  const [calSelectedDate, setCalSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [plannerCalDate, setPlannerCalDate] = useState(new Date());
  const [plannerSelectedDate, setPlannerSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [flavorTags, setFlavorTags] = useState<string[]>(
    safeGet('cookingPapaFlavorTags', ['減肥餐', '兒童至愛', '快手15分鐘', '惹味大排檔', '清淡健康'])
  );
  const [userAvatar, setUserAvatar] = useState<string>(
    () => { try { return localStorage.getItem('cookingPapaAvatar') || DEFAULT_AVATAR; } catch { return DEFAULT_AVATAR; } }
  );
  const [groceryChecked, setGroceryChecked] = useState<Record<string, boolean>>(safeGet('groceryChecked', {}));
  const [groceryDeleted, setGroceryDeleted] = useState<Record<string, boolean>>(safeGet('groceryDeleted', {}));
  const [groceryOrder, setGroceryOrderState] = useState<string[]>(safeGet('groceryOrder', []));
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [customModal, setCustomModal] = useState<CustomModalState | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isPlannerModalOpen, setIsPlannerModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCalorieEditModalOpen, setIsCalorieEditModalOpen] = useState(false);
  const [editCalorieItem, setEditCalorieItem] = useState<CalorieItem | null>(null);
  const [isCalorieRefModalOpen, setIsCalorieRefModalOpen] = useState(false);
  const [syncTimeDisplay, setSyncTimeDisplay] = useState('🔄 最後同步時間：未同步');

  const unsubRecipes = useRef<(() => void) | null>(null);
  const unsubCalories = useRef<(() => void) | null>(null);
  const unsubPlanner = useRef<(() => void) | null>(null);
  const unsubGrocery = useRef<(() => void) | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Auth ---
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { await signInAnonymously(auth); return; }
      setCurrentUser(user);

      if (unsubRecipes.current) unsubRecipes.current();
      unsubRecipes.current = onSnapshot(
        collection(firestore, 'artifacts', APP_ID, 'users', user.uid, 'recipes'),
        (snap) => {
          const data: Dish[] = [];
          snap.forEach((d) => data.push({ id: d.id, ...(d.data() as Omit<Dish, 'id'>) }));
          setRecipes(data);
          const now = new Date();
          setSyncTimeDisplay(`🔄 最後同步時間：${now.toLocaleDateString()} ${now.toLocaleTimeString()}`);
        }
      );

      if (unsubCalories.current) unsubCalories.current();
      unsubCalories.current = onSnapshot(
        collection(firestore, 'artifacts', APP_ID, 'users', user.uid, 'calories'),
        (snap) => {
          const data: CalorieItem[] = [];
          snap.forEach((d) => data.push({ id: d.id, ...(d.data() as Omit<CalorieItem, 'id'>) }));
          setCalorieDb(data);
        }
      );

      if (unsubPlanner.current) unsubPlanner.current();
      unsubPlanner.current = onSnapshot(
        doc(firestore, 'artifacts', APP_ID, 'users', user.uid, 'settings', 'planner'),
        (docSnap) => { setPlannerDb(docSnap.exists() ? (docSnap.data() as PlannerDb) : {}); }
      );

      if (unsubGrocery.current) unsubGrocery.current();
      unsubGrocery.current = onSnapshot(
        doc(firestore, 'artifacts', APP_ID, 'users', user.uid, 'settings', 'grocery'),
        (docSnap) => {
          if (docSnap.exists() && Array.isArray(docSnap.data().items)) {
            setCustomGroceryDb(docSnap.data().items as CustomGroceryItem[]);
          } else {
            setCustomGroceryDb([]);
          }
        }
      );
    });
    return () => {
      unsub();
      unsubRecipes.current?.();
      unsubCalories.current?.();
      unsubPlanner.current?.();
      unsubGrocery.current?.();
    };
  }, []);

  // --- Navigation ---
  const navigate = useCallback((view: ViewType | 'search' | 'favorites', dishId?: string, flavorId?: string) => {
    if (view === 'search') {
      setCurrentView('home');
      setCurrentHomeTab('search');
      window.scrollTo(0, 0);
      return;
    }
    if (view === 'favorites') {
      setCurrentView('home');
      setCurrentHomeTab('favorites');
      window.scrollTo(0, 0);
      return;
    }
    if (dishId) setCurrentDishId(dishId);
    if (flavorId) setCurrentFlavorId(flavorId);
    setCurrentView(view as ViewType);
    if (view === 'home') setCurrentHomeTab('grid');
    window.scrollTo(0, 0);
  }, []);

  // --- Toast ---
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMessage(null), 2500);
  }, []);

  // --- Custom Modal ---
  const showCustomAlert = useCallback((msg: string) => {
    setCustomModal({ type: 'alert', title: '提示', message: msg, onConfirm: () => setCustomModal(null) });
  }, []);

  const showCustomConfirm = useCallback((msg: string, fn: () => void) => {
    setCustomModal({
      type: 'confirm', title: '確認操作', message: msg,
      onConfirm: () => { setCustomModal(null); fn(); },
      onCancel: () => setCustomModal(null),
    });
  }, []);

  const showCustomPrompt = useCallback((msg: string, placeholder: string, fn: (val: string) => void, defaultValue = '') => {
    setCustomModal({
      type: 'prompt', title: '請輸入', message: msg, placeholder, defaultValue,
      onConfirm: (val) => { setCustomModal(null); fn(val ?? ''); },
      onCancel: () => setCustomModal(null),
    });
  }, []);

  const dismissCustomModal = useCallback(() => setCustomModal(null), []);

  // --- Local prefs ---
  const setFlavorTagsAndSave = useCallback((tags: string[]) => {
    setFlavorTags(tags);
    localStorage.setItem('cookingPapaFlavorTags', JSON.stringify(tags));
  }, []);

  const setUserAvatarAndSave = useCallback((avatar: string) => {
    setUserAvatar(avatar);
    localStorage.setItem('cookingPapaAvatar', avatar);
  }, []);

  // --- Grocery local ---
  const toggleGroceryChecked = useCallback((key: string) => {
    setGroceryChecked((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem('groceryChecked', JSON.stringify(next));
      return next;
    });
  }, []);

  const markGroceryDeleted = useCallback((key: string) => {
    setGroceryDeleted((prev) => {
      const next = { ...prev, [key]: true };
      localStorage.setItem('groceryDeleted', JSON.stringify(next));
      return next;
    });
  }, []);

  const setGroceryOrder = useCallback((order: string[]) => {
    setGroceryOrderState(order);
    localStorage.setItem('groceryOrder', JSON.stringify(order));
  }, []);

  // --- Firebase CRUD ---
  const syncToCloud = useCallback(async (data: Dish) => {
    if (!currentUser) return;
    await setDoc(doc(firestore, 'artifacts', APP_ID, 'users', currentUser.uid, 'recipes', data.id), data);
  }, [currentUser]);

  const deleteFromCloud = useCallback(async (id: string) => {
    if (!currentUser) return;
    await deleteDoc(doc(firestore, 'artifacts', APP_ID, 'users', currentUser.uid, 'recipes', id));
  }, [currentUser]);

  const addCalorieRecord = useCallback(async (item: Omit<CalorieItem, 'id'>) => {
    if (!currentUser) return;
    await addDoc(collection(firestore, 'artifacts', APP_ID, 'users', currentUser.uid, 'calories'), item);
  }, [currentUser]);

  const updateCalorieRecord = useCallback(async (item: CalorieItem) => {
    if (!currentUser) return;
    await setDoc(doc(firestore, 'artifacts', APP_ID, 'users', currentUser.uid, 'calories', item.id), item);
  }, [currentUser]);

  const deleteCalorieRecord = useCallback(async (id: string) => {
    if (!currentUser) return;
    await deleteDoc(doc(firestore, 'artifacts', APP_ID, 'users', currentUser.uid, 'calories', id));
  }, [currentUser]);

  const savePlannerToCloud = useCallback(async (data: PlannerDb) => {
    if (!currentUser) return;
    await setDoc(doc(firestore, 'artifacts', APP_ID, 'users', currentUser.uid, 'settings', 'planner'), data);
  }, [currentUser]);

  const saveCustomGroceryToCloud = useCallback(async (items: CustomGroceryItem[]) => {
    if (!currentUser) return;
    await setDoc(doc(firestore, 'artifacts', APP_ID, 'users', currentUser.uid, 'settings', 'grocery'), { items });
  }, [currentUser]);

  // --- Auth actions ---
  const handleAuth = useCallback(async (type: 'login' | 'signup', email: string, password: string) => {
    if (!email || !password) { showCustomAlert('請輸入電郵同密碼！'); return; }
    if (password.length < 6) { showCustomAlert('密碼最少需要 6 個字元。'); return; }
    try {
      if (type === 'signup') {
        await createUserWithEmailAndPassword(auth, email, password);
        showToast('註冊成功！🎉');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        showToast('已登入！👋');
      }
    } catch (e: any) {
      if (e.code === 'auth/operation-not-allowed') showCustomAlert('⚠️ Firebase 設定錯誤：\n請前往 Firebase 後台開啟「Email/Password」登入。');
      else if (e.code === 'auth/email-already-in-use') showCustomAlert('此電郵已被註冊，請直接登入。');
      else if (e.code === 'auth/wrong-password' || e.code === 'auth/user-not-found') showCustomAlert('電郵或密碼錯誤。');
      else showCustomAlert('登入失敗：' + e.message);
    }
  }, [showCustomAlert, showToast]);

  const handleLogout = useCallback(async () => {
    await signOut(auth);
    showToast('已登出，資料將恢復為本地暫存');
  }, [showToast]);

  const handleChangePassword = useCallback(async (newPwd: string) => {
    if (!currentUser || currentUser.isAnonymous) { showCustomAlert('請先登入！'); return; }
    if (newPwd.length < 6) { showCustomAlert('新密碼最少需要 6 個字元。'); return; }
    try {
      await updatePassword(currentUser, newPwd);
      showToast('密碼已成功更新！✅');
    } catch (e: any) {
      if (e.code === 'auth/requires-recent-login') showCustomAlert('基於安全理由，請登出並重新登入後，再嘗試更改密碼。');
      else showCustomAlert('更改密碼失敗：' + e.message);
    }
  }, [currentUser, showCustomAlert, showToast]);

  const value: AppContextType = {
    currentView, currentDishId, currentFlavorId, navigate,
    currentUser, recipes, calorieDb, plannerDb, customGroceryDb,
    currentHomeTab, setCurrentHomeTab,
    currentGroceryMode, setCurrentGroceryMode,
    searchFilterPlanning, setSearchFilterPlanning,
    fridgeTempRecipes, setFridgeTempRecipes,
    isAiLoading, setIsAiLoading,
    calDate, setCalDate, calSelectedDate, setCalSelectedDate,
    plannerCalDate, setPlannerCalDate, plannerSelectedDate, setPlannerSelectedDate,
    flavorTags, setFlavorTagsAndSave,
    userAvatar, setUserAvatarAndSave,
    groceryChecked, toggleGroceryChecked,
    groceryDeleted, markGroceryDeleted,
    groceryOrder, setGroceryOrder,
    toastMessage, showToast,
    customModal, showCustomAlert, showCustomConfirm, showCustomPrompt, dismissCustomModal,
    isShareModalOpen, setIsShareModalOpen,
    isPlannerModalOpen, setIsPlannerModalOpen,
    isEditModalOpen, setIsEditModalOpen,
    isCalorieEditModalOpen, setIsCalorieEditModalOpen,
    editCalorieItem, setEditCalorieItem,
    isCalorieRefModalOpen, setIsCalorieRefModalOpen,
    syncTimeDisplay,
    syncToCloud, deleteFromCloud,
    addCalorieRecord, updateCalorieRecord, deleteCalorieRecord,
    savePlannerToCloud, saveCustomGroceryToCloud,
    handleAuth, handleLogout, handleChangePassword,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
