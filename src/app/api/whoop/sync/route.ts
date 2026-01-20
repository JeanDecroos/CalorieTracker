import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchWhoopWorkouts, WhoopWorkout } from '@/lib/whoop/client'
import { formatDateForDB } from '@/utils/dateUtils'
import { estimateCalories } from '@/lib/utils/calorieEstimation'

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { days = 30 } = body // Default to last 30 days

    // Get user profile for age/weight if available
    const { data: profile } = await supabase
      .from('profiles')
      .select('age, weight_kg')
      .eq('id', user.id)
      .single()

    // Calculate date range
    const now = new Date()
    const afterDate = new Date(now)
    afterDate.setDate(afterDate.getDate() - days)

    // Fetch workouts from Whoop
    // Whoop API uses ISO 8601 date strings
    const startDate = afterDate.toISOString()
    const endDate = now.toISOString()

    const whoopWorkouts = await fetchWhoopWorkouts(
      user.id,
      startDate,
      endDate
    )

    if (whoopWorkouts.length === 0) {
      return NextResponse.json({
        success: true,
        synced: 0,
        message: 'No new activities to sync',
      })
    }

    // Get existing Whoop workout IDs to avoid duplicates
    // Note: This assumes a whoop_workout_id column exists in activities table
    // If not, this will need to be added via migration
    const { data: existingActivities } = await supabase
      .from('activities')
      .select('whoop_workout_id')
      .eq('user_id', user.id)
      .not('whoop_workout_id', 'is', null)

    const existingWhoopIds = new Set(
      existingActivities?.map(a => a.whoop_workout_id).filter(id => id !== null) || []
    )

    const syncedActivities = []
    const skippedActivities = []
    const failedActivities = []

    for (const workout of whoopWorkouts) {
      // Skip if already synced
      if (existingWhoopIds.has(workout.id)) {
        skippedActivities.push({
          id: workout.id,
          name: workout.sport?.name || 'Workout',
          date: workout.start,
          reason: 'already_synced',
        })
        continue
      }

      const workoutDate = new Date(workout.start)
      const workoutDateStr = formatDateForDB(workoutDate)

      // Convert workout to activity name
      const activityName = workout.sport?.name || 'Workout'

      // Calculate duration in minutes
      const start = new Date(workout.start)
      const end = new Date(workout.end)
      const durationMs = end.getTime() - start.getTime()
      const durationMinutes = Math.round(durationMs / (1000 * 60))

      // Calorie priority logic:
      // 1. Use Whoop-provided calories if available and > 0
      // 2. Use kilojoule conversion (1 kJ ≈ 0.239 kcal)
      // 3. Calculate estimate if user has age/weight
      // 4. Default to 0 if calculation not possible
      
      let caloriesBurned: number | null = null
      let calorieSource: string | null = null

      if (workout.calories && workout.calories > 0) {
        // Priority 1: Use Whoop-provided calories
        caloriesBurned = workout.calories
        calorieSource = 'whoop_provided'
      } else if (workout.score?.kilojoule && workout.score.kilojoule > 0) {
        // Priority 2: Convert kilojoule to calories (1 kJ ≈ 0.239 kcal, but for workout energy expenditure, often 1 kJ ≈ 1 kcal)
        // Using a conversion that's more accurate for human energy expenditure
        caloriesBurned = Math.round(workout.score.kilojoule * 0.239)
        calorieSource = 'whoop_kilojoule'
      } else if (profile?.age && profile?.weight_kg && durationMinutes > 0) {
        // Priority 3: Calculate estimate if user has age/weight
        // Try to determine activity type from sport name
        const activityType = workout.sport?.name || 'General'
        const averageHeartRate = workout.score?.average_heart_rate || null
        
        const estimated = estimateCalories({
          activityType,
          durationMinutes,
          weightKg: profile.weight_kg,
          age: profile.age,
          averageHeartRate,
        })
        
        if (estimated !== null && estimated > 0) {
          caloriesBurned = estimated
          calorieSource = 'estimated'
        } else {
          // Priority 4: Default to 0
          caloriesBurned = 0
          calorieSource = null
        }
      } else {
        // Priority 4: Default to 0
        caloriesBurned = 0
        calorieSource = null
      }

      // Insert activity
      // Note: If whoop_workout_id column doesn't exist yet, this insert may need adjustment
      const { error: insertError } = await supabase.from('activities').insert({
        user_id: user.id,
        date: workoutDateStr,
        activity_name: activityName,
        calories_burned: caloriesBurned,
        duration_minutes: durationMinutes > 0 ? durationMinutes : null,
        whoop_workout_id: workout.id,
        calorie_source: calorieSource,
      })

      if (!insertError) {
        syncedActivities.push({
          name: activityName,
          date: workoutDateStr,
          calories: caloriesBurned,
          source: calorieSource,
        })
      } else {
        console.error('Error inserting activity:', insertError, workout)
        failedActivities.push({
          id: workout.id,
          name: activityName,
          date: workoutDateStr,
          error: insertError.message,
        })
      }
    }

    return NextResponse.json({
      success: true,
      synced: syncedActivities.length,
      skipped: skippedActivities.length,
      failed: failedActivities.length,
      total: whoopWorkouts.length,
      activities: syncedActivities,
      skipped_details: skippedActivities,
      failed_details: failedActivities,
      date_range: {
        after: afterDate.toISOString(),
        before: now.toISOString(),
        days,
      },
    })
  } catch (error: any) {
    console.error('Whoop sync error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to sync Whoop activities',
      },
      { status: 500 }
    )
  }
}
