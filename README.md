# Weekly Nutrition Tracker

A full-stack web application for tracking weekly calorie intake and nutrition goals, built with Next.js 14+, Supabase, and the OpenFoodFacts API.

## Features

- 🔐 **Authentication**: Secure email/password authentication with Supabase
- 📅 **Weekly Calendar View**: Visual week-by-week calendar showing daily nutrition and activities
- 📊 **Weekly Tracking**: Track calories against a weekly goal (default: 14,000 kcal)
- 🏦 **Weekly Banking**: Dynamic calculation showing if you're on track, under, or over budget
- 🍽️ **Meal Logging**: AI-powered meal analysis using Google Gemini API
- 🏃 **Activity Tracking**: Log activities and calories burned
- 📈 **Progress Visualization**: Visual progress bar and status cards
- 🗑️ **Entry Management**: View and delete food entries and activities

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (Auth & PostgreSQL)
- **State Management**: React Query (TanStack Query)
- **Icons**: Lucide React
- **Date Utilities**: date-fns
- **External API**: OpenFoodFacts

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account and project
- npm or yarn package manager

### Setup Instructions

1. **Clone or navigate to the project directory**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env.local`
   - Get your Supabase URL and anon key from your Supabase project settings
   - Add them to `.env.local`:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

4. **Database is already set up** (via Supabase MCP)
   - The migrations have been applied automatically
   - Tables created: `profiles`, `food_logs`, `activities`
   - RLS policies are in place for data security

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   - Navigate to [http://localhost:3000](http://localhost:3000)
   - Sign up for a new account or sign in

## Database Schema

### `profiles` table
- `id` (UUID, references auth.users)
- `weekly_calorie_goal` (INTEGER, default: 14000)
- `created_at`, `updated_at` (timestamps)

### `food_logs` table
- `id` (UUID)
- `user_id` (UUID, references auth.users)
- `date` (DATE)
- `product_name` (TEXT)
- `calories` (INTEGER)
- `protein` (INTEGER)
- `grams` (INTEGER)
- `created_at` (timestamp)

### `activities` table
- `id` (UUID)
- `user_id` (UUID, references auth.users)
- `date` (DATE)
- `activity_name` (TEXT)
- `calories_burned` (INTEGER)
- `duration_minutes` (INTEGER, optional)
- `created_at` (timestamp)

## Weekly Banking Calculation

The app calculates your weekly status based on:
- **Weekly Goal**: From your profile (default: 14,000 kcal)
- **Total Consumed**: Sum of calories for the current week (Monday-Sunday)
- **Expected Consumption**: (Weekly Goal / 7) × Days Elapsed
- **Variance**: Expected Consumption - Total Consumed

Status messages:
- "You are X kcal under schedule" (positive variance)
- "You are X kcal over budget" (negative variance)
- "You are exactly on schedule" (zero variance)

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout with providers
│   ├── page.tsx                 # Main calendar page
│   ├── login/
│   │   └── page.tsx             # Login page
│   ├── dashboard/
│   │   └── page.tsx             # Legacy dashboard (optional)
│   ├── api/auth/callback/       # Auth callback route
│   └── auth/logout/             # Logout route
├── components/
│   ├── WeeklyCalendar.tsx       # Main weekly calendar view
│   ├── MealWizard.tsx           # AI-powered meal analysis
│   ├── ActivityWizard.tsx       # Activity logging
│   ├── FoodSearch.tsx           # OpenFoodFacts search & insert
│   ├── WeeklyProgressBar.tsx   # Progress visualization
│   ├── WeeklyBankingCard.tsx   # Status calculation display
│   └── FoodLogList.tsx          # Today's food logs
├── lib/
│   ├── supabase/               # Supabase clients
│   └── queries/                 # React Query hooks
│       ├── foodLogs.ts          # Food log queries
│       ├── activities.ts        # Activity queries
│       ├── profiles.ts          # Profile queries
│       └── weeklyCalculations.ts # Weekly banking calculations
└── utils/
    └── dateUtils.ts            # Week calculation helpers
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Security

- Row Level Security (RLS) policies ensure users can only access their own data
- All database queries are protected by RLS
- Authentication is handled securely by Supabase

## License

ISC
