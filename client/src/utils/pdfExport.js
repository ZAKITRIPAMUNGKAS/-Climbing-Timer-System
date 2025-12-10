import jsPDF from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'

/**
 * Generate Start List PDF
 * @param {Array} climbers - Array of climber objects
 * @param {Object} competition - Competition object
 * @param {String} round - Round name (e.g., "Qualification", "Final")
 */
export function generateStartListPDF(climbers, competition, round = 'Qualification') {
  const doc = new jsPDF()
  
  // Title
  doc.setFontSize(18)
  doc.text(competition.name || 'Competition', 14, 20)
  
  doc.setFontSize(14)
  doc.text(`Start List - ${round}`, 14, 30)
  
  // Date
  doc.setFontSize(10)
  doc.text(`Generated: ${new Date().toLocaleString('id-ID')}`, 14, 40)
  
  // Table data
  const tableData = climbers
    .sort((a, b) => (a.bib_number || 0) - (b.bib_number || 0))
    .map((climber, index) => [
      index + 1,
      climber.bib_number || '-',
      climber.name || '-',
      climber.team || '-'
    ])
  
  // Generate table
  doc.autoTable({
    startY: 50,
    head: [['No', 'Bib', 'Name', 'Team']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] }, // Blue
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 30 },
      2: { cellWidth: 80 },
      3: { cellWidth: 50 }
    }
  })
  
  // Footer with signature area
  const pageHeight = doc.internal.pageSize.height
  const footerY = pageHeight - 50
  
  doc.setFontSize(10)
  doc.text('Chief Judge Signature:', 14, footerY)
  doc.line(14, footerY + 5, 80, footerY + 5)
  
  doc.text('Date/Time:', 100, footerY)
  doc.line(100, footerY + 5, 180, footerY + 5)
  
  // Save PDF
  const filename = `${competition.name || 'competition'}_startlist_${round.toLowerCase()}.pdf`
  doc.save(filename)
}

/**
 * Generate Result List PDF
 * @param {Array} leaderboard - Array of leaderboard entries
 * @param {Object} competition - Competition object
 * @param {String} round - Round name (e.g., "Qualification", "Final")
 */
export function generateResultListPDF(leaderboard, competition, round = 'Qualification') {
  const doc = new jsPDF()
  
  // Title
  doc.setFontSize(18)
  doc.text(competition.name || 'Competition', 14, 20)
  
  doc.setFontSize(14)
  doc.text(`Result List - ${round}`, 14, 30)
  
  // Date
  doc.setFontSize(10)
  doc.text(`Generated: ${new Date().toLocaleString('id-ID')}`, 14, 40)
  
  // Determine table columns based on competition type
  const isSpeed = competition.type === 'speed' || competition.type === 'speed_climbing'
  
  let tableData = []
  let headers = []
  
  if (isSpeed) {
    // Speed Climbing Result List
    headers = ['Rank', 'Bib', 'Name', 'Team', 'Lane A', 'Lane B', 'Total Time', 'Status']
    
    tableData = leaderboard
      .sort((a, b) => {
        // Sort by rank if available, otherwise by total_time
        if (a.rank && b.rank) return a.rank - b.rank
        if (a.total_time && b.total_time) return a.total_time - b.total_time
        return 0
      })
      .map((entry) => [
        entry.rank || '-',
        entry.bib_number || '-',
        entry.name || '-',
        entry.team || '-',
        entry.lane_a_time ? `${entry.lane_a_time}s` : '-',
        entry.lane_b_time ? `${entry.lane_b_time}s` : '-',
        entry.total_time ? `${entry.total_time}s` : '-',
        entry.status || 'VALID'
      ])
  } else {
    // Boulder Result List
    headers = ['Rank', 'Bib', 'Name', 'Team', 'Tops', 'Zones', 'Total Score']
    
    tableData = leaderboard
      .sort((a, b) => {
        // Sort by rank if available, otherwise by totalScore
        if (a.rank && b.rank) return a.rank - b.rank
        if (a.totalScore && b.totalScore) return b.totalScore - a.totalScore
        return 0
      })
      .map((entry) => {
        const tops = entry.scores?.filter(s => s.isTop).length || 0
        const zones = entry.scores?.filter(s => s.isZone).length || 0
        
        return [
          entry.rank || '-',
          entry.bib_number || '-',
          entry.name || '-',
          entry.team || '-',
          tops,
          zones,
          entry.totalScore?.toFixed(1) || '0.0'
        ]
      })
  }
  
  // Generate table
  doc.autoTable({
    startY: 50,
    head: [headers],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [34, 197, 94] }, // Green
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 25 },
      2: { cellWidth: 60 },
      3: { cellWidth: 40 }
    }
  })
  
  // Footer with signature area
  const pageHeight = doc.internal.pageSize.height
  const footerY = pageHeight - 50
  
  doc.setFontSize(10)
  doc.text('Chief Judge Signature:', 14, footerY)
  doc.line(14, footerY + 5, 80, footerY + 5)
  
  doc.text('Date/Time:', 100, footerY)
  doc.line(100, footerY + 5, 180, footerY + 5)
  
  // Save PDF
  const filename = `${competition.name || 'competition'}_results_${round.toLowerCase()}.pdf`
  doc.save(filename)
}

/**
 * Generate Result List Excel
 * @param {Array} leaderboard - Array of leaderboard entries
 * @param {Object} competition - Competition object
 * @param {String} round - Round name (e.g., "Qualification", "Final")
 */
