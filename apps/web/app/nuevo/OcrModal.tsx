'use client'

import { useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'

interface OcrModalProps {
  isOpen: boolean
  onClose: () => void
  onAmountExtracted: (amount: string, storeName?: string) => void
}

export function OcrModal({ isOpen, onClose, onAmountExtracted }: OcrModalProps) {
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const extractAmount = async (imageData: string) => {
    try {
      setLoading(true)
      setError('')

      // Importar tesseract dinámicamente
      const Tesseract = await import('tesseract.js')

      // Procesar imagen con OCR
      const result = await Tesseract.recognize(imageData, 'spa')
      const text = result.data.text
      const textUpper = text.toUpperCase()

      console.log('OCR Raw Text:', text)

      const lines = text.split('\n').filter(l => l.trim())
      let totalAmount = null
      let storeName = ''

      // Estrategia 1: Buscar línea con TOTAL y extraer número más cercano
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toUpperCase()
        if (
          (line.includes('TOTAL') ||
           line.includes('A PAGAR') ||
           line.includes('IMPORTE TOTAL') ||
           line.includes('MONTO FINAL')) &&
          !line.includes('VUELTO') &&
          !line.includes('ANTERIOR')
        ) {
          // Buscar número en esta línea o la siguiente
          let searchText = lines[i] + ' ' + (lines[i + 1] || '')
          const numbers = searchText.match(/\$?\s*(\d+[\.,]\d{2}|\d+)/g) || []

          if (numbers.length > 0) {
            // Tomar el primer número después del $
            for (const num of numbers) {
              const cleaned = num.replace(/\$/g, '').trim().replace(',', '.')
              const amount = parseFloat(cleaned)
              if (amount > 0 && amount < 1000000) {
                totalAmount = amount
                break
              }
            }
            if (totalAmount) break
          }
        }
      }

      // Estrategia 2: Si no encontró, buscar en últimas líneas (donde suele estar el total)
      if (!totalAmount) {
        const lastLines = lines.slice(Math.max(0, lines.length - 8))
        for (let i = lastLines.length - 1; i >= 0; i--) {
          const line = lastLines[i]
          const lineUpper = line.toUpperCase()

          // Evitar líneas con solo números pequeños (fechas, cantidades)
          if (!lineUpper.includes('CANTIDAD') && !lineUpper.includes('PRECIO') && !lineUpper.includes('ITEM')) {
            const numbers = line.match(/\d+[\.,]\d{2}/g) || []
            if (numbers && numbers.length > 0 && numbers[0]) {
              const amount = parseFloat(numbers[0].replace(',', '.'))
              if (amount > 50 && amount < 1000000) { // El total debe ser > 50
                totalAmount = amount
                break
              }
            }
          }
        }
      }

      // Estrategia 3: Fallback - buscar el número más grande (>50) en todo el documento
      if (!totalAmount) {
        const allNumbers = textUpper.match(/\d+[\.,]\d{2}/g) || []
        if (allNumbers.length > 0) {
          const amounts = allNumbers
            .map(n => parseFloat(n.replace(',', '.')))
            .filter(a => a > 50 && a < 1000000)
          if (amounts.length > 0) {
            totalAmount = Math.max(...amounts)
          }
        }
      }

      // Buscar nombre del establecimiento (primeras 4 líneas, más de 3 caracteres)
      for (let i = 0; i < Math.min(4, lines.length); i++) {
        const line = lines[i].trim()
        if (line && line.length > 3 && !line.match(/^\d{1,2}\//) && !line.match(/^\d+$/)) {
          storeName = line
          break
        }
      }

      if (totalAmount && totalAmount > 0) {
        console.log('Extracted - Amount:', totalAmount, 'Store:', storeName)
        onAmountExtracted(totalAmount.toString(), storeName || undefined)
        handleClose()
      } else {
        setError('No se pudo extraer el total. Intenta:\n• Foto más clara\n• Que se vea completo el ticket\n• O ingresa manualmente')
      }
    } catch (err: any) {
      console.error('Error en OCR:', err)
      setError('Error al procesar: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Mostrar preview
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setPreview(result)
      extractAmount(result)
    }
    reader.readAsDataURL(file)
  }

  const handleClose = () => {
    setPreview(null)
    setError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">📸 Capturar Ticket</h2>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ✕
            </button>
          </div>

          {preview ? (
            <div className="mb-4">
              <img
                src={preview}
                alt="Ticket preview"
                className="w-full h-64 object-cover rounded-lg mb-4"
              />
              {loading && (
                <div className="flex items-center justify-center gap-2 text-indigo-600">
                  <Loader2 className="animate-spin" size={20} />
                  <span>Procesando imagen...</span>
                </div>
              )}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                  {error}
                </div>
              )}
            </div>
          ) : (
            <div className="mb-4">
              <label
                htmlFor="file-input"
                className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-indigo-300 rounded-lg cursor-pointer hover:bg-indigo-50 transition"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <p className="text-4xl mb-2">📷</p>
                  <p className="text-sm font-semibold text-gray-700">
                    Haz clic para cargar una foto
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG o cualquier formato de imagen
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  id="file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={loading}
                />
              </label>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 rounded-lg transition"
              disabled={loading}
            >
              Cancelar
            </button>
            {preview && (
              <button
                onClick={() => {
                  setPreview(null)
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                  }
                }}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg transition"
                disabled={loading}
              >
                Otra foto
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
