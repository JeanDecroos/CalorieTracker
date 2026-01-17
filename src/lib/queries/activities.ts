import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { formatDateForDB } from '@/utils/dateUtils'

export interface Activity {
  id: string
  user_id: string
  date: string
  activity_name: string
  calories_burned: number | null
  duration_minutes?: number | null
  strava_activity_id?: number | null
  calorie_source?: string | null
  created_at: string
}

export interface CreateActivityInput {
  activity_name: string
  calories_burned: number
  duration_minutes?: number
  date?: string
}

export function useActivities(weekStart: Date, weekEnd: Date) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['activities', formatDateForDB(weekStart), formatDateForDB(weekEnd)],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Not authenticated')
      }

      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', formatDateForDB(weekStart))
        .lte('date', formatDateForDB(weekEnd))
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Activity[]
    },
  })
}

export function useDayActivities(date: Date) {
  const supabase = createClient()
  const dateStr = formatDateForDB(date)

  return useQuery({
    queryKey: ['activities', 'day', dateStr],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Not authenticated')
      }

      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', dateStr)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Activity[]
    },
  })
}

export function useAddActivity() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateActivityInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Not authenticated')
      }

      const { data, error } = await supabase
        .from('activities')
        .insert({
          user_id: user.id,
          activity_name: input.activity_name,
          calories_burned: input.calories_burned,
          duration_minutes: input.duration_minutes,
          date: input.date || formatDateForDB(new Date()),
        })
        .select()
        .single()

      if (error) throw error
      return data as Activity
    },
    onSuccess: () => {
      // Invalidate all activity queries to refetch
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      queryClient.invalidateQueries({ queryKey: ['weekly-banking'] })
    },
  })
}

export interface UpdateActivityInput {
  activity_name?: string
  calories_burned?: number | null
  duration_minutes?: number | null
  calorie_source?: 'strava_provided' | 'estimated' | 'manual' | null
}

export function useUpdateActivity() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateActivityInput }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Not authenticated')
      }

      const updateData: any = {
        ...input,
        calorie_source: 'manual', // Set to manual when user edits
      }

      const { data, error } = await supabase
        .from('activities')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      return data as Activity
    },
    onSuccess: () => {
      // Invalidate all activity queries to refetch
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      queryClient.invalidateQueries({ queryKey: ['weekly-banking'] })
    },
  })
}

export function useDeleteActivity() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Not authenticated')
      }

      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
    },
    onSuccess: () => {
      // Invalidate all activity queries to refetch
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      queryClient.invalidateQueries({ queryKey: ['weekly-banking'] })
    },
  })
}
