export type Expense = {
  id: string
  user_id: string
  amount: number
  category: string
  description?: string
  owner: 'yo' | 'vos' | 'compartido'
  created_at: string
  updated_at: string
}

export type CreateExpenseInput = {
  amount: number
  category: string
  description?: string
  owner: 'yo' | 'vos' | 'compartido'
}

export type User = {
  id: string
  email: string
  user_metadata?: Record<string, any>
}

export const CATEGORIES = [
  'Supermercado',
  'Servicios Públicos',
  'Salidas',
  'Transporte',
  'Otros',
] as const

export type Category = typeof CATEGORIES[number]
