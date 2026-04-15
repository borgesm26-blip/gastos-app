'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from './supabase'

export function withAuth(Component: React.ComponentType) {
  return function ProtectedComponent(props: any) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    useEffect(() => {
      const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
          router.push('/auth/login')
          return
        }

        setIsAuthenticated(true)
        setIsLoading(false)
      }

      checkAuth()

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          if (!session) {
            router.push('/auth/login')
          }
        }
      )

      return () => {
        subscription?.unsubscribe()
      }
    }, [router])

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">Cargando...</p>
          </div>
        </div>
      )
    }

    return isAuthenticated ? <Component {...props} /> : null
  }
}
