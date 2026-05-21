export type ViewType = 'home' | 'recipe' | 'fridge' | 'add' | 'grocery' | 'calorie' | 'planner' | 'profile';
export type HomeTab = 'grid' | 'search' | 'favorites';
export type GroceryMode = 'recipe' | 'flat';

export interface RecordItem {
  id: string;
  date: string;
  images?: string[] | null;
  note?: string;
}

export interface Flavor {
  id: string;
  name: string;
  ingredients: string;
  steps: string;
  serving?: string;
  cooktime?: string;
  kcal?: string;
  rating?: number;
  isPlanning?: boolean;
  isFavorite?: boolean;
  records?: RecordItem[];
  coverImage?: string;
  tags?: string[];
}

export interface Dish {
  id: string;
  name: string;
  flavors: Flavor[];
}

export interface CalorieItem {
  id: string;
  name: string;
  kcal: number;
  desc?: string;
  dateStr: string;
  timestamp: number;
}

export type PlannerEntry =
  | { isManual: true; text: string; dishId?: never; flavorId?: never }
  | { isManual?: false; dishId: string; flavorId: string; text?: never };

export type PlannerDb = Record<string, PlannerEntry[]>;

export interface CustomGroceryItem {
  id: string;
  text: string;
}

export interface FridgeRecipe {
  name: string;
  flavor: string;
  ingredients: string;
  steps: string;
  tags?: string[];
  kcal?: number;
}

export interface CustomModalState {
  type: 'alert' | 'confirm' | 'prompt';
  title: string;
  message: string;
  placeholder?: string;
  defaultValue?: string;
  onConfirm: (value?: string) => void;
  onCancel?: () => void;
}
