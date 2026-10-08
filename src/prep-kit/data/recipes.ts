import img1 from "@/assets/recipes/p13.jpg.asset.json";
import img2 from "@/assets/recipes/p15.jpg.asset.json";
import img3 from "@/assets/recipes/p17.jpg.asset.json";
import img4 from "@/assets/recipes/p19.jpg.asset.json";
import img5 from "@/assets/recipes/p21.jpg.asset.json";
import img6 from "@/assets/recipes/p23.jpg.asset.json";
import img7 from "@/assets/recipes/p26.jpg.asset.json";
import img8 from "@/assets/recipes/p28.jpg.asset.json";
import img9 from "@/assets/recipes/p30.jpg.asset.json";
import img10 from "@/assets/recipes/p32.jpg.asset.json";
import img11 from "@/assets/recipes/p34.jpg.asset.json";
import img12 from "@/assets/recipes/p36.jpg.asset.json";
import img13 from "@/assets/recipes/p39.jpg.asset.json";
import img14 from "@/assets/recipes/p41.jpg.asset.json";
import img15 from "@/assets/recipes/p44.jpg.asset.json";
import img16 from "@/assets/recipes/p46.jpg.asset.json";
import img17 from "@/assets/recipes/p48.jpg.asset.json";
import img18 from "@/assets/recipes/p50.jpg.asset.json";
import img19 from "@/assets/recipes/p53.jpg.asset.json";
import img20 from "@/assets/recipes/p55.jpg.asset.json";
import img21 from "@/assets/recipes/p57.jpg.asset.json";
import img22 from "@/assets/recipes/p59.jpg.asset.json";
import img23 from "@/assets/recipes/p61.jpg.asset.json";
import img24 from "@/assets/recipes/p63.jpg.asset.json";
import img25 from "@/assets/recipes/p66.jpg.asset.json";
import img26 from "@/assets/recipes/p68.jpg.asset.json";
import img27 from "@/assets/recipes/p70.jpg.asset.json";
import img28 from "@/assets/recipes/p72.jpg.asset.json";
import img29 from "@/assets/recipes/p74.jpg.asset.json";
import img30 from "@/assets/recipes/p76.jpg.asset.json";
const IMGS = [img1.url, img2.url, img3.url, img4.url, img5.url, img6.url, img7.url, img8.url, img9.url, img10.url, img11.url, img12.url, img13.url, img14.url, img15.url, img16.url, img17.url, img18.url, img19.url, img20.url, img21.url, img22.url, img23.url, img24.url, img25.url, img26.url, img27.url, img28.url, img29.url, img30.url];
// Source of truth: Plant & Simple V8 cookbook (30_High_Protein_Plant_Based_Meals_v8.pdf).
// Extracted verbatim. Do not edit by hand without checking the PDF.
import type { Recipe } from "./types";

