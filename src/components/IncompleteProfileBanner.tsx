'use client'

import { useState, useEffect } from 'react'
import { X, AlertCircle, ChevronRight } from 'lucide-react'
import { useProfile, isProfileComplete } from '@/lib/queries/profiles'
import { OnboardingWizard } from './OnboardingWizard'

export function IncompleteProfileBanner() {
  const { data: profile } = useProfile()
  const [isDismissed, setIsDismissed] = useState(false)
  const [showWizard, setShowWizard] = useState(false)

  // Check if banner was dismissed in this session
  useEffect(() => {
    const dismissed = sessionStorage.getItem('profile-banner-dismissed')
    if (dismissed === 'true') {
      setIsDismissed(true)
    }
  }, [])

  const handleDismiss = () => {
    setIsDismissed(true)
    sessionStorage.setItem('profile-banner-dismissed', 'true')
  }

  const handleCompleteProfile = () => {
    setShowWizard(true)
  }

  const handleWizardComplete = () => {
    setShowWizard(false)
    // Clear dismissal so banner can reappear if still incomplete
    sessionStorage.removeItem('profile-banner-dismissed')
    setIsDismissed(false)
  }

  // Don't show if profile is complete or dismissed
  if (!profile || isProfileComplete(profile) || isDismissed) {
    return null
  }

  return (
    <>
      <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6 rounded-r-xl">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-amber-900 mb-1">
              Complete your profile for accurate calculations
            </h3>
            <p className="text-sm text-amber-800 mb-3">
              For accurate calorie burn calculations, we need your height, weight, and age. 
              Without this information, activity calories may be estimated less accurately.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCompleteProfile}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Complete Profile
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleDismiss}
                className="text-amber-600 hover:text-amber-800 text-sm font-medium transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-amber-400 hover:text-amber-600 transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {showWizard && (
        <OnboardingWizard
          onClose={() => setShowWizard(false)}
          onComplete={handleWizardComplete}
        />
      )}
    </>
  )
}
