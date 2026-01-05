'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { OnboardingData } from '@/types'
import Sidebar from '@/components/Sidebar'
import DataTable from '@/components/DataTable'
import CohortCharts from '@/components/CohortCharts'
import AttendanceUpload from '@/components/AttendanceUpload'
import AttendanceRecords from '@/components/AttendanceRecords'
import XPLeaderboard from '@/components/XPLeaderboard'
import AuthWrapper from '@/components/auth/AuthWrapper'
import { Menu, X, ArrowLeft, Loader2 } from 'lucide-react'
import FeedbackTable from '@/components/FeedbackTable'
import MentibyCallingAgent from '@/components/MentibyCallingAgent'
import CohortInitiator from '@/components/CohortInitiator'
import CohortScheduleEditor from '@/components/CohortScheduleEditor'

// Temporary local type definition for FeedbackData
type FeedbackData = {
  EnrollmentID: string
  Mentor1Feedback: string
  Mentor2Feedback: string
  OverallFeedback: string
  ChallengesFaced: string
  SuggestionsToImprove: string
}

interface SelectedBatch {
  tableName: string
  batchName: string
  sessionCount: number
}

interface AdminPanelProps {
  selectedBatch: SelectedBatch
  onBack: () => void
}

function AdminPanel({ selectedBatch, onBack }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'table' | 'charts' | 'feedback'| 'mbycallingagent' | 'attendance' | 'xp' | 'records' | 'cohort-initiator' | 'cohort-schedule-editor'>('cohort-schedule-editor')
  const [onboardingData, setOnboardingData] = useState<OnboardingData[]>([])
  const [feedbackData, setFeedbackData] = useState<FeedbackData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    fetchData()
    fetchFeedbackData()
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data: onboardingData, error } = await supabase
        .from('onboarding')
        .select('*')
        .order('EnrollmentID', { ascending: true })

      if (error) {
        throw error
      }

      setOnboardingData(onboardingData || [])
    } catch (err) {
      console.error('Error fetching onboarding data:', err)
      setError(err instanceof Error ? err.message : 'An error occurred while fetching onboarding data')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchFeedbackData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data: feedbackData, error } = await supabase
        .from('mentibyFeedback')
        .select('*')
        .order('Overall Mentiby Rating', { ascending: true })
        .order('Mentor Teaching Style Rating', { ascending: true })

      if (error) {
        throw error
      }

      setFeedbackData(feedbackData || [])
    } catch (err) {
      console.error('Error fetching feedback data:', err)
      setError(err instanceof Error ? err.message : 'An error occurred while fetching feedback data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTabChange = (tab: 'table' | 'charts' | 'feedback' | 'mbycallingagent' | 'attendance' | 'xp' | 'records' | 'cohort-initiator' | 'cohort-schedule-editor') => {
    setActiveTab(tab)
    setIsMobileMenuOpen(false)
  }

  const renderContent = () => {
    if (error) {
      return (
        <div className="flex items-center justify-center h-full px-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 glow-purple">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold gradient-text mb-2 sm:mb-3">Error Loading Data</h3>
            <p className="text-muted-foreground mb-4 sm:mb-6 text-sm sm:text-base">{error}</p>
            <button
              onClick={() => {
                if (activeTab === 'feedback') {
                  fetchFeedbackData()
                } else {
                  fetchData()
                }
              }}
              className="px-4 py-2 sm:px-6 sm:py-3 gradient-purple text-white rounded-xl hover:scale-105 transition-all duration-300 font-medium glow-purple text-sm sm:text-base"
            >
              Retry Connection
            </button>
          </div>
        </div>
      )
    }

    switch (activeTab) {
      case 'table':
        return <DataTable data={onboardingData} isLoading={isLoading} onDataUpdate={fetchData} />
      case 'feedback':
        return <FeedbackTable data={feedbackData} isLoading={isLoading} onDataUpdate={fetchFeedbackData} />
      case 'charts':
        return <CohortCharts data={onboardingData} isLoading={isLoading} />
      case 'xp':
        return <XPLeaderboard />
      case 'records':
        return <AttendanceRecords />
      case 'attendance':
        return <AttendanceUpload />
      case 'mbycallingagent':
        return <MentibyCallingAgent/>
      case 'cohort-initiator':
        return <CohortInitiator />
      case 'cohort-schedule-editor':
        return <CohortScheduleEditor />
      default:
        return <DataTable data={onboardingData} isLoading={isLoading} onDataUpdate={fetchData} />
    }
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile Menu Button */}
      {!isMobileMenuOpen && (
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="fixed top-20 left-4 z-50 lg:hidden p-3 bg-card/80 backdrop-blur-xl border border-border/50 rounded-xl hover:scale-105 transition-all duration-300"
        >
          <Menu className="w-5 h-5 text-foreground" />
        </button>
      )}

      {/* Mobile Close Button */}
      {isMobileMenuOpen && (
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed top-4 right-4 z-50 lg:hidden p-3 bg-card/80 backdrop-blur-xl border border-border/50 rounded-xl"
        >
          <X className="w-5 h-5 text-foreground" />
        </button>
      )}

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-40 lg:z-auto
        transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        transition-transform duration-300 ease-in-out lg:transition-none
      `}>
        <Sidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 border-b border-border/50 bg-background/80 backdrop-blur-sm">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-2 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 text-violet-400 rounded-lg transition-all duration-200 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </button>

          <div className="px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg">
            <span className="text-slate-400 text-sm">Viewing: </span>
            <span className="text-white font-medium">{selectedBatch.batchName}</span>
          </div>

          <div className="w-24 sm:w-32" />
        </div>

        <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto pt-4">
          <div className="h-full flex flex-col">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  )
}

function DashboardContent() {
  const router = useRouter()
  const [selectedBatch, setSelectedBatch] = useState<SelectedBatch | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if batch is stored in sessionStorage
    const storedBatch = sessionStorage.getItem('selectedBatch')
    if (storedBatch) {
      try {
        setSelectedBatch(JSON.parse(storedBatch))
      } catch {
        // Invalid data, redirect to home
        router.replace('/home')
      }
    } else {
      // No batch selected, redirect to home
      router.replace('/home')
    }
    setIsLoading(false)
  }, [router])

  const handleBack = () => {
    // Clear stored batch and navigate to home
    sessionStorage.removeItem('selectedBatch')
    router.push('/home')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
      </div>
    )
  }

  if (!selectedBatch) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
      </div>
    )
  }

  return (
    <AdminPanel 
      selectedBatch={selectedBatch} 
      onBack={handleBack} 
    />
  )
}

export default function Page() {
  return (
    <AuthWrapper>
      <DashboardContent />
    </AuthWrapper>
  )
}
