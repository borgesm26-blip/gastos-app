'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { withAuth } from '@/lib/auth-guard'
import Link from 'next/link'

const CATEGORIES = [
  'Alquiler',
  'Expensas',
  'Bebé',
  'Alacena',
  'Farmacia',
  'Streaming',
  'Apps',
  'Gastos Hormiga',
  'Salidas',
  'Otros',
]

function EditarGastoPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Alacena')
  const [description, setDescription] = useState('')
  const [owner, setOwner] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  // Cargar el gasto actual
  useEffect(() => {
    const loadExpense = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
          router.push('/auth/login')
          return
        }

        const response = await fetch(`/api/gastos/${id}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        })

        if (!response.ok) {
          throw new Error('No se pudo cargar el gasto')
        }

        const data = await response.json()
        setAmount(data.amount.toString())
        setCategory(data.category)
        setDescription(data.description || '')
        setOwner(data.owner)
      } catch (err: any) {
        setError(err.message || 'Error al cargar el gasto')
      } finally {
        setInitialLoading(false)
      }
    }

    loadExpense()
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!amount || parseInt(amount) <= 0) {
      setError('Ingresa un monto válido')
      return
    }

    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/auth/login')
        return
      }

      const response = await fetch(`/api/gastos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          amount: parseInt(amount),
          category,
          description,
          owner,
        }),
      })

      if (!response.ok) {
        throw new Error('Error al actualizar el gasto')
      }

      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el gasto')
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Cargando gasto...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Editar Gasto</h1>
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
            ✕
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Monto */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Monto (ARS)
            </label>
            <input
              type="number"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              autoFocus
              required
              className="w-full text-3xl font-bold px-4 py-3 border-b-2 border-indigo-300 focus:outline-none focus:border-indigo-600 text-gray-800"
            />
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Categoría
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Descripción (opcional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ej: Coto, verdulería"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Owner (Read-only) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Registrado por
            </label>
            <div className="px-4 py-2 bg-gray-100 rounded-lg text-gray-700 font-medium">
              {owner || 'Cargando...'}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition text-lg"
          >
            {loading ? 'Guardando...' : '💾 Guardar Cambios'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default withAuth(EditarGastoPage)
