/** Achievement badges and estimated savings for Meal Prep members (pure logic, browser storage read separately). */
export const SAVED_PER_MEAL_USD = 8; // estimate vs. takeout
export const MINUTES_SAVED_PER_MEAL = 15; // estimate from batch cooking

export interface BadgeStats {
  mealsLogged: number; bestStreak: number; goalDays: number; plannedMeals: number;
  prepComplete: boolean; groceryComplete: boolean; favourites: number;
}
export interface Badge { id: string; icon: string; title: string; hint: string; progress: number; goal: number; earned: boolean }

const DEFS: { id: string; icon: string; title: string; hint: string; goal: number; get: (s: BadgeStats) => number }[] = [
  { id: "first-bite", icon: "🌱", title: "First Bite", hint: "Tick off your first meal", goal: 1, get: (s) => s.mealsLogged },
  { id: "streak-3", icon: "🔥", title: "On a Roll", hint: "3-day streak", goal: 3, get: (s) => s.bestStreak },
  { id: "streak-7", icon: "🏆", title: "Week Champion", hint: "7-day streak", goal: 7, get: (s) => s.bestStreak },
  { id: "streak-30", icon: "👑", title: "Habit Legend", hint: "30-day streak", goal: 30, get: (s) => s.bestStreak },
  { id: "protein-1", icon: "⚡", title: "Protein Pro", hint: "Hit your protein goal once", goal: 1, get: (s) => s.goalDays },
  { id: "protein-7", icon: "💪", title: "Protein Habit", hint: "Hit your protein goal on 7 days", goal: 7, get: (s) => s.goalDays },
  { id: "planner", icon: "📋", title: "Master Planner", hint: "Plan 21 meals in one week", goal: 21, get: (s) => s.plannedMeals },
  { id: "batch-boss", icon: "👨‍🍳", title: "Batch Boss", hint: "Finish every prep-day step", goal: 1, get: (s) => (s.prepComplete ? 1 : 0) },
  { id: "grocery", icon: "🛒", title: "Grocery Ninja", hint: "Tick your whole grocery list", goal: 1, get: (s) => (s.groceryComplete ? 1 : 0) },
  { id: "favourites", icon: "❤️", title: "Recipe Fan", hint: "Save 5 favourite recipes", goal: 5, get: (s) => s.favourites },
  { id: "saver", icon: "💰", title: "Smart Saver", hint: `Save an estimated $50`, goal: 50, get: (s) => s.mealsLogged * SAVED_PER_MEAL_USD },
  { id: "pioneer", icon: "🌿", title: "Plant Pioneer", hint: "Log 50 meals", goal: 50, get: (s) => s.mealsLogged },
];

export function computeBadges(s: BadgeStats): Badge[] {
  return DEFS.map((d) => { const v = d.get(s); return { id: d.id, icon: d.icon, title: d.title, hint: d.hint, goal: d.goal, progress: Math.min(v, d.goal), earned: v >= d.goal }; });
}

/** Longest run of consecutive ISO dates (YYYY-MM-DD). */
export function longestStreak(dates: string[]): number {
  const days = [...new Set(dates)].map((d) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10)) / 864e5).sort((a, b) => a - b);
  let best = 0, run = 0;
  days.forEach((d, i) => { run = i > 0 && d - days[i - 1]! === 1 ? run + 1 : 1; best = Math.max(best, run); });
  return best;
}

export function savings(mealsLogged: number) {
  return { dollars: mealsLogged * SAVED_PER_MEAL_USD, hours: Math.round((mealsLogged * MINUTES_SAVED_PER_MEAL) / 6) / 10 };
}

/** Reads the member's local history (meal ticks + protein-goal days) from browser storage. */
export function readHistory(): { mealsLogged: number; loggedDates: string[]; goalDays: number } {
  let mealsLogged = 0, goalDays = 0; const loggedDates: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i) ?? "";
    if (k.startsWith("prep-eaten-")) {
      try { const n = (JSON.parse(localStorage.getItem(k) ?? "[]") as string[]).length; if (n) { mealsLogged += n; loggedDates.push(k.slice(11)); } } catch { /* ignore */ }
    } else if (k.startsWith("prep-goal-")) goalDays++;
  }
  return { mealsLogged, loggedDates, goalDays };
}
