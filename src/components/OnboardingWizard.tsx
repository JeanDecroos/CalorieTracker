'use client'

import { useState, useEffect, useRef } from 'react'
import { X, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react'
import { useProfile, useUpdateProfile, ProfileInput } from '@/lib/queries/profiles'

interface OnboardingWizardProps {
  onClose: () => void
  onComplete?: () => void
}

export function OnboardingWizard({ onClose, onComplete }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [height, setHeight] = useState<string>('')
  const [weight, setWeight] = useState<string>('')
  const [age, setAge] = useState<string>('')
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const initialized = useRef(false)

  const { data: profile } = useProfile()
  const updateProfile = useUpdateProfile()

  const totalSteps = 3

  // Initialize with existing profile data if available (only once on mount)
  useEffect(() => {
    if (profile && !initialized.current) {
      if (profile.height_cm) setHeight(profile.height_cm.toString())
      if (profile.weight_kg) setWeight(profile.weight_kg.toString())
      if (profile.age) setAge(profile.age.toString())
      initialized.current = true
    }
  }, [profile])

  const validateStep = (step: number): boolean => {
    const newErrors: { [key: string]: string } = {}

    if (step === 1) {
      if (height && (parseFloat(height) < 50 || parseFloat(height) > 250)) {
        newErrors.height = 'Please enter a valid height between 50 and 250 cm'
      }
    } else if (step === 2) {
      if (weight && (parseFloat(weight) < 20 || parseFloat(weight) > 300)) {
        newErrors.weight = 'Please enter a valid weight between 20 and 300 kg'
      }
    } else if (step === 3) {
      if (age && (parseInt(age) < 1 || parseInt(age) > 120)) {
        newErrors.age = 'Please enter a valid age between 1 and 120 years'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1)
      } else {
        handleComplete()
      }
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handleComplete = async () => {
    const profileData: ProfileInput = {}
    
    if (height && !errors.height && !isNaN(parseInt(height))) {
      profileData.height_cm = parseInt(height)
    }
    if (weight && !errors.weight && !isNaN(parseFloat(weight))) {
      profileData.weight_kg = parseFloat(weight)
    }
    if (age && !errors.age && !isNaN(parseInt(age))) {
      profileData.age = parseInt(age)
    }

    // Only update if there's data to save
    if (Object.keys(profileData).length > 0) {
      try {
        await updateProfile.mutateAsync(profileData)
      } catch (error) {
        console.error('Failed to update profile:', error)
        // Don't close on error, let user retry
        return
      }
    }

    // Close wizard and call onComplete callback
    onClose()
    if (onComplete) {
      onComplete()
    }
  }

  const getStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">What's your height?</h3>
              <p className="text-slate-600 text-sm mb-6">
                We use your height along with weight and age to calculate accurate calorie burn estimates for your activities.
              </p>
            </div>
            <div>
              <label htmlFor="height" className="block text-sm font-medium text-slate-700 mb-2">
                Height (cm)
              </label>
              <input
                id="height"
                type="number"
                value={height}
                onChange={(e) => {
                  setHeight(e.target.value)
                  if (errors.height) {
                    setErrors({ ...errors, height: '' })
                  }
                }}
                placeholder="e.g., 175"
                min="50"
                max="250"
                className={`w-full px-4 py-3 border rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${
                  errors.height ? 'border-rose-300 bg-rose-50' : 'border-slate-200'
                }`}
              />
              {errors.height && (
                <p className="mt-2 text-sm text-rose-600">{errors.height}</p>
              )}
            </div>
          </div>
        )
      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">What's your weight?</h3>
              <p className="text-slate-600 text-sm mb-6">
                Your weight is essential for calculating calories burned during activities using the MET (Metabolic Equivalent) formula.
              </p>
            </div>
            <div>
              <label htmlFor="weight" className="block text-sm font-medium text-slate-700 mb-2">
                Weight (kg)
              </label>
              <input
                id="weight"
                type="number"
                value={weight}
                onChange={(e) => {
                  setWeight(e.target.value)
                  if (errors.weight) {
                    setErrors({ ...errors, weight: '' })
                  }
                }}
                placeholder="e.g., 70"
                min="20"
                max="300"
                step="0.1"
                className={`w-full px-4 py-3 border rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${
                  errors.weight ? 'border-rose-300 bg-rose-50' : 'border-slate-200'
                }`}
              />
              {errors.weight && (
                <p className="mt-2 text-sm text-rose-600">{errors.weight}</p>
              )}
            </div>
          </div>
        )
      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">What's your age?</h3>
              <p className="text-slate-600 text-sm mb-6">
                Age helps us calculate your maximum heart rate, which refines calorie burn estimates when heart rate data is available from your activities.
              </p>
            </div>
            <div>
              <label htmlFor="age" className="block text-sm font-medium text-slate-700 mb-2">
                Age (years)
              </label>
              <input
                id="age"
                type="number"
                value={age}
                onChange={(e) => {
                  setAge(e.target.value)
                  if (errors.age) {
                    setErrors({ ...errors, age: '' })
                  }
                }}
                placeholder="e.g., 30"
                min="1"
                max="120"
                className={`w-full px-4 py-3 border rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${
                  errors.age ? 'border-rose-300 bg-rose-50' : 'border-slate-200'
                }`}
              />
              {errors.age && (
                <p className="mt-2 text-sm text-rose-600">{errors.age}</p>
              )}
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Complete Your Profile</h2>
              <p className="text-sm text-slate-500 mt-1">
                Step {currentStep} of {totalSteps}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          {/* Step Content */}
          <div className="mb-8">
            {getStepContent()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              {currentStep > 1 && (
                <button
                  onClick={handlePrevious}
                  className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 font-medium transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Previous
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSkip}
                className="px-4 py-2 text-slate-500 hover:text-slate-700 font-medium transition-colors"
              >
                Skip
              </button>
              <button
                onClick={handleNext}
                disabled={updateProfile.isPending}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateProfile.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : currentStep === totalSteps ? (
                  <>
                    Complete Setup
                    <ChevronRight className="w-5 h-5" />
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
