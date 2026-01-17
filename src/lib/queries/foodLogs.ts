import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { formatDateForDB } from '@/utils/dateUtils'

export interface FoodLog {
  id: string
  user_id: string
  date: string
  product_name: string
  calories: number
  protein: number
  grams: number
  meal_type?: string
  created_at: string
}

export interface CreateFoodLogInput {
  product_name: string
  calories: number
  protein: number
  grams: number
  date?: string
  meal_type?: string
}

export function useFoodLogs(weekStart: Date, weekEnd: Date) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['food-logs', formatDateForDB(weekStart), formatDateForDB(weekEnd)],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Not authenticated')
      }

      const { data, error } = await supabase
        .from('food_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', formatDateForDB(weekStart))
        .lte('date', formatDateForDB(weekEnd))
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as FoodLog[]
    },
  })
}

export function useTodayFoodLogs() {
  const supabase = createClient()
  const today = formatDateForDB(new Date())

  return useQuery({
    queryKey: ['food-logs', 'today', today],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Not authenticated')
      }

      const { data, error } = await supabase
        .from('food_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as FoodLog[]
    },
  })
}

export function useAddFoodLog() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateFoodLogInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Not authenticated')
      }

      const { data, error } = await supabase
        .from('food_logs')
        .insert({
          user_id: user.id,
          product_name: input.product_name,
          calories: input.calories,
          protein: input.protein,
          grams: input.grams,
          date: input.date || formatDateForDB(new Date()),
          meal_type: input.meal_type || 'Lunch',
        })
        .select()
        .single()

      if (error) throw error
      return data as FoodLog
    },
    onSuccess: () => {
      // Invalidate all food log queries to refetch
      queryClient.invalidateQueries({ queryKey: ['food-logs'] })
      queryClient.invalidateQueries({ queryKey: ['weekly-banking'] })
    },
  })
}

export function useUpdateFoodLog() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<CreateFoodLogInput> }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Not authenticated')
      }

      const updateData: any = {}
      if (input.product_name !== undefined) updateData.product_name = input.product_name
      if (input.calories !== undefined) updateData.calories = input.calories
      if (input.protein !== undefined) updateData.protein = input.protein
      if (input.grams !== undefined) updateData.grams = input.grams
      if (input.meal_type !== undefined) updateData.meal_type = input.meal_type

      const { data, error } = await supabase
        .from('food_logs')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      return data as FoodLog
    },
    onSuccess: () => {
      // Invalidate all food log queries to refetch
      queryClient.invalidateQueries({ queryKey: ['food-logs'] })
      queryClient.invalidateQueries({ queryKey: ['weekly-banking'] })
    },
  })
}

export function useDeleteFoodLog() {
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
        .from('food_logs')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
    },
    onSuccess: () => {
      // Invalidate all food log queries to refetch
      queryClient.invalidateQueries({ queryKey: ['food-logs'] })
      queryClient.invalidateQueries({ queryKey: ['weekly-banking'] })
    },
  })
}
