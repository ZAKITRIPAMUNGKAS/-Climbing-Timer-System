import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, User, Users, Trophy, Building2, Hash } from 'lucide-react'
import Swal from 'sweetalert2'

function ClimbersManagementPage() {
  const [competitions, setCompetitions] = useState([])
  const [selectedCompetition, setSelectedCompetition] = useState(null)
  const [climbers, setClimbers] = useState([])
  const [filteredClimbers, setFilteredClimbers] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [climbersLoading, setClimbersLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingClimber, setEditingClimber] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    bib_number: '',
    team: ''
  })

  useEffect(() => {
    fetchCompetitions()
  }, [])

  useEffect(() => {
    if (selectedCompetition) {
      fetchClimbers()
    } else {
      setClimbers([])
      setFilteredClimbers([])
    }
  }, [selectedCompetition])

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredClimbers(climbers)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredClimbers(
        climbers.filter(climber =>
          climber.name?.toLowerCase().includes(query) ||
          climber.bib_number?.toString().includes(query) ||
          climber.team?.toLowerCase().includes(query)
        )
      )
    }
  }, [searchQuery, climbers])

  const fetchCompetitions = async () => {
    try {
      setLoading(true)
      const [boulderRes, speedRes] = await Promise.all([
        fetch('/api/competitions'),
        fetch('/api/speed-competitions')
      ])
      
      const boulder = boulderRes.ok ? await boulderRes.json() : []
      const speed = speedRes.ok ? await speedRes.json() : []
      
      const allCompetitions = [
        ...boulder.map(c => ({ ...c, type: 'boulder' })),
        ...speed.map(c => ({ ...c, type: 'speed' }))
      ]
      
      setCompetitions(allCompetitions.sort((a, b) => {
        // Sort by name
        return (a.name || '').localeCompare(b.name || '')
      }))
    } catch (error) {
      console.error('Error fetching competitions:', error)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Gagal memuat data kompetisi'
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchClimbers = async () => {
    if (!selectedCompetition) return
    
    try {
      setClimbersLoading(true)
      const url = selectedCompetition.type === 'speed'
        ? `/api/speed-competitions/${selectedCompetition.id}/climbers`
        : `/api/competitions/${selectedCompetition.id}/climbers`
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setClimbers(data)
        setFilteredClimbers(data)
      } else {
        throw new Error('Failed to fetch climbers')
      }
    } catch (error) {
      console.error('Error fetching climbers:', error)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Gagal memuat data peserta'
      })
    } finally {
      setClimbersLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingClimber(null)
    setFormData({
      name: '',
      bib_number: getNextBibNumber(),
      team: ''
    })
    setShowModal(true)
  }

  const handleEdit = (climber) => {
    setEditingClimber(climber)
    setFormData({
      name: climber.name || '',
      bib_number: climber.bib_number || '',
      team: climber.team || ''
    })
    setShowModal(true)
  }

  const getNextBibNumber = () => {
    if (climbers.length === 0) return 1
    const maxBib = Math.max(...climbers.map(c => parseInt(c.bib_number) || 0))
    return maxBib + 1
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Nama wajib diisi',
        text: 'Mohon isi nama peserta'
      })
      return
    }

    if (!formData.bib_number || formData.bib_number === '') {
      Swal.fire({
        icon: 'warning',
        title: 'Nomor Bib wajib diisi',
        text: 'Mohon isi nomor bib peserta'
      })
      return
    }

    try {
      let url, method
      
      if (editingClimber) {
        // Update: Use appropriate endpoint based on competition type
        if (selectedCompetition.type === 'speed') {
          url = `/api/speed-climbers/${editingClimber.id}`
        } else {
          url = `/api/climbers/${editingClimber.id}`
        }
        method = 'PUT'
      } else {
        // Create: Use competition-specific endpoint
        if (selectedCompetition.type === 'speed') {
          url = `/api/speed-competitions/${selectedCompetition.id}/climbers`
        } else {
          url = `/api/competitions/${selectedCompetition.id}/climbers`
        }
        method = 'POST'
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name.trim(),
          bib_number: parseInt(formData.bib_number),
          team: formData.team.trim() || null
        })
      })

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: editingClimber ? 'Berhasil' : 'Berhasil',
          text: editingClimber ? 'Data peserta berhasil diperbarui' : 'Peserta berhasil ditambahkan',
          timer: 2000,
          showConfirmButton: false
        })
        setShowModal(false)
        setEditingClimber(null)
        fetchClimbers()
      } else {
        const error = await response.json()
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error || 'Gagal menyimpan data peserta'
        })
      }
    } catch (error) {
      console.error('Error saving climber:', error)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Terjadi kesalahan saat menyimpan data'
      })
    }
  }

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Hapus Peserta?',
      text: 'Data peserta akan dihapus permanen',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal'
    })

    if (!result.isConfirmed) return

    try {
      // Determine endpoint based on competition type
      const url = selectedCompetition.type === 'speed'
        ? `/api/speed-climbers/${id}`
        : `/api/climbers/${id}`
      
      const response = await fetch(url, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: 'Peserta berhasil dihapus',
          timer: 2000,
          showConfirmButton: false
        })
        fetchClimbers()
      } else {
        const error = await response.json()
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.error || 'Gagal menghapus peserta'
        })
      }
    } catch (error) {
      console.error('Error deleting climber:', error)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Terjadi kesalahan saat menghapus data'
      })
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Data Peserta</h2>
          <p className="text-sm text-gray-600 mt-1">Kelola data peserta kompetisi - Tambah, Edit, atau Hapus peserta</p>
        </div>
        <button
          onClick={handleAdd}
          disabled={!selectedCompetition}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm font-semibold"
        >
          <Plus size={18} />
          <span>Tambah Peserta</span>
        </button>
      </div>

      {/* Competition Selector */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Pilih Kompetisi
        </label>
        <select
          value={selectedCompetition?.id || ''}
          onChange={(e) => {
            const compId = parseInt(e.target.value)
            const comp = competitions.find(c => c.id === compId)
            setSelectedCompetition(comp || null)
          }}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">-- Pilih Kompetisi --</option>
          {competitions.map(comp => (
            <option key={comp.id} value={comp.id}>
              {comp.name} ({comp.type === 'boulder' ? 'Boulder' : 'Speed'}) - {comp.round === 'qualification' ? 'Kualifikasi' : comp.round === 'final' ? 'Final' : comp.round}
            </option>
          ))}
        </select>
      </div>

      {selectedCompetition && (
        <>
          {/* Competition Info */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center gap-3">
              <Trophy className="text-blue-600" size={24} />
              <div>
                <h3 className="font-bold text-gray-900">{selectedCompetition.name}</h3>
                <p className="text-sm text-gray-600">
                  {selectedCompetition.type === 'boulder' ? 'Boulder' : 'Speed'} • {selectedCompetition.round === 'qualification' ? 'Kualifikasi' : selectedCompetition.round === 'final' ? 'Final' : selectedCompetition.round}
                </p>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Cari peserta berdasarkan nama, nomor bib, atau team..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="mt-2 text-sm text-gray-500">
              Menampilkan {filteredClimbers.length} dari {climbers.length} peserta
            </div>
          </div>

          {/* Climbers Table */}
          {climbersLoading ? (
            <div className="flex items-center justify-center h-64 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">No</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Bib</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Nama</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Team / Sekolah</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredClimbers.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                          {searchQuery ? 'Tidak ada peserta yang sesuai dengan pencarian' : 'Belum ada data peserta'}
                        </td>
                      </tr>
                    ) : (
                      filteredClimbers.map((climber, index) => (
                        <tr key={climber.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Hash size={16} className="text-gray-400" />
                              <span className="text-sm font-semibold text-gray-900">{climber.bib_number || '-'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <User size={16} className="text-gray-400" />
                              <span className="text-sm font-medium text-gray-900">{climber.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Building2 size={16} className="text-gray-400" />
                              <span className="text-sm text-gray-600">{climber.team || '-'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEdit(climber)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit Peserta"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(climber.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Hapus Peserta"
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
          )}
        </>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                {editingClimber ? 'Edit Peserta' : 'Tambah Peserta'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingClimber(null)
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nama Peserta <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Masukkan nama peserta"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nomor Bib <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.bib_number}
                  onChange={(e) => setFormData({ ...formData, bib_number: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Masukkan nomor bib"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Team / Sekolah
                </label>
                <input
                  type="text"
                  value={formData.team}
                  onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Masukkan team atau sekolah (opsional)"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingClimber(null)
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                {editingClimber ? 'Simpan Perubahan' : 'Tambah Peserta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClimbersManagementPage

