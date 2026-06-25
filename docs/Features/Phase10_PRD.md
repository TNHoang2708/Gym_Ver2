# PRD — Phase 10: Advanced AI Diet & Recipe Engine

## Overview
Phase 10 transitions the Nutrition module from a simple macro-logging tool into an intelligent dietary prescriber. By expanding the user's dietary profile, the AI Coach will generate specific, structured, and grocery-ready daily meal plans that perfectly align with their caloric goals, macro targets, and allergies.

---

## Sub-Phase 10.1: Dietary Profile Expansion
**Estimated Time:** 20 mins

### Tasks:
- [x] 1. Open `src/app/(app)/profile/page.tsx`.
- [x] 2. Create a new modal state: `activeModal === 'dietary'`.
- [x] 3. Add a new section to the Profile menu titled "Dietary Restrictions".
- [x] 4. In the modal, build a multi-select UI for common dietary lifestyles (e.g., Vegan, Vegetarian, Keto, Paleo, Halal).
- [x] 5. Below the lifestyles, build a tag-input component for entering specific allergies (e.g., Peanuts, Shellfish, Dairy).
- [x] 6. Update the `user_memory` database schema. Alter `hard_memory` to accept `dietary_lifestyles` (string array) and `allergies` (string array).
- [x] 7. Implement the `updateDietaryInfo` function to save this data back to Supabase.

---

## Sub-Phase 10.2: AI Recipe Generation API (`/api/recipes`)
**Estimated Time:** 35 mins

### Tasks:
- [x] 1. Create a new Next.js route handler: `src/app/api/recipes/route.ts`.
- [x] 2. Import the Vercel AI SDK (`generateObject` or `streamObject`) and the OpenAI provider.
- [x] 3. Define a strict Zod schema for the expected LLM output. The schema must include: `mealName` (string), `macros` (object: calories, protein, carbs, fat), `ingredients` (array of strings with measurements), `instructions` (array of strings), and `prepTimeMinutes` (number).
- [x] 4. Write the system prompt. Instruct the AI to act as a Michelin-star sports nutritionist.
- [x] 5. Inject the user's current `dietary_lifestyles`, `allergies`, and target daily macros into the prompt dynamically.
- [x] 6. Enforce a rule in the prompt: "The total macros of the generated meals must equal the user's daily target ± 5%."
- [x] 7. Return the structured JSON response to the client.

---

## Sub-Phase 10.3: Recipe UI Components
**Estimated Time:** 30 mins

### Tasks:
- [x] 1. Navigate to `src/app/(app)/nutrition/page.tsx`.
- [x] 2. Add a new tab toggle at the top of the screen: "Food Log" vs "AI Meal Plan".
- [x] 3. In the "AI Meal Plan" view, add a prominent, gold-glowing "Generate Today's Menu" button.
- [x] 4. Build a skeleton loader to display while the `/api/recipes` endpoint is processing (which may take 5-10 seconds).
- [x] 5. Build the `RecipeCard` component. It should display the meal name, a macro breakdown pill, and prep time.
- [x] 6. Add an expandable accordion inside `RecipeCard` to reveal the full ingredients list and step-by-step instructions.
- [x] 7. Integrate a stock image API (like Unsplash) to fetch a generic food image based on the `mealName`, or use a stylized generic SVG icon for meals.

---

## Sub-Phase 10.4: Food Log Integration
**Estimated Time:** 15 mins

### Tasks:
- [x] 1. Inside the `RecipeCard` component, add a secondary action button: "Log This Meal".
- [x] 2. When clicked, invoke a function that takes the AI-generated macros and automatically inserts a new row into the `food_logs` table.
- [x] 3. Trigger a toast notification: "AI Meal logged successfully."
- [x] 4. Automatically refresh the parent Nutrition page's macro progress bars to reflect the newly ingested calories.
- [x] 5. Add logic to disable the "Log This Meal" button if the meal has already been logged to prevent duplicate entries.

---
**Status:** ~90% Complete (Missing Unsplash images and duplicate entry guard)
