import { useState, useEffect } from 'react'
import { Settings as SettingsIcon, Database, Download, Upload, Save, Info, Bell, Globe, Shield, RefreshCw } from 'lucide-react'

function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    organizationName: 'FPTI Karanganyar',
    organizationEmail: 'info@fpti-karanganyar.com',
    organizationPhone: '+62 XXX XXX XXXX',
    organizationAddress: 'Karanganyar, Jawa Tengah',
    defaultBoulderCount: 4,
    defaultSpeedLanes: 2,
    enableNotifications: true,
    enablePublicLiveScore: true,
    maintenanceMode: false
  })
  const [systemInfo, setSystemInfo] = useState({
    version: '1.0.0',
    databaseStatus: 'Connected',
    lastBackup: null,
    totalCompetitions: 0,
    totalAthletes: 0,
    totalUsers: 0
  })

  useEffect(() => {
    fetchSystemInfo()
    fetchSettings()
  }, [])

  const fetchSystemInfo = async () => {
    try {
      // Fetch system statistics
      const [competitionsRes, athletesRes, usersRes] = await Promise.all([
        fetch('/api/competitions'),
        fetch('/api/athletes'),
        fetch('/api/users')
      ])
      
      const competitions = await competitionsRes.json()
      const athletes = await athletesRes.json()
      const users = await usersRes.json()

      setSystemInfo(prev => ({
        ...prev,
        totalCompetitions: competitions.length || 0,
        totalAthletes: athletes.length || 0,
        totalUsers: users.length || 0
      }))
    } catch (error) {
      console.error('Error fetching system info:', error)
    }
  }

  const fetchSettings = async () => {
    // In a real app, this would fetch from backend
    // For now, we'll use localStorage or default values
    const savedSettings = localStorage.getItem('appSettings')
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      // Save to localStorage (in production, this would be an API call)
      localStorage.setItem('appSettings', JSON.stringify(settings))
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      alert('Settings saved successfully!')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleExportData = async () => {
    setLoading(true)
    try {
      // Export all data as JSON
      const [competitionsRes, athletesRes, usersRes] = await Promise.all([
        fetch('/api/competitions'),
        fetch('/api/athletes'),
        fetch('/api/users')
      ])

      if (!competitionsRes.ok || !athletesRes.ok || !usersRes.ok) {
        throw new Error('Failed to fetch some data')
      }

      const [competitions, athletes, users] = await Promise.all([
        competitionsRes.json(),
        athletesRes.json(),
        usersRes.json()
      ])

      const exportData = {
        exportDate: new Date().toISOString(),
        competitions,
        athletes,
        users: users.map(u => ({ ...u, password: '***' })) // Remove passwords
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `fpti-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      alert('Data exported successfully!')
    } catch (error) {
      console.error('Error exporting data:', error)
      alert('Failed to export data')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'competition', label: 'Competition', icon: SettingsIcon },
    { id: 'system', label: 'System', icon: Database },
    { id: 'backup', label: 'Backup & Export', icon: Download }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <SettingsIcon size={28} className="text-blue-600" />
          Settings
        </h2>
        <p className="text-gray-600 mt-1">Manage application settings and preferences</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-semibold transition-all border-b-2 ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Organization Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Organization Name
                    </label>
                    <input
                      type="text"
                      value={settings.organizationName}
                      onChange={(e) => setSettings({ ...settings, organizationName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={settings.organizationEmail}
                      onChange={(e) => setSettings({ ...settings, organizationEmail: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={settings.organizationPhone}
                      onChange={(e) => setSettings({ ...settings, organizationPhone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <textarea
                      value={settings.organizationAddress}
                      onChange={(e) => setSettings({ ...settings, organizationAddress: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Preferences</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Enable Notifications</label>
                      <p className="text-xs text-gray-500">Receive notifications for important events</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.enableNotifications}
                        onChange={(e) => setSettings({ ...settings, enableNotifications: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Public Live Score</label>
                      <p className="text-xs text-gray-500">Allow public access to live score pages</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.enablePublicLiveScore}
                        onChange={(e) => setSettings({ ...settings, enablePublicLiveScore: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Maintenance Mode</label>
                      <p className="text-xs text-gray-500">Temporarily disable public access</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.maintenanceMode}
                        onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Competition Settings */}
          {activeTab === 'competition' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Default Competition Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Boulder Count
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={settings.defaultBoulderCount}
                      onChange={(e) => setSettings({ ...settings, defaultBoulderCount: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Number of boulders for new Boulder competitions</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Speed Lanes
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="4"
                      value={settings.defaultSpeedLanes}
                      onChange={(e) => setSettings({ ...settings, defaultSpeedLanes: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Number of lanes for Speed competitions</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* System Info */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
                <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Application Version</span>
                    <span className="text-sm text-gray-900 font-semibold">{systemInfo.version}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Database Status</span>
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-900 font-semibold">{systemInfo.databaseStatus}</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Total Competitions</span>
                    <span className="text-sm text-gray-900 font-semibold">{systemInfo.totalCompetitions}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Total Athletes</span>
                    <span className="text-sm text-gray-900 font-semibold">{systemInfo.totalAthletes}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Total Users</span>
                    <span className="text-sm text-gray-900 font-semibold">{systemInfo.totalUsers}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={fetchSystemInfo}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    <RefreshCw size={18} />
                    Refresh System Info
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Backup & Export */}
          {activeTab === 'backup' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Export</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <Info className="text-blue-600 mt-0.5" size={20} />
                    <div className="text-sm text-blue-800">
                      <p className="font-semibold mb-1">Export All Data</p>
                      <p>Download a complete backup of all competitions, athletes, and users data as JSON file. This file can be used to restore data or migrate to another system.</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleExportData}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                      <span>Exporting...</span>
                    </>
                  ) : (
                    <>
                      <Download size={18} />
                      <span>Export All Data</span>
                    </>
                  )}
                </button>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Database Backup</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <Shield className="text-yellow-600 mt-0.5" size={20} />
                    <div className="text-sm text-yellow-800">
                      <p className="font-semibold mb-1">Database Backup</p>
                      <p>For database backup, please use MySQL backup tools (mysqldump) or your hosting provider's backup feature. This ensures complete database integrity.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      {(activeTab === 'general' || activeTab === 'competition') && (
        <div className="flex justify-end">
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={18} />
                <span>Save Settings</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

export default SettingsPage

