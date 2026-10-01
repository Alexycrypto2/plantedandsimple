// Built-in backup content. Used whenever the hosted database is unreachable
// (paused, restarting, network error) so every public page and detail page
// still opens with real, complete content instead of an error screen.
import type { Recipe } from "@/lib/library/types";
import type { PublicProduct } from "@/lib/products.functions";
import type { PublicPost } from "@/lib/blog.functions";
import peekCover from "@/assets/peek-cover.jpg.asset.json";

export const COOKBOOK_COVER_URL: string = peekCover.url;

const base = {
  hero_image_id: null,
  gallery_ids: [] as string[],
  gallery_urls: [] as string[],
  pinterest_description: null,
  seo_title: null,
  seo_description: null,
  status: "published" as const,
  published_at: "2026-09-01T09:00:00Z",
  difficulty: "easy",
};

export const FALLBACK_RECIPES: Recipe[] = [
  {
    ...base,
    id: "fallback-lentil-dahl",
    slug: "red-lentil-dahl",
    title: "Red Lentil Dahl",
    subtitle: "A warm, fragrant weeknight bowl",
    description: "Creamy red lentils simmered with tomato, ginger and warming spices, finished with lime and fresh coriander.",
    hero_image_url: "/recipes/red-lentil-dahl.jpg",
    ingredients: [
      { group: "Dahl", items: ["1 cup red lentils, rinsed", "1 onion, finely chopped", "3 garlic cloves, minced", "1 tbsp grated ginger", "1 tsp ground cumin", "1 tsp turmeric", "1 tsp garam masala", "1 can (400g) chopped tomatoes", "1 can (400ml) light coconut milk", "2 cups vegetable stock"] },
      { group: "To finish", items: ["Juice of 1 lime", "Handful fresh coriander", "Salt to taste"] },
    ],
    instructions: [
      { title: "Build the base", body: "Soften the onion in a splash of oil for 5 minutes. Add garlic, ginger and spices and stir for 1 minute until fragrant." },
      { title: "Simmer", body: "Add lentils, tomatoes, coconut milk and stock. Simmer for 20–25 minutes, stirring often, until thick and creamy." },
      { title: "Finish", body: "Season with salt and lime juice. Serve over rice with fresh coriander." },
    ],
    nutrition: [{ label: "Protein", value: "18g" }, { label: "Calories", value: "390" }, { label: "Fibre", value: "12g" }],
    tips: ["Leftovers thicken overnight — loosen with a splash of water when reheating."],
    prep_minutes: 10,
    cook_minutes: 25,
    servings: "4",
    tags: ["dinner", "high-protein"],
    is_featured: true,
  },
  {
    ...base,
    id: "fallback-tacos",
    slug: "black-bean-tacos",
    title: "Black Bean Tacos",
    subtitle: "Smoky, bright and ready in 20 minutes",
    description: "Warm tortillas layered with smoky spiced black beans, crunchy slaw and a creamy lime sauce.",
    hero_image_url: "/recipes/black-bean-tacos.jpg",
    ingredients: [
      { group: "Beans", items: ["2 cans black beans, drained", "1 tsp smoked paprika", "1 tsp cumin", "1 garlic clove, minced", "Juice of ½ lime"] },
      { group: "To serve", items: ["8 small corn tortillas", "1 cup shredded red cabbage", "1 avocado, sliced", "Fresh coriander", "Lime wedges"] },
    ],
    instructions: [
      { title: "Spice the beans", body: "Warm the beans with garlic, paprika and cumin for 5 minutes, lightly mashing half of them." },
      { title: "Warm tortillas", body: "Toast tortillas in a dry pan for 30 seconds per side." },
      { title: "Assemble", body: "Fill with beans, cabbage and avocado. Finish with coriander and a squeeze of lime." },
    ],
    nutrition: [{ label: "Protein", value: "16g" }, { label: "Calories", value: "420" }, { label: "Fibre", value: "15g" }],
    tips: ["The beans keep for 4 days — make a double batch for lunches."],
    prep_minutes: 10,
    cook_minutes: 10,
    servings: "4",
    tags: ["quick", "dinner"],
    is_featured: true,
  },
  {
    ...base,
    id: "fallback-noodles",
    slug: "smoky-peanut-tofu-noodles",
    title: "Smoky Peanut Tofu Noodles",
    subtitle: "Silky noodles with crisp-edged tofu",
    description: "A satisfying bowl of noodles tossed in a smoky peanut sauce with crispy tofu and greens.",
    hero_image_url: "/recipes/smoky-peanut-tofu-noodles.jpg",
    ingredients: [
      { group: "Noodles", items: ["200g rice or wheat noodles", "400g firm tofu, cubed", "2 cups greens (bok choy or spinach)"] },
      { group: "Sauce", items: ["3 tbsp peanut butter", "2 tbsp soy sauce", "1 tbsp maple syrup", "1 tsp smoked paprika", "1 tbsp rice vinegar", "Warm water to loosen"] },
    ],
    instructions: [
      { title: "Crisp the tofu", body: "Pan-fry tofu cubes in a little oil for 8–10 minutes until golden on all sides." },
      { title: "Make the sauce", body: "Whisk all sauce ingredients with warm water until smooth and pourable." },
      { title: "Toss", body: "Cook noodles, wilt greens in the same pot, drain and toss everything with sauce and tofu." },
    ],
    nutrition: [{ label: "Protein", value: "26g" }, { label: "Calories", value: "540" }, { label: "Fibre", value: "6g" }],
    tips: ["Top with crushed peanuts and chilli flakes for crunch."],
    prep_minutes: 15,
    cook_minutes: 20,
    servings: "3",
    tags: ["noodles", "meal prep"],
    is_featured: false,
  },
  {
    ...base,
    id: "fallback-harissa",
    slug: "harissa-chickpea-bowl",
    title: "Harissa Chickpea Bowl",
    subtitle: "Roasted, spiced and meal-prep friendly",
    description: "Crispy harissa chickpeas over fluffy grains with roasted vegetables and a cooling tahini drizzle.",
    hero_image_url: "/recipes/harissa-chickpea-bowl.jpg",
    ingredients: [
      { group: "Bowl", items: ["2 cans chickpeas, drained", "2 tbsp harissa paste", "1 cup quinoa or couscous", "1 red pepper, chopped", "1 courgette, chopped"] },
      { group: "Tahini drizzle", items: ["3 tbsp tahini", "Juice of 1 lemon", "Water to loosen", "Pinch of salt"] },
    ],
    instructions: [
      { title: "Roast", body: "Toss chickpeas and vegetables with harissa and oil. Roast at 200°C for 25 minutes." },
      { title: "Cook grains", body: "Cook quinoa or couscous according to the packet." },
      { title: "Serve", body: "Pile grains into bowls, top with roasted chickpeas and vegetables and drizzle with tahini." },
    ],
    nutrition: [{ label: "Protein", value: "22g" }, { label: "Calories", value: "480" }, { label: "Fibre", value: "14g" }],
    tips: ["Keeps 4 days in the fridge — store the drizzle separately."],
    prep_minutes: 10,
    cook_minutes: 25,
    servings: "4",
    tags: ["meal prep", "high-protein"],
    is_featured: true,
  },
  {
    ...base,
    id: "fallback-scramble",
    slug: "tempeh-breakfast-scramble",
    title: "Tempeh Breakfast Scramble",
    subtitle: "A savoury, protein-packed morning plate",
    description: "Crumbled tempeh with peppers, spinach and warming spices — a hearty breakfast in 15 minutes.",
    hero_image_url: "/recipes/tempeh-breakfast-scramble.jpg",
    ingredients: [
      { group: "Scramble", items: ["200g tempeh, crumbled", "1 red pepper, diced", "2 handfuls spinach", "½ tsp turmeric", "½ tsp smoked paprika", "1 tbsp soy sauce"] },
      { group: "To serve", items: ["Toasted sourdough", "Sliced avocado", "Chives"] },
    ],
    instructions: [
      { title: "Brown the tempeh", body: "Fry crumbled tempeh in oil for 5–6 minutes until golden." },
      { title: "Add vegetables", body: "Add pepper and spices, cook 3 minutes, then stir in spinach and soy sauce until wilted." },
      { title: "Serve", body: "Spoon over toast with avocado and chives." },
    ],
    nutrition: [{ label: "Protein", value: "24g" }, { label: "Calories", value: "410" }, { label: "Fibre", value: "8g" }],
    tips: ["Steam tempeh for 5 minutes first for a milder flavour."],
    prep_minutes: 5,
    cook_minutes: 12,
    servings: "2",
    tags: ["breakfast", "high-protein"],
    is_featured: false,
  },
];

