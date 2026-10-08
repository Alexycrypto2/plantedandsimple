export type RecipeCategory = "breakfast" | "lunch" | "dinner" | "meal-prep" | "snack";

export interface Recipe {
  id: string;
  num: number;
  title: string;
  category: RecipeCategory | string;
  description: string;
  nutrition: { calories: number; protein: number; carbs: number; fat: number; fiber: number };
  prep: string;
  cook: string;
  totalMinutes: number;
  serves: string;
  level: string;
  mealPrep: boolean;
  freezer: boolean;
  proteins: string[];
  why: string[];
  ingredients: string[];
  steps: string[];
  storage: { fridge?: string; freezer?: string; reheat?: string };
  tips: { substitutions?: string; serving?: string; variations?: string };
  cookbookPage: number;
  image: string;
}

export const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type Day = (typeof DAYS)[number];
export const DAY_LABEL: Record<Day, string> = {
  mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday", sun: "Sunday",
};
export const SLOTS = ["breakfast", "lunch", "dinner", "snack"] as const;
export type Slot = (typeof SLOTS)[number];
export type PlanSlots = Partial<Record<Day, Partial<Record<Slot, string | null>>>>;
