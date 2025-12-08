import { useState, useEffect } from 'react'
import { Gavel, Trophy, Timer, Search, Maximize2, Minimize2, LogOut } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import ScoreInputModal from '../components/ScoreInputModal'
import FinalsMatchInputModal from '../components/FinalsMatchInputModal'

function JudgeInterfacePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const isFullscreen = location.pathname === '/judge-interface-fullscreen'
  
  const [competitions, setCompetitions] = useState([])
  const [selectedCompetition, setSelectedCompetition] = useState(null)
  const [climbers, setClimbers] = useState([])
  const [finalsMatches, setFinalsMatches] = useState([])
  const [activeTab, setActiveTab] = useState('qualification') // 'qualification' or 'finals'
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showScoreModal, setShowScoreModal] = useState(false)
  const [selectedClimber, setSelectedClimber] = useState(null)
  const [showFinalsModal, setShowFinalsModal] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState(null)

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
      })
      navigate('/login', { replace: true })
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const toggleFullscreen = () => {
    if (isFullscreen) {
      navigate('/dashboard/judge-interface')
    } else {
      navigate('/judge-interface-fullscreen')
    }
  }

  useEffect(() => {
    fetchCompetitions()
  }, [])

  useEffect(() => {
    if (selectedCompetition) {
      if (selectedCompetition.type === 'speed' && selectedCompetition.status === 'finals') {
        // Fetch finals matches for speed competitions in finals stage
        fetchFinalsMatches(selectedCompetition.id)
      } else {
        fetchClimbers(selectedCompetition.id, selectedCompetition.type)
      }
    }
  }, [selectedCompetition, activeTab])

  const fetchFinalsMatches = async (competitionId) => {
    try {
      const response = await fetch(`/api/speed-competitions/${competitionId}/finals`)
      if (response.ok) {
        const data = await response.json()
        setFinalsMatches(data)
      }
    } catch (error) {
      console.error('Error fetching finals matches:', error)
    }
  }

  const fetchCompetitions = async () => {
    try {
      const [boulderRes, speedRes] = await Promise.all([
        fetch('/api/competitions'),
        fetch('/api/speed-competitions')
      ])
      
      const boulder = await boulderRes.json()
      const speed = await speedRes.json()
      
      setCompetitions([
        ...boulder.map(c => ({ ...c, type: 'boulder' })),
        ...speed.map(c => ({ ...c, type: 'speed' }))
      ])
      setLoading(false)
    } catch (error) {
      console.error('Error fetching competitions:', error)
      setLoading(false)
    }
  }

  const fetchClimbers = async (competitionId, type) => {
    try {
      const url = type === 'speed'
        ? `/api/speed-competitions/${competitionId}/climbers`
        : `/api/competitions/${competitionId}/climbers`
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setClimbers(data)
      }
    } catch (error) {
      console.error('Error fetching climbers:', error)
    }
  }

  const filteredClimbers = climbers.filter(climber =>
    climber.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    climber.bib_number.toString().includes(searchQuery)
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className={isFullscreen ? "min-h-screen bg-slate-50" : "space-y-6"}>
      {/* Fullscreen Header */}
      {isFullscreen && (
        <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
          <div className="px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Gavel size={24} className="text-blue-600 sm:w-7 sm:h-7" />
                  <span>Judge Interface</span>
                </h2>
                <span className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                  Fullscreen Mode
                </span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <button
                  onClick={toggleFullscreen}
                  className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm"
                  title="Exit Fullscreen"
                >
                  <Minimize2 size={18} />
                  <span className="hidden sm:inline">Exit Fullscreen</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <LogOut size={18} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Regular Header (if not fullscreen) */}
      {!isFullscreen && (
        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Gavel size={24} className="text-blue-600 sm:w-7 sm:h-7" />
                Judge Interface
              </h2>
              <p className="text-sm sm:text-base text-gray-600 mt-1">Input scores for competitions</p>
            </div>
            <button
              onClick={toggleFullscreen}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
              title="Enter Fullscreen Mode"
            >
              <Maximize2 size={18} />
              <span className="hidden sm:inline">Fullscreen</span>
            </button>
          </div>
        </div>
      )}

      <div className={isFullscreen ? "p-3 sm:p-4 lg:p-6" : ""}>

      {/* Competition Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Competition
        </label>
        <select
          value={selectedCompetition?.id || ''}
          onChange={(e) => {
            const comp = competitions.find(c => c.id === parseInt(e.target.value))
            setSelectedCompetition(comp || null)
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Select Competition --</option>
          {competitions.map((comp) => (
            <option key={comp.id} value={comp.id}>
              {comp.name} ({comp.type === 'boulder' ? 'Boulder' : 'Speed'})
            </option>
          ))}
        </select>
      </div>

          {/* Score Input */}
      {selectedCompetition && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mt-4 sm:mt-6">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">{selectedCompetition.name}</h3>
                <p className="text-xs sm:text-sm text-gray-600 capitalize">{selectedCompetition.type} Competition</p>
              </div>
              <div className="flex items-center gap-2">
                {selectedCompetition.type === 'boulder' ? (
                  <Trophy className="text-blue-600" size={20} />
                ) : (
                  <Timer className="text-purple-600" size={20} />
                )}
              </div>
            </div>
          </div>

          {/* Tabs for Speed Finals */}
          {selectedCompetition.type === 'speed' && selectedCompetition.status === 'finals' && (
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="inline-flex bg-gray-100 rounded-lg p-1 gap-1 w-full sm:w-auto">
                <button
                  onClick={() => {
                    setActiveTab('qualification')
                    fetchClimbers(selectedCompetition.id, selectedCompetition.type)
                  }}
                  className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm sm:text-base font-semibold transition-all rounded-md ${
                    activeTab === 'qualification'
                      ? 'bg-white shadow text-gray-900'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Qualification
                </button>
                <button
                  onClick={() => {
                    setActiveTab('finals')
                    fetchFinalsMatches(selectedCompetition.id)
                  }}
                  className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm sm:text-base font-semibold transition-all rounded-md ${
                    activeTab === 'finals'
                      ? 'bg-white shadow text-gray-900'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Finals
                </button>
              </div>
            </div>
          )}
          
          {/* Search */}
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder={
                  activeTab === 'finals' 
                    ? "Search match by climber name or stage..." 
                    : "Search climber by name or bib number..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Content: Finals Matches or Climbers List */}
          {activeTab === 'finals' && selectedCompetition.status === 'finals' ? (
            <div className="p-4 sm:p-6">
              {finalsMatches.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <p className="text-sm sm:text-base text-gray-500">No finals matches found</p>
                  <p className="text-xs sm:text-sm text-gray-400 mt-2">
                    Generate bracket first from Manage Competitions
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {finalsMatches
                    .filter(match => {
                      if (!searchQuery) return true
                      const query = searchQuery.toLowerCase()
                      return (
                        match.climber_a_name?.toLowerCase().includes(query) ||
                        match.climber_b_name?.toLowerCase().includes(query) ||
                        match.stage?.toLowerCase().includes(query)
                      )
                    })
                    .map((match) => (
                      <div key={match.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex-1 w-full">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                            <span className="px-2 sm:px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                              {match.stage}
                            </span>
                            <span className="text-xs text-gray-500">Match {match.match_order}</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div>
                              <div className="text-sm text-gray-600">Lane A</div>
                              <div className="font-semibold text-gray-900">
                                {match.climber_a_name} (#{match.climber_a_bib})
                              </div>
                              {match.time_a && (
                                <div className="text-sm text-green-600 font-semibold">
                                  {match.time_a}s ({match.status_a})
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">
                                {match.climber_b_id ? 'Lane B' : 'BYE'}
                              </div>
                              {match.climber_b_id ? (
                                <>
                                  <div className="font-semibold text-gray-900">
                                    {match.climber_b_name} (#{match.climber_b_bib})
                                  </div>
                                  {match.time_b && (
                                    <div className="text-sm text-green-600 font-semibold">
                                      {match.time_b}s ({match.status_b})
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="text-sm text-yellow-600 font-semibold">Walkover</div>
                              )}
                            </div>
                          </div>
                          {match.winner_id && (
                            <div className="mt-2 text-sm">
                              <span className="text-green-600 font-semibold">
                                Winner: {match.winner_id === match.climber_a_id ? match.climber_a_name : match.climber_b_name}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-4 mt-3 sm:mt-0">
                          <button
                            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                            onClick={() => {
                              setSelectedMatch(match)
                              setShowFinalsModal(true)
                            }}
                          >
                            Input Score
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 sm:p-6">
              {filteredClimbers.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <p className="text-sm sm:text-base text-gray-500">No climbers found</p>
                  <p className="text-xs sm:text-sm text-gray-400 mt-2">
                    {searchQuery ? 'Try a different search term' : 'Add climbers to this competition first'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredClimbers.map((climber) => (
                    <div key={climber.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <span className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs sm:text-sm font-semibold">
                            #{climber.bib_number}
                          </span>
                          <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{climber.name}</h4>
                          {climber.team && (
                            <span className="text-xs sm:text-sm text-gray-600">• {climber.team}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          onClick={() => {
                            setSelectedClimber(climber)
                            setShowScoreModal(true)
                          }}
                        >
                          Input Score
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Info */}
      {!selectedCompetition && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <Gavel className="mx-auto mb-4 text-blue-600" size={48} />
          <p className="text-blue-800 font-semibold mb-2">Select a competition to start</p>
          <p className="text-sm text-blue-600">Choose a competition from the dropdown above to input scores</p>
        </div>
      )}

      {/* Score Input Modal */}
      {showScoreModal && selectedClimber && selectedCompetition && (
        <ScoreInputModal
          isOpen={showScoreModal}
          onClose={() => {
            setShowScoreModal(false)
            setSelectedClimber(null)
          }}
          climber={selectedClimber}
          competition={selectedCompetition}
          onSuccess={() => {
            // Refresh climbers or scores if needed
            fetchClimbers(selectedCompetition.id, selectedCompetition.type)
          }}
        />
      )}

      {/* Finals Match Input Modal */}
      {showFinalsModal && selectedMatch && selectedCompetition && (
        <FinalsMatchInputModal
          isOpen={showFinalsModal}
          onClose={() => {
            setShowFinalsModal(false)
            setSelectedMatch(null)
          }}
          match={selectedMatch}
          competition={selectedCompetition}
          onSuccess={() => {
            // Refresh finals matches
            fetchFinalsMatches(selectedCompetition.id)
          }}
        />
      )}
      </div>
    </div>
  )
}

export default JudgeInterfacePage

