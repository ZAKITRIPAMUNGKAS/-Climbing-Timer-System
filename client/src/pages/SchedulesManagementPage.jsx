import { useState, useEffect } from 'react'
import { Calendar, Plus, Edit, Trash2, MapPin, Clock } from 'lucide-react'

function SchedulesManagementPage() {
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState(null)
  const [formData, setFormData] = useState({
    date: '',
    title: '',
    location: '',
    time: '',
    status: 'upcoming',
    category: '',
    description: ''
  })

  useEffect(() => {
    fetchSchedules()
  }, [])

  const fetchSchedules = async () => {
    try {
      const response = await fetch('/api/schedules')
      if (response.ok) {
        const data = await response.json()
        setSchedules(data)
      }
      setLoading(false)
    } catch (error) {
      console.error('Error fetching schedules:', error)
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const url = editingSchedule 
        ? `/api/schedules/${editingSchedule.id}`
        : '/api/schedules'
      
      const method = editingSchedule ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await fetchSchedules()
        setShowModal(false)
        setEditingSchedule(null)
        setFormData({ date: '', title: '', location: '', time: '', status: 'upcoming', category: '', description: '' })
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save schedule')
      }
    } catch (error) {
      console.error('Error saving schedule:', error)
      alert('Failed to save schedule')
    }
  }

  const handleEdit = (schedule) => {
    setEditingSchedule(schedule)
    setFormData({
      date: schedule.date,
      title: schedule.title,
      location: schedule.location,
      time: schedule.time,
      status: schedule.status,
      category: schedule.category,
      description: schedule.description || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return

    try {
      const response = await fetch(`/api/schedules/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        await fetchSchedules()
      } else {
        alert('Failed to delete schedule')
      }
    } catch (error) {
      console.error('Error deleting schedule:', error)
      alert('Failed to delete schedule')
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manage Schedules</h2>
          <p className="text-gray-600 mt-1">Create and manage competition schedules</p>
        </div>
        <button
          onClick={() => {
            setEditingSchedule(null)
            setFormData({ date: '', title: '', location: '', time: '', status: 'upcoming', category: '', description: '' })
            setShowModal(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Add Schedule
        </button>
      </div>

      {/* Schedules List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calendar size={20} className="text-blue-600" />
            Competition Schedules
          </h3>
        </div>
        <div className="p-6">
          {schedules.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto mb-4 text-gray-400" size={48} />
              <p className="text-gray-500">No schedules found</p>
              <p className="text-sm text-gray-400 mt-2">Add schedules to manage competition timeline</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {schedules.map((schedule) => (
                <div key={schedule.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{schedule.title}</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <Calendar size={14} />
                        <span>{schedule.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <Clock size={14} />
                        <span>{schedule.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin size={14} />
                        <span>{schedule.location}</span>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      schedule.status === 'upcoming' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {schedule.status}
                    </div>
                  </div>
                  <div className="mb-3">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                      {schedule.category}
                    </span>
                  </div>
                  {schedule.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{schedule.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-4">
                    <button
                      onClick={() => handleEdit(schedule)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                    >
                      <Edit size={16} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(schedule.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
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
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {editingSchedule ? 'Edit Schedule' : 'Add Schedule'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="text"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    placeholder="e.g., 15 Januari 2024"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time *
                  </label>
                  <input
                    type="text"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    placeholder="e.g., 08:00 WIB"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Kejurnas FPTI 2024"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location *
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Solo, Jawa Tengah"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Speed, Boulder, Lead"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="past">Past</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Additional information about the schedule..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingSchedule ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingSchedule(null)
                    setFormData({ date: '', title: '', location: '', time: '', status: 'upcoming', category: '', description: '' })
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
    </div>
  )
}

export default SchedulesManagementPage