export const FALLBACK_PRODUCTS: PublicProduct[] = [
  {
    id: "fallback-cookbook",
    slug: "plant-based-cookbook",
    title: "The Plant-Based Cookbook",
    subtitle: "30 simple, high-protein plant-based recipes",
    description:
      "30 easy, delicious and protein-packed plant-based recipes with full-colour photography, a 7-day meal plan, grocery lists and meal-prep guides. Instant PDF download.",
    category_id: null,
    category_slug: "cookbooks",
    category_name: "Cookbooks",
    cover_image_url: COOKBOOK_COVER_URL,
    gallery_urls: [],
    price_cents: 1499,
    compare_at_cents: 2999,
    currency: "USD",
    price_display: "14.99",
    compare_at_display: "29.99",
    paddle_price_external_id: null,
    is_featured: true,
    is_bestseller: true,
    seo_title: null,
    seo_description: null,
    tags: ["cookbook", "high-protein"],
    benefits: [],
    features: [],
  },
];

const p = (s: string) => `<p>${s}</p>`;

export const FALLBACK_POSTS: PublicPost[] = [
  {
    id: "fallback-blog-1",
    slug: "how-to-build-a-better-plant-based-bowl",
    title: "How to Build a Better Plant-Based Bowl",
    excerpt: "A simple framework for balanced, satisfying meals.",
    content: [
      p("A great bowl is not a recipe — it is a formula. Once you know it, dinner takes ten minutes of thinking and very little shopping."),
      "<h2>1. Start with a grain</h2>",
      p("Quinoa, brown rice, couscous or noodles give the bowl body and slow energy. Cook a big batch on Sunday."),
      "<h2>2. Add a protein</h2>",
      p("Chickpeas, lentils, tofu, tempeh or edamame. Aim for a generous handful — this is what keeps you full."),
      "<h2>3. Pile on vegetables</h2>",
      p("Mix one roasted and one raw vegetable for contrast: roasted peppers with crunchy cabbage, for example."),
      "<h2>4. Finish with a sauce</h2>",
      p("Tahini-lemon, peanut-lime or a spoon of harissa yoghurt ties everything together. The sauce is where the flavour lives."),
    ].join(""),
    featured_image_url: "/recipes/harissa-chickpea-bowl.jpg",
    category: "Kitchen Notes",
    tags: ["cooking", "bowls"],
    seo_title: null,
    seo_description: null,
    published_at: "2026-09-05T09:00:00Z",
  },
  {
    id: "fallback-blog-2",
    slug: "the-gentle-art-of-meal-prep",
    title: "The Gentle Art of Meal Prep",
    excerpt: "Make weekday cooking feel lighter without cooking everything in advance.",
    content: [
      p("Meal prep does not have to mean five identical boxes. Gentle prep means preparing components, not meals."),
      "<h2>Prep components</h2>",
      p("Cook one grain, one pot of beans or lentils, roast a tray of vegetables and make one sauce. That is enough for four different dinners."),
      "<h2>Mix and match</h2>",
      p("Monday is a bowl, Tuesday is tacos, Wednesday is a noodle stir-fry — all from the same base ingredients."),
      "<h2>Keep it fresh</h2>",
      p("Store sauces separately and add fresh herbs, lime or crunchy toppings just before eating."),
    ].join(""),
    featured_image_url: "/recipes/smoky-peanut-tofu-noodles.jpg",
    category: "Rituals",
    tags: ["meal prep"],
    seo_title: null,
    seo_description: null,
    published_at: "2026-09-12T09:00:00Z",
  },
];

export function fallbackRecipe(slug: string) {
  const recipe = FALLBACK_RECIPES.find((r) => r.slug === slug);
  if (!recipe) return null;
  return {
    recipe,
    related: {
      recipes: FALLBACK_RECIPES.filter((r) => r.slug !== slug).slice(0, 3),
      blogs: [] as any[],
      products: [] as any[],
    },
  };
}
export const fallbackProduct = (slug: string) => FALLBACK_PRODUCTS.find((x) => x.slug === slug) ?? null;
export const fallbackPost = (slug: string) => FALLBACK_POSTS.find((x) => x.slug === slug) ?? null;
