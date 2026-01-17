import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface MealTemplate {
  id: string
  user_id: string
  name: string
  calories: number
  protein: number
  grams: number
  category?: string | null
  notes?: string | null
  stock?: number | null
  created_at: string
  updated_at: string
}

export interface CreateMealTemplateInput {
  name: string
  calories: number
  protein: number
  grams: number
  category?: string | null
  notes?: string | null
  stock?: number | null
}

export interface UpdateMealTemplateInput {
  name?: string
  calories?: number
  protein?: number
  grams?: number
  category?: string | null
  notes?: string | null
  stock?: number | null
}

export function useMealTemplates() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['meal-templates'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Not authenticated')
      }

      const { data, error } = await supabase
        .from('meal_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as MealTemplate[]
    },
  })
}

export function useAddMealTemplate() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateMealTemplateInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Not authenticated')
      }

      const { data, error } = await supabase
        .from('meal_templates')
        .insert({
          user_id: user.id,
          name: input.name,
          calories: input.calories,
          protein: input.protein,
          grams: input.grams,
          category: input.category || null,
          notes: input.notes || null,
          stock: input.stock !== undefined ? input.stock : null,
        })
        .select()
        .single()

      if (error) throw error
      return data as MealTemplate
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal-templates'] })
    },
  })
}

export function useUpdateMealTemplate() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateMealTemplateInput }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Not authenticated')
      }

      const updateData: any = {}
      if (input.name !== undefined) updateData.name = input.name
      if (input.calories !== undefined) updateData.calories = input.calories
      if (input.protein !== undefined) updateData.protein = input.protein
      if (input.grams !== undefined) updateData.grams = input.grams
      if (input.category !== undefined) updateData.category = input.category
      if (input.notes !== undefined) updateData.notes = input.notes
      if (input.stock !== undefined) updateData.stock = input.stock

      const { data, error } = await supabase
        .from('meal_templates')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      return data as MealTemplate
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal-templates'] })
    },
  })
}

export function useDeleteMealTemplate() {
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
        .from('meal_templates')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meal-templates'] })
    },
  })
}