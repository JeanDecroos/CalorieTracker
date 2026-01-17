import Link from 'next/link'
import { Shield, Lock, Database, Users, Eye, Trash2, Download } from 'lucide-react'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-medium mb-6"
          >
            ← Back to Home
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-indigo-600" />
            <h1 className="text-4xl font-extrabold text-slate-900">Privacy Policy</h1>
          </div>
          <p className="text-slate-600">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Introduction</h2>
            <p className="text-slate-700 leading-relaxed">
              Welcome to CalorieTracker. We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, store, and protect your data when you use our application.
            </p>
          </section>

          {/* Data Collection */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-5 h-5 text-indigo-600" />
              <h2 className="text-2xl font-bold text-slate-900">Information We Collect</h2>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Account Information</h3>
                <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
                  <li>Email address (for authentication)</li>
                  <li>User profile information (age, weight) - optional</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Health and Fitness Data</h3>
                <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
                  <li>Food logs (meals, calories, protein, grams)</li>
                  <li>Activity data (exercise type, duration, calories burned)</li>
                  <li>Calorie goals and targets</li>
                  <li>Weekly and monthly progress data</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Third-Party Integration Data</h3>
                <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
                  <li>Strava activity data (if you connect your Strava account)</li>
                  <li>Strava access tokens (stored securely for API access)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* How We Use Data */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Eye className="w-5 h-5 text-indigo-600" />
              <h2 className="text-2xl font-bold text-slate-900">How We Use Your Information</h2>
            </div>
            <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
              <li>To provide and maintain our calorie tracking services</li>
              <li>To calculate and display your calorie balance, progress, and statistics</li>
              <li>To sync activity data from Strava (if connected)</li>
              <li>To estimate calories burned for activities when not provided by Strava</li>
              <li>To personalize your experience and track your health goals</li>
              <li>To improve our services and user experience</li>
            </ul>
          </section>

          {/* Data Storage */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-5 h-5 text-indigo-600" />
              <h2 className="text-2xl font-bold text-slate-900">Data Storage and Security</h2>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Database</h3>
                <p className="text-slate-700 leading-relaxed">
                  Your data is stored securely in Supabase, a cloud-hosted PostgreSQL database. All data is protected by:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4 mt-2">
                  <li>Row Level Security (RLS) policies that ensure only you can access your own data</li>
                  <li>Encrypted connections (HTTPS/TLS)</li>
                  <li>Secure authentication and authorization</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">Third-Party Services</h3>
                <p className="text-slate-700 leading-relaxed">
                  We use the following third-party services that may process your data:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4 mt-2">
                  <li><strong>Supabase</strong>: Database and authentication services</li>
                  <li><strong>Strava</strong>: Activity tracking (only if you choose to connect your account)</li>
                  <li><strong>Netlify</strong>: Application hosting and deployment</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Data Sharing */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-indigo-600" />
              <h2 className="text-2xl font-bold text-slate-900">Data Sharing</h2>
            </div>
            <p className="text-slate-700 leading-relaxed">
              We do not sell, trade, or rent your personal information to third parties. We only share your data:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4 mt-2">
              <li>With service providers (Supabase, Netlify) necessary to operate our application</li>
              <li>With Strava, only if you explicitly connect your Strava account</li>
              <li>When required by law or to protect our rights and safety</li>
            </ul>
          </section>

          {/* User Rights */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Download className="w-5 h-5 text-indigo-600" />
              <h2 className="text-2xl font-bold text-slate-900">Your Rights</h2>
            </div>
            <p className="text-slate-700 leading-relaxed mb-4">
              You have the following rights regarding your personal data:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
              <li><strong>Access</strong>: You can view all your data through the application</li>
              <li><strong>Modification</strong>: You can update or correct your data at any time</li>
              <li><strong>Deletion</strong>: You can delete your account and all associated data</li>
              <li><strong>Data Portability</strong>: You can export your data (contact us for assistance)</li>
              <li><strong>Withdrawal of Consent</strong>: You can disconnect third-party integrations (e.g., Strava) at any time</li>
            </ul>
          </section>

          {/* Cookies and Tracking */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Cookies and Tracking</h2>
            <p className="text-slate-700 leading-relaxed">
              We use authentication cookies to maintain your login session. These are essential for the application to function and are not used for tracking or advertising purposes.
            </p>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Children's Privacy</h2>
            <p className="text-slate-700 leading-relaxed">
              Our service is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
            </p>
          </section>

          {/* Changes to Policy */}
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Changes to This Privacy Policy</h2>
            <p className="text-slate-700 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          {/* Contact */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-indigo-600" />
              <h2 className="text-2xl font-bold text-slate-900">Contact Us</h2>
            </div>
            <p className="text-slate-700 leading-relaxed">
              If you have any questions about this Privacy Policy or wish to exercise your rights regarding your personal data, please contact us at:
            </p>
            <div className="mt-4 p-4 bg-slate-50 rounded-xl">
              <p className="text-slate-800 font-medium">Email: bartjan.decroos@me.com</p>
            </div>
          </section>

          {/* Consent */}
          <section className="pt-6 border-t border-slate-200">
            <p className="text-slate-700 leading-relaxed">
              By using CalorieTracker, you consent to the collection and use of information in accordance with this Privacy Policy.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
