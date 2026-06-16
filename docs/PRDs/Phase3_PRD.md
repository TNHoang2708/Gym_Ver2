# Phase 3: Nutrition & Body Metrics (Completed)

## Core Objective
Allow users to track their daily food intake against calculated goals, and monitor their physical body changes over time.

## Features & Progress

### 1. Goal Calculation
- [x] Automatically calculate BMR and TDEE based on user's hard memory
- [x] Set daily goals for Calories, Protein, Carbs, and Fat based on user's fitness goal

### 2. Nutrition Logging (`/nutrition`)
- [x] Search Open Food Facts API for food items
- [x] Log food to specific meals (Breakfast, Lunch, Dinner, Snack)
- [x] Daily progress bars for Calories and Macros
- [x] `food_logs` database table

### 3. Advanced Nutrition Features
- [x] **Barcode Scanner:** Use device camera to scan and auto-fetch food
- [x] **Quick Add Favourites:** Save frequent foods to a `food_favourites` table for 1-click logging
- [x] **Weekly Macro Chart:** Stacked Bar Chart showing the last 7 days of Protein, Carbs, and Fat

### 4. Body Metrics (`/bmi`)
- [x] Log current weight to `weight_logs`
- [x] **Weight History Chart:** Line chart pulling true historical data
- [x] **Body Fat % Estimation:** Track body fat percentages
- [x] **Progress Photos:** UI to upload and view before/after pictures
- [x] **Measurement Tracking:** Input fields for Neck, Chest, Arms, Waist, Hips

---
**Status:** 100% Complete ✅
