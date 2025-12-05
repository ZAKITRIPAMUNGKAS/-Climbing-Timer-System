import { useState } from 'react'
import { Upload, X, FileText, CheckCircle, AlertCircle } from 'lucide-react'

function ClimbersUploadModal({ isOpen, onClose, competitionId, competitionType, onSuccess }) {
  const [file, setFile] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)

  if (!isOpen) return null

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (validateFile(droppedFile)) {
        setFile(droppedFile)
      }
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (validateFile(selectedFile)) {
        setFile(selectedFile)
      }
    }
  }

  const validateFile = (file) => {
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
    const validExtensions = ['.csv', '.xls', '.xlsx']
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase()
    
    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      alert('Invalid file type. Please upload CSV, XLS, or XLSX file.')
      return false
    }
    
    if (file.size > 10 * 1024 * 1024) {
      alert('File size too large. Maximum size is 10MB.')
      return false
    }
    
    return true
  }

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file first')
      return
    }

    setUploading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const url = competitionType === 'boulder'
        ? `/api/competitions/${competitionId}/climbers/bulk-upload`
        : `/api/speed-competitions/${competitionId}/climbers/bulk-upload`

      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        body: formData
      })

      // Check if response is JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        throw new Error(`Server returned ${response.status}: ${text.substring(0, 100)}`)
      }

      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          message: data.message,
          inserted: data.inserted,
          skipped: data.skipped,
          errors: data.errors,
          details: data.details
        })
        if (onSuccess) {
          onSuccess()
        }
      } else {
        setResult({
          success: false,
          message: data.error || 'Upload failed'
        })
      }
    } catch (error) {
      console.error('Upload error:', error)
      setResult({
        success: false,
        message: 'Failed to upload file: ' + error.message
      })
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setResult(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Upload Data Peserta</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {!result ? (
          <>
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4">
                Upload file CSV atau Excel dengan format:
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-semibold">name</th>
                      <th className="text-left p-2 font-semibold">bib_number</th>
                      <th className="text-left p-2 font-semibold">team</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2">John Doe</td>
                      <td className="p-2">1</td>
                      <td className="p-2">Tim A</td>
                    </tr>
                    <tr>
                      <td className="p-2">Jane Smith</td>
                      <td className="p-2">2</td>
                      <td className="p-2">Tim B</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-500">
                * Kolom name dan bib_number wajib diisi. Team bersifat opsional.
              </p>
            </div>

            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-blue-500 bg-blue-50'
                  : file
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 bg-gray-50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="text-green-600" size={32} />
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-600">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    className="ml-auto text-red-600 hover:text-red-700"
                  >
                    <X size={20} />
                  </button>
                </div>
              ) : (
                <div>
                  <Upload className="mx-auto mb-4 text-gray-400" size={48} />
                  <p className="text-gray-600 mb-2">
                    Drag & drop file di sini atau klik untuk memilih
                  </p>
                  <p className="text-sm text-gray-500">
                    CSV, XLS, atau XLSX (max 10MB)
                  </p>
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept=".csv,.xls,.xlsx"
                    onChange={handleFileChange}
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                  >
                    Pilih File
                  </label>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    Upload
                  </>
                )}
              </button>
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <div>
            {result.success ? (
              <div className="text-center py-6">
                <CheckCircle className="mx-auto mb-4 text-green-600" size={48} />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Upload Berhasil!</h4>
                <p className="text-gray-600 mb-4">{result.message}</p>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-600">{result.inserted}</div>
                      <div className="text-sm text-gray-600">Inserted</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-yellow-600">{result.skipped}</div>
                      <div className="text-sm text-gray-600">Skipped</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">{result.errors}</div>
                      <div className="text-sm text-gray-600">Errors</div>
                    </div>
                  </div>
                </div>
                {result.details && result.details.errors && result.details.errors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-left">
                    <p className="font-semibold text-red-800 mb-2">Errors:</p>
                    <ul className="text-sm text-red-700 space-y-1">
                      {result.details.errors.map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <button
                  onClick={handleClose}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="text-center py-6">
                <AlertCircle className="mx-auto mb-4 text-red-600" size={48} />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Upload Gagal</h4>
                <p className="text-gray-600 mb-4">{result.message}</p>
                <button
                  onClick={() => setResult(null)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ClimbersUploadModal

