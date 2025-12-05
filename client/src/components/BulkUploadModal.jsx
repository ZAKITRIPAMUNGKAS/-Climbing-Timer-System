import { useState, useRef } from 'react'
import { X, Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react'

function BulkUploadModal({ onClose, onSuccess }) {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef(null)
  const dropZoneRef = useRef(null)

  const handleFileSelect = (selectedFile) => {
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ]
    
    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.csv')) {
      setError('File harus berupa CSV atau Excel (.csv, .xls, .xlsx)')
      return
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('Ukuran file maksimal 5MB')
      return
    }

    setFile(selectedFile)
    setError('')
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFileSelect(droppedFile)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Pilih file terlebih dahulu')
      return
    }

    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/athletes/bulk-upload', {
        method: 'POST',
        credentials: 'include',
        body: formData
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          onSuccess()
        }, 1500)
      } else {
        setError(data.error || 'Upload gagal. Periksa format file Anda.')
      }
    } catch (error) {
      console.error('Upload error:', error)
      setError('Terjadi kesalahan saat upload. Silakan coba lagi.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Upload className="text-blue-600" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Bulk Upload Athletes</h3>
              <p className="text-sm text-gray-500">Upload file CSV atau Excel untuk menambahkan banyak atlet sekaligus</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Format File:</h4>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Kolom: name, team, bib_number</li>
              <li>Baris pertama adalah header</li>
              <li>Format yang didukung: CSV, XLS, XLSX</li>
              <li>Ukuran maksimal: 5MB</li>
            </ul>
          </div>

          {/* Drop Zone */}
          <div
            ref={dropZoneRef}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              file
                ? 'border-green-300 bg-green-50'
                : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xls,.xlsx"
              onChange={(e) => {
                if (e.target.files[0]) {
                  handleFileSelect(e.target.files[0])
                }
              }}
              className="hidden"
            />

            {file ? (
              <div className="space-y-3">
                <CheckCircle2 className="mx-auto text-green-600" size={48} />
                <div>
                  <div className="font-semibold text-gray-900">{file.name}</div>
                  <div className="text-sm text-gray-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </div>
                </div>
                <button
                  onClick={() => {
                    setFile(null)
                    if (fileInputRef.current) {
                      fileInputRef.current.value = ''
                    }
                  }}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Hapus file
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <FileSpreadsheet className="mx-auto text-gray-400" size={48} />
                <div>
                  <div className="font-semibold text-gray-900 mb-1">
                    Drag & drop file di sini
                  </div>
                  <div className="text-sm text-gray-500 mb-3">atau</div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    Pilih File
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              <AlertCircle size={20} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
              <CheckCircle2 size={20} />
              <span className="text-sm">Upload berhasil! Memproses data...</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={uploading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold disabled:opacity-50"
            >
              Batal
            </button>
            <button
              onClick={handleUpload}
              disabled={!file || uploading || success}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload size={18} />
                  <span>Upload</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BulkUploadModal

