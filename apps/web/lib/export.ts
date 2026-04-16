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

export function exportToMarkdown(expenses: Expense[]) {
  const now = new Date().toLocaleDateString('es-AR')

  let markdown = `# 💰 Reporte de Gastos\n\n`
  markdown += `**Generado:** ${now}\n\n`
  markdown += `**Total de gastos:** ${expenses.length}\n`
  markdown += `**Monto total:** ARS $${expenses.reduce((acc, e) => acc + e.amount, 0).toFixed(0)}\n\n`

  // Resumen por categoría
  const byCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount
    return acc
  }, {} as Record<string, number>)

  markdown += `## 📊 Resumen por Categoría\n\n`
  markdown += `| Categoría | Monto | Cantidad |\n`
  markdown += `|-----------|-------|----------|\n`

  Object.entries(byCategory)
    .sort(([, a], [, b]) => b - a)
    .forEach(([category, amount]) => {
      const count = expenses.filter(e => e.category === category).length
      markdown += `| ${category} | ARS $${amount.toFixed(0)} | ${count} |\n`
    })

  // Resumen por owner
  const byOwner = expenses.reduce((acc, e) => {
    acc[e.owner] = (acc[e.owner] || 0) + e.amount
    return acc
  }, {} as Record<string, number>)

  markdown += `\n## 👥 Resumen por Persona\n\n`
  markdown += `| Persona | Monto |\n`
  markdown += `|---------|-------|\n`
  Object.entries(byOwner)
    .sort(([, a], [, b]) => b - a)
    .forEach(([owner, amount]) => {
      const label = owner === 'yo' ? '🧑 Yo' : owner === 'vos' ? '👤 Vos' : '🏠 Compartido'
      markdown += `| ${label} | ARS $${amount.toFixed(0)} |\n`
    })

  // Lista detallada
  markdown += `\n## 📝 Detalle de Gastos\n\n`

  expenses.forEach((expense) => {
    const date = new Date(expense.created_at).toLocaleDateString('es-AR')
    const owner = expense.owner === 'yo' ? 'Yo' : expense.owner === 'vos' ? 'Vos' : 'Compartido'
    markdown += `### ${expense.category} - ARS $${expense.amount.toFixed(0)}\n`
    markdown += `- **Fecha:** ${date}\n`
    markdown += `- **Persona:** ${owner}\n`
    if (expense.description) {
      markdown += `- **Descripción:** ${expense.description}\n`
    }
    markdown += `\n`
  })

  return markdown
}

export function downloadMarkdown(expenses: Expense[]) {
  const markdown = exportToMarkdown(expenses)
  const blob = new Blob([markdown], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `gastos-${new Date().toISOString().split('T')[0]}.md`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function downloadExcel(expenses: Expense[]) {
  const XLSX = await import('xlsx')

  // Preparar datos para resumen por categoría
  const byCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount
    return acc
  }, {} as Record<string, number>)

  const categorySummary = Object.entries(byCategory)
    .sort(([, a], [, b]) => b - a)
    .map(([category, amount]) => ({
      Categoría: category,
      Monto: amount,
      Cantidad: expenses.filter(e => e.category === category).length,
    }))

  // Preparar datos para resumen por persona
  const byOwner = expenses.reduce((acc, e) => {
    acc[e.owner] = (acc[e.owner] || 0) + e.amount
    return acc
  }, {} as Record<string, number>)

  const ownerSummary = Object.entries(byOwner)
    .sort(([, a], [, b]) => b - a)
    .map(([owner, amount]) => ({
      Persona: owner === 'yo' ? 'Yo' : owner === 'vos' ? 'Vos' : 'Compartido',
      Monto: amount,
    }))

  // Preparar detalle de gastos
  const detailData = expenses.map(expense => ({
    Fecha: new Date(expense.created_at).toLocaleDateString('es-AR'),
    Categoría: expense.category,
    Monto: `ARS $${expense.amount.toFixed(0)}`,
    Persona: expense.owner === 'yo' ? 'Yo' : expense.owner === 'vos' ? 'Vos' : 'Compartido',
    Descripción: expense.description || '',
  }))

  // Crear workbook
  const wb = XLSX.utils.book_new()

  // Agregar hojas
  const summarySheet = XLSX.utils.json_to_sheet([
    { Concepto: 'Total de gastos', Valor: expenses.length },
    { Concepto: 'Monto total', Valor: `ARS $${expenses.reduce((acc, e) => acc + e.amount, 0).toFixed(0)}` },
    { Concepto: 'Fecha de reporte', Valor: new Date().toLocaleDateString('es-AR') },
  ])

  const categorySheet = XLSX.utils.json_to_sheet(categorySummary)
  const ownerSheet = XLSX.utils.json_to_sheet(ownerSummary)
  const detailSheet = XLSX.utils.json_to_sheet(detailData)

  XLSX.utils.book_append_sheet(wb, summarySheet, 'Resumen')
  XLSX.utils.book_append_sheet(wb, categorySheet, 'Por Categoría')
  XLSX.utils.book_append_sheet(wb, ownerSheet, 'Por Persona')
  XLSX.utils.book_append_sheet(wb, detailSheet, 'Detalle')

  // Descargar
  XLSX.writeFile(wb, `gastos-${new Date().toISOString().split('T')[0]}.xlsx`)
}
