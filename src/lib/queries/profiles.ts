import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface Profile {
  id: string
  weekly_calorie_goal: number
  goal_description?: string | null
  goal_amount?: number | null
  goal_unit?: 'per_day' | 'per_week' | null
  goal_start_date?: string | null
  goal_duration_weeks?: number | null
  goal_end_date?: string | null
  age?: number | null
  weight_kg?: number | null
  height_cm?: number | null
  created_at: string
  updated_at: string
}

export interface GoalInput {
  goal_description?: string | null
  goal_amount?: number | null
  goal_unit?: 'per_day' | 'per_week' | null
  goal_duration_weeks?: number | null
  goal_end_date?: string | null
  age?: number | null
  weight_kg?: number | null
  height_cm?: number | null
}

export interface ProfileInput {
  age?: number | null
  weight_kg?: number | null
  height_cm?: number | null
}

// Helper function to calculate weekly total from daily goal
export function calculateWeeklyFromDaily(dailyAmount: number): number {
  return dailyAmount * 7
}

// Helper function to calculate daily total from weekly goal
export function calculateDailyFromWeekly(weeklyAmount: number): number {
  return weeklyAmount / 7
}

// Check if profile has all required information for accurate calculations
export function isProfileComplete(profile: Profile | null | undefined): boolean {
  if (!profile) return false
  return !!(
    profile.height_cm &&
    profile.height_cm > 0 &&
    profile.weight_kg &&
    profile.weight_kg > 0 &&
    profile.age &&
    profile.age > 0
  )
}

export function useProfile() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Not authenticated')
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        // If profile doesn't exist, create it
        if (error.code === 'PGRST116') {
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({ id: user.id, weekly_calorie_goal: 14000 })
            .select()
            .single()

          if (insertError) throw insertError
          return newProfile as Profile
        }
        throw error
      }

      return data as Profile
    },
  })
}

export function useUpdateProfile() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: number | GoalInput | ProfileInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Not authenticated')
      }

      // Handle backward compatibility: if number is passed, update weekly_calorie_goal
      if (typeof input === 'number') {
        const { data, error } = await supabase
          .from('profiles')
          .update({ weekly_calorie_goal: input })
          .eq('id', user.id)
          .select()
          .single()

        if (error) throw error
        return data as Profile
      }

      // Check if this is a profile-only update (just age, weight, height)
      const profileInput = input as ProfileInput
      const isProfileOnlyUpdate = 
        (profileInput.age !== undefined || profileInput.weight_kg !== undefined || profileInput.height_cm !== undefined) &&
        !('goal_description' in input) &&
        !('goal_amount' in input) &&
        !('goal_unit' in input) &&
        !('goal_duration_weeks' in input) &&
        !('goal_end_date' in input)

      if (isProfileOnlyUpdate) {
        // Simple profile update - just update the fields provided
        const { data, error } = await supabase
          .from('profiles')
          .update(profileInput)
          .eq('id', user.id)
          .select()
          .single()

        if (error) throw error
        return data as Profile
      }

      // Handle goal input with validation
      const goalInput = input as GoalInput
      
      // Only validate goal fields if they are being set
      const hasGoalFields = goalInput.goal_amount !== undefined || 
                           goalInput.goal_description !== undefined ||
                           goalInput.goal_unit !== undefined
      
      if (hasGoalFields) {
        // Validation: either duration_weeks or end_date must be provided
        if (!goalInput.goal_duration_weeks && !goalInput.goal_end_date) {
          throw new Error('Either duration in weeks or end date must be provided')
        }

        // Set goal_start_date to today if not already set
        const updateData: any = {
          ...goalInput,
          goal_start_date: (goalInput as any).goal_start_date || new Date().toISOString().split('T')[0],
        }

        // If end_date is provided, calculate duration_weeks if not set
        if (goalInput.goal_end_date && !goalInput.goal_duration_weeks) {
          const startDate = new Date(updateData.goal_start_date)
          const endDate = new Date(goalInput.goal_end_date)
          const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          updateData.goal_duration_weeks = Math.ceil(diffDays / 7)
        }

        // If duration_weeks is provided, calculate end_date if not set
        if (goalInput.goal_duration_weeks && !goalInput.goal_end_date) {
          const startDate = new Date(updateData.goal_start_date)
          const endDate = new Date(startDate)
          endDate.setDate(endDate.getDate() + (goalInput.goal_duration_weeks * 7))
          updateData.goal_end_date = endDate.toISOString().split('T')[0]
        }

        const { data, error } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', user.id)
          .select()
          .single()

        if (error) throw error
        return data as Profile
      }

      // Fallback: just update whatever fields were provided
      const { data, error } = await supabase
        .from('profiles')
        .update(goalInput)
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error
      return data as Profile
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      queryClient.invalidateQueries({ queryKey: ['weekly-banking'] })
    },
  })
}
