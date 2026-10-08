// Bonus content transcribed from the V8 cookbook (chapters 6 + bonus chapters).
import { RECIPES } from "./recipes";
import { DAYS, type PlanSlots, type Recipe } from "./types";

const SHORT: Record<string, string> = {
  "Tofu Scramble Burrito": "tofu-scramble-breakfast-burritos",
  "Chocolate PB Oats": "chocolate-peanut-butter-protein-oats",
  "Savory Chickpea Pancakes": "savory-chickpea-pancakes",
  "Berry Almond Smoothie Bowl": "berry-almond-protein-smoothie-bowl",
  "Tofu Breakfast Hash": "high-protein-tofu-breakfast-hash",
  "Tempeh Bacon Avo Toast": "tempeh-bacon-avocado-toast",
  "Mediterranean Chickpea Bowl": "mediterranean-chickpea-power-bowl",
  "Smoky Tempeh Caesar Wrap": "smoky-tempeh-caesar-wrap",
  "Lentil Walnut Meatball Sub": "lentil-walnut-meatball-subs",
  "Lentil Meatball Sub": "lentil-walnut-meatball-subs",
  "Crispy Tofu Banh Mi Bowl": "crispy-tofu-banh-mi-bowl",
  "White Bean Tuna-less Sandwich": "white-bean-tuna-less-salad",
  "Edamame Soba Salad": "edamame-soba-noodle-salad",
  "Sticky Sesame Tofu": "sticky-sesame-tofu-with-broccoli",
  "Lentil Bolognese": "one-pot-lentil-bolognese",
  "BBQ Tempeh Sweet Potato Bowl": "bbq-tempeh-sweet-potato-bowls",
  "Tuscan White Bean Skillet": "tuscan-white-bean-skillet",
  "Spicy Peanut Tempeh Stir-Fry": "spicy-peanut-tempeh-stir-fry",
  "Seitan Steak Fajitas": "seitan-steak-fajitas",
  "High-Protein Burrito Bowl": "high-protein-burrito-bowls",
  "Mediterranean Quinoa Jar": "mediterranean-quinoa-jars",
  "Lemon Herb Lentil Meal Prep": "lemon-herb-lentil-meal-prep",
  "Buffalo Chickpea Wrap": "buffalo-chickpea-wraps",
  "Sheet Pan Tofu & Veggies": "sheet-pan-tofu-veggies",
  "Curried Lentil Stew": "curried-lentil-stew",
  "Roasted Chickpeas": "crispy-roasted-chickpeas",
  "Edamame Hummus": "edamame-hummus-with-veggies",
  "PB Protein Bites": "no-bake-peanut-butter-protein-bites",
  "PB Bites x2": "no-bake-peanut-butter-protein-bites",
  "Tofu Jerky": "tofu-jerky-strips",
  "Cottage-Style Tofu Dip": "cottage-style-tofu-dip",
  "Cottage Tofu Dip": "cottage-style-tofu-dip",
  "Chocolate Hemp Bar": "chocolate-hemp-protein-bars",
};

type Row = [string, string, string, string];
function build(rows: Row[]): PlanSlots {
  const out: PlanSlots = {};
  rows.forEach((r, i) => {
    out[DAYS[i]!] = {
      breakfast: SHORT[r[0]] ?? null,
      lunch: SHORT[r[1]] ?? null,
      dinner: SHORT[r[2]] ?? null,
      snack: SHORT[r[3]] ?? null,
    };
  });
  return out;
}

