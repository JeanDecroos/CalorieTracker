import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchStravaActivities } from '@/lib/strava/client'
import { formatDateForDB } from '@/utils/dateUtils'
import { estimateCalories } from '@/lib/utils/calorieEstimation'

interface StravaActivity {
  id: number
  name: string
  distance: number
  moving_time: number
  elapsed_time: number
  type: string
  start_date_local: string
  calories?: number
  average_heartrate?: number
}

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

    // Fetch activities from Strava
    const afterTimestamp = Math.floor(afterDate.getTime() / 1000)
    const beforeTimestamp = Math.floor(now.getTime() / 1000)

    const stravaActivities = await fetchStravaActivities(
      user.id,
      beforeTimestamp,
      afterTimestamp
    )

    if (stravaActivities.length === 0) {
      return NextResponse.json({
        success: true,
        synced: 0,
        message: 'No new activities to sync',
      })
    }

    // Get existing Strava activity IDs to avoid duplicates
    const { data: existingActivities } = await supabase
      .from('activities')
      .select('strava_activity_id')
      .eq('user_id', user.id)
      .not('strava_activity_id', 'is', null)

    const existingStravaIds = new Set(
      existingActivities?.map(a => a.strava_activity_id).filter(id => id !== null) || []
    )

    const syncedActivities = []
    const skippedActivities = []
    const failedActivities = []

    for (const activity of stravaActivities) {
      // Skip if already synced
      if (existingStravaIds.has(activity.id)) {
        skippedActivities.push({
          id: activity.id,
          name: activity.name || activity.type,
          date: activity.start_date_local,
          reason: 'already_synced',
        })
        continue
      }

      const activityDate = new Date(activity.start_date_local)
      const activityDateStr = formatDateForDB(activityDate)

      // Convert activity type to readable name
      const activityName =
        activity.type === 'Run'
          ? 'Running'
          : activity.type === 'Ride'
            ? 'Cycling'
            : activity.type === 'Walk'
              ? 'Walking'
              : activity.type === 'Swim'
                ? 'Swimming'
                : activity.type || 'Activity'

      // Duration in minutes
      const durationMinutes = Math.round((activity.moving_time || activity.elapsed_time) / 60)

      // Calorie priority logic:
      // 1. Use Strava-provided calories if available and > 0
      // 2. Calculate estimate if user has age/weight
      // 3. Default to 0 if calculation not possible
      
      let caloriesBurned: number | null = null
      let calorieSource: string | null = null

      if (activity.calories && activity.calories > 0) {
        // Priority 1: Use Strava-provided calories
        caloriesBurned = activity.calories
        calorieSource = 'strava_provided'
      } else if (profile?.age && profile?.weight_kg) {
        // Priority 2: Calculate estimate if user has age/weight
        const estimated = estimateCalories({
          activityType: activity.type,
          durationMinutes,
          weightKg: profile.weight_kg,
          age: profile.age,
          averageHeartRate: activity.average_heartrate || null,
        })
        
        if (estimated !== null && estimated > 0) {
          caloriesBurned = estimated
          calorieSource = 'estimated'
        } else {
          // Priority 3: Default to 0
          caloriesBurned = 0
          calorieSource = null
        }
      } else {
        // Priority 3: Default to 0
        caloriesBurned = 0
        calorieSource = null
      }

      // Insert activity
      const { error: insertError } = await supabase.from('activities').insert({
        user_id: user.id,
        date: activityDateStr,
        activity_name: activityName,
        calories_burned: caloriesBurned,
        duration_minutes: durationMinutes > 0 ? durationMinutes : null,
        strava_activity_id: activity.id,
        calorie_source: calorieSource,
      })

      if (!insertError) {
        syncedActivities.push({
          name: activityName,
          date: activityDateStr,
          calories: caloriesBurned,
          source: calorieSource,
        })
      } else {
        console.error('Error inserting activity:', insertError, activity)
        failedActivities.push({
          id: activity.id,
          name: activityName,
          date: activityDateStr,
          error: insertError.message,
        })
      }
    }

    return NextResponse.json({
      success: true,
      synced: syncedActivities.length,
      skipped: skippedActivities.length,
      failed: failedActivities.length,
      total: stravaActivities.length,
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
    console.error('Strava sync error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to sync Strava activities',
      },
      { status: 500 }
    )
  }
}
