# Navigation Restructure Plan

## Overview
Restructure the dashboard header/navigation to have a hierarchical menu system with main sections: Challenge, Meals, Activities, Goal, and Settings. Each section provides different views and functionality.

## User Requirements
- Navigation style: Dropdown menus (main nav items with sub-menus)
- Challenge: Navigation item (not main title)
- Meals/Activities: Overview pages with statistics and quick actions
- Meal Preps: Rename "Saved Meals" to "Meal Preps" and include in Meals section

## Proposed Structure

### H1: Challenge (Navigation Item)
- Main navigation item with dropdown
- Sub-items: Day, Week, Month, Goal (current ViewSwitcher)
- Shows challenge/tracking views
- Default active section

### H2: Meals (Navigation Item)
- Overview page showing:
  - Meal statistics (total meals, calories, protein, etc.)
  - Quick actions (Add Meal button)
  - Link to Meal Preps (renamed from Saved Meals)
  - Recent meals list
  - Meal history/statistics

### H3: Activities (Navigation Item)
- Overview page showing:
  - Activity statistics (total activities, calories burned, etc.)
  - Quick actions (Add Activity button)
  - Recent activities list
  - Activity history/statistics
  - Strava integration (future)

### H4: Goal (Navigation Item)
- Goal definition and progress tracking
- Currently exists as GoalView
- User will provide more details later

### H5: Settings (Navigation Item)
- General app settings
- Profile settings
- Preferences
- Integrations (Strava, etc.)
- Uses existing `/settings` page or creates new one

## Implementation Details

### 1. Navigation Component
Create dropdown navigation component:
- Horizontal navigation bar
- Main items: Challenge, Meals, Activities, Goal, Settings
- Challenge has dropdown: Day, Week, Month, Goal
- Active section highlighted
- Responsive: collapses to mobile menu on small screens
- Logout button on the right

### 2. Header Restructure
Modify `src/app/dashboard/page.tsx`:
- Replace "Nutrition Tracker" title with navigation component
- Move ViewSwitcher into Challenge dropdown
- Add navigation items for Meals, Activities, Goal, Settings
- Keep Logout button in header

### 3. Meals Overview Page
Create `src/app/dashboard/meals/page.tsx`:
- Statistics cards (total meals, calories, protein, etc.)
- Quick action: Add Meal button
- Link to Meal Preps (renamed from Saved Meals)
- Recent meals list
- Meal history/trends

### 4. Activities Overview Page
Create `src/app/dashboard/activities/page.tsx`:
- Statistics cards (total activities, calories burned, etc.)
- Quick action: Add Activity button
- Recent activities list
- Activity history/trends

### 5. Rename "Saved Meals" to "Meal Preps"
- Update page title: `src/app/saved-meals/page.tsx` → `src/app/dashboard/meal-preps/page.tsx`
- Update all references and navigation links
- Update component text from "Saved Meals" to "Meal Preps"

### 6. Navigation States
- Default to "Challenge" section with "Week" view
- Clicking "Meals" shows meals overview page
- Clicking "Activities" shows activities overview
- Clicking "Goal" shows GoalView (existing)
- Clicking "Settings" shows settings page

### 7. Routing
Use URL routing:
- `/dashboard` - Challenge section (default: Week view)
- `/dashboard/challenge` - Challenge section
- `/dashboard/challenge/day` - Day view
- `/dashboard/challenge/week` - Week view
- `/dashboard/challenge/month` - Month view
- `/dashboard/challenge/goal` - Goal view
- `/dashboard/meals` - Meals overview
- `/dashboard/meal-preps` - Meal Preps (renamed from saved-meals)
- `/dashboard/activities` - Activities overview
- `/dashboard/goal` - Goal page (if separate from challenge/goal view)
- `/dashboard/settings` - Settings page

## File Changes
- `src/app/dashboard/page.tsx`: Restructure with navigation component
- `src/components/Navigation.tsx` (new): Main navigation component with dropdowns
- `src/app/dashboard/meals/page.tsx` (new): Meals overview page
- `src/app/dashboard/activities/page.tsx` (new): Activities overview page
- `src/app/saved-meals/page.tsx` → `src/app/dashboard/meal-preps/page.tsx`: Rename and move
- Update all navigation links to use new structure

## User Experience
- Main navigation bar at top with dropdown menus
- Challenge dropdown shows Day/Week/Month/Goal options
- Clicking Meals shows overview with stats and quick actions
- Meal Preps accessible from Meals section
- Consistent navigation across all sections