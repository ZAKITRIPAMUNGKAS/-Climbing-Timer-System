import jsPDF from 'jspdf'
import 'jspdf-autotable'

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

