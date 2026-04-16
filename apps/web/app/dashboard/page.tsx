'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { withAuth } from '@/lib/auth-guard'
import { downloadExcel } from '@/lib/export'
import Link from 'next/link'

type Expense = {
  id: string
  user_id: string
  amount: number
  category: string
  description?: string
  owner: 'yo' | 'vos' | 'compartido'
  created_at: string
  updated_at: string
}

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
            <p className="text-gray-600 text-sm mt-1">{user?.user_metadata?.full_name || user?.email}</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/perfil"
              className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-semibold py-2 px-4 rounded-lg transition"
              title="Editar perfil"
            >
              ⚙️
            </Link>
            <button
              onClick={handleLogout}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition"
            >
              Salir
            </button>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Link
            href="/nuevo"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-lg text-center text-lg transition shadow-lg"
          >
            ➕ Nuevo Gasto
          </Link>
          <Link
            href="/historico"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg text-center text-lg transition shadow-lg"
          >
            📊 Histórico
          </Link>
        </div>

        {/* Botón Descargar Excel */}
        <div className="mb-8">
          <button
            onClick={() => downloadExcel(expenses)}
            disabled={expenses.length === 0}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-1 px-3 rounded text-sm transition"
            title="Descargar como Excel"
          >
            📊 Descargar
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-semibold mb-2">Total Este Mes</p>
            <p className="text-4xl font-bold text-indigo-600">
              ARS ${monthExpenses.reduce((acc, e) => acc + e.amount, 0).toFixed(0)}
            </p>
            <p className="text-gray-500 text-xs mt-2">{monthExpenses.length} gastos</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-semibold mb-2">Total General</p>
            <p className="text-4xl font-bold text-blue-600">
              ${totalExpenses.toFixed(0)}
            </p>
            <p className="text-gray-500 text-xs mt-2">{expenses.length} gastos</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-semibold mb-2">Tus Gastos</p>
            <p className="text-4xl font-bold text-green-600">
              ${(totalByOwner[user?.user_metadata?.full_name] || 0).toFixed(0)}
            </p>
            <p className="text-gray-500 text-xs mt-2">{expenses.filter(e => e.owner === user?.user_metadata?.full_name).length} gastos</p>
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
                        ${total.toFixed(0)}
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
                      {new Date(expense.created_at).toLocaleDateString('es-AR')} • {expense.owner}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-xl font-bold text-indigo-600 min-w-[100px] text-right">
                      ARS ${expense.amount.toFixed(0)}
                    </p>
                    <Link
                      href={`/editar/${expense.id}`}
                      className="text-indigo-600 hover:text-indigo-800 text-lg"
                      title="Editar gasto"
                    >
                      ✏️
                    </Link>
                  </div>
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
