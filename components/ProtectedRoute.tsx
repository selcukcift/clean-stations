"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { useAuthStore, type User } from "@/stores/authStore"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: User['role'][]
  redirectTo?: string
}

export default function ProtectedRoute({ 
  children, 
  allowedRoles,
  redirectTo = '/login'
}: ProtectedRouteProps) {
  const router = useRouter()
  const { isAuthenticated, user, isLoading } = useAuthStore()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Wait for auth state to hydrate from localStorage
    const timer = setTimeout(() => {
      if (!isAuthenticated || !user) {
        router.push(redirectTo)
        return
      }

      // Check role permissions if specified
      if (allowedRoles && !allowedRoles.includes(user.role)) {
        router.push('/dashboard') // Redirect to dashboard if role not allowed
        return
      }

      setIsChecking(false)
    }, 100)

    return () => clearTimeout(timer)
  }, [isAuthenticated, user, allowedRoles, router, redirectTo])

  if (isLoading || isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900 mb-2">
            Authenticating...
          </h1>
          <p className="text-slate-600">
            Verifying your access permissions...
          </p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null // Router will handle redirect
  }

  return <>{children}</>
}

// Helper component for role-specific access
interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles: User['role'][]
  fallback?: React.ReactNode
}

export function RoleGuard({ children, allowedRoles, fallback }: RoleGuardProps) {
  const { user } = useAuthStore()

  if (!user || !allowedRoles.includes(user.role)) {
    return fallback || (
      <div className="p-4 text-center">
        <p className="text-slate-600">You don't have permission to access this content.</p>
      </div>
    )
  }

  return <>{children}</>
}
