import { useState, useEffect } from 'react'
import { Plus, Upload, Search, Edit, Trash2, Download, AlertCircle, CheckCircle2, X } from 'lucide-react'
import BulkUploadModal from '../components/BulkUploadModal'

function AthletesManagementPage() {
  const [athletes, setAthletes] = useState([])
  const [filteredAthletes, setFilteredAthletes] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [editingAthlete, setEditingAthlete] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', school: '', achievement: '', category: 'Boulder' })
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  useEffect(() => {
    fetchAthletes()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredAthletes(athletes)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredAthletes(
        athletes.filter(athlete =>
          athlete.name?.toLowerCase().includes(query) ||
          athlete.school?.toLowerCase().includes(query) ||
          athlete.achievement?.toLowerCase().includes(query)
        )
      )
    }
  }, [searchQuery, athletes])

  const fetchAthletes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/athletes')
      if (response.ok) {
        const data = await response.json()
        setAthletes(data)
        setFilteredAthletes(data)
      }
    } catch (error) {
      console.error('Error fetching athletes:', error)
      setMessage({ type: 'error', text: 'Gagal memuat data atlet' })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus atlet ini?')) {
      return
    }

    try {
      const response = await fetch(`/api/athletes/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Atlet berhasil dihapus' })
        fetchAthletes()
      } else {
        setMessage({ type: 'error', text: 'Gagal menghapus atlet' })
      }
    } catch (error) {
      console.error('Error deleting athlete:', error)
      setMessage({ type: 'error', text: 'Terjadi kesalahan saat menghapus' })
    }
  }

  const handleUploadSuccess = () => {
    setShowUploadModal(false)
    setMessage({ type: 'success', text: 'Upload berhasil! Data atlet telah ditambahkan.' })
    fetchAthletes()
  }

  const handleEdit = (athlete) => {
    setEditingAthlete(athlete)
    setEditForm({
      name: athlete.name || '',
      school: athlete.school || '',
      achievement: athlete.achievement || '',
      category: athlete.category || 'Boulder'
    })
    setSelectedImage(null)
    setImagePreview(athlete.image ? `${window.location.origin}${athlete.image}` : null)
    setShowModal(true)
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'File harus berupa gambar' })
        return
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Ukuran file maksimal 5MB' })
        return
      }
      setSelectedImage(file)
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async () => {
    if (!editForm.name.trim()) {
      setMessage({ type: 'error', text: 'Nama atlet wajib diisi' })
      return
    }
    
    if (!editForm.school || editForm.school.trim() === '') {
      setMessage({ type: 'error', text: 'Asal sekolah wajib diisi' })
      return
    }

    // Image is optional for both new and existing athletes

    try {
      let response
      
      if (editingAthlete) {
        // Update existing athlete
        if (selectedImage) {
          const formData = new FormData()
          formData.append('name', editForm.name.trim())
          formData.append('category', editForm.category || 'Boulder')
          formData.append('school', editForm.school.trim() || '')
          formData.append('achievement', editForm.achievement.trim() || '')
          formData.append('image', selectedImage)
          if (editingAthlete.image) {
            formData.append('existingImage', editingAthlete.image)
          }

          response = await fetch(`/api/athletes/${editingAthlete.id}`, {
            method: 'PUT',
            credentials: 'include',
            body: formData
          })
        } else {
          response = await fetch(`/api/athletes/${editingAthlete.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
              name: editForm.name.trim(),
              category: editForm.category || 'Boulder',
              school: editForm.school.trim() || '',
              achievement: editForm.achievement.trim() || '',
              existingImage: editingAthlete.image || null
            })
          })
        }
      } else {
        // Create new athlete
        if (selectedImage) {
          // If image is provided, use FormData
          const formData = new FormData()
          formData.append('name', editForm.name.trim())
          formData.append('category', editForm.category || 'Boulder')
          formData.append('school', editForm.school.trim() || '')
          formData.append('achievement', editForm.achievement.trim() || '')
          formData.append('image', selectedImage)

          response = await fetch('/api/athletes', {
            method: 'POST',
            credentials: 'include',
            body: formData
          })
        } else {
          // If no image, use JSON (don't send FormData with empty image field)
          response = await fetch('/api/athletes', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
              name: editForm.name.trim(),
              category: editForm.category || 'Boulder',
              school: editForm.school.trim() || '',
              achievement: editForm.achievement.trim() || ''
            })
          })
        }
      }

      if (response.ok) {
        setMessage({ type: 'success', text: editingAthlete ? 'Data atlet berhasil diperbarui' : 'Atlet berhasil ditambahkan' })
        setEditingAthlete(null)
        setSelectedImage(null)
        setImagePreview(null)
        setShowModal(false)
        fetchAthletes()
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || (editingAthlete ? 'Gagal memperbarui data atlet' : 'Gagal menambahkan atlet') })
      }
    } catch (error) {
      console.error('Error saving athlete:', error)
      setMessage({ type: 'error', text: 'Terjadi kesalahan saat menyimpan data' })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manage Athletes</h2>
          <p className="text-sm text-gray-600 mt-1">Kelola data atlet dan lakukan bulk upload</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-semibold"
          >
            <Upload size={18} />
            <span>Bulk Upload</span>
          </button>
          <button
            onClick={() => {
              setEditingAthlete(null)
              setEditForm({ name: '', school: '', achievement: '', category: 'Boulder' })
              setSelectedImage(null)
              setImagePreview(null)
              setShowModal(true)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
          >
            <Plus size={18} />
            <span>Tambah Atlet</span>
          </button>
        </div>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div className={`flex items-center gap-2 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span>{message.text}</span>
          <button
            onClick={() => setMessage({ type: '', text: '' })}
            className="ml-auto text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Cari atlet berdasarkan nama, asal sekolah, atau achievement..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="mt-2 text-sm text-gray-500">
          Menampilkan {filteredAthletes.length} dari {athletes.length} atlet
        </div>
      </div>

      {/* Athletes Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">No</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Nama</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Kategori</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Asal Sekolah</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Achievement</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAthletes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    {searchQuery ? 'Tidak ada atlet yang sesuai dengan pencarian' : 'Belum ada data atlet'}
                  </td>
                </tr>
              ) : (
                filteredAthletes.map((athlete, index) => (
                  <tr key={athlete.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">{athlete.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                        {athlete.category || 'Boulder'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {athlete.school || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{athlete.achievement || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleEdit(athlete)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Atlet"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(athlete.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Upload Modal */}
      {showUploadModal && (
        <BulkUploadModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={handleUploadSuccess}
        />
      )}

      {/* Add/Edit Athlete Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-xl font-bold text-gray-900">{editingAthlete ? 'Edit Atlet' : 'Tambah Atlet'}</h3>
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingAthlete(null)
                  setSelectedImage(null)
                  setImagePreview(null)
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Foto Atlet
                </label>
                <div className="space-y-3">
                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="relative w-32 h-32 border-2 border-gray-300 rounded-lg overflow-hidden">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  {/* File Input */}
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Klik untuk upload</span> atau drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF (MAX. 5MB)</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </label>
                  {selectedImage && (
                    <p className="text-xs text-gray-600">
                      File dipilih: {selectedImage.name}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nama Atlet <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Masukkan nama atlet"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Asal Sekolah / Team <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.school}
                  onChange={(e) => setEditForm({ ...editForm, school: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Masukkan asal sekolah atau team (contoh: SMA N 1 Karanganyar)"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Kategori <span className="text-red-500">*</span>
                </label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Boulder">Boulder</option>
                  <option value="Speed Climbing">Speed Climbing</option>
                  <option value="Lead">Lead</option>
                  <option value="Lead / Boulder">Lead / Boulder</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Achievement / Prestasi
                </label>
                <input
                  type="text"
                  value={editForm.achievement}
                  onChange={(e) => setEditForm({ ...editForm, achievement: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Masukkan achievement (contoh: JUARA HARAPAN DIA)"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 flex-shrink-0">
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingAthlete(null)
                  setSelectedImage(null)
                  setImagePreview(null)
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                {editingAthlete ? 'Simpan Perubahan' : 'Tambah Atlet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AthletesManagementPage