export const COOKBOOK_PLANS: { id: string; name: string; page: number; blurb: string; slots: PlanSlots }[] = [
  { id: "week-1", name: "Week 1 Meal Plan", page: 79, blurb: "The cookbook's starter week.", slots: build([
    ["Tofu Scramble Burrito", "Mediterranean Chickpea Bowl", "Sticky Sesame Tofu", "Roasted Chickpeas"],
    ["Chocolate PB Oats", "Smoky Tempeh Caesar Wrap", "Lentil Bolognese", "Edamame Hummus"],
    ["Savory Chickpea Pancakes", "Lentil Walnut Meatball Sub", "BBQ Tempeh Sweet Potato Bowl", "PB Protein Bites"],
    ["Berry Almond Smoothie Bowl", "Crispy Tofu Banh Mi Bowl", "Tuscan White Bean Skillet", "Tofu Jerky"],
    ["Tofu Breakfast Hash", "White Bean Tuna-less Sandwich", "Spicy Peanut Tempeh Stir-Fry", "Cottage-Style Tofu Dip"],
    ["Tempeh Bacon Avo Toast", "Edamame Soba Salad", "Seitan Steak Fajitas", "Chocolate Hemp Bar"],
    ["Chocolate PB Oats", "Mediterranean Quinoa Jar", "Curried Lentil Stew", "Roasted Chickpeas"],
  ]) },
  { id: "week-2", name: "Week 2 Meal Plan", page: 80, blurb: "Sheet-pan dinners and wraps.", slots: build([
    ["Tempeh Bacon Avo Toast", "Buffalo Chickpea Wrap", "Sheet Pan Tofu & Veggies", "Edamame Hummus"],
    ["Tofu Scramble Burrito", "Mediterranean Quinoa Jar", "Lentil Bolognese", "Chocolate Hemp Bar"],
    ["Berry Almond Smoothie Bowl", "Smoky Tempeh Caesar Wrap", "Sticky Sesame Tofu", "PB Protein Bites"],
    ["Savory Chickpea Pancakes", "White Bean Tuna-less Sandwich", "Tuscan White Bean Skillet", "Roasted Chickpeas"],
    ["Tofu Breakfast Hash", "Crispy Tofu Banh Mi Bowl", "Curried Lentil Stew", "Tofu Jerky"],
    ["Chocolate PB Oats", "Lentil Walnut Meatball Sub", "BBQ Tempeh Sweet Potato Bowl", "Cottage-Style Tofu Dip"],
    ["Berry Almond Smoothie Bowl", "Mediterranean Chickpea Bowl", "Spicy Peanut Tempeh Stir-Fry", "Chocolate Hemp Bar"],
  ]) },
  { id: "week-3", name: "Week 3 Meal Plan", page: 81, blurb: "Burrito bowls and lentil prep.", slots: build([
    ["Berry Almond Smoothie Bowl", "Crispy Tofu Banh Mi Bowl", "Seitan Steak Fajitas", "Edamame Hummus"],
    ["Tofu Scramble Burrito", "Mediterranean Chickpea Bowl", "Sheet Pan Tofu & Veggies", "PB Protein Bites"],
    ["Chocolate PB Oats", "Lentil Walnut Meatball Sub", "Spicy Peanut Tempeh Stir-Fry", "Roasted Chickpeas"],
    ["Tofu Breakfast Hash", "Buffalo Chickpea Wrap", "Lentil Bolognese", "Cottage-Style Tofu Dip"],
    ["Savory Chickpea Pancakes", "High-Protein Burrito Bowl", "Tuscan White Bean Skillet", "Tofu Jerky"],
    ["Tempeh Bacon Avo Toast", "Mediterranean Quinoa Jar", "BBQ Tempeh Sweet Potato Bowl", "Chocolate Hemp Bar"],
    ["Berry Almond Smoothie Bowl", "Lemon Herb Lentil Meal Prep", "Sticky Sesame Tofu", "Edamame Hummus"],
  ]) },
  { id: "week-4", name: "Week 4 Meal Plan", page: 82, blurb: "Stews, soba, and fajitas.", slots: build([
    ["Chocolate PB Oats", "Smoky Tempeh Caesar Wrap", "Curried Lentil Stew", "PB Protein Bites"],
    ["Tofu Breakfast Hash", "Edamame Soba Salad", "Seitan Steak Fajitas", "Roasted Chickpeas"],
    ["Tofu Scramble Burrito", "High-Protein Burrito Bowl", "Tuscan White Bean Skillet", "Cottage-Style Tofu Dip"],
    ["Savory Chickpea Pancakes", "White Bean Tuna-less Sandwich", "Sheet Pan Tofu & Veggies", "Tofu Jerky"],
    ["Berry Almond Smoothie Bowl", "Buffalo Chickpea Wrap", "Sticky Sesame Tofu", "Chocolate Hemp Bar"],
    ["Tempeh Bacon Avo Toast", "Mediterranean Chickpea Bowl", "Spicy Peanut Tempeh Stir-Fry", "Edamame Hummus"],
    ["Chocolate PB Oats", "Lemon Herb Lentil Meal Prep", "Lentil Bolognese", "Roasted Chickpeas"],
  ]) },
  // 7-day high-protein plan (p.84). Its "Lunch" + "Snack/Dinner" columns map to lunch + dinner;
  // non-recipe items (edamame, smoothies) are left open.
  { id: "high-protein-7", name: "7-Day High-Protein Plan", page: 84, blurb: "Roughly 110 g+ protein per day.", slots: build([
    ["Chocolate PB Oats", "Sticky Sesame Tofu", "", "Roasted Chickpeas"],
    ["Tofu Scramble Burrito", "Mediterranean Chickpea Bowl", "Chocolate Hemp Bar", ""],
    ["Berry Almond Smoothie Bowl", "Buffalo Chickpea Wrap", "Tofu Jerky", "PB Bites x2"],
    ["Tempeh Bacon Avo Toast", "Lentil Meatball Sub", "Cottage Tofu Dip", "Edamame Hummus"],
    ["Tofu Breakfast Hash", "Crispy Tofu Banh Mi Bowl", "Roasted Chickpeas", "Chocolate Hemp Bar"],
    ["Savory Chickpea Pancakes", "Edamame Soba Salad", "PB Bites x2", ""],
    ["Chocolate PB Oats", "Mediterranean Quinoa Jar", "Curried Lentil Stew", ""],
  ]) },
];

