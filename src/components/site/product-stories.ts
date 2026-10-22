import actionKitchen from "@/assets/product-action-kitchen.jpg";
import actionMealPrep from "@/assets/product-action-meal-prep.jpg";
import actionBowl from "@/assets/product-action-bowl.jpg";
import actionGrocery from "@/assets/product-action-grocery.jpg";
import prepPlanner from "@/assets/prep-feature-planner.jpg";
import prepGrocery from "@/assets/prep-feature-grocery.jpg";
import kitWeek from "@/assets/kit-page-3.jpg";
import kitGrocery from "@/assets/kit-page-5.jpg";
import kitPrep from "@/assets/kit-page-8.jpg";

type ProductStory = {
  format: string;
  previewLabel: string;
  benefitHeading: string;
  guarantee: string;
  gallery: Array<{ url: string; label: string }>;
  included: string[];
  benefits: Array<{ title: string; body: string }>;
  faq: Array<{ q: string; a: string }>;
};

const guarantee = { q: "What if it's not for me?", a: "You're covered by our 60-day money-back guarantee. Email support@plantedandsimple.com to request a refund." };

export const PRODUCT_STORIES: Record<string, ProductStory> = {
  "high-protein-cookbook": {
    format: "Instant PDF download after checkout",
    previewLabel: "Cookbook in your kitchen",
    benefitHeading: "What this cookbook does for you",
    guarantee: "Download the cookbook and try the recipes. If it's not for you, email us within 60 days for a refund.",
    gallery: [
      { url: actionKitchen, label: "Keep the cookbook beside you as you cook" },
      { url: actionBowl, label: "Protein-forward plant-based meals" },
      { url: actionMealPrep, label: "Cook ahead for your week" },
      { url: actionGrocery, label: "Shop with a ready-to-use list" },
    ],
    included: ["30 high-protein plant-based recipes", "Macros alongside each recipe", "7-day meal plan and grocery list", "Meal-prep guidance", "Digital PDF for phone, tablet or printing"],
    benefits: [
      { title: "Choose dinner with confidence", body: "Thirty recipes in one place, with ingredients and instructions ready when you are." },
      { title: "See the macros", body: "Check the listed nutrition when choosing meals for your week." },
      { title: "Take a plan to the store", body: "Use the included meal plan and grocery list instead of starting from scratch." },
      { title: "Cook on your terms", body: "Read on your phone or tablet, or print the pages you want beside you." },
    ],
    faq: [
      { q: "Is this a physical book?", a: "No. This is a digital PDF cookbook. The devices and printed pages pictured show ways to use it; they are not included." },
      { q: "How many recipes are included?", a: "30 high-protein plant-based recipes, with macros, plus a meal plan and grocery list." },
      { q: "Can I open it on my phone?", a: "Yes. Download the PDF and open it on your phone, tablet or computer. You can also print it for your household." },
      guarantee,
    ],
  },
  "meal-prep-system": {
    format: "Paid access to the interactive Meal Prep app",
    previewLabel: "Interactive planning tools",
    benefitHeading: "What the Meal Prep System does for you",
    guarantee: "Try the Meal Prep System. If it doesn't suit your routine, email us within 60 days for a refund.",
    gallery: [
      { url: prepPlanner, label: "Your interactive weekly planner" },
      { url: prepGrocery, label: "Groceries from your selected meals" },
    ],
    included: ["Interactive weekly meal planner", "Shared recipe library", "Grocery lists from your meal plan", "Pantry tracking", "Batch-prep and kitchen tools", "Saved plans and recipe favourites"],
    benefits: [
      { title: "Move beyond paper", body: "Choose recipes and adjust your week in the interactive planner." },
      { title: "Bring meals and groceries together", body: "Build a shopping list from the meals in your plan." },
      { title: "Keep track of your pantry", body: "Record what you have alongside your weekly planning." },
      { title: "Return to a saved plan", body: "Keep favourite recipes and meal plans available for another week." },
    ],
    faq: [
      { q: "Is this another PDF cookbook?", a: "No. The Meal Prep System is an interactive web app with planning, grocery and kitchen tools." },
      { q: "How do I get access?", a: "Access is granted after your payment is verified. Follow the access instructions sent after purchase." },
      { q: "Do I need the premium cookbook?", a: "No. The app includes its own recipe library. The premium PDF cookbook is a separate product." },
      guarantee,
    ],
  },
  "planning-kit": {
    format: "Instant printable PDF download after checkout",
    previewLabel: "Printable planning sheets",
    benefitHeading: "What the Planning Kit does for you",
    guarantee: "Download and try the planning sheets. If they don't suit your routine, email us within 60 days for a refund.",
    gallery: [
      { url: kitWeek, label: "Your week at a glance" },
      { url: kitGrocery, label: "Grocery list by aisle" },
      { url: kitPrep, label: "Batch-prep planning sheet" },
    ],
    included: ["12 printable planning pages", "Weekly meal planner", "Aisle-sorted grocery list", "Pantry and fridge check", "Plant protein and leftovers planners", "Batch-prep checklist and monthly planner"],
    benefits: [
      { title: "Put your week on paper", body: "Plan breakfast, lunch, dinner and snacks in one place." },
      { title: "Check before you shop", body: "Use the pantry and fridge sheets to see what you already have." },
      { title: "Make a focused shopping list", body: "Group groceries by aisle before heading to the store." },
      { title: "Use any recipes you love", body: "These blank planning templates work with your own recipes, not just our cookbook." },
    ],
    faq: [
      { q: "What do I receive?", a: "A 12-page printable PDF planning kit, not a physical planner or an interactive app." },
      { q: "Can I print it again?", a: "Yes. Print fresh copies for your own household whenever you need them." },
      { q: "Does it include recipes?", a: "It contains planning templates rather than a recipe collection. Use it with any recipes you like." },
      { q: "How is it different from the Meal Prep System?", a: "The kit is a pen-and-paper PDF. The Meal Prep System is a separate interactive web app that builds plans and grocery lists." },
      guarantee,
    ],
  },
};