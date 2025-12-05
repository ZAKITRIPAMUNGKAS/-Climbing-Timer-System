import { useState, useEffect } from 'react'
import { Plus, Upload, Search, Edit, Trash2, Download, AlertCircle, CheckCircle2 } from 'lucide-react'
import BulkUploadModal from '../components/BulkUploadModal'

function AthletesManagementPage() {
  const [athletes, setAthletes] = useState([])
  const [filteredAthletes, setFilteredAthletes] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

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
          athlete.team?.toLowerCase().includes(query) ||
          athlete.bib_number?.toString().includes(query)
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
            placeholder="Cari atlet berdasarkan nama, tim, atau nomor bib..."
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
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Tim</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Bib Number</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAthletes.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{athlete.team || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{athlete.bib_number || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
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
    </div>
  )
}

export default AthletesManagementPage

