'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function Page() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/home')
  }, [router])

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
    </div>
  )
}