export const SMOOTHIES: { n: number; name: string; protein: number; ingredients: string[] }[] = [
  [1, "Chocolate Banana Power", 30, "1 frozen banana; 1 cup soy milk; 1 scoop chocolate vegan protein powder; 2 tbsp peanut butter; 1 tbsp cocoa powder; 1 tbsp hemp seeds; ice"],
  [2, "Strawberry Cheesecake", 28, "Frozen strawberries; soy milk; vanilla protein powder; cashew butter; lemon juice; hemp seeds"],
  [3, "Green Goddess", 26, "Soy milk; vanilla protein; banana; spinach; avocado; chia seeds; lime"],
  [4, "Tropical Mango Coconut", 24, "Frozen mango; coconut milk; vanilla protein; shredded coconut; hemp seeds; lime"],
  [5, "Mocha Almond Fudge", 29, "Cold brew; soy milk; chocolate protein; almond butter; cocoa; ice"],
  [6, "PB&J Smoothie", 30, "Frozen berries; soy milk; vanilla protein; peanut butter; chia"],
  [7, "Oatmeal Cookie", 27, "Soy milk; vanilla protein; rolled oats; cinnamon; hemp seeds"],
  [8, "Pumpkin Spice", 28, "Pumpkin; soy milk; vanilla protein; banana; cashew butter; pumpkin spice"],
  [9, "Chocolate Cherry", 30, "Frozen cherries; soy milk; chocolate protein; peanut butter; cocoa; chia"],
  [10, "Vanilla Chai", 26, "Brewed chai; soy milk; vanilla protein; banana; cashew butter; cinnamon"],
  [11, "Blueberry Muffin", 28, "Blueberries; oat milk; vanilla protein; oats; almond butter; cinnamon"],
  [12, "Matcha Latte", 25, "Oat milk; matcha; vanilla protein; banana; hemp seeds"],
  [13, "Salted Caramel Date", 29, "Dates; soy milk; vanilla protein; tahini; sea salt; ice"],
  [14, "Peach Cobbler", 27, "Frozen peaches; soy milk; vanilla protein; oats; cinnamon; almond butter"],
  [15, "Apple Pie", 26, "Applesauce; soy milk; vanilla protein; oats; almond butter; cinnamon"],
].map(([n, name, protein, ing]) => ({ n: n as number, name: name as string, protein: protein as number, ingredients: (ing as string).split("; ") }));

