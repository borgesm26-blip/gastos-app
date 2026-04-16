'use client'

import { useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'

interface OcrModalProps {
  isOpen: boolean
  onClose: () => void
  onAmountExtracted: (amount: string) => void
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

      console.log('OCR Text:', text)

      // Buscar números en el texto
      const numbers = text.match(/\d+[\.,]\d{2}|\d+/g) || []

      if (numbers.length === 0) {
        setError('No se encontraron números en la imagen')
        return
      }

      // Buscar el monto (usualmente el número más grande)
      const amounts = numbers.map(n => {
        const cleaned = n.replace(',', '.')
        return parseFloat(cleaned)
      })

      // Tomar el número más grande (usualmente el total)
      const maxAmount = Math.max(...amounts)

      if (maxAmount > 0) {
        onAmountExtracted(maxAmount.toString())
        handleClose()
      } else {
        setError('No se pudo extraer un monto válido')
      }
    } catch (err: any) {
      console.error('Error en OCR:', err)
      setError('Error al procesar la imagen: ' + err.message)
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
