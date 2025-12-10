import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Upload, Image as ImageIcon, X, CheckCircle } from 'lucide-react'
import DashboardLayout from '../components/DashboardLayout'

function ClimbersPhotoManagementPage() {
  const { competitionId } = useParams()
  const [competition, setCompetition] = useState(null)
  const [climbers, setClimbers] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState({})
  const [selectedClimber, setSelectedClimber] = useState(null)
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  useEffect(() => {
    if (competitionId) {
      fetchCompetition()
      fetchClimbers()
    }
  }, [competitionId])

  const fetchCompetition = async () => {
    try {
      const response = await fetch(`/api/competitions/${competitionId}`)
      if (response.ok) {
        const data = await response.json()
        setCompetition(data)
      }
    } catch (error) {
      console.error('Error fetching competition:', error)
    }
  }

  const fetchClimbers = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/competitions/${competitionId}/climbers`)
      if (response.ok) {
        const data = await response.json()
        setClimbers(data)
      }
      setLoading(false)
    } catch (error) {
      console.error('Error fetching climbers:', error)
      setLoading(false)
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('File harus berupa gambar')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran file maksimal 5MB')
        return
      }
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUploadPhoto = async (climberId) => {
    if (!selectedImage) {
      alert('Pilih foto terlebih dahulu')
      return
    }

    setUploading({ ...uploading, [climberId]: true })

    try {
      const formData = new FormData()
      formData.append('photo', selectedImage)

      const response = await fetch(`/api/competitions/${competitionId}/climbers/${climberId}/photo`, {
        method: 'PUT',
        credentials: 'include',
        body: formData
      })

      if (response.ok) {
        await fetchClimbers()
        setSelectedClimber(null)
        setSelectedImage(null)
        setImagePreview(null)
        alert('Foto berhasil diupload')
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.error || 'Gagal upload foto'}`)
      }
    } catch (error) {
      console.error('Error uploading photo:', error)
      alert(`Gagal upload foto: ${error.message}`)
    } finally {
      setUploading({ ...uploading, [climberId]: false })
    }
  }

  const handleDeletePhoto = async (climberId) => {
    if (!confirm('Yakin ingin menghapus foto?')) return

    try {
      const response = await fetch(`/api/competitions/${competitionId}/climbers/${climberId}/photo`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        await fetchClimbers()
        alert('Foto berhasil dihapus')
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.error || 'Gagal menghapus foto'}`)
      }
    } catch (error) {
      console.error('Error deleting photo:', error)
      alert(`Gagal menghapus foto: ${error.message}`)
    }
  }

  const openUploadModal = (climber) => {
    setSelectedClimber(climber)
    setSelectedImage(null)
    setImagePreview(climber.photo ? `${window.location.origin}${climber.photo}` : null)
  }

  const closeUploadModal = () => {
    setSelectedClimber(null)
    setSelectedImage(null)
    setImagePreview(null)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            to="/dashboard/competitions"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Upload Foto Peserta</h2>
            <p className="text-sm text-gray-600">
              {competition?.name || 'Competition'}
            </p>
          </div>
        </div>

        {/* Climbers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {climbers.map((climber) => (
            <div
              key={climber.id}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              {/* Photo Preview */}
              <div className="relative w-full aspect-square mb-3 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                {climber.photo ? (
                  <>
                    <img
                      src={climber.photo.startsWith('http') ? climber.photo : `${window.location.origin}${climber.photo}`}
                      alt={climber.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.nextElementSibling.style.display = 'flex'
                      }}
                    />
                    <div className="hidden absolute inset-0 bg-gray-200 items-center justify-center">
                      <ImageIcon size={48} className="text-gray-400" />
                    </div>
                    <button
                      onClick={() => handleDeletePhoto(climber.id)}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      title="Hapus foto"
                    >
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon size={48} className="text-gray-400" />
                  </div>
                )}
              </div>

              {/* Climber Info */}
              <div className="text-center mb-3">
                <div className="font-semibold text-gray-900 mb-1">{climber.name}</div>
                <div className="text-sm text-gray-600">
                  Bib: {climber.bib_number} {climber.team && `• ${climber.team}`}
                </div>
              </div>

              {/* Upload Button */}
              <button
                onClick={() => openUploadModal(climber)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Upload size={16} />
                {climber.photo ? 'Ganti Foto' : 'Upload Foto'}
              </button>
            </div>
          ))}
        </div>

        {climbers.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Belum ada peserta. Upload peserta terlebih dahulu di halaman Manage Competitions.
          </div>
        )}

        {/* Upload Modal */}
        {selectedClimber && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Upload Foto - {selectedClimber.name}
                </h3>
                <button
                  onClick={closeUploadModal}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-600" />
                </button>
              </div>

              {/* Image Preview */}
              {imagePreview && (
                <div className="mb-4">
                  <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              {/* File Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pilih Foto
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Format: JPG, PNG. Maksimal 5MB
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={closeUploadModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={() => handleUploadPhoto(selectedClimber.id)}
                  disabled={!selectedImage || uploading[selectedClimber.id]}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploading[selectedClimber.id] ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Upload
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default ClimbersPhotoManagementPage