export function generateResultListExcel(leaderboard, competition, round = 'Qualification') {
  // Create a new workbook
  const wb = XLSX.utils.book_new()
  
  // Determine table columns based on competition type
  const isSpeed = competition.type === 'speed' || competition.type === 'speed_climbing'
  
  let headers = []
  let data = []
  
  if (isSpeed) {
    // Speed Climbing Result List
    headers = ['Rank', 'Bib', 'Name', 'Team', 'Lane A', 'Lane B', 'Total Time', 'Status']
    
    data = leaderboard
      .sort((a, b) => {
        // Sort by stage and match_order first (for finals), then by rank or total_time
        if (a.stage && b.stage) {
          const stageOrder = {
            'Round of 16': 1,
            'Quarter Final': 2,
            'Semi Final': 3,
            'Small Final': 4,
            'Big Final': 5
          }
          const orderA = stageOrder[a.stage] || 99
          const orderB = stageOrder[b.stage] || 99
          if (orderA !== orderB) return orderA - orderB
          if (a.match_order && b.match_order) {
            if (a.match_order !== b.match_order) return a.match_order - b.match_order
          }
        }
        // Sort by rank if available, otherwise by total_time
        if (a.rank && b.rank && a.rank !== '-' && b.rank !== '-') return a.rank - b.rank
        if (a.total_time && b.total_time) return a.total_time - b.total_time
        return 0
      })
      .map((entry) => {
        // Format time values
        const formatTime = (time) => {
          if (!time) return '-'
          if (typeof time === 'number') return `${time.toFixed(2)}s`
          if (typeof time === 'string') {
            // Remove 's' if already present
            return time.includes('s') ? time : `${time}s`
          }
          return '-'
        }
        
        return [
          entry.rank || '-',
          entry.bib_number || '-',
          entry.name || '-',
          entry.team || '-',
          formatTime(entry.lane_a_time),
          formatTime(entry.lane_b_time),
          formatTime(entry.total_time),
          entry.status || 'VALID'
        ]
      })
  } else {
    // Boulder Result List
    headers = ['Rank', 'Bib', 'Name', 'Team', 'Tops', 'Zones', 'TOP Attempts', 'ZONE Attempts', 'Total Score']
    
    data = leaderboard
      .sort((a, b) => {
        // Sort by rank if available, otherwise by totalScore
        if (a.rank && b.rank) return a.rank - b.rank
        if (a.totalScore && b.totalScore) return b.totalScore - a.totalScore
        return 0
      })
      .map((entry) => {
        const tops = entry.scores?.filter(s => s.isTop).length || 0
        const zones = entry.scores?.filter(s => s.isZone && !s.isTop).length || 0
        
        // Get TOP attempts per boulder (only for boulders that reached TOP)
        const topAttemptsList = entry.scores
          ?.filter(s => s.isTop && s.topAttempts > 0)
          .map(s => s.topAttempts)
          .sort((a, b) => a - b) || []
        
        // Get ZONE attempts per boulder (only for boulders that reached ZONE but not TOP)
        const zoneAttemptsList = entry.scores
          ?.filter(s => s.isZone && !s.isTop && s.zoneAttempts > 0)
          .map(s => s.zoneAttempts)
          .sort((a, b) => a - b) || []
        
        // Format attempts display - show list of attempts
        const formatAttempts = (attemptsList) => {
          if (attemptsList.length === 0) return '-'
          return attemptsList.join(', ')
        }
        
        return [
          entry.rank || '-',
          entry.bib_number || '-',
          entry.name || '-',
          entry.team || '-',
          tops,
          zones,
          formatAttempts(topAttemptsList),
          formatAttempts(zoneAttemptsList),
          entry.totalScore?.toFixed(1) || '0.0'
        ]
      })
  }
  
  // Combine headers and data
  const worksheetData = [headers, ...data]
  
  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(worksheetData)
  
  // Set column widths
  const colWidths = headers.map((_, index) => {
    if (index === 0) return { wch: 8 } // Rank
    if (index === 1) return { wch: 8 } // Bib
    if (index === 2) return { wch: 30 } // Name
    if (index === 3) return { wch: 20 } // Team
    if (index === 4) return { wch: 8 } // Tops
    if (index === 5) return { wch: 8 } // Zones
    if (index === 6) return { wch: 12 } // TOP Attempts
    if (index === 7) return { wch: 12 } // ZONE Attempts
    return { wch: 15 } // Other columns
  })
  ws['!cols'] = colWidths
  
  // Style header row
  const headerRange = XLSX.utils.decode_range(ws['!ref'])
  for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
    if (!ws[cellAddress]) continue
    ws[cellAddress].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '228B22' } }, // Green background
      alignment: { horizontal: 'center', vertical: 'center' }
    }
  }
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Results')
  
  // Add metadata sheet
  const metadataData = [
    ['Competition Name', competition.name || 'Competition'],
    ['Round', round],
    ['Generated', new Date().toLocaleString('id-ID')],
    ['Total Participants', leaderboard.length]
  ]
  const metadataWs = XLSX.utils.aoa_to_sheet(metadataData)
  XLSX.utils.book_append_sheet(wb, metadataWs, 'Info')
  
  // Generate filename
  const filename = `${competition.name || 'competition'}_results_${round.toLowerCase()}.xlsx`
  
  // Save file
  XLSX.writeFile(wb, filename)
}