export const PROTEIN_CHEAT: [string, string, string, string][] = [
  ["Tofu (extra-firm)", "100 g", "17 g", "Scrambles, stir-fries, baked"],
  ["Tempeh", "100 g", "20 g", "Bacon, sandwiches, stir-fries"],
  ["Edamame", "1 cup cooked", "18 g", "Snacks, salads, hummus"],
  ["Lentils", "1 cup cooked", "18 g", "Stews, bolognese, meatballs"],
  ["Chickpeas", "1 cup cooked", "15 g", "Bowls, wraps, roasted snacks"],
  ["Black beans", "1 cup cooked", "15 g", "Burritos, salads, soups"],
  ["Seitan", "100 g", "25 g", "Fajitas, steaks, sandwiches"],
  ["Quinoa", "1 cup cooked", "8 g", "Bowls, jars, sides"],
  ["Hemp seeds", "3 tbsp", "10 g", "Smoothies, toast, oats"],
  ["Chia seeds", "3 tbsp", "6 g", "Puddings, oats, baked goods"],
];

export const GUIDES: { title: string; page: number; items: string[] }[] = [
  { title: "Batch Cooking Tips", page: 88, items: [
    "Cook one giant pot of grains every Sunday — quinoa, rice, or farro.",
    "Roast two sheet pans of vegetables at once.",
    "Double legume recipes; beans and lentils freeze beautifully.",
    "Press tofu the night before so it is ready to cook.",
    "Whisk three sauces on Sunday: peanut, tahini-lemon, and BBQ-tamari.",
  ] },
  { title: "Storage Tips", page: 88, items: [
    "Use glass containers so meals stay fresh and easy to reheat.",
    "Store dressings on the bottom of mason jars and greens on top.",
    "Label everything with the date you made it.",
    "Keep cooked grains slightly under-done so reheating stays fluffy.",
    "Store nuts and seeds in the freezer for longer freshness.",
  ] },
  { title: "Freezing Tips", page: 89, items: [
    "Cool food completely before freezing to prevent ice crystals.",
    "Freeze soups and stews flat in zip-top bags.",
    "Most cooked legume dishes freeze up to 3 months.",
    "Freeze ripe bananas in chunks for smoothies.",
    "Label with name, date, and reheating instructions.",
  ] },
  { title: "Time-Saving Tricks", page: 89, items: [
    "Buy pre-chopped aromatics when life is busy.",
    "Use a rice cooker on a timer.",
    "Stock frozen edamame, riced cauliflower, and chopped onions.",
    "Keep one drawer of meal prep tools.",
    "Protect one prep window each week.",
  ] },
  { title: "Cheapest Plant Proteins", page: 90, items: [
    "Dry lentils: ~18g per cooked cup, budget superstar.",
    "Dry black beans: ~15g per cooked cup.",
    "Dry chickpeas: bowls, wraps, hummus, roasted snacks.",
    "Tofu: affordable, flexible, and high protein.",
    "Rolled oats + peanut butter: pantry staples that stretch breakfasts.",
  ] },
  { title: "Money-Saving Strategies", page: 90, items: [
    "Buy dry beans and lentils in bulk.",
    "Use frozen broccoli, berries, spinach, and edamame.",
    "Cook once, eat twice — leftovers lower the grocery bill.",
    "Shop the ethnic aisle for tahini, beans, rice, and spices.",
  ] },
  { title: "More Smart Swaps", page: 91, items: [
    "Skip pre-cut produce when possible.",
    "Build meals around one splurge: tempeh + rice + vegetables.",
    "Grow herbs on a windowsill.",
    "Use sauces to make repeat ingredients feel new.",
  ] },
];

export const RECIPE_BY_ID: Record<string, Recipe> = Object.fromEntries(RECIPES.map((r) => [r.id, r]));
export const CATEGORY_LABEL: Record<string, string> = {
  breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", "meal-prep": "Meal Prep", snack: "Snacks",
};
