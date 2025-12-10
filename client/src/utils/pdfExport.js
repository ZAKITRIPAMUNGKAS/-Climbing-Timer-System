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
export function generateResultListExcel(leaderboard, competition, round = 'Qualification', finalsMatches = null) {
  // Create a new workbook
  const wb = XLSX.utils.book_new()
  
  // Determine table columns based on competition type
  const isSpeed = competition.type === 'speed' || competition.type === 'speed_climbing'
  const isFinals = round === 'Finals' || round === 'finals'
  
  let headers = []
  let data = []
  
  if (isSpeed) {
    // Speed Climbing Result List
    if (isFinals) {
      // For finals, add bracket history columns
      headers = ['Rank', 'Bib', 'Name', 'Team', 'Lane A', 'Lane B', 'Total Time', 'Status', 'Bracket Progression', 'Match History']
    } else {
      headers = ['Rank', 'Bib', 'Name', 'Team', 'Lane A', 'Lane B', 'Total Time', 'Status']
    }
    
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
        
        const row = [
          entry.rank || '-',
          entry.bib_number || '-',
          entry.name || '-',
          entry.team || '-',
          formatTime(entry.lane_a_time),
          formatTime(entry.lane_b_time),
          formatTime(entry.total_time),
          entry.status || 'VALID'
        ]
        
        // Add bracket history columns for finals
        if (isFinals) {
          row.push(entry.progression || '-') // Bracket Progression
          row.push(entry.bracket_history || '-') // Match History
        }
        
        return row
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
    if (isSpeed && isFinals) {
      // Speed Finals columns
      if (index === 4) return { wch: 12 } // Lane A
      if (index === 5) return { wch: 12 } // Lane B
      if (index === 6) return { wch: 12 } // Total Time
      if (index === 7) return { wch: 10 } // Status
      if (index === 8) return { wch: 30 } // Bracket Progression
      if (index === 9) return { wch: 60 } // Match History
      return { wch: 15 }
    } else if (isSpeed) {
      // Speed Qualification columns
      if (index === 4) return { wch: 12 } // Lane A
      if (index === 5) return { wch: 12 } // Lane B
      if (index === 6) return { wch: 12 } // Total Time
      if (index === 7) return { wch: 10 } // Status
      return { wch: 15 }
    } else {
      // Boulder columns
      if (index === 4) return { wch: 8 } // Tops
      if (index === 5) return { wch: 8 } // Zones
      if (index === 6) return { wch: 12 } // TOP Attempts
      if (index === 7) return { wch: 12 } // ZONE Attempts
      return { wch: 15 } // Other columns
    }
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
  
  // Add bracket detail sheet for finals with professional format
  if (isFinals && finalsMatches && finalsMatches.length > 0) {
    // Group matches by stage
    const matchesByStage = {}
    finalsMatches.forEach(match => {
      if (!matchesByStage[match.stage]) {
        matchesByStage[match.stage] = []
      }
      matchesByStage[match.stage].push(match)
    })
    
    // Define stage order
    const stageOrder = ['Round of 16', 'Quarter Final', 'Semi Final', 'Small Final', 'Big Final']
    const orderedStages = stageOrder.filter(stage => matchesByStage[stage])
    
    // Prepare bracket data with headers and spacing
    const bracketData = []
    let currentRow = 0
    
    // Helper function to format time
    const formatTime = (time) => {
      if (!time || time === 0) return '-'
      if (typeof time === 'number') return `${time.toFixed(2)}s`
      if (typeof time === 'string') {
        return time.includes('s') ? time : `${time}s`
      }
      return '-'
    }
    
    // Add main header (merged cells will be handled separately)
    const competitionName = competition.name || 'Competition'
    const year = new Date().getFullYear()
    bracketData.push([`${competitionName.toUpperCase()} – FINAL BRACKET RESULT`])
    bracketData.push([`Kategori Speed – Tahun ${year}`])
    bracketData.push([]) // Empty row
    currentRow = 3
    
    // Process each stage
    orderedStages.forEach((stage, stageIndex) => {
      const stageMatches = matchesByStage[stage]
        .sort((a, b) => (a.match_order || 0) - (b.match_order || 0))
      
      // Add stage header
      bracketData.push([`${stage.toUpperCase()}`])
      currentRow++
      
      // Add table headers
      const headers = ['Match', 'Climber A', 'Sekolah A', 'Waktu A', 'VS', 'Climber B', 'Sekolah B', 'Waktu B', 'Winner']
      bracketData.push(headers)
      currentRow++
      
      // Add match data
      stageMatches.forEach(match => {
        // Calculate total time for Climber A
        let aTotal = match.climber_a_total_time ? parseFloat(match.climber_a_total_time) : null
        if (!aTotal && match.climber_a_run1_time && match.climber_a_run2_time &&
            match.climber_a_run1_status === 'VALID' && match.climber_a_run2_status === 'VALID') {
          aTotal = parseFloat(match.climber_a_run1_time) + parseFloat(match.climber_a_run2_time)
        }
        
        // Calculate total time for Climber B
        let bTotal = match.climber_b_total_time ? parseFloat(match.climber_b_total_time) : null
        if (!bTotal && match.climber_b_run1_time && match.climber_b_run2_time &&
            match.climber_b_run1_status === 'VALID' && match.climber_b_run2_status === 'VALID') {
          bTotal = parseFloat(match.climber_b_run1_time) + parseFloat(match.climber_b_run2_time)
        }
        
        const winner = match.winner_id === match.climber_a_id ? match.climber_a_name : 
                      match.winner_id === match.climber_b_id ? match.climber_b_name : '-'
        
        bracketData.push([
          `Match ${match.match_order || '-'}`,
          match.climber_a_name || '-',
          match.climber_a_team || '-',
          formatTime(aTotal),
          'VS',
          match.climber_b_name || 'BYE',
          match.climber_b_team || '-',
          formatTime(bTotal),
          winner
        ])
        currentRow++
      })
      
      // Add 2 empty rows between stages (except last stage)
      if (stageIndex < orderedStages.length - 1) {
        bracketData.push([])
        bracketData.push([])
        currentRow += 2
      }
    })
    
    // Create worksheet
    const bracketWs = XLSX.utils.aoa_to_sheet(bracketData)
    
    // Set column widths
    bracketWs['!cols'] = [
      { wch: 12 }, // Match
      { wch: 25 }, // Climber A
      { wch: 25 }, // Sekolah A
      { wch: 12 }, // Waktu A
      { wch: 5 },  // VS
      { wch: 25 }, // Climber B
      { wch: 25 }, // Sekolah B
      { wch: 12 }, // Waktu B
      { wch: 25 }  // Winner
    ]
    
    // Style cells
    const range = XLSX.utils.decode_range(bracketWs['!ref'])
    
    // Style main header (row 0)
    for (let col = 0; col <= 8; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
      if (!bracketWs[cellAddress]) {
        bracketWs[cellAddress] = { t: 's', v: '' }
      }
      bracketWs[cellAddress].s = {
        font: { bold: true, sz: 16 },
        alignment: { horizontal: 'center', vertical: 'center' }
      }
    }
    // Merge header cells
    bracketWs['!merges'] = bracketWs['!merges'] || []
    bracketWs['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 8 } })
    
    // Style sub-header (row 1)
    for (let col = 0; col <= 8; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 1, c: col })
      if (!bracketWs[cellAddress]) {
        bracketWs[cellAddress] = { t: 's', v: '' }
      }
      bracketWs[cellAddress].s = {
        font: { bold: true, sz: 14 },
        alignment: { horizontal: 'center', vertical: 'center' }
      }
    }
    bracketWs['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 8 } })
    
    // Find and style stage headers and table headers
    let rowIndex = 3
    orderedStages.forEach((stage) => {
      const stageMatches = matchesByStage[stage]
        .sort((a, b) => (a.match_order || 0) - (b.match_order || 0))
      
      // Style stage header
      for (let col = 0; col <= 8; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: col })
        if (!bracketWs[cellAddress]) {
          bracketWs[cellAddress] = { t: 's', v: '' }
        }
        bracketWs[cellAddress].s = {
          font: { bold: true, sz: 12 },
          fill: { fgColor: { rgb: 'E0E0E0' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' }
          }
        }
      }
      bracketWs['!merges'].push({ s: { r: rowIndex, c: 0 }, e: { r: rowIndex, c: 8 } })
      rowIndex++
      
      // Style table headers
      for (let col = 0; col <= 8; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: col })
        if (!bracketWs[cellAddress]) continue
        bracketWs[cellAddress].s = {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '228B22' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' }
          }
        }
      }
      rowIndex++
      
      // Style match rows
      stageMatches.forEach(() => {
        for (let col = 0; col <= 8; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: col })
          if (!bracketWs[cellAddress]) continue
          
          const isWinnerCol = col === 8
          bracketWs[cellAddress].s = {
            font: { bold: isWinnerCol },
            fill: isWinnerCol ? { fgColor: { rgb: 'D4EDDA' } } : undefined,
            alignment: { horizontal: col === 4 ? 'center' : 'left', vertical: 'center' },
            border: {
              top: { style: 'thin' },
              bottom: { style: 'thin' },
              left: { style: 'thin' },
              right: { style: 'thin' }
            }
          }
        }
        rowIndex++
      })
      
      // Skip 2 empty rows
      rowIndex += 2
    })
    
    XLSX.utils.book_append_sheet(wb, bracketWs, 'Bracket')
  }
  
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

