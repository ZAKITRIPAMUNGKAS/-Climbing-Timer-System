import { useState, useEffect } from 'react'
import { UserCog, Plus, Edit, Trash2, Shield, User } from 'lucide-react'

function UsersManagementPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'judge'
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      } else {
        console.error('Failed to fetch users')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const url = editingUser 
        ? `/api/users/${editingUser.id}`
        : '/api/users'
      
      const method = editingUser ? 'PUT' : 'POST'
      
      const body = editingUser && !formData.password
        ? { username: formData.username, role: formData.role }
        : formData

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      })

      if (response.ok) {
        await fetchUsers()
        setShowModal(false)
        setEditingUser(null)
        setFormData({ username: '', password: '', role: 'judge' })
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save user')
      }
    } catch (error) {
      console.error('Error saving user:', error)
      alert('Failed to save user')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        await fetchUsers()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Failed to delete user')
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
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600 mt-1">Manage judge and timer accounts</p>
        </div>
        <button
          onClick={() => {
            setEditingUser(null)
            setFormData({ username: '', password: '', role: 'judge' })
            setShowModal(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Add User
        </button>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <UserCog size={20} className="text-blue-600" />
            System Users
          </h3>
        </div>
        <div className="p-6">
          {users.length === 0 ? (
            <div className="text-center py-12">
              <UserCog className="mx-auto mb-4 text-gray-400" size={48} />
              <p className="text-gray-500">No users found</p>
              <p className="text-sm text-gray-400 mt-2">Add users to manage judge and timer accounts</p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${
                      user.role === 'admin' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {user.role === 'admin' ? <Shield size={20} /> : <User size={20} />}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{user.username}</h4>
                      <p className="text-sm text-gray-600 capitalize">{user.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingUser(user)
                        setFormData({ username: user.username, password: '', role: user.role })
                        setShowModal(true)
                      }}
                      className="px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                    >
                      <Trash2 size={16} />
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
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {editingUser ? 'Edit User' : 'Add User'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {editingUser ? 'New Password (leave blank to keep current)' : 'Password'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={!editingUser}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="judge">Judge</option>
                  <option value="timer">Timer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex items-center gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingUser ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingUser(null)
                    setFormData({ username: '', password: '', role: 'judge' })
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

export default UsersManagementPage

