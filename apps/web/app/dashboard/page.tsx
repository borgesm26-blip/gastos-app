'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { withAuth } from '@/lib/auth-guard'
import { Expense } from 'types'
import Link from 'next/link'

function DashboardPage() {
  const router = useRouter()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  const fetchExpenses = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/auth/login')
        return
      }

      setUser(session.user)

      const response = await fetch('/api/gastos', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setExpenses(data)
      }
    } catch (error) {
      console.error('Error fetching expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExpenses()

    // Suscribirse a cambios en real-time
    const channel = supabase
      .channel('expenses')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expenses' },
        () => {
          fetchExpenses()
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  // Calcular totales por categoría
  const totalByCategory = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount
    return acc
  }, {} as Record<string, number>)

  // Total general
  const totalExpenses = expenses.reduce((acc, expense) => acc + expense.amount, 0)

  // Total por owner
  const totalByOwner = expenses.reduce((acc, expense) => {
    acc[expense.owner] = (acc[expense.owner] || 0) + expense.amount
    return acc
  }, {} as Record<string, number>)

  // Gastos de este mes
  const thisMonth = new Date()
  const monthExpenses = expenses.filter((e) => {
    const date = new Date(e.created_at)
    return date.getMonth() === thisMonth.getMonth() && date.getFullYear() === thisMonth.getFullYear()
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">💰 Gastos</h1>
            <p className="text-gray-600 text-sm mt-1">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition"
          >
            Salir
          </button>
        </div>

        {/* Botón Nuevo Gasto */}
        <Link
          href="/nuevo"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-lg text-center text-lg mb-8 block transition shadow-lg"
        >
          ➕ Nuevo Gasto
        </Link>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-semibold mb-2">Total Este Mes</p>
            <p className="text-4xl font-bold text-indigo-600">
              ${monthExpenses.reduce((acc, e) => acc + e.amount, 0).toFixed(2)}
            </p>
            <p className="text-gray-500 text-xs mt-2">{monthExpenses.length} gastos</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-semibold mb-2">Total General</p>
            <p className="text-4xl font-bold text-blue-600">
              ${totalExpenses.toFixed(2)}
            </p>
            <p className="text-gray-500 text-xs mt-2">{expenses.length} gastos</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-semibold mb-2">Compartido</p>
            <p className="text-4xl font-bold text-green-600">
              ${(totalByOwner['compartido'] || 0).toFixed(2)}
            </p>
            <p className="text-gray-500 text-xs mt-2">Pozo común</p>
          </div>
        </div>

        {/* Gastos por Categoría */}
        {Object.keys(totalByCategory).length > 0 && (
          <div className="bg-white rounded-lg shadow mb-8 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Gastos por Categoría</h2>
            <div className="space-y-3">
              {Object.entries(totalByCategory)
                .sort(([, a], [, b]) => b - a)
                .map(([category, total]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-gray-700 font-medium">{category}</span>
                    <div className="flex items-center gap-4 flex-1 ml-4">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full"
                          style={{
                            width: `${(total / Math.max(...Object.values(totalByCategory))) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-indigo-600 font-bold min-w-[100px] text-right">
                        ${total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Últimos Gastos */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Últimos Gastos</h2>
          {expenses.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No hay gastos registrados. ¡Comienza a registrar tus gastos!
            </p>
          ) : (
            <div className="space-y-2">
              {expenses.slice(0, 10).map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{expense.category}</p>
                    {expense.description && (
                      <p className="text-sm text-gray-600">{expense.description}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      {new Date(expense.created_at).toLocaleDateString('es-AR')} •{' '}
                      {expense.owner === 'yo' ? 'Yo' : expense.owner === 'vos' ? 'Vos' : 'Compartido'}
                    </p>
                  </div>
                  <p className="text-xl font-bold text-indigo-600 min-w-[100px] text-right">
                    ${expense.amount.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default withAuth(DashboardPage)
