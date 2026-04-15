'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { CATEGORIES } from 'types'
import { withAuth } from '@/lib/auth-guard'
import Link from 'next/link'

function NuevoGastoPage() {
  const router = useRouter()
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Supermercado')
  const [description, setDescription] = useState('')
  const [owner, setOwner] = useState<'yo' | 'vos' | 'compartido'>('compartido')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!amount || parseFloat(amount) <= 0) {
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

      const response = await fetch('/api/gastos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          category,
          description,
          owner,
        }),
      })

      if (!response.ok) {
        throw new Error('Error al guardar el gasto')
      }

      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Error al guardar el gasto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Nuevo Gasto</h1>
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
            ✕
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Monto */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Monto ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
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

          {/* Owner */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              ¿De quién?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['yo', 'vos', 'compartido'].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setOwner(opt as any)}
                  className={`py-2 px-3 rounded-lg font-semibold transition ${
                    owner === opt
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {opt === 'yo' ? 'Yo' : opt === 'vos' ? 'Vos' : 'Compartido'}
                </button>
              ))}
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
            {loading ? 'Guardando...' : '💾 Guardar'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default withAuth(NuevoGastoPage)
