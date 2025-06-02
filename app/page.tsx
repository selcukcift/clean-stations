"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { useSession } from "next-auth/react"

export default function HomePage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const isAuthenticated = status === 'authenticated'
  const user = session?.user
  const isLoading = status === 'loading'

  useEffect(() => {
    // Give a moment for auth state to hydrate from localStorage
    const timer = setTimeout(() => {
      if (isAuthenticated && user) {
        router.push('/dashboard')
      } else {
        router.push('/login')
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [status, isAuthenticated, user, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
        <h1 className="text-xl font-semibold text-slate-900 mb-2">
          Loading Torvan Medical CleanStation
        </h1>
        <p className="text-slate-600">
          Please wait while we prepare your workflow system...
        </p>
      </div>
    </div>
  )
}
