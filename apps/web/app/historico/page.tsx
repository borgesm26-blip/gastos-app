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
  owner: string
  created_at: string
  updated_at: string
}

type MonthData = {
  month: string
  year: number
  monthNum: number
  total: number
  count: number
  expenses: Expense[]
}

function HistoricoPage() {
  const router = useRouter()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [monthsData, setMonthsData] = useState<MonthData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [user, setUser] = useState<any>(null)

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

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

        // Agrupar por mes
        const grouped: Record<string, Expense[]> = data.reduce((acc: Record<string, Expense[]>, expense: Expense) => {
          const date = new Date(expense.created_at)
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
          if (!acc[key]) acc[key] = []
          acc[key].push(expense)
          return acc
        }, {})

        // Convertir a MonthData ordenado por fecha descendente
        const sorted = Object.entries(grouped)
          .map(([key, expenses]) => {
            const [year, month] = key.split('-')
            const expensesList = expenses as Expense[]
            return {
              month: months[parseInt(month) - 1],
              year: parseInt(year),
              monthNum: parseInt(month),
              total: expensesList.reduce((sum, e) => sum + e.amount, 0),
              count: expensesList.length,
              expenses: expensesList,
            }
          })
          .sort((a, b) => {
            if (b.year !== a.year) return b.year - a.year
            return b.monthNum - a.monthNum
          })

        setMonthsData(sorted)

        // Seleccionar mes actual por defecto
        const now = new Date()
        const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
        const currentMonth = sorted.find(m => `${m.year}-${String(m.monthNum).padStart(2, '0')}` === currentKey)
        if (currentMonth) {
          setSelectedMonth(`${currentMonth.year}-${String(currentMonth.monthNum).padStart(2, '0')}`)
        } else if (sorted.length > 0) {
          setSelectedMonth(`${sorted[0].year}-${String(sorted[0].monthNum).padStart(2, '0')}`)
        }
      }
    } catch (error) {
      console.error('Error fetching expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExpenses()
  }, [])

  const getSelectedMonthData = () => {
    if (!selectedMonth) return null
    const [year, month] = selectedMonth.split('-')
    return monthsData.find(m => m.year === parseInt(year) && String(m.monthNum).padStart(2, '0') === month)
  }

  const selectedData = getSelectedMonthData()

  // Calcular totales por categoría del mes seleccionado
  const categoryTotal = selectedData?.expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount
    return acc
  }, {} as Record<string, number>) || {}

  // Calcular totales por persona del mes seleccionado
  const ownerTotal = selectedData?.expenses.reduce((acc, expense) => {
    acc[expense.owner] = (acc[expense.owner] || 0) + expense.amount
    return acc
  }, {} as Record<string, number>) || {}

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Cargando histórico...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">📊 Histórico</h1>
            <p className="text-gray-600 text-sm mt-1">Visualiza tus gastos por mes</p>
          </div>
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
            ✕
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel izquierdo: Resumen de meses */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Meses Registrados</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {monthsData.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Sin registros</p>
              ) : (
                monthsData.map((month) => {
                  const key = `${month.year}-${String(month.monthNum).padStart(2, '0')}`
                  const isSelected = selectedMonth === key
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedMonth(key)}
                      className={`w-full text-left p-3 rounded-lg transition ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="font-semibold">{month.month} {month.year}</div>
                      <div className={`text-sm ${isSelected ? 'text-indigo-100' : 'text-gray-500'}`}>
                        ARS ${month.total.toFixed(0)} • {month.count} gastos
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Panel derecho: Detalle del mes seleccionado */}
          <div className="lg:col-span-2 space-y-6">
            {selectedData ? (
              <>
                {/* Stats del mes */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    {selectedData.month} {selectedData.year}
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-600 text-sm font-semibold mb-1">Total del Mes</p>
                      <p className="text-3xl font-bold text-indigo-600">
                        ARS ${selectedData.total.toFixed(0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm font-semibold mb-1">Cantidad de Gastos</p>
                      <p className="text-3xl font-bold text-blue-600">{selectedData.count}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => downloadExcel(selectedData.expenses)}
                    disabled={selectedData.expenses.length === 0}
                    className="mt-4 w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded transition"
                  >
                    📊 Descargar Excel
                  </button>
                </div>

                {/* Gastos por categoría */}
                {Object.keys(categoryTotal).length > 0 && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Por Categoría</h3>
                    <div className="space-y-3">
                      {Object.entries(categoryTotal)
                        .sort(([, a], [, b]) => b - a)
                        .map(([category, total]) => (
                          <div key={category} className="flex items-center justify-between">
                            <span className="text-gray-700 font-medium">{category}</span>
                            <div className="flex items-center gap-3 flex-1 ml-4">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-indigo-600 h-2 rounded-full"
                                  style={{
                                    width: `${(total / Math.max(...Object.values(categoryTotal))) * 100}%`,
                                  }}
                                ></div>
                              </div>
                              <span className="text-indigo-600 font-bold min-w-[100px] text-right">
                                ARS ${total.toFixed(0)}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Gastos por persona */}
                {Object.keys(ownerTotal).length > 0 && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Por Persona</h3>
                    <div className="space-y-3">
                      {Object.entries(ownerTotal)
                        .sort(([, a], [, b]) => b - a)
                        .map(([owner, total]) => (
                          <div key={owner} className="flex items-center justify-between">
                            <span className="text-gray-700 font-medium">{owner}</span>
                            <span className="text-blue-600 font-bold">
                              ARS ${total.toFixed(0)}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Lista detallada de gastos */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Detalle de Gastos</h3>
                  {selectedData.expenses.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No hay gastos en este mes</p>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {selectedData.expenses
                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                        .map((expense) => (
                          <div
                            key={expense.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
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
                            <p className="text-lg font-bold text-indigo-600 min-w-[100px] text-right">
                              ARS ${expense.amount.toFixed(0)}
                            </p>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-500">Selecciona un mes para ver el detalle</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default withAuth(HistoricoPage)