export const RECIPES: Recipe[] = [
{
  "id": "tofu-scramble-breakfast-burritos",
  "num": 1,
  "title": "Tofu Scramble Breakfast Burritos",
  "category": "breakfast",
  "description": "Soft tortillas wrapped around fluffy, golden tofu scramble with black beans, peppers, and salsa. These freeze beautifully — make a batch on Sunday and breakfast is handled for the week.",
  "nutrition": {
    "calories": 420,
    "protein": 27,
    "carbs": 48,
    "fat": 14,
    "fiber": 9
  },
  "prep": "10 min",
  "cook": "12 min",
  "totalMinutes": 22,
  "serves": "4",
  "level": "Easy",
  "mealPrep": true,
  "freezer": true,
  "proteins": [
    "tofu",
    "bean"
  ],
  "why": [
    "Packs 27 g of plant protein per serving",
    "Ready in 10 min of prep",
    "Meal-prep friendly — make it ahead",
    "Freezer friendly for busy weeks",
    "Family-approved, 100% plant-based"
  ],
  "ingredients": [
    "1 block (14 oz) extra-firm tofu, drained",
    "1 tbsp olive oil",
    "1/2 yellow onion, diced",
    "1 red bell pepper, diced",
    "1 cup canned black beans, rinsed",
    "1/2 tsp turmeric",
    "1 tsp smoked paprika",
    "1 tsp garlic powder",
    "3 tbsp nutritional yeast",
    "2 tbsp unsweetened soy milk",
    "Salt and pepper to taste",
    "4 large whole-wheat tortillas",
    "1/2 cup salsa",
    "1 avocado, sliced",
    "Fresh cilantro, optional"
  ],
  "steps": [
    "Crumble the tofu into a bowl with your hands until it resembles scrambled eggs.",
    "Heat olive oil in a large nonstick skillet over medium heat. Add onion and bell pepper; cook 4 minutes until softened.",
    "Add crumbled tofu, turmeric, smoked paprika, garlic powder, salt, and pepper. Stir to coat and cook 4 minutes.",
    "Stir in black beans, nutritional yeast, and soy milk. Cook 2 more minutes until creamy and heated through.",
    "Warm tortillas for 15 seconds in the microwave. Spoon the scramble down the center of each.",
    "Top with salsa, avocado, and cilantro. Fold in the sides and roll tightly into burritos."
  ],
  "storage": {
    "fridge": "Up to 4 days in an airtight container.",
    "freezer": "Wrap individually in foil and freeze up to 2 months.",
    "reheat": "Microwave 1–2 minutes from refrigerated, or unwrap and bake at 375°F for 20 minutes."
  },
  "tips": {
    "substitutions": "Use kala namak (black salt) for an eggy flavor.",
    "serving": "Serve with hot sauce and a cup of unsweetened soy milk for an extra protein boost.",
    "variations": "Add chopped spinach or mushrooms with the peppers."
  },
  "cookbookPage": 13,
  "image": IMGS[0]
},
{
  "id": "chocolate-peanut-butter-protein-oats",
  "num": 2,
  "title": "Chocolate Peanut Butter Protein Oats",
  "category": "breakfast",
  "description": "Creamy, decadent oats that taste like dessert but pack 28 grams of protein. This is the breakfast that converts skeptics — rich, chocolatey, and ready in under 10 minutes.",
  "nutrition": {
    "calories": 455,
    "protein": 28,
    "carbs": 52,
    "fat": 16,
    "fiber": 10
  },
  "prep": "5 min",
  "cook": "8 min",
  "totalMinutes": 13,
  "serves": "1",
  "level": "Easy",
  "mealPrep": true,
  "freezer": false,
  "proteins": [
    "hemp",
    "peanut",
    "protein powder"
  ],
  "why": [
    "Packs 28 g of plant protein per serving",
    "Ready in 5 min of prep",
    "Meal-prep friendly — make it ahead",
    "Family-approved, 100% plant-based"
  ],
  "ingredients": [
    "1/2 cup rolled oats",
    "1 cup unsweetened soy milk",
    "1 scoop (25 g) vegan chocolate protein powder",
    "1 tbsp cocoa powder",
    "2 tbsp natural peanut butter",
    "1 tbsp chia seeds",
    "1 tbsp maple syrup",
    "Pinch of salt",
    "1 tbsp hemp seeds, for topping",
    "Sliced banana, optional"
  ],
  "steps": [
    "Combine oats, soy milk, cocoa, chia, maple, and salt in a small saucepan.",
    "Bring to a gentle simmer over medium heat, stirring often, 5–6 minutes until thick and creamy.",
    "Remove from heat. Let cool 1 minute (so the protein powder doesn't clump), then stir in protein powder until smooth.",
    "Swirl in peanut butter.",
    "Transfer to a bowl. Top with hemp seeds and banana slices."
  ],
  "storage": {
    "fridge": "Up to 3 days.",
    "freezer": "Not recommended.",
    "reheat": "Microwave 60 seconds with a splash of soy milk."
  },
  "tips": {
    "substitutions": "Almond butter or sunflower butter works in place of peanut butter.",
    "serving": "Pair with a side of berries for added antioxidants.",
    "variations": "Make overnight oats: skip cooking, mix everything (except protein powder)."
  },
  "cookbookPage": 15,
  "image": IMGS[1]
},
{
  "id": "savory-chickpea-pancakes",
  "num": 3,
  "title": "Savory Chickpea Pancakes",
  "category": "breakfast",
  "description": "Crispy on the edges, tender in the middle, and naturally gluten-free. These chickpea-flour pancakes are loaded with fresh herbs and make a savory breakfast that feels like brunch at a café.",
  "nutrition": {
    "calories": 330,
    "protein": 19,
    "carbs": 36,
    "fat": 12,
    "fiber": 8
  },
  "prep": "10 min",
  "cook": "15 min",
  "totalMinutes": 25,
  "serves": "4",
  "level": "Easy",
  "mealPrep": true,
  "freezer": true,
  "proteins": [
    "chickpea"
  ],
  "why": [
    "Packs 19 g of plant protein per serving",
    "Ready in 10 min of prep",
    "Meal-prep friendly — make it ahead",
    "Freezer friendly for busy weeks",
    "Family-approved, 100% plant-based"
  ],
  "ingredients": [
    "1 1/2 cups chickpea flour",
    "1 1/2 cups water",
    "1 tbsp olive oil + more for cooking",
    "1/2 tsp baking powder",
    "1/2 tsp garlic powder",
    "1/2 tsp turmeric",
    "1 tsp salt",
    "1/4 tsp black pepper",
    "2 green onions, thinly sliced",
    "2 tbsp chopped fresh parsley",
    "1/2 cup grated zucchini, squeezed dry",
    "Optional: vegan yogurt and hot sauce for serving"
  ],
  "steps": [
    "Whisk chickpea flour, water, olive oil, baking powder, garlic, turmeric, salt, and pepper in a bowl until smooth.",
    "Let the batter rest 5 minutes (this is what makes them fluffy).",
    "Stir in green onions, parsley, and zucchini.",
    "Heat a nonstick skillet over medium heat and add a small drizzle of oil.",
    "Pour 1/4 cup of batter per pancake. Cook 3–4 minutes until bubbles form and edges look set.",
    "Flip and cook 2–3 minutes more until golden.",
    "Serve warm with vegan yogurt and a drizzle of hot sauce."
  ],
  "storage": {
    "fridge": "Up to 4 days in an airtight container.",
    "freezer": "Freeze in a single layer, then transfer to a bag for up to 2 months.",
    "reheat": "Toast in a dry skillet or pop in the toaster for 2 minutes."
  },
  "tips": {
    "substitutions": "Swap zucchini for grated carrot or finely chopped spinach.",
    "serving": "Layer with avocado and tomato for a savory breakfast sandwich.",
    "variations": "Add 1/2 cup crumbled tofu to the batter for an extra 8 g protein."
  },
  "cookbookPage": 17,
  "image": IMGS[2]
},
{
  "id": "berry-almond-protein-smoothie-bowl",
  "num": 4,
  "title": "Berry Almond Protein Smoothie Bowl",
  "category": "breakfast",
  "description": "Thick, frosty, and just sweet enough — this smoothie bowl tastes like ice cream for breakfast but delivers 30 grams of plant protein and a serious dose of antioxidants.",
  "nutrition": {
    "calories": 395,
    "protein": 30,
    "carbs": 48,
    "fat": 11,
    "fiber": 12
  },
  "prep": "7 min",
  "cook": "0 min",
  "totalMinutes": 7,
  "serves": "1",
  "level": "Easy",
  "mealPrep": false,
  "freezer": false,
  "proteins": [
    "hemp",
    "protein powder"
  ],
  "why": [
    "Packs 30 g of plant protein per serving",
    "Ready in 7 min of prep",
    "Family-approved, 100% plant-based"
  ],
  "ingredients": [
    "1 frozen banana",
    "1 cup frozen mixed berries",
    "1 scoop (25 g) vanilla vegan protein powder",
    "1/2 cup unsweetened soy milk",
    "2 tbsp almond butter",
    "1 tbsp hemp seeds",
    "Toppings: 2 tbsp granola, 1 tbsp sliced almonds, fresh berries, drizzle of nut butter"
  ],
  "steps": [
    "Add banana, frozen berries, protein powder, soy milk, almond butter, and hemp seeds to a high-powered blender.",
    "Blend on low, then gradually increase to high, using a tamper or scraping the sides until ultra-thick (add 1 tbsp soy milk at a time only if needed).",
    "Spoon into a chilled bowl and smooth the top.",
    "Arrange granola, almonds, and fresh berries on top in neat rows.",
    "Finish with a drizzle of nut butter and serve immediately."
  ],
  "storage": {
    "fridge": "Best eaten fresh; can blend without toppings and freeze in a jar for up to 1 month.",
    "freezer": "Freeze the blended base; thaw 10 minutes before serving.",
    "reheat": "Not applicable — serve cold."
  },
  "tips": {
    "substitutions": "Cashew butter or sunflower butter in place of almond butter.",
    "serving": "Pair with a side of toast topped with peanut butter for an even bigger.",
    "variations": "Add 1 cup spinach for a green version — you won't taste it."
  },
  "cookbookPage": 19,
  "image": IMGS[3]
},
{
  "id": "high-protein-tofu-breakfast-hash",
  "num": 5,
  "title": "High-Protein Tofu Breakfast Hash",
  "category": "breakfast",
  "description": "Crispy potatoes, golden tofu, smoky spices, and a generous handful of greens. This is the breakfast hash that fuels a long morning — diner energy, plant-powered nutrition.",
  "nutrition": {
    "calories": 410,
    "protein": 24,
    "carbs": 45,
    "fat": 16,
    "fiber": 9
  },
  "prep": "10 min",
  "cook": "25 min",
  "totalMinutes": 35,
  "serves": "4",
  "level": "Easy",
  "mealPrep": true,
  "freezer": true,
  "proteins": [
    "tofu"
  ],
  "why": [
    "Packs 24 g of plant protein per serving",
    "Ready in 10 min of prep",
    "Meal-prep friendly — make it ahead",
    "Freezer friendly for busy weeks",
    "Family-approved, 100% plant-based"
  ],
  "ingredients": [
    "1 block (14 oz) extra-firm tofu, pressed and cubed",
    "2 tbsp olive oil, divided",
    "1 lb baby potatoes, halved",
    "1 red bell pepper, diced",
    "1/2 red onion, diced",
    "2 cloves garlic, minced",
    "1 tsp smoked paprika",
    "1 tsp ground cumin",
    "1/2 tsp chili powder",
    "2 cups baby spinach",
    "Salt and pepper to taste",
    "2 tbsp nutritional yeast",
    "Fresh parsley, for garnish"
  ],
  "steps": [
    "Bring a pot of salted water to a boil. Add potatoes and parboil 6 minutes; drain.",
    "Meanwhile, heat 1 tbsp olive oil in a large skillet over medium-high heat. Add tofu, season with salt, and cook 8 minutes, flipping every 2 minutes, until golden on all sides. Remove from pan.",
    "Add remaining oil and the parboiled potatoes to the skillet. Cook 6–8 minutes until crisp and golden.",
    "Add bell pepper and onion; cook 3 minutes until softened.",
    "Stir in garlic, smoked paprika, cumin, and chili powder; cook 1 minute.",
    "Return tofu to the skillet. Add spinach and nutritional yeast; toss until spinach wilts.",
    "Taste, adjust salt and pepper, and garnish with parsley."
  ],
  "storage": {
    "fridge": "Up to 5 days in an airtight container.",
    "freezer": "Up to 2 months in freezer-safe containers.",
    "reheat": "Reheat in a skillet over medium heat for 5 minutes, or microwave 2 minutes."
  },
  "tips": {
    "substitutions": "Sweet potatoes work beautifully in place of baby potat oes.",
    "serving": "Top with sliced avocado and a drizzle of hot sauce.",
    "variations": "Add 1 cup cooked black beans to bump protein to 30 g per serving."
  },
  "cookbookPage": 21,
  "image": IMGS[4]
},
{
  "id": "tempeh-bacon-avocado-toast",
  "num": 6,
  "title": "Tempeh Bacon Avocado Toast",
  "category": "breakfast",
  "description": "Crispy, smoky, maple-glazed tempeh bacon layered over creamy avocado on toasted sourdough. This is brunch upgraded — and it's ready in 15 minutes.",
  "nutrition": {
    "calories": 445,
    "protein": 26,
    "carbs": 42,
    "fat": 20,
    "fiber": 12
  },
  "prep": "5 min",
  "cook": "10 min",
  "totalMinutes": 15,
  "serves": "2",
  "level": "Easy",
  "mealPrep": true,
  "freezer": false,
  "proteins": [
    "tempeh",
    "hemp"
  ],
  "why": [
    "Packs 26 g of plant protein per serving",
    "Ready in 5 min of prep",
    "Meal-prep friendly — make it ahead",
    "Family-approved, 100% plant-based"
  ],
  "ingredients": [
    "1 block (8 oz) tempeh, thinly sliced",
    "2 tbsp tamari or soy sauce",
    "1 tbsp maple syrup",
    "1 tbsp olive oil",
    "1 tsp smoked paprika",
    "1/2 tsp garlic powder",
    "1 ripe avocado",
    "1 tsp lemon juice",
    "Pinch of salt",
    "2 thick slices sourdough bread",
    "2 tbsp hemp seeds",
    "Red pepper flakes, optional"
  ],
  "steps": [
    "Whisk tamari, maple, olive oil, smoked paprika, and garlic powder in a shallow dish.",
    "Add tempeh slices and let marinate 5 minutes, flipping once.",
    "Heat a nonstick skillet over medium heat. Cook tempeh 3 minutes per side until crisp and caramelized.",
    "Mash avocado with lemon juice and salt in a small bowl.",
    "Toast sourdough until deeply golden.",
    "Spread mashed avocado on toast, top with tempeh bacon strips, and sprinkle with hemp seeds and red pepper flakes."
  ],
  "storage": {
    "fridge": "Tempeh bacon keeps 5 days; avocado mash is best fresh.",
    "freezer": "Cooked tempeh bacon freezes up to 1 month.",
    "reheat": "Reheat tempeh in a skillet 2 minutes per side."
  },
  "tips": {
    "substitutions": "Coconut aminos work in place of tamari for a milder, soy-free option.",
    "serving": "Add sliced tomato and fresh basil for a BLT-style toast.",
    "variations": "Layer in baby arugula and a thin smear of vegan cream chees e."
  },
  "cookbookPage": 23,
  "image": IMGS[5]
},
{
  "id": "mediterranean-chickpea-power-bowl",
  "num": 7,
  "title": "Mediterranean Chickpea Power Bowl",
  "category": "lunch",
  "description": "Lemony chickpeas, fluffy quinoa, crisp cucumbers, juicy tomatoes, and a creamy tahini drizzle. This bowl is the gold standard of meal-prep lunches — bright, filling, and never boring.",
  "nutrition": {
    "calories": 510,
    "protein": 26,
    "carbs": 58,
    "fat": 20,
    "fiber": 13
  },
  "prep": "15 min",
  "cook": "15 min",
  "totalMinutes": 30,
  "serves": "2",
  "level": "Easy",
  "mealPrep": true,
  "freezer": false,
  "proteins": [
    "chickpea"
  ],
  "why": [
    "Packs 26 g of plant protein per serving",
    "Ready in 15 min of prep",
    "Meal-prep friendly — make it ahead",
    "Family-approved, 100% plant-based"
  ],
  "ingredients": [
    "1 cup cooked quinoa",
    "1 can (15 oz) chickpeas, rinsed",
    "1 tbsp olive oil",
    "1 tsp smoked paprika",
    "1/2 tsp ground cumin",
    "1 cup cherry tomatoes, halved",
    "1 cucumber, diced",
    "1/4 red onion, thinly sliced",
    "1/4 cup kalamata olives",
    "1/4 cup chopped fresh parsley",
    "2 cups baby spinach",
    "Tahini dressing: 3 tbsp tahini, 2 tbsp lemon juice, 1 small garlic clove minced, 3–4 tbsp water, salt"
  ],
  "steps": [
    "Preheat oven to 425°F. Toss chickpeas with olive oil, smoked paprika, cumin, and salt on a sheet pan.",
    "Roast 18–20 minutes, shaking once, until crisp.",
    "Whisk all tahini dressing ingredients in a small bowl until creamy, adding water until pourable.",
    "Build bowls: divide quinoa and spinach between two bowls.",
    "Top with roasted chickpeas, tomatoes, cucumber, red onion, olives, and parsley.",
    "Drizzle generously with tahini dressing and serve."
  ],
  "storage": {
    "fridge": "Up to 4 days; store dressing separately.",
    "freezer": "Not recommended — best fresh.",
    "reheat": "Serve cold or at room temperature."
  },
  "tips": {
    "substitutions": "Farro or brown rice in place of quinoa.",
    "serving": "Add warmed whole-wheat pita for a bigger meal.",
    "variations": "Top with cubed marinated tofu for an extra 12 g protein."
  },
  "cookbookPage": 26,
  "image": IMGS[6]
},
{
  "id": "smoky-tempeh-caesar-wrap",
  "num": 8,
  "title": "Smoky Tempeh Caesar Wrap",
  "category": "lunch",
  "description": "Creamy cashew Caesar dressing, crunchy romaine, and smoky pan-seared tempeh wrapped in a soft tortilla. All the comfort of a classic Caesar, completely dairy-free.",
  "nutrition": {
    "calories": 475,
    "protein": 25,
    "carbs": 42,
    "fat": 22,
    "fiber": 8
  },
  "prep": "15 min",
  "cook": "10 min",
  "totalMinutes": 25,
  "serves": "2",
  "level": "Easy",
  "mealPrep": true,
  "freezer": false,
  "proteins": [
    "tempeh"
  ],
  "why": [
    "Packs 25 g of plant protein per serving",
    "Ready in 15 min of prep",
    "Meal-prep friendly — make it ahead",
    "Family-approved, 100% plant-based"
  ],
  "ingredients": [
    "1 block (8 oz) tempeh, cubed",
    "2 tbsp tamari",
    "1 tbsp maple syrup",
    "1 tsp smoked paprika",
    "1 tbsp olive oil",
    "2 large whole-wheat tortillas",
    "4 cups chopped romaine",
    "Caesar dressing: 1/3 cup raw cashews soaked 10 min in hot water, 2 tbsp lemon juice"
  ],
  "steps": [
    "Toss tempeh with tamari, maple, and smoked paprika; let sit 5 minutes.",
    "Heat olive oil in a skillet over medium-high heat. Cook tempeh 6 minutes, tossing occasionally, until golden.",
    "Drain cashews. Blend all dressing ingredients until silky smooth.",
    "Toss romaine with half the dressing in a large bowl.",
    "Warm tortillas. Fill each with dressed romaine and tempeh, drizzle with extra dressing.",
    "Roll tightly, slice in half, and serve."
  ],
  "storage": {
    "fridge": "Components keep 4 days; assemble just before eating.",
    "freezer": "Cooked tempeh freezes 1 month; dressing does not.",
    "reheat": "Reheat tempeh in a skillet for 2 minutes."
  },
  "tips": {
    "substitutions": "Sunflower seeds in place of cashews for nut-free.",
    "serving": "Add cherry tomatoes and avocado for a heartier wrap.",
    "variations": "Use the dressing on grain bowls or roasted broccoli."
  },
  "cookbookPage": 28,
  "image": IMGS[7]
},
{
  "id": "lentil-walnut-meatball-subs",
  "num": 9,
  "title": "Lentil Walnut Meatball Subs",
  "category": "lunch",
  "description": "Tender, herb-packed lentil-walnut meatballs simmered in marinara and tucked into a toasted sub roll. This is comfort food at its plant-based best.",
  "nutrition": {
    "calories": 560,
    "protein": 28,
    "carbs": 68,
    "fat": 20,
    "fiber": 14
  },
  "prep": "20 min",
  "cook": "30 min",
  "totalMinutes": 50,
  "serves": "4",
  "level": "Medium",
  "mealPrep": true,
  "freezer": true,
  "proteins": [
    "lentil"
  ],
  "why": [
    "Packs 28 g of plant protein per serving",
    "Ready in 20 min of prep",
    "Meal-prep friendly — make it ahead",
    "Freezer friendly for busy weeks",
    "Family-approved, 100% plant-based"
  ],
  "ingredients": [
    "1 cup cooked brown lentils",
    "3/4 cup raw walnuts",
    "1/2 cup rolled oats",
    "1/2 yellow onion, diced",
    "2 cloves garlic, minced",
    "2 tbsp tomato paste",
    "2 tbsp ground flaxseed + 5 tbsp water",
    "2 tbsp nutritional yeast",
    "1 tsp Italian seasoning",
    "1 tsp smoked paprika",
    "1 tsp salt",
    "2 tbsp olive oil",
    "2 cups marinara sauce",
    "4 whole-wheat sub rolls",
    "Fresh basil, for serving"
  ],
  "steps": [
    "Preheat oven to 400°F. Whisk flax and water; let sit 5 minutes.",
    "Pulse walnuts in a food processor until coarse crumbs. Add lentils, oats, onion, garlic, tomato paste, flax mixture, nutritional yeast, and seasonings. Pulse until combined but still textured.",
    "Roll into 16 balls. Place on a parchment-lined sheet pan and drizzle with olive oil.",
    "Bake 20 minutes, flipping halfway, until firm and golden.",
    "Warm marinara in a skillet. Add baked meatballs and simmer 5 minutes.",
    "Split and toast sub rolls. Fill each with 4 meatballs and plenty of sauce.",
    "Top with torn basil and serve."
  ],
  "storage": {
    "fridge": "Up to 5 days in sauce.",
    "freezer": "Freeze meatballs (with or without sauce) up to 3 months.",
    "reheat": "Reheat in a covered skillet over medium-low heat 8 minutes; microwave from frozen 3."
  },
  "tips": {
    "substitutions": "Pecans work in place of walnuts.",
    "serving": "Serve over spaghetti or polenta instead of a roll.",
    "variations": "Add a slice of vegan mozzarella before broiling the open subs for 2 minutes."
  },
  "cookbookPage": 30,
  "image": IMGS[8]
},
{
  "id": "crispy-tofu-banh-mi-bowl",
  "num": 10,
  "title": "Crispy Tofu Banh Mi Bowl",
  "category": "lunch",
  "description": "All the bright, punchy flavors of a classic banh mi — pickled veggies, fresh herbs, sriracha mayo — over a bowl of fluffy brown rice and crispy baked tofu.",
  "nutrition": {
    "calories": 485,
    "protein": 27,
    "carbs": 58,
    "fat": 16,
    "fiber": 9
  },
  "prep": "20 min",
  "cook": "25 min",
  "totalMinutes": 45,
  "serves": "2",
  "level": "Medium",
  "mealPrep": true,
  "freezer": false,
  "proteins": [
    "tofu"
  ],
  "why": [
    "Packs 27 g of plant protein per serving",
    "Ready in 20 min of prep",
    "Meal-prep friendly — make it ahead",
    "Family-approved, 100% plant-based"
  ],
  "ingredients": [
    "1 block (14 oz) extra-firm tofu, pressed and cubed",
    "2 tbsp tamari",
    "1 tbsp maple syrup",
    "2 tbsp cornstarch",
    "1 cup cooked brown rice",
    "Quick pickles: 1 carrot julienned, 1/2 daikon or cucumber julienned, 1/4 cup rice vinegar",
    "Sriracha mayo: 1/4 cup vegan mayo, 1 tbsp sriracha, 1 tsp lime juice",
    "Fresh cilantro and mint",
    "1 jalapeño, sliced",
    "Lime wedges"
  ],
  "steps": [
    "Preheat oven to 425°F. Toss tofu with tamari and maple, then dust with cornstarch.",
    "Spread on a parchment-lined sheet pan. Bake 25 minutes, flipping once, until crisp.",
    "Combine pickle ingredients in a bowl; let sit at least 15 minutes.",
    "Whisk sriracha mayo ingredients in a small bowl.",
    "Divide rice between two bowls. Top with tofu, pickled veg, herbs, and jalapeño.",
    "Drizzle with sriracha mayo and serve with lime wedges."
  ],
  "storage": {
    "fridge": "Components keep 4 days separately.",
    "freezer": "Tofu freezes 1 month; pickles and mayo do not.",
    "reheat": "Reheat tofu in a 375°F oven 8 minutes; assemble cold bowl."
  },
  "tips": {
    "substitutions": "Cucumber works in place of daikon; tahini-sriracha works in place.",
    "serving": "Wrap everything in butter lettuce or rice paper for a fresh roll twist.",
    "variations": "Add edamame for an extra 8 g protein."
  },
  "cookbookPage": 32,
  "image": IMGS[9]
},
{
  "id": "white-bean-tuna-less-salad",
  "num": 11,
  "title": "White Bean Tuna-less Salad",
  "category": "lunch",
  "description": "Mashed white beans, crunchy celery, briny capers, and creamy vegan mayo on toasted whole-grain bread. It's the lunchbox classic, completely reimagined.",
  "nutrition": {
    "calories": 440,
    "protein": 22,
    "carbs": 52,
    "fat": 14,
    "fiber": 11
  },
  "prep": "10 min",
  "cook": "0 min",
  "totalMinutes": 10,
  "serves": "2",
  "level": "Easy",
  "mealPrep": true,
  "freezer": false,
  "proteins": [
    "bean"
  ],
  "why": [
    "Packs 22 g of plant protein per serving",
    "Ready in 10 min of prep",
    "Meal-prep friendly — make it ahead",
    "Family-approved, 100% plant-based"
  ],
  "ingredients": [
    "1 can (15 oz) cannellini beans, rinsed",
    "2 tbsp vegan mayo",
    "1 tbsp Dijon mustard",
    "1 tbsp lemon juice",
    "1 tbsp capers, drained",
    "2 celery stalks, finely diced",
    "1/4 red onion, finely diced",
    "2 tbsp chopped parsley",
    "1 sheet nori, crumbled (optional, for ocean flavor)",
    "Salt and pepper",
    "4 slices whole-grain bread",
    "Lettuce, tomato, sliced cucumber for serving"
  ],
  "steps": [
    "Mash beans in a bowl with a fork until mostly broken down but still chunky.",
    "Stir in mayo, Dijon, lemon juice, capers, celery, red onion, parsley, and nori (if using).",
    "Season generously with salt and pepper.",
    "Toast bread until golden.",
    "Spread the salad on two slices, layer with lettuce, tomato, and cucumber. Top with remaining bread.",
    "Slice in half and serve."
  ],
  "storage": {
    "fridge": "Salad keeps 4 days in an airtight container; assemble sandwiches fresh.",
    "freezer": "Not recommended.",
    "reheat": "Serve cold."
  },
  "tips": {
    "substitutions": "Mashed chickpeas work beautifully in place of cannelli ni.",
    "serving": "Serve over a bed of greens for a low-carb version.",
    "variations": "Add diced pickles or a teaspoon of relish for extra brightn ess."
  },
  "cookbookPage": 34,
  "image": IMGS[10]
},
{
  "id": "edamame-soba-noodle-salad",
  "num": 12,
  "title": "Edamame Soba Noodle Salad",
  "category": "lunch",
  "description": "Chewy buckwheat soba tossed in a sesame-ginger dressing with shelled edamame, crunchy veggies, and a shower of sesame seeds. Refreshing, cold, and crazy satisfying.",
  "nutrition": {
    "calories": 470,
    "protein": 24,
    "carbs": 62,
    "fat": 14,
    "fiber": 9
  },
  "prep": "10 min",
  "cook": "12 min",
  "totalMinutes": 22,
  "serves": "3",
  "level": "Easy",
  "mealPrep": true,
  "freezer": false,
  "proteins": [
    "edamame"
  ],
  "why": [
    "Packs 24 g of plant protein per serving",
    "Ready in 10 min of prep",
    "Meal-prep friendly — make it ahead",
    "Family-approved, 100% plant-based"
  ],
  "ingredients": [
    "8 oz buckwheat soba noodles",
    "2 cups shelled edamame",
    "1 red bell pepper, thinly sliced",
    "1 cup shredded carrots",
    "1 cucumber, julienned",
    "3 green onions, sliced",
    "Dressing: 3 tbsp tamari, 2 tbsp rice vinegar, 1 tbsp sesame oil, 1 tbsp maple syrup, 1 tbsp grated ginger, 1 garlic clove minced",
    "Sesame seeds and cilantro for serving"
  ],
  "steps": [
    "Cook soba noodles according to package directions; rinse under cold water.",
    "Steam edamame 4–5 minutes until tender; cool slightly.",
    "Whisk dressing ingredients in a large bowl.",
    "Add noodles, edamame, bell pepper, carrots, cucumber, and green onions. Toss well.",
    "Chill 15 minutes for best flavor, then garnish with sesame seeds and cilantro."
  ],
  "storage": {
    "fridge": "Up to 4 days. Toss before serving.",
    "freezer": "Not recommended.",
    "reheat": "Serve cold or room temperature."
  },
  "tips": {
    "substitutions": "Rice noodles work if soba is unavailable.",
    "serving": "Add baked tofu for extra protein.",
    "variations": "Add chili crisp or sriracha for heat."
  },
  "cookbookPage": 36,
  "image": IMGS[11]
},
{
  "id": "sticky-sesame-tofu-with-broccoli",
  "num": 13,
  "title": "Sticky Sesame Tofu with Broccoli",
  "category": "dinner",
  "description": "Crispy cubes of tofu glazed in a sticky-sweet sesame sauce, served over rice with bright green broccoli. Better than takeout, ready in 30 minutes.",
  "nutrition": {
    "calories": 510,
    "protein": 30,
    "carbs": 58,
    "fat": 16,
    "fiber": 8
  },
  "prep": "10 min",
  "cook": "20 min",
  "totalMinutes": 30,
  "serves": "4",
  "level": "Easy",
  "mealPrep": true,
  "freezer": false,
  "proteins": [
    "tofu"
  ],
  "why": [
    "Packs 30 g of plant protein per serving",
    "Ready in 10 min of prep",
    "Meal-prep friendly — make it ahead",
    "Family-approved, 100% plant-based"
  ],
  "ingredients": [
    "1 block (14 oz) extra-firm tofu, pressed and cubed",
    "3 tbsp cornstarch, divided",
    "2 tbsp olive oil",
    "4 cups broccoli florets",
    "Sauce: 1/3 cup tamari, 1/4 cup maple syrup, 2 tbsp rice vinegar, 2 tbsp tomato paste",
    "Sesame seeds and green onions for garnish",
    "Cooked brown rice for serving"
  ],
  "steps": [
    "Toss tofu cubes with 2 tbsp cornstarch.",
    "Heat olive oil in a large nonstick skillet over medium-high heat. Cook tofu 8 minutes, turning occasionally, until golden on all sides. Remove from skillet.",
    "In the same skillet, add broccoli with 2 tbsp water. Cover and steam 3 minutes; uncover and cook 2 more minutes.",
    "Whisk sauce ingredients in a bowl. Whisk remaining 1 tbsp cornstarch into the sauce.",
    "Return tofu to the skillet. Pour sauce over and cook 3 minutes, stirring, until thick and glossy.",
    "Serve over brown rice; garnish with sesame seeds and green onions."
  ],
  "storage": {
    "fridge": "Up to 4 days in an airtight container.",
    "freezer": "Up to 2 months; sauce may thin on reheating.",
    "reheat": "Microwave 2 minutes or reheat in a skillet over medium heat."
  },
  "tips": {
    "substitutions": "Tempeh works in place of tofu.",
    "serving": "Add cashews for crunch and serve with cauliflower rice for low-carb.",
    "variations": "Swap broccoli for snap peas, bok choy, or green beans."
  },
  "cookbookPage": 39,
  "image": IMGS[12]
},
{
  "id": "one-pot-lentil-bolognese",
  "num": 14,
  "title": "One-Pot Lentil Bolognese",
  "category": "dinner",
  "description": "Rich, deeply savory lentil bolognese with a glug of red wine and a Parmesan-like topping of nutritional yeast. One pot, weeknight-easy, and freezes like a dream.",
  "nutrition": {
    "calories": 525,
    "protein": 26,
    "carbs": 78,
    "fat": 10,
    "fiber": 16
  },
  "prep": "10 min",
  "cook": "30 min",
  "totalMinutes": 40,
  "serves": "4",
  "level": "Easy",
  "mealPrep": true,
  "freezer": true,
  "proteins": [
    "lentil"
  ],
  "why": [
    "Packs 26 g of plant protein per serving",
    "Ready in 10 min of prep",
    "Meal-prep friendly — make it ahead",
    "Freezer friendly for busy weeks",
    "Family-approved, 100% plant-based"
  ],
  "ingredients": [
    "1 tbsp olive oil",
    "1 yellow onion, diced",
    "2 carrots, finely diced",
    "2 celery stalks, finely diced",
    "4 cloves garlic, minced",
    "1 tbsp Italian seasoning",
    "1 tsp smoked paprika",
    "2 tbsp tomato paste",
    "1/4 cup red wine (optional)",
    "1 can (28 oz) crushed tomatoes",
    "1 1/4 cups dry green or brown lentils, rinsed",
    "3 cups vegetable broth",
    "1 tsp salt",
    "12 oz whole-wheat spaghetti",
    "Nutritional yeast and fresh basil for serving"
  ],
  "steps": [
    "Heat olive oil in a large pot over medium heat. Add onion, carrots, and celery; cook 6 minutes until softened.",
    "Add garlic, Italian seasoning, smoked paprika, and tomato paste; cook 1 minute until fragrant.",
    "Pour in red wine (if using) and simmer 1 minute.",
    "Add crushed tomatoes, lentils, broth, and salt. Bring to a boil, then reduce heat and simmer covered 25 minutes, stirring occasionally, until lentils are tender.",
    "Meanwhile, cook spaghetti according to package directions.",
    "Taste sauce and adjust salt. Serve over spaghetti, topped generously with nutritional yeast and basil."
  ],
  "storage": {
    "fridge": "Sauce keeps 5 days in the fridge.",
    "freezer": "Sauce freezes up to 3 months.",
    "reheat": "Reheat sauce in a saucepan with a splash of water; microwave from fro zen 4 minutes."
  },
  "tips": {
    "substitutions": "Walnuts (chopped) can replace 1/2 cup of the lentils for a meatier.",
    "serving": "Serve over zucchini noodles or polenta.",
    "variations": "Add a handful of chopped mushrooms with the onions for extr a umami."
  },
  "cookbookPage": 41,
  "image": IMGS[13]
},
{
  "id": "bbq-tempeh-sweet-potato-bowls",
  "num": 15,
  "title": "BBQ Tempeh Sweet Potato Bowls",
  "category": "dinner",
  "description": "Sticky, smoky BBQ tempeh over roasted sweet potatoes with crunchy slaw and creamy avocado. Sweet, smoky, and ridiculously satisfying.",
  "nutrition": {
    "calories": 560,
    "protein": 27,
    "carbs": 68,
    "fat": 20,
    "fiber": 13
  },
  "prep": "15 min",
  "cook": "30 min",
  "totalMinutes": 45,
  "serves": "4",
  "level": "Easy",
  "mealPrep": true,
  "freezer": true,
  "proteins": [
    "tempeh"
  ],
  "why": [
    "Packs 27 g of plant protein per serving",
    "Ready in 15 min of prep",
    "Meal-prep friendly — make it ahead",
    "Freezer friendly for busy weeks",
    "Family-approved, 100% plant-based"
  ],
  "ingredients": [
    "2 medium sweet potatoes, cubed",
    "2 tbsp olive oil",
    "Salt and pepper",
    "2 blocks (8 oz each) tempeh, sliced",
    "1/2 cup BBQ sauce + 2 tbsp tamari + 1 tbsp maple syrup",
    "Slaw: 3 cups shredded green cabbage, 1 shredded carrot, 2 tbsp vegan mayo, 1 tbsp apple cider",
    "1 avocado, sliced",
    "Green onions, sliced"
  ],
  "steps": [
    "Preheat oven to 425°F. Toss sweet potatoes with olive oil, salt, and pepper. Roast 25 minutes, flipping once.",
    "Steam tempeh slices 10 minutes (removes bitterness and helps it absorb flavor).",
    "Whisk BBQ sauce, tamari, and maple in a bowl. Add tempeh and toss to coat.",
    "Heat a skillet over medium heat. Cook tempeh 4 minutes per side until caramelized.",
    "Toss all slaw ingredients in a bowl.",
    "Build bowls: sweet potatoes, BBQ tempeh, slaw, and avocado. Top with green onions."
  ],
  "storage": {
    "fridge": "Up to 5 days; assemble bowls fresh.",
    "freezer": "BBQ tempeh and sweet potatoes freeze 2 months; slaw does not.",
    "reheat": "Reheat tempeh and sweet potatoes in a 375°F oven 10 minutes."
  },
  "tips": {
    "substitutions": "Russet potatoes or cauliflower work in place of sweet potato.",
    "serving": "Pile into wraps or buns for BBQ tempeh sandwiches.",
    "variations": "Add black beans for an extra 8 g protein."
  },
  "cookbookPage": 44,
  "image": IMGS[14]
},
{
  "id": "tuscan-white-bean-skillet",
  "num": 16,
  "title": "Tuscan White Bean Skillet",
  "category": "dinner",
  "description": "Creamy white beans simmered with sun-dried tomatoes, garlic, and wilted spinach in a luscious coconut-milk broth. Twenty minutes, one pan, restaurant-level flavor.",
  "nutrition": {
    "calories": 445,
    "protein": 21,
    "carbs": 48,
    "fat": 18,
    "fiber": 12
  },
  "prep": "5 min",
  "cook": "15 min",
  "totalMinutes": 20,
  "serves": "4",
  "level": "Easy",
  "mealPrep": true,
  "freezer": true,
  "proteins": [
    "bean"
  ],
  "why": [
    "Packs 21 g of plant protein per serving",
    "Ready in 5 min of prep",
    "Meal-prep friendly — make it ahead",
    "Freezer friendly for busy weeks",
    "Family-approved, 100% plant-based"
  ],
  "ingredients": [
    "2 tbsp olive oil",
    "1 yellow onion, diced",
    "4 cloves garlic, minced",
    "1/2 cup chopped oil-packed sun-dried tomatoes",
    "1 tsp Italian seasoning",
    "1/2 tsp red pepper flakes",
    "2 cans (15 oz each) cannellini beans, rinsed",
    "1 can (13.5 oz) full-fat coconut milk",
    "2 tbsp nutritional yeast",
    "1 tbsp lemon juice",
    "5 cups baby spinach",
    "Salt and pepper",
    "Fresh basil for garnish",
    "Crusty bread for serving"
  ],
  "steps": [
    "Heat olive oil in a large skillet over medium heat. Add onion and cook 5 minutes.",
    "Add garlic, sun-dried tomatoes, Italian seasoning, and red pepper flakes; cook 1 minute.",
    "Stir in beans, coconut milk, and nutritional yeast. Simmer 5 minutes, mashing some beans against the side of the pan to thicken.",
    "Stir in spinach a handful at a time until wilted.",
    "Finish with lemon juice; season with salt and pepper.",
    "Top with basil and serve with crusty bread."
  ],
  "storage": {
    "fridge": "Up to 5 days in an airtight container.",
    "freezer": "Up to 3 months.",
    "reheat": "Reheat in a covered skillet with a splash of water, or microwave 2 minutes."
  },
  "tips": {
    "substitutions": "Light coconut milk or unsweetened oat creamer also wor ks.",
    "serving": "Serve over polenta or whole-wheat pasta.",
    "variations": "Stir in cubed tofu or chickpeas for extra protein."
  },
  "cookbookPage": 46,
  "image": IMGS[15]
},
{
  "id": "spicy-peanut-tempeh-stir-fry",
  "num": 17,
  "title": "Spicy Peanut Tempeh Stir-Fry",
  "category": "dinner",
  "description": "A craveable stir-fry with crispy tempeh, crunchy veggies, and a rich peanut-lime sauce. The flavor-to-effort ratio here is unbeatable.",
  "nutrition": {
    "calories": 525,
    "protein": 29,
    "carbs": 42,
    "fat": 26,
    "fiber": 8
  },
  "prep": "15 min",
  "cook": "15 min",
  "totalMinutes": 30,
  "serves": "3",
  "level": "Easy",
  "mealPrep": true,
  "freezer": false,
  "proteins": [
    "tempeh",
    "peanut"
  ],
  "why": [
    "Packs 29 g of plant protein per serving",
    "Ready in 15 min of prep",
    "Meal-prep friendly — make it ahead",
    "Family-approved, 100% plant-based"
  ],
  "ingredients": [
    "1 block (8 oz) tempeh, cubed",
    "2 tbsp olive oil, divided",
    "2 cups snap peas",
    "1 red bell pepper, sliced",
    "2 cups broccoli florets",
    "Sauce: 3 tbsp peanut butter, 2 tbsp tamari, 2 tbsp lime juice",
    "1 tbsp maple syrup, 1 tbsp grated",
    "Cooked rice or rice noodles for serving",
    "Chopped peanuts and cilantro for serving"
  ],
  "steps": [
    "Steam tempeh cubes 8 minutes.",
    "Heat 1 tbsp oil in a large skillet over medium-high heat. Cook tempeh 5 minutes until golden; remove.",
    "Whisk sauce ingredients until smooth.",
    "Add remaining oil to the skillet. Stir-fry snap peas, bell pepper, and broccoli 4 minutes until crisp-tender.",
    "Return tempeh; pour sauce over and toss 2 minutes until everything is glossy.",
    "Serve over rice; top with peanuts and cilantro."
  ],
  "storage": {
    "fridge": "Up to 4 days in an airtight container.",
    "freezer": "Not recommended.",
    "reheat": "Reheat in a skillet 4 minutes with a splash of water."
  },
  "tips": {
    "substitutions": "Almond butter or sunflower butter in place of peanut butter.",
    "serving": "Wrap in lettuce leaves for a low-carb option.",
    "variations": "Add cubed pineapple for sweet-spicy contrast."
  },
  "cookbookPage": 48,
  "image": IMGS[16]
},
{
  "id": "seitan-steak-fajitas",
  "num": 18,
  "title": "Seitan Steak Fajitas",
  "category": "dinner",
  "description": "Sizzling strips of marinated seitan with charred peppers and onions, piled into warm tortillas with all the fixings. This is fajita night, perfected.",
  "nutrition": {
    "calories": 490,
    "protein": 32,
    "carbs": 52,
    "fat": 14,
    "fiber": 8
  },
  "prep": "15 min",
  "cook": "15 min",
  "totalMinutes": 30,
  "serves": "4",
  "level": "Easy",
  "mealPrep": true,
  "freezer": true,
  "proteins": [
    "seitan"
  ],
  "why": [
    "Packs 32 g of plant protein per serving",
    "Ready in 15 min of prep",
    "Meal-prep friendly — make it ahead",
    "Freezer friendly for busy weeks",
    "Family-approved, 100% plant-based"
  ],
  "ingredients": [
    "12 oz seitan, sliced",
    "Marinade: 3 tbsp lime juice, 2 tbsp olive oil, 2 tbsp tamari, 2 tsp smoked paprika, 1 tsp ground cumin",
    "2 bell peppers, sliced",
    "1 yellow onion, sliced",
    "8 small whole-wheat tortillas",
    "Toppings: vegan sour cream, salsa, sliced avocado, fresh cilantro"
  ],
  "steps": [
    "Whisk marinade ingredients in a bowl. Toss with seitan and rest 10 minutes.",
    "Heat a large skillet over high heat. Add peppers and onion; cook 5–6 minutes until charred at the edges.",
    "Add marinated seitan and cook 4–5 minutes until browned and sizzling.",
    "Warm tortillas in a dry skillet.",
    "Serve fajita filling with tortillas and toppings."
  ],
  "storage": {
    "fridge": "Up to 4 days. Store tortillas separately.",
    "freezer": "Filling freezes up to 2 months.",
    "reheat": "Reheat filling in a hot skillet 3–4 minutes."
  },
  "tips": {
    "substitutions": "Portobello mushrooms or tofu can replace seitan.",
    "serving": "Serve with lime wedges and quick pickled onions.",
    "variations": "Add jalapeños for extra heat."
  },
  "cookbookPage": 50,
  "image": IMGS[17]
},
{
  "id": "high-protein-burrito-bowls",
  "num": 19,
  "title": "High-Protein Burrito Bowls",
  "category": "meal-prep",
  "description": "Five identical, perfectly portioned burrito bowls layered with cilantro-lime rice, seasoned beans, fajita veggies, and crispy tofu. Sunday-prep magic.",
  "nutrition": {
    "calories": 525,
    "protein": 28,
    "carbs": 68,
    "fat": 16,
    "fiber": 14
  },
  "prep": "20 min",
  "cook": "35 min",
  "totalMinutes": 55,
  "serves": "5",
  "level": "Easy",
  "mealPrep": true,
  "freezer": true,
  "proteins": [
    "tofu",
    "bean"
  ],
  "why": [
    "Packs 28 g of plant protein per serving",
    "Ready in 20 min of prep",
    "Meal-prep friendly — make it ahead",
    "Freezer friendly for busy weeks",
    "Family-approved, 100% plant-based"
  ],
  "ingredients": [
    "1 1/2 cups brown rice, cooked",
    "1/4 cup chopped cilantro + zest and juice of 1 lime",
    "1 block (14 oz) extra-firm tofu, cubed",
    "2 tbsp cornstarch",
    "2 tbsp olive oil, divided",
    "1 tbsp taco seasoning",
    "2 bell peppers, sliced",
    "1 yellow onion, sliced",
    "1 can (15 oz) black beans, rinsed, warmed with 1/2 tsp cumin",
    "1 cup corn kernels",
    "1 cup salsa",
    "1 avocado, sliced (add fresh each day)"
  ],
  "steps": [
    "Stir cooked rice with cilantro, lime zest and juice. Cool.",
    "Toss tofu with cornstarch and taco seasoning. Heat 1 tbsp oil in a skillet over medium-high; cook tofu 8 minutes until crisp.",
    "In another skillet, heat remaining oil and sauté peppers and onion 6 minutes until charred.",
    "Divide rice between 5 meal-prep containers. Top each with beans, peppers and onion, corn, and tofu.",
    "Add 2 tbsp salsa to each. Cool fully before sealing.",
    "Refrigerate; add fresh avocado the day of eating."
  ],
  "storage": {
    "fridge": "Up to 5 days.",
    "freezer": "Without avocado, up to 2 months.",
    "reheat": "Microwave covered 2–3 minutes until steaming."
  },
  "tips": {
    "substitutions": "Quinoa or cauliflower rice works for the base.",
    "serving": "Top with cashew sour cream or pickled jalapeños.",
    "variations": "Add a handful of roasted sweet potato cubes for extra fiber ."
  },
  "cookbookPage": 53,
  "image": IMGS[18]
},
{
  "id": "mediterranean-quinoa-jars",
  "num": 20,
  "title": "Mediterranean Quinoa Jars",
  "category": "meal-prep",
  "description": "Layered glass jars stacked with quinoa, chickpeas, cucumbers, tomatoes, and a zesty lemon-tahini dressing waiting at the bottom. Grab and go all week.",
  "nutrition": {
    "calories": 510,
    "protein": 24,
    "carbs": 60,
    "fat": 18,
    "fiber": 12
  },
  "prep": "20 min",
  "cook": "15 min",
  "totalMinutes": 35,
  "serves": "4",
  "level": "Easy",
  "mealPrep": true,
  "freezer": false,
  "proteins": [
    "chickpea"
  ],
  "why": [
    "Packs 24 g of plant protein per serving",
    "Ready in 20 min of prep",
    "Meal-prep friendly — make it ahead",
    "Family-approved, 100% plant-based"
  ],
  "ingredients": [
    "Dressing: 1/4 cup tahini, 3 tbsp lemon juice, 1 small garlic clove minced, 1 tbsp olive oil, 1 tsp maple syrup",
    "1 1/2 cups cooked quinoa",
    "1 can (15 oz) chickpeas, rinsed",
    "1 cucumber, diced",
    "1 cup cherry tomatoes, halved",
    "1/2 red onion, diced",
    "1/3 cup kalamata olives",
    "1/4 cup chopped parsley",
    "4 cups baby spinach",
    "4 wide-mouth quart jars"
  ],
  "steps": [
    "Whisk dressing ingredients until smooth.",
    "In each jar, layer in this order: 3 tbsp dressing, chickpeas, tomatoes, cucumber, red onion, olives, quinoa, parsley, spinach.",
    "Seal jars tightly. Refrigerate up to 5 days.",
    "When ready to eat, shake jar or invert into a bowl. Toss and enjoy."
  ],
  "storage": {
    "fridge": "Up to 5 days; dressing-on-bottom layering keeps everything crisp.",
    "freezer": "Not recommended.",
    "reheat": "Serve cold."
  },
  "tips": {
    "substitutions": "Farro or barley can replace quinoa.",
    "serving": "Add cubed marinated tofu for an extra 12 g protein.",
    "variations": "Swap cucumbers for shredded carrots in warmer months."
  },
  "cookbookPage": 55,
  "image": IMGS[19]
},
{
  "id": "lemon-herb-lentil-meal-prep",
  "num": 21,
  "title": "Lemon Herb Lentil Meal Prep",
  "category": "meal-prep",
  "description": "A bright, herby lentil dish layered with roasted vegetables and finished with a punchy lemon-mustard dressing. Lunch box-ready and packed with 25 grams of protein.",
  "nutrition": {
    "calories": 440,
    "protein": 25,
    "carbs": 52,
    "fat": 12,
    "fiber": 16
  },
  "prep": "15 min",
  "cook": "30 min",
  "totalMinutes": 45,
  "serves": "4",
  "level": "Easy",
  "mealPrep": false,
  "freezer": true,
  "proteins": [
    "lentil"
  ],
  "why": [
    "Packs 25 g of plant protein per serving",
    "Ready in 15 min of prep",
    "Freezer friendly for busy weeks",
    "Family-approved, 100% plant-based"
  ],
  "ingredients": [
    "1 1/2 cups dry French green lentils",
    "4 cups water",
    "1 tsp salt",
    "1 lb baby potatoes, halved",
    "2 cups Brussels sprouts, halved",
    "2 tbsp olive oil",
    "Dressing: 3 tbsp olive oil, 2 tbsp lemon juice, 1 tbsp Dijon, 1 tsp maple syrup, 1 garlic clove minced",
    "1/4 cup chopped parsley",
    "1/4 cup chopped dill",
    "4 cups arugula"
  ],
  "steps": [
    "Preheat oven to 425°F. Toss potatoes and Brussels sprouts with olive oil, salt, and pepper. Roast 25 minutes.",
    "Meanwhile, simmer lentils in salted water 20 minutes until tender; drain.",
    "Whisk dressing ingredients in a small jar.",
    "In a large bowl, combine warm lentils, dressing, and herbs.",
    "Divide arugula between 4 containers. Top with lentil mixture and roasted vegetables.",
    "Cool fully before sealing."
  ],
  "storage": {
    "fridge": "Up to 5 days.",
    "freezer": "Up to 2 months without arugula.",
    "reheat": "Best at room temperature; microwave lentils and veg 90 seconds if pre ferred warm."
  },
  "tips": {
    "substitutions": "Brown lentils work, but French green lentils hold their shape best.",
    "serving": "Top with cubed avocado the day of eating.",
    "variations": "Add roasted chickpeas for an extra 8 g protein."
  },
  "cookbookPage": 57,
  "image": IMGS[20]
},
{
  "id": "buffalo-chickpea-wraps",
  "num": 22,
  "title": "Buffalo Chickpea Wraps",
  "category": "meal-prep",
  "description": "Spicy buffalo-roasted chickpeas with crisp romaine, ranch-style cashew dressing, and shredded carrots, all wrapped in a soft tortilla. Big game-day energy.",
  "nutrition": {
    "calories": 470,
    "protein": 20,
    "carbs": 58,
    "fat": 18,
    "fiber": 12
  },
  "prep": "15 min",
  "cook": "25 min",
  "totalMinutes": 40,
  "serves": "4",
  "level": "Easy",
  "mealPrep": true,
  "freezer": false,
  "proteins": [
    "chickpea"
  ],
  "why": [
    "Packs 20 g of plant protein per serving",
    "Ready in 15 min of prep",
    "Meal-prep friendly — make it ahead",
    "Family-approved, 100% plant-based"
  ],
  "ingredients": [
    "2 cans (15 oz each) chickpeas, rinsed and patted dry",
    "1/3 cup buffalo hot sauce",
    "2 tbsp olive oil",
    "Ranch: 1/2 cup raw cashews soaked 10 min, 2 tbsp lemon juice, 2 tbsp water, 1 tsp garlic powder",
    "4 large whole-wheat tortillas",
    "4 cups chopped romaine",
    "2 carrots, shredded",
    "1 celery stalk, thinly sliced"
  ],
  "steps": [
    "Preheat oven to 425°F. Toss chickpeas with olive oil and a little salt. Roast 20 minutes until crisp.",
    "Toss roasted chickpeas with buffalo sauce.",
    "Blend all ranch ingredients until silky smooth.",
    "Build wraps: tortilla, ranch, romaine, carrots, celery, buffalo chickpeas.",
    "Roll tightly. Wrap each in parchment for grab-and-go.",
    "Store in the fridge."
  ],
  "storage": {
    "fridge": "Best within 3 days.",
    "freezer": "Not recommended.",
    "reheat": "Serve cold or warm 30 seconds in the microwave."
  },
  "tips": {
    "substitutions": "Sunflower seeds in place of cashews for nut-free.",
    "serving": "Pile into a bowl with rice for a buffalo grain bowl.",
    "variations": "Add sliced avocado for extra creaminess."
  },
  "cookbookPage": 59,
  "image": IMGS[21]
},
{
  "id": "sheet-pan-tofu-veggies",
  "num": 23,
  "title": "Sheet Pan Tofu & Veggies",
  "category": "meal-prep",
  "description": "Everything roasts on one pan with a maple-mustard glaze that caramelizes around chunky tofu, sweet potato, broccoli, and red onion. Zero stress, maximum flavor.",
  "nutrition": {
    "calories": 470,
    "protein": 26,
    "carbs": 52,
    "fat": 18,
    "fiber": 11
  },
  "prep": "10 min",
  "cook": "30 min",
  "totalMinutes": 40,
  "serves": "4",
  "level": "Easy",
  "mealPrep": true,
  "freezer": true,
  "proteins": [
    "tofu"
  ],
  "why": [
    "Packs 26 g of plant protein per serving",
    "Ready in 10 min of prep",
    "Meal-prep friendly — make it ahead",
    "Freezer friendly for busy weeks",
    "Family-approved, 100% plant-based"
  ],
  "ingredients": [
    "1 block (14 oz) extra-firm tofu, cubed",
    "2 medium sweet potatoes, cubed",
    "4 cups broccoli florets",
    "1 red onion, cut into wedges",
    "Glaze: 3 tbsp olive oil, 2 tbsp maple syrup, 2 tbsp Dijon, 2 tbsp tamari, 2 tsp smoked paprika, 1 tsp garlic powder",
    "Sesame seeds and green onions"
  ],
  "steps": [
    "Preheat oven to 425°F. Line a large sheet pan with parchment.",
    "Whisk glaze ingredients in a large bowl.",
    "Add tofu, sweet potato, broccoli, and red onion. Toss to coat.",
    "Spread in a single layer on the sheet pan.",
    "Roast 25–30 minutes, flipping halfway, until everything is golden and tender.",
    "Sprinkle with sesame seeds and green onions; divide into meal-prep containers."
  ],
  "storage": {
    "fridge": "Up to 5 days.",
    "freezer": "Up to 2 months.",
    "reheat": "Reheat in a 375°F oven 10 minutes, or microwave 2 minutes."
  },
  "tips": {
    "substitutions": "Cauliflower, bell peppers, or carrots work in place of broccoli.",
    "serving": "Serve over rice or quinoa.",
    "variations": "Drizzle with peanut sauce for a Thai-inspired version."
  },
  "cookbookPage": 61,
  "image": IMGS[22]
},
{
  "id": "curried-lentil-stew",
  "num": 24,
  "title": "Curried Lentil Stew",
  "category": "meal-prep",
  "description": "Warming red lentils simmered with coconut milk, sweet potato, and Indian-inspired spices. This freezes like a champion — make once, eat all month.",
  "nutrition": {
    "calories": 440,
    "protein": 20,
    "carbs": 58,
    "fat": 14,
    "fiber": 13
  },
  "prep": "10 min",
  "cook": "30 min",
  "totalMinutes": 40,
  "serves": "6",
  "level": "Easy",
  "mealPrep": true,
  "freezer": false,
  "proteins": [
    "lentil"
  ],
  "why": [
    "Packs 20 g of plant protein per serving",
    "Ready in 10 min of prep",
    "Meal-prep friendly — make it ahead",
    "Family-approved, 100% plant-based"
  ],
  "ingredients": [
    "1 tbsp olive oil",
    "1 yellow onion, diced",
    "4 cloves garlic, minced",
    "1 tbsp grated ginger",
    "2 tbsp curry powder",
    "1 tsp ground cumin",
    "1/2 tsp turmeric",
    "1 medium sweet potato, cubed",
    "1 1/2 cups red lentils, rinsed",
    "1 can (13.5 oz) coconut milk",
    "4 cups vegetable broth",
    "1 can (14.5 oz) diced tomatoes",
    "1 tsp salt",
    "4 cups baby spinach",
    "Juice of 1 lime",
    "Cilantro and cooked rice for serving"
  ],
  "steps": [
    "Heat olive oil in a large pot over medium heat. Cook onion 5 minutes.",
    "Add garlic, ginger, curry powder, cumin, and turmeric. Cook 1 minute.",
    "Stir in sweet potato, lentils, coconut milk, broth, tomatoes, and salt.",
    "Bring to a boil, then reduce heat and simmer 25 minutes, stirring occasionally.",
    "Stir in spinach until wilted.",
    "Finish with lime juice. Serve over rice with cilantro."
  ],
  "storage": {
    "fridge": "Up to 6 days.",
    "freezer": "Up to 3 months.",
    "reheat": "Reheat on the stove over medium-low heat with a splash of broth, 8 minutes."
  },
  "tips": {
    "substitutions": "Light coconut milk works for fewer calories.",
    "serving": "Serve with naan or over basmati rice.",
    "variations": "Add cubed tofu in the last 5 minutes for extra protein."
  },
  "cookbookPage": 63,
  "image": IMGS[23]
},
{
  "id": "crispy-roasted-chickpeas",
  "num": 25,
  "title": "Crispy Roasted Chickpeas",
  "category": "snack",
  "description": "Snackable, shareable, addictively crunchy. These crispy chickpeas store in a jar on the counter and pull double duty as salad topper, soup garnish, or weekday snack.",
  "nutrition": {
    "calories": 190,
    "protein": 9,
    "carbs": 26,
    "fat": 6,
    "fiber": 7
  },
  "prep": "5 min",
  "cook": "35 min",
  "totalMinutes": 40,
  "serves": "4",
  "level": "Easy",
  "mealPrep": true,
  "freezer": false,
  "proteins": [
    "chickpea"
  ],
  "why": [
    "Packs 9 g of plant protein per serving",
    "Ready in 5 min of prep",
    "Meal-prep friendly — make it ahead",
    "Family-approved, 100% plant-based"
  ],
  "ingredients": [
    "2 cans (15 oz each) chickpeas, drained and patted very dry",
    "2 tbsp olive oil",
    "1 tsp smoked paprika",
    "1 tsp garlic powder",
    "1/2 tsp ground cumin",
    "1/2 tsp salt",
    "1/4 tsp cayenne (optional)"
  ],
  "steps": [
    "Preheat oven to 425°F.",
    "Spread chickpeas on a clean towel; pat dry and remove any loose skins (this is the secret to maximum crunch).",
    "Toss chickpeas with olive oil on a sheet pan; roast 25 minutes, shaking once.",
    "Remove from oven; sprinkle with all spices and toss.",
    "Return to oven 5–10 minutes until deeply golden.",
    "Cool on the pan (they crisp further as they cool)."
  ],
  "storage": {
    "fridge": "Best within 2 days in a loosely covered container at room temperat ure.",
    "freezer": "Not recommended.",
    "reheat": "Re-crisp at 350°F for 5 minutes if needed."
  },
  "tips": {
    "substitutions": "Maple-cinnamon for a sweet version (omit cumin, paprik a, garlic.",
    "serving": "Toss with kale salad or sprinkle on grain bowls.",
    "variations": "Try curry powder + lime zest for a fragrant twist."
  },
  "cookbookPage": 66,
  "image": IMGS[24]
},
{
  "id": "edamame-hummus-with-veggies",
  "num": 26,
  "title": "Edamame Hummus with Veggies",
  "category": "snack",
  "description": "Bright green, protein-packed hummus that's lighter and fresher than traditional. Serve with crisp veggies, pita, or as a sandwich spread.",
  "nutrition": {
    "calories": 210,
    "protein": 13,
    "carbs": 18,
    "fat": 11,
    "fiber": 6
  },
  "prep": "10 min",
  "cook": "0 min",
  "totalMinutes": 10,
  "serves": "4",
  "level": "Easy",
  "mealPrep": true,
  "freezer": true,
  "proteins": [
    "edamame"
  ],
  "why": [
    "Packs 13 g of plant protein per serving",
    "Ready in 10 min of prep",
    "Meal-prep friendly — make it ahead",
    "Freezer friendly for busy weeks",
    "Family-approved, 100% plant-based"
  ],
  "ingredients": [
    "2 cups frozen shelled edamame, thawed",
    "1/4 cup tahini",
    "3 tbsp lemon juice",
    "2 cloves garlic",
    "1/4 cup olive oil",
    "1 tsp ground cumin",
    "1/2 tsp salt",
    "1/4 cup water",
    "Veggies for dipping: carrots, cucumbers, bell peppers, snap peas"
  ],
  "steps": [
    "Add edamame, tahini, lemon juice, garlic, olive oil, cumin, salt, and water to a food processor.",
    "Blend 2 minutes, scraping down the sides, until completely smooth and creamy.",
    "Taste and adjust salt or lemon.",
    "Transfer to a bowl; drizzle with olive oil.",
    "Serve with crunchy vegetables."
  ],
  "storage": {
    "fridge": "Up to 5 days in an airtight container.",
    "freezer": "Up to 2 months; thaw overnight in the fridge.",
    "reheat": "Not applicable."
  },
  "tips": {
    "substitutions": "White beans or peas can replace edamame.",
    "serving": "Spread on sandwiches or stir into bowls for a creamy boost.",
    "variations": "Add fresh basil and mint for a herby spring version."
  },
  "cookbookPage": 68,
  "image": IMGS[25]
},
{
  "id": "no-bake-peanut-butter-protein-bites",
  "num": 27,
  "title": "No-Bake Peanut Butter Protein Bites",
  "category": "snack",
  "description": "Soft, fudgy, totally craveable bites that taste like dessert but deliver 8 grams of protein each. The grab-and-go snack that disappears within days.",
  "nutrition": {
    "calories": 175,
    "protein": 8,
    "carbs": 16,
    "fat": 9,
    "fiber": 3
  },
  "prep": "15 min",
  "cook": "0 min",
  "totalMinutes": 15,
  "serves": "12 bites",
  "level": "Easy",
  "mealPrep": true,
  "freezer": true,
  "proteins": [
    "hemp",
    "peanut",
    "protein powder"
  ],
  "why": [
    "Packs 8 g of plant protein per serving",
    "Ready in 15 min of prep",
    "Meal-prep friendly — make it ahead",
    "Freezer friendly for busy weeks",
    "Family-approved, 100% plant-based"
  ],
  "ingredients": [
    "1 cup rolled oats",
    "1/2 cup natural peanut butter",
    "1/4 cup maple syrup",
    "1/4 cup vegan vanilla protein powder",
    "2 tbsp ground flaxseed",
    "2 tbsp dark chocolate chips",
    "1 tbsp hemp seeds",
    "Pinch of salt",
    "2–3 tbsp soy milk, if needed"
  ],
  "steps": [
    "Combine all ingredients except soy milk in a large bowl. Stir until a thick dough forms.",
    "If too dry, add soy milk 1 tablespoon at a time until the mixture holds together when pressed.",
    "Roll into 12 balls (about 1 1/2 tablespoons each).",
    "Refrigerate 30 minutes to firm up.",
    "Store in an airtight container."
  ],
  "storage": {
    "fridge": "Up to 2 weeks in the refrigerator.",
    "freezer": "Up to 3 months.",
    "reheat": "Eat straight from the fridge or freezer."
  },
  "tips": {
    "substitutions": "Sunflower seed butter for nut-free; almond butter also works.",
    "serving": "Pack for hikes, post-workout, or kids' lunches.",
    "variations": "Add cocoa powder for a chocolate brownie version."
  },
  "cookbookPage": 70,
  "image": IMGS[26]
},
{
  "id": "tofu-jerky-strips",
  "num": 28,
  "title": "Tofu Jerky Strips",
  "category": "snack",
  "description": "Chewy, smoky, savory strips of tofu marinated in tamari, maple, and liquid smoke. A high-protein, road-trip-ready snack with serious umami.",
  "nutrition": {
    "calories": 150,
    "protein": 16,
    "carbs": 8,
    "fat": 6,
    "fiber": 2
  },
  "prep": "10m + 2h",
  "cook": "2 hr",
  "totalMinutes": 250,
  "serves": "4",
  "level": "Medium",
  "mealPrep": true,
  "freezer": false,
  "proteins": [
    "tofu"
  ],
  "why": [
    "Packs 16 g of plant protein per serving",
    "Ready in 10m + 2h of prep",
    "Meal-prep friendly — make it ahead",
    "Family-approved, 100% plant-based"
  ],
  "ingredients": [
    "1 block (14 oz) extra-firm tofu, frozen and thawed, sliced 1/4-inch thick",
    "Marinade: 1/3 cup tamari, 2 tbsp maple syrup, 2 tbsp rice vinegar, 1 tbsp liquid smoke, 1 tsp smoked paprika"
  ],
  "steps": [
    "Freezing and thawing tofu creates a chewy texture. Pat slices dry and press firmly between paper towels.",
    "Whisk all marinade ingredients in a shallow dish.",
    "Add tofu strips; marinate 2 hours, flipping once.",
    "Preheat oven to 250°F. Arrange marinated tofu in a single layer on a parchment-lined sheet pan.",
    "Bake 1 1/2 to 2 hours, flipping every 30 minutes, until chewy and dry to the touch.",
    "Cool completely before storing."
  ],
  "storage": {
    "fridge": "Up to 1 week in an airtight container.",
    "freezer": "Not recommended (texture suffers).",
    "reheat": "Eat as-is, room temperature."
  },
  "tips": {
    "substitutions": "Coconut aminos work for soy-free; molasses can replace liquid smoke.",
    "serving": "Slice thinner for crispier jerky; thicker for chewier.",
    "variations": "Add chili flakes or sriracha to marinade for spicy jerky."
  },
  "cookbookPage": 72,
  "image": IMGS[27]
},
{
  "id": "cottage-style-tofu-dip",
  "num": 29,
  "title": "Cottage-Style Tofu Dip",
  "category": "snack",
  "description": "A high-protein, dairy-free riff on cottage cheese — perfect for scooping with crackers, dolloping on toast, or spreading in wraps.",
  "nutrition": {
    "calories": 180,
    "protein": 15,
    "carbs": 6,
    "fat": 11,
    "fiber": 2
  },
  "prep": "10 min",
  "cook": "0 min",
  "totalMinutes": 10,
  "serves": "4",
  "level": "Easy",
  "mealPrep": true,
  "freezer": false,
  "proteins": [
    "tofu"
  ],
  "why": [
    "Packs 15 g of plant protein per serving",
    "Ready in 10 min of prep",
    "Meal-prep friendly — make it ahead",
    "Family-approved, 100% plant-based"
  ],
  "ingredients": [
    "1 block (14 oz) firm silken tofu, drained",
    "2 tbsp lemon juice",
    "2 tbsp olive oil",
    "2 tbsp nutritional yeast",
    "1/2 tsp garlic powder",
    "1/2 tsp onion powder",
    "1/2 tsp salt",
    "2 tbsp chopped chives",
    "2 tbsp chopped dill",
    "Black pepper",
    "Crackers or vegetables for serving"
  ],
  "steps": [
    "Crumble tofu into a bowl with your hands to create cottage-cheese-like curds.",
    "Stir in lemon juice, olive oil, nutritional yeast, garlic powder, onion powder, and salt.",
    "Fold in chives and dill.",
    "Season generously with black pepper.",
    "Serve immediately or chill 30 minutes for flavors to meld."
  ],
  "storage": {
    "fridge": "Up to 4 days in an airtight container.",
    "freezer": "Not recommended.",
    "reheat": "Serve cold."
  },
  "tips": {
    "substitutions": "Soft tofu also works for a creamier consistency.",
    "serving": "Dollop onto avocado toast or use to stuff bell peppers.",
    "variations": "Stir in everything-bagel seasoning for an instant flavor boost."
  },
  "cookbookPage": 74,
  "image": IMGS[28]
},
{
  "id": "chocolate-hemp-protein-bars",
  "num": 30,
  "title": "Chocolate Hemp Protein Bars",
  "category": "snack",
  "description": "Chewy, fudgy, and packed with 14 grams of protein per bar. These taste like a candy bar but are sweetened with dates and built around hemp and chia seeds.",
  "nutrition": {
    "calories": 245,
    "protein": 14,
    "carbs": 26,
    "fat": 11,
    "fiber": 6
  },
  "prep": "15 min",
  "cook": "0 min",
  "totalMinutes": 15,
  "serves": "10 bars",
  "level": "Easy",
  "mealPrep": true,
  "freezer": true,
  "proteins": [
    "hemp",
    "peanut",
    "protein powder"
  ],
  "why": [
    "Packs 14 g of plant protein per serving",
    "Ready in 15 min of prep",
    "Meal-prep friendly — make it ahead",
    "Freezer friendly for busy weeks",
    "Family-approved, 100% plant-based"
  ],
  "ingredients": [
    "1 1/2 cups Medjool dates, pitted",
    "1 cup rolled oats",
    "1/2 cup hemp seeds",
    "1/4 cup chia seeds",
    "1/3 cup vegan chocolate protein powder",
    "1/4 cup cocoa powder",
    "1/3 cup natural peanut butter",
    "Pinch of salt",
    "2–3 tbsp soy milk",
    "Topping: 1/3 cup dark chocolate chips + 1 tsp coconut oil, melted"
  ],
  "steps": [
    "Line an 8x8 inch pan with parchment.",
    "Soak dates in hot water 10 minutes; drain.",
    "Add dates, oats, hemp, chia, protein powder, cocoa, peanut butter, and salt to a food processor.",
    "Blend until a sticky dough forms. Add soy milk 1 tbsp at a time if needed.",
    "Press firmly into the pan. Drizzle or spread melted chocolate on top.",
    "Chill 1 hour, then slice into 10 bars."
  ],
  "storage": {
    "fridge": "Up to 2 weeks.",
    "freezer": "Up to 3 months.",
    "reheat": "Enjoy chilled or room temperature."
  },
  "tips": {
    "substitutions": "Almond butter works in place of peanut butter.",
    "serving": "Wrap individually for lunch boxes or post-workout snacks.",
    "variations": "Add shredded coconut or chopped almonds for texture."
  },
  "cookbookPage": 76,
  "image": IMGS[29]
}
];
