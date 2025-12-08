import { useState, useEffect } from 'react'
import { Trophy, Plus, Edit, Trash2, CheckCircle, XCircle, Calendar, Upload, Users, Zap } from 'lucide-react'
import ClimbersUploadModal from '../components/ClimbersUploadModal'

function CompetitionsManagementPage() {
  const [competitions, setCompetitions] = useState([])
  const [speedCompetitions, setSpeedCompetitions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadCompetition, setUploadCompetition] = useState(null)
  const [editingCompetition, setEditingCompetition] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    total_boulders: 4,
    status: 'active',
    type: 'boulder'
  })

  useEffect(() => {
    fetchCompetitions()
  }, [])

  const fetchCompetitions = async () => {
    try {
      const [boulderRes, speedRes] = await Promise.all([
        fetch('/api/competitions'),
        fetch('/api/speed-competitions')
      ])
      
      if (boulderRes.ok) {
        const data = await boulderRes.json()
        setCompetitions(data)
      }
      
      if (speedRes.ok) {
        const data = await speedRes.json()
        setSpeedCompetitions(data)
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Error fetching competitions:', error)
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const url = formData.type === 'boulder' 
        ? '/api/competitions' 
        : '/api/speed-competitions'
      
      const method = editingCompetition ? 'PUT' : 'POST'
      const endpoint = editingCompetition 
        ? `${url}/${editingCompetition.id}`
        : url

      // Prepare request body based on competition type
      let requestBody
      if (formData.type === 'boulder') {
        requestBody = {
          name: formData.name,
          total_boulders: formData.total_boulders,
          status: formData.status
        }
      } else {
        // Speed competition
        requestBody = {
          name: formData.name,
          status: formData.status
        }
      }

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(requestBody)
      })

      if (response.ok) {
        await fetchCompetitions()
        setShowModal(false)
        setEditingCompetition(null)
        setFormData({ name: '', total_boulders: 4, status: 'active', type: 'boulder' })
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error occurred' }))
        console.error('Error response:', errorData)
        const errorMessage = errorData.error || errorData.message || 'Failed to save competition'
        alert(`Error: ${errorMessage}${errorData.details ? '\n\nDetails: ' + JSON.stringify(errorData.details, null, 2) : ''}`)
      }
    } catch (error) {
      console.error('Error saving competition:', error)
      alert(`Failed to save competition: ${error.message || 'Network error'}`)
    }
  }

  const handleEdit = (comp, type) => {
    setEditingCompetition({ ...comp, type })
    setFormData({
      name: comp.name,
      total_boulders: comp.total_boulders || 4,
      status: comp.status,
      type: type
    })
    setShowModal(true)
  }

  const handleDelete = async (id, type) => {
    if (!confirm('Are you sure you want to delete this competition?')) return

    try {
      const url = type === 'boulder' 
        ? `/api/competitions/${id}` 
        : `/api/speed-competitions/${id}`
      
      const response = await fetch(url, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        await fetchCompetitions()
      } else {
        alert('Failed to delete competition')
      }
    } catch (error) {
      console.error('Error deleting competition:', error)
      alert('Failed to delete competition')
    }
  }

  const [generatingBracket, setGeneratingBracket] = useState(false)
  const [generatingNextRound, setGeneratingNextRound] = useState({})

  const handleGenerateBracket = async (competitionId) => {
    if (generatingBracket) return // Double-click protection
    
    if (!confirm('Generate bracket dari top 8 qualifikasi? (Bracket yang sudah ada akan dihapus jika ada)')) return

    setGeneratingBracket(true)
    try {
      const response = await fetch(`/api/speed-competitions/${competitionId}/generate-bracket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ topCount: 8 })
      })

      const data = await response.json()

      if (response.ok) {
        alert(`Bracket berhasil dibuat! ${data.message}`)
        await fetchCompetitions()
      } else {
        alert(data.error || 'Failed to generate bracket')
      }
    } catch (error) {
      console.error('Error generating bracket:', error)
      alert('Failed to generate bracket')
    } finally {
      setGeneratingBracket(false)
    }
  }

  const handleGenerateNextRound = async (competitionId) => {
    if (generatingNextRound[competitionId]) return // Double-click protection
    
    if (!confirm('Generate round berikutnya (Semi Final / Final)?')) return

    setGeneratingNextRound(prev => ({ ...prev, [competitionId]: true }))
    try {
      const response = await fetch(`/api/speed-competitions/${competitionId}/generate-next-round`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      })

      const data = await response.json()

      if (response.ok) {
        alert(`Round berikutnya berhasil dibuat! ${data.message}`)
        await fetchCompetitions()
      } else {
        alert(data.error || 'Failed to generate next round')
      }
    } catch (error) {
      console.error('Error generating next round:', error)
      alert('Failed to generate next round')
    } finally {
      setGeneratingNextRound(prev => ({ ...prev, [competitionId]: false }))
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Manage Competitions</h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">Create and manage competitions</p>
        </div>
        <button
          onClick={() => {
            setEditingCompetition(null)
            setFormData({ name: '', total_boulders: 4, status: 'active', type: 'boulder' })
            setShowModal(true)
          }}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
        >
          <Plus size={18} />
          <span>Add Competition</span>
        </button>
      </div>

      {/* Boulder Competitions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Trophy size={20} className="text-blue-600" />
            Boulder Competitions
          </h3>
        </div>
        <div className="p-6">
          {competitions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No competitions found</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {competitions.map((comp) => (
                <div key={comp.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{comp.name}</h4>
                      <p className="text-sm text-gray-600">Boulders: {comp.total_boulders}</p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      comp.status === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {comp.status}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 mt-4">
                    <button
                      onClick={() => {
                        setUploadCompetition({ id: comp.id, type: 'boulder', name: comp.name })
                        setShowUploadModal(true)
                      }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors"
                    >
                      <Upload size={16} />
                      Upload Peserta
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(comp, 'boulder')}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                      >
                        <Edit size={16} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(comp.id, 'boulder')}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Speed Competitions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calendar size={20} className="text-purple-600" />
            Speed Competitions
          </h3>
        </div>
        <div className="p-6">
          {speedCompetitions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No competitions found</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {speedCompetitions.map((comp) => (
                <div key={comp.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{comp.name}</h4>
                      <p className="text-sm text-gray-600">
                        Status: {comp.status === 'qualification' ? 'Qualification' : comp.status === 'finals' ? 'Finals' : 'Finished'}
                      </p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      comp.status !== 'finished' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {comp.status}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 mt-4">
                    <button
                      onClick={() => {
                        setUploadCompetition({ id: comp.id, type: 'speed', name: comp.name })
                        setShowUploadModal(true)
                      }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors"
                    >
                      <Upload size={16} />
                      Upload Peserta
                    </button>
                    {comp.status === 'qualification' && (
                      <button
                        onClick={() => handleGenerateBracket(comp.id)}
                        disabled={generatingBracket}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-50 text-purple-600 rounded hover:bg-purple-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Zap size={16} />
                        {generatingBracket ? 'Generating...' : 'Generate Bracket'}
                      </button>
                    )}
                    {comp.status === 'finals' && (
                      <button
                        onClick={() => handleGenerateNextRound(comp.id)}
                        disabled={generatingNextRound[comp.id]}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-orange-50 text-orange-600 rounded hover:bg-orange-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Zap size={16} />
                        {generatingNextRound[comp.id] ? 'Generating...' : 'Generate Next Round'}
                      </button>
                    )}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(comp, 'speed')}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                      >
                        <Edit size={16} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(comp.id, 'speed')}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {editingCompetition ? 'Edit Competition' : 'Add Competition'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Competition Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!!editingCompetition}
                >
                  <option value="boulder">Boulder</option>
                  <option value="speed">Speed Climbing</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Competition Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              {formData.type === 'boulder' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Boulders
                  </label>
                  <input
                    type="number"
                    value={formData.total_boulders}
                    onChange={(e) => setFormData({ ...formData, total_boulders: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    max="10"
                    required
                  />
                </div>
              )}
              {formData.type === 'speed' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="qualification">Qualification</option>
                    <option value="finals">Finals</option>
                    <option value="finished">Finished</option>
                  </select>
                </div>
              )}
              {formData.type === 'boulder' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="finished">Finished</option>
                  </select>
                </div>
              )}
              <div className="flex items-center gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingCompetition ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingCompetition(null)
                    setFormData({ name: '', total_boulders: 4, status: 'active', type: 'boulder' })
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && uploadCompetition && (
        <ClimbersUploadModal
          isOpen={showUploadModal}
          onClose={() => {
            setShowUploadModal(false)
            setUploadCompetition(null)
          }}
          competitionId={uploadCompetition.id}
          competitionType={uploadCompetition.type}
          onSuccess={() => {
            // Refresh competitions if needed
          }}
        />
      )}
    </div>
  )
}

export default CompetitionsManagementPage

