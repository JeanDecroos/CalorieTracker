/**
 * Calorie estimation utility using MET (Metabolic Equivalent) values
 * Formula: calories = MET × weight_kg × duration_hours
 * 
 * References:
 * - Compendium of Physical Activities for MET values
 * - Heart rate can refine intensity estimates
 */

/**
 * MET (Metabolic Equivalent) values for different activity types
 * Based on Compendium of Physical Activities and common exercise types
 */
const MET_VALUES: Record<string, number> = {
  // Running - varies by pace, using moderate effort
  'Run': 10.0,
  'Run - Track': 10.0,
  'Run - Trail': 9.0,
  
  // Cycling - moderate effort
  'Ride': 7.0,
  'Ride - Mountain': 8.5,
  'Ride - Road': 7.0,
  'Ride - Stationary': 6.0,
  'Ride - Virtual': 7.0,
  'Cycling': 7.0,
  
  // Walking
  'Walk': 3.5,
  'Hike': 5.0,
  
  // Swimming
  'Swim': 8.0,
  'Swim - Open Water': 8.5,
  'Swim - Pool': 8.0,
  
  // Strength Training
  'WeightTraining': 5.0,
  'Workout': 5.5,
  'Crossfit': 7.0,
  'Strength': 5.0,
  
  // Other activities
  'Yoga': 2.5,
  'Pilates': 3.0,
  'Elliptical': 7.0,
  'Rowing': 7.0,
  'StairStepper': 9.0,
  'Wheelchair': 3.0,
  'NordicSki': 9.0,
  'AlpineSki': 7.0,
  'Snowboard': 6.0,
  'IceSkate': 7.0,
  'InlineSkate': 12.0,
  'RockClimbing': 8.0,
  'BackcountrySki': 7.0,
  'EBikeRide': 4.0,
  'Velomobile': 7.0,
  'VirtualRide': 7.0,
  'VirtualRun': 10.0,
  
  // Default for unknown activities
  'default': 3.5, // Light activity
}

/**
 * Get MET value for an activity type
 */
function getMETValue(activityType: string): number {
  // Try exact match first
  if (MET_VALUES[activityType]) {
    return MET_VALUES[activityType]
  }
  
  // Try case-insensitive match
  const normalizedType = activityType.trim()
  const key = Object.keys(MET_VALUES).find(
    k => k.toLowerCase() === normalizedType.toLowerCase()
  )
  
  if (key) {
    return MET_VALUES[key]
  }
  
  // Return default MET value
  return MET_VALUES['default']
}

/**
 * Calculate heart rate percentage of max HR
 * Max HR formula: 220 - age (simple estimation)
 */
function getHeartRatePercentage(
  averageHeartRate: number,
  age: number
): number {
  const maxHR = 220 - age
  if (maxHR <= 0) return 0.5 // Default to 50% if invalid
  
  return Math.min(1.0, Math.max(0.3, averageHeartRate / maxHR))
}

/**
 * Adjust MET value based on heart rate intensity
 * Heart rate zones adjust the MET multiplier:
 * - < 50% max HR: 0.8x (light effort)
 * - 50-60%: 1.0x (moderate effort)
 * - 60-70%: 1.2x (moderate-vigorous)
 * - 70-80%: 1.4x (vigorous)
 * - 80-90%: 1.6x (very vigorous)
 * - > 90%: 1.8x (maximum)
 */
function adjustMETByHeartRate(
  baseMET: number,
  heartRatePercentage: number
): number {
  let multiplier = 1.0
  
  if (heartRatePercentage < 0.5) {
    multiplier = 0.8 // Light effort
  } else if (heartRatePercentage < 0.6) {
    multiplier = 1.0 // Moderate effort
  } else if (heartRatePercentage < 0.7) {
    multiplier = 1.2 // Moderate-vigorous
  } else if (heartRatePercentage < 0.8) {
    multiplier = 1.4 // Vigorous
  } else if (heartRatePercentage < 0.9) {
    multiplier = 1.6 // Very vigorous
  } else {
    multiplier = 1.8 // Maximum
  }
  
  return baseMET * multiplier
}

/**
 * Estimate calories burned for an activity
 * 
 * Priority logic:
 * 1. Use Strava-provided calories if available
 * 2. Calculate estimate using MET formula if user has age/weight
 * 3. Return null if calculation not possible (will default to 0)
 * 
 * @param params Activity parameters
 * @returns Estimated calories or null if calculation not possible
 */
export function estimateCalories(params: {
  activityType: string
  durationMinutes: number
  weightKg?: number | null
  age?: number | null
  averageHeartRate?: number | null
}): number | null {
  const { activityType, durationMinutes, weightKg, age, averageHeartRate } = params
  
  // Need at least weight for calculation
  if (!weightKg || weightKg <= 0) {
    return null
  }
  
  // Duration must be positive
  if (!durationMinutes || durationMinutes <= 0) {
    return null
  }
  
  // Get base MET value
  const baseMET = getMETValue(activityType)
  
  // Adjust MET based on heart rate if available
  let adjustedMET = baseMET
  if (averageHeartRate && averageHeartRate > 0 && age && age > 0) {
    const hrPercentage = getHeartRatePercentage(averageHeartRate, age)
    adjustedMET = adjustMETByHeartRate(baseMET, hrPercentage)
  }
  
  // Calculate calories: MET × weight_kg × duration_hours
  const durationHours = durationMinutes / 60
  const calories = adjustedMET * weightKg * durationHours
  
  // Round to nearest integer
  return Math.round(calories)
}
