'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import AuthWrapper from '@/components/auth/AuthWrapper'
import { 
  Upload, Calendar, Book, Users, Play, CheckCircle, XCircle, 
  AlertCircle, FileText, ChevronLeft, LogOut, Lock
} from 'lucide-react'

interface UploadResult {
  success: boolean
  message: string
  data?: any
  error?: string
}

interface AttendanceData {
  cohortType: string
  cohortNumber: string
  subject: string
  date: string
  teacher: string
  table: string
  batch: string
  time: string
  from: string
  sessionFrom: string
}

function AttendanceUploadContent() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  
  // Get pre-filled values from sessionStorage
  const [sessionData, setSessionData] = useState<AttendanceData | null>(null)
  
  useEffect(() => {
    const stored = sessionStorage.getItem('attendanceUploadData')
    if (stored) {
      try {
        setSessionData(JSON.parse(stored))
      } catch {
        router.push('/home')
      }
    } else {
      router.push('/home')
    }
  }, [router])

  const cohortType = sessionData?.cohortType || ''
  const cohortNumber = sessionData?.cohortNumber || ''
  const subject = sessionData?.subject || ''
  const date = sessionData?.date || ''
  const teacherName = sessionData?.teacher || ''
  const tableName = sessionData?.table || ''
  const batchName = sessionData?.batch || ''
  const fromPage = sessionData?.from || 'session'
  
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const resultsRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to results when upload is successful
  useEffect(() => {
    if (uploadResult?.success && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        })
      }, 300)
    }
  }, [uploadResult])

  // Progress animation during upload
  useEffect(() => {
    if (isUploading) {
      setUploadProgress(0)
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 80 && prev < 95) {
            return prev + 1
          } else if (prev >= 95) {
            clearInterval(interval)
            return prev
          }
          const increment = Math.random() * 8 + 2
          return Math.min(prev + increment, 80)
        })
      }, 300)
      return () => clearInterval(interval)
    } else {
      setUploadProgress(0)
    }
  }, [isUploading])

  const handleBack = () => {
    if (fromPage === 'session' && tableName && date) {
      // Restore session page data for navigation back
      sessionStorage.setItem('sessionPageData', JSON.stringify({
        table: tableName,
        date: date,
        time: sessionData?.time || '',
        batch: batchName,
        from: sessionData?.sessionFrom || 'home'
      }))
      router.push('/session')
    } else {
      router.push('/home')
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      const file = files[0]
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setCsvFile(file)
      } else {
        alert('Please upload a CSV file only')
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      const file = files[0]
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setCsvFile(file)
      } else {
        alert('Please upload a CSV file only')
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!csvFile) {
      alert('Please select a CSV file')
      return
    }

    setIsUploading(true)
    setUploadResult(null)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('csv_file', csvFile)
      formData.append('cohort_type', cohortType)
      formData.append('cohort_number', cohortNumber)
      formData.append('subject', subject)
      formData.append('date', date)
      formData.append('teacher_name', teacherName)

      const response = await fetch('/api/attendance/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      setUploadProgress(100)
      await new Promise(resolve => setTimeout(resolve, 500))

      if (response.ok) {
        setUploadResult({
          success: true,
          message: 'Attendance uploaded successfully!',
          data: result
        })
        setCsvFile(null)
        const fileInput = document.getElementById('csvFile') as HTMLInputElement
        if (fileInput) fileInput.value = ''
      } else {
        setUploadResult({
          success: false,
          message: 'Upload failed',
          error: result.error || 'Unknown error occurred',
          data: result
        })
      }
    } catch (error) {
      setUploadResult({
        success: false,
        message: 'Upload failed',
        error: error instanceof Error ? error.message : 'Network error occurred'
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A'
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-IN', { 
      weekday: 'short',
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    })
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 via-slate-950 to-purple-950/20" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 bg-slate-950/50 backdrop-blur-xl sticky top-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back to Session</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Upload className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-white">Upload Attendance</h1>
                <p className="text-slate-500 text-xs">{batchName}</p>
              </div>
            </div>

            <button
              onClick={signOut}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Upload <span className="text-blue-400">Attendance</span>
          </h2>
          <p className="text-slate-400">
            Upload the Teams/Zoom meeting attendance CSV file
          </p>
        </div>

        {/* Session Info Card (Read-only) */}
        <div className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-white/10 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-400 font-medium">Session Details (Auto-filled)</span>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Cohort Type */}
            <div className="bg-slate-900/50 rounded-xl p-3 border border-white/5">
              <div className="flex items-center gap-2 mb-1">
                <Book className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs text-slate-500">Cohort Type</span>
              </div>
              <p className="text-white font-medium">{cohortType || 'N/A'}</p>
            </div>

            {/* Cohort Number */}
            <div className="bg-slate-900/50 rounded-xl p-3 border border-white/5">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-xs text-slate-500">Cohort #</span>
              </div>
              <p className="text-white font-medium">{cohortNumber || 'N/A'}</p>
            </div>

            {/* Subject */}
            <div className="bg-slate-900/50 rounded-xl p-3 border border-white/5">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs text-slate-500">Subject</span>
              </div>
              <p className="text-white font-medium truncate">{subject || 'N/A'}</p>
            </div>

            {/* Date */}
            <div className="bg-slate-900/50 rounded-xl p-3 border border-white/5">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-xs text-slate-500">Class Date</span>
              </div>
              <p className="text-white font-medium">{formatDate(date)}</p>
            </div>

            {/* Teacher */}
            <div className="bg-slate-900/50 rounded-xl p-3 border border-white/5">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-3.5 h-3.5 text-pink-400" />
                <span className="text-xs text-slate-500">Teacher</span>
              </div>
              <p className="text-white font-medium truncate">{teacherName || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Upload Form */}
        <div className="bg-gradient-to-b from-slate-800/50 to-slate-900/50 border border-white/10 rounded-2xl p-6 sm:p-8">
          <form onSubmit={handleSubmit}>
            {/* File Upload Area */}
            <div
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${
                dragActive
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-white/20 hover:border-blue-500/50 hover:bg-white/5'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {csvFile ? (
                <div className="space-y-3">
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto">
                    <FileText className="w-8 h-8 text-emerald-400" />
                  </div>
                  <p className="text-emerald-400 font-medium text-lg">{csvFile.name}</p>
                  <p className="text-slate-400 text-sm">
                    {(csvFile.size / 1024).toFixed(1)} KB
                  </p>
                  <button
                    type="button"
                    onClick={() => setCsvFile(null)}
                    className="text-red-400 hover:text-red-300 text-sm underline"
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto">
                    <Upload className="w-8 h-8 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium mb-1">
                      Drag and drop your CSV file here
                    </p>
                    <p className="text-slate-400 text-sm mb-4">
                      or click to browse files
                    </p>
                    <input
                      id="csvFile"
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="csvFile"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl cursor-pointer transition-all duration-200 transform hover:scale-105"
                    >
                      <Upload className="w-4 h-4" />
                      Choose File
                    </label>
                  </div>
                  <p className="text-slate-500 text-xs">
                    Supported format: CSV files only
                  </p>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="mt-6">
              <button
                type="submit"
                disabled={!csvFile || isUploading}
                className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 transition-all duration-200 ${
                  isUploading
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 animate-pulse'
                    : csvFile
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl hover:shadow-blue-500/20'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                } text-white`}
              >
                {isUploading ? (
                  <>
                    <div className="relative w-8 h-8">
                      <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 32 32">
                        <circle cx="16" cy="16" r="12" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
                        <circle
                          cx="16" cy="16" r="12" fill="none"
                          stroke="rgba(255,255,255,0.9)" strokeWidth="3" strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 12}`}
                          strokeDashoffset={`${2 * Math.PI * 12 * (1 - uploadProgress / 100)}`}
                          className="transition-all duration-300 ease-out"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold">{Math.round(uploadProgress)}</span>
                      </div>
                    </div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Upload Attendance
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Upload Result */}
        {uploadResult && (
          <div
            ref={resultsRef}
            className={`mt-6 rounded-2xl p-6 border ${
              uploadResult.success
                ? 'bg-emerald-500/10 border-emerald-500/20'
                : 'bg-red-500/10 border-red-500/20'
            }`}
          >
            <div className="flex items-start gap-3">
              {uploadResult.success ? (
                <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
              )}

              <div className="flex-1">
                <h3 className={`font-semibold mb-2 ${uploadResult.success ? 'text-emerald-400' : 'text-red-400'}`}>
                  {uploadResult.message}
                </h3>

                {uploadResult.error && (
                  <p className="text-red-300 text-sm">{uploadResult.error}</p>
                )}

                {uploadResult.success && uploadResult.data && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-white/5 rounded-xl mt-3">
                    <div>
                      <p className="text-slate-400 text-sm">Total Processed</p>
                      <p className="text-white font-medium text-lg">{uploadResult.data.processed || 0}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Present</p>
                      <p className="text-emerald-400 font-medium text-lg">{uploadResult.data.present || 0}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Absent</p>
                      <p className="text-red-400 font-medium text-lg">{uploadResult.data.absent || 0}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Date</p>
                      <p className="text-blue-400 font-medium">{uploadResult.data.class_date || date}</p>
                    </div>
                  </div>
                )}

                {uploadResult.success && (
                  <button
                    onClick={handleBack}
                    className="mt-4 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-colors text-sm"
                  >
                    ← Back to Session
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-blue-400 font-semibold mb-2">CSV Format</h3>
              <ul className="text-blue-300 text-sm space-y-1">
                <li>• Upload the meeting attendance export from Teams/Zoom</li>
                <li>• Roll Number format: 2XMBYXXX (e.g., 25MBY3001)</li>
                <li>• Students with ≥10% attendance time = Present</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function AttendanceUploadPage() {
  return (
    <AuthWrapper>
      <AttendanceUploadContent />
    </AuthWrapper>
  )
}

