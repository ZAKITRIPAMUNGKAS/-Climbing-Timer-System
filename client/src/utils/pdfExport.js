import jsPDF from 'jspdf'
// Import jspdf-autotable as a function (required for Vite/modern bundlers)
import autoTable from 'jspdf-autotable'
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
  autoTable(doc, {
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
  autoTable(doc, {
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
 * Helper function to load image as base64
 */
async function loadImageAsBase64(imagePath) {
  try {
    const response = await fetch(imagePath)
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('Error loading image:', error)
    return null
  }
}

/**
 * Generate Official Result PDF (FPTI Format)
 * @param {Array} leaderboard - Array of leaderboard entries
 * @param {Object} competition - Competition object
 * @param {String} round - Round name (e.g., "Qualification", "Semifinal")
 * @param {String} categoryType - Category type: "Boulder", "Lead", or "Speed"
 * @param {Object} options - Additional options: { eventName, location, date, categoryName, cutoffRank }
 */
export async function generateOfficialResultPDF(leaderboard, competition, round = 'Qualification', categoryType = 'Boulder', options = {}) {
  // Load logos first (left and right)
  const logoBase64 = await loadImageAsBase64('/logo.jpeg')
  const logoRightBase64 = await loadImageAsBase64('/header_surat_kanan.png')
  
  // Create jsPDF instance - same way as other functions that work
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  
  // Default options
  const eventName = options.eventName || competition.name || 'PORPROV TAHUN 2025'
  const location = options.location || 'Semarang'
  const date = options.date || new Date().toLocaleDateString('id-ID', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
  })
  const categoryName = options.categoryName || `${round} ${categoryType} Perorangan`
  const cutoffRank = options.cutoffRank || 8
  
  // Calculate tie-break cutoff
  // If climber at cutoffRank has same score as climbers below, include all tied climbers
  let qualifiedCount = cutoffRank
  const sortedLeaderboard = [...leaderboard].sort((a, b) => {
    // Sort by rank if available
    if (a.rank && b.rank) return a.rank - b.rank
    // Sort by score (descending for boulder, ascending for speed)
    if (categoryType === 'Boulder') {
      const scoreA = a.totalScore || 0
      const scoreB = b.totalScore || 0
      if (scoreA !== scoreB) return scoreB - scoreA
    } else if (categoryType === 'Speed') {
      const timeA = a.total_time || 999
      const timeB = b.total_time || 999
      if (timeA !== timeB) return timeA - timeB
    } else if (categoryType === 'Lead') {
      const heightA = a.height || 0
      const heightB = b.height || 0
      if (heightA !== heightB) return heightB - heightA
    }
    return 0
  })
  
  if (sortedLeaderboard.length > cutoffRank - 1) {
    const cutoffClimber = sortedLeaderboard[cutoffRank - 1]
    let cutoffScore = null
    
    if (categoryType === 'Boulder') {
      cutoffScore = cutoffClimber.totalScore
    } else if (categoryType === 'Speed') {
      cutoffScore = cutoffClimber.total_time
    } else if (categoryType === 'Lead') {
      cutoffScore = cutoffClimber.height
    }
    
    // Find all climbers with same score as cutoff
    if (cutoffScore !== null) {
      for (let i = cutoffRank; i < sortedLeaderboard.length; i++) {
        const climber = sortedLeaderboard[i]
        let climberScore = null
        
        if (categoryType === 'Boulder') {
          climberScore = climber.totalScore
        } else if (categoryType === 'Speed') {
          climberScore = climber.total_time
        } else if (categoryType === 'Lead') {
          climberScore = climber.height
        }
        
        if (climberScore === cutoffScore) {
          qualifiedCount++
        } else {
          break
        }
      }
    }
  }
  
  // Header section - Start from higher position to accommodate logos
  let currentY = 30 // Start lower to avoid logo cutoff at top and give space for both logos
  
  // Helper function to get image dimensions
  const getImageDimensions = (base64) => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        resolve({ width: img.width, height: img.height })
      }
      img.onerror = () => {
        // Fallback to square if can't load
        resolve({ width: 1, height: 1 })
      }
      img.src = base64
    })
  }
  
  // Helper function to add image with proper aspect ratio
  const addImageWithAspectRatio = async (base64, x, y, maxWidth, maxHeight, format = 'JPEG') => {
    if (!base64) return false
    
    try {
      const imgDims = await getImageDimensions(base64)
      const aspectRatio = imgDims.width / imgDims.height
      
      // Calculate dimensions maintaining aspect ratio
      let imgWidth = maxWidth
      let imgHeight = maxHeight
      
      // Maintain aspect ratio - fit within max bounds
      if (maxWidth / maxHeight > aspectRatio) {
        // Height is the limiting factor
        imgHeight = maxHeight
        imgWidth = imgHeight * aspectRatio
      } else {
        // Width is the limiting factor
        imgWidth = maxWidth
        imgHeight = imgWidth / aspectRatio
      }
      
      // Add image to PDF - maintain aspect ratio, don't stretch
      doc.addImage(base64, format, x, y, imgWidth, imgHeight, undefined, 'FAST')
      return true
    } catch (error) {
      console.error('Error adding image to PDF:', error)
      return false
    }
  }
  
  // Logo (left) - FPTI logo
  const logoMaxWidth = 20
  const logoMaxHeight = 16
  const logoX = 15
  const logoY = currentY - 8 // Position logo higher with more margin from top
  
  if (logoBase64) {
    const logoAdded = await addImageWithAspectRatio(logoBase64, logoX, logoY, logoMaxWidth, logoMaxHeight, 'JPEG')
    if (!logoAdded) {
      // Fallback: Draw placeholder if image add fails
      doc.setDrawColor(200, 200, 200)
      doc.setFillColor(255, 255, 255)
      doc.rect(logoX, logoY, logoMaxWidth, logoMaxHeight, 'FD')
      doc.setFontSize(7)
      doc.setFont(undefined, 'normal')
      doc.setTextColor(150, 150, 150)
      doc.text('LOGO', logoX + logoMaxWidth / 2, logoY + logoMaxHeight / 2, { align: 'center', baseline: 'middle' })
    }
  } else {
    // Fallback: Draw placeholder if logo fails to load
    doc.setDrawColor(200, 200, 200)
    doc.setFillColor(255, 255, 255)
    doc.rect(logoX, logoY, logoMaxWidth, logoMaxHeight, 'FD')
    doc.setFontSize(7)
    doc.setFont(undefined, 'normal')
    doc.setTextColor(150, 150, 150)
    doc.text('LOGO', logoX + logoMaxWidth / 2, logoY + logoMaxHeight / 2, { align: 'center', baseline: 'middle' })
  }
  
  // Logo (right) - header_surat_kanan.png
  const logoRightMaxWidth = 20
  const logoRightMaxHeight = 16
  const logoRightX = pageWidth - 15 - logoRightMaxWidth // Position from right edge
  const logoRightY = currentY - 8 // Same Y position as left logo
  
  if (logoRightBase64) {
    const logoRightAdded = await addImageWithAspectRatio(logoRightBase64, logoRightX, logoRightY, logoRightMaxWidth, logoRightMaxHeight, 'PNG')
    if (!logoRightAdded) {
      // Fallback: Draw placeholder if image add fails
      doc.setDrawColor(200, 200, 200)
      doc.setFillColor(255, 255, 255)
      doc.rect(logoRightX, logoRightY, logoRightMaxWidth, logoRightMaxHeight, 'FD')
      doc.setFontSize(7)
      doc.setFont(undefined, 'normal')
      doc.setTextColor(150, 150, 150)
      doc.text('LOGO', logoRightX + logoRightMaxWidth / 2, logoRightY + logoRightMaxHeight / 2, { align: 'center', baseline: 'middle' })
    }
  } else {
    // Fallback: Draw placeholder if logo fails to load
    doc.setDrawColor(200, 200, 200)
    doc.setFillColor(255, 255, 255)
    doc.rect(logoRightX, logoRightY, logoRightMaxWidth, logoRightMaxHeight, 'FD')
    doc.setFontSize(7)
    doc.setFont(undefined, 'normal')
    doc.setTextColor(150, 150, 150)
    doc.text('LOGO', logoRightX + logoRightMaxWidth / 2, logoRightY + logoRightMaxHeight / 2, { align: 'center', baseline: 'middle' })
  }
  
  // Center header - positioned between the two logos
  doc.setFontSize(10)
  doc.setFont(undefined, 'bold')
  const centerText = 'FEDERASI PANJAT TEBING INDONESIA KARANGANYAR'
  const centerTextWidth = doc.getTextWidth(centerText)
  doc.text(centerText, (pageWidth - centerTextWidth) / 2, currentY + 5)
  
  currentY += 10 // Spacing after header
  
  // Event name - Use round from competition if available
  doc.setFontSize(11)
  doc.setFont(undefined, 'normal')
  const roundText = round.toUpperCase() === 'QUALIFICATION' ? 'KUALIFIKASI' : 
                     round.toUpperCase() === 'SEMIFINAL' ? 'SEMIFINAL' :
                     round.toUpperCase() === 'FINAL' ? 'FINAL' : round.toUpperCase()
  const eventText = `BABAK ${roundText} ${eventName.toUpperCase()}`
  const eventTextWidth = doc.getTextWidth(eventText)
  doc.text(eventText, (pageWidth - eventTextWidth) / 2, currentY)
  
  currentY += 6
  
  // Location & Date
  doc.setFontSize(10)
  const locationDateText = `${location}, ${date}`
  const locationDateWidth = doc.getTextWidth(locationDateText)
  doc.text(locationDateText, (pageWidth - locationDateWidth) / 2, currentY)
  
  currentY += 10
  
  // Sub-header: Official Result + Category Name
  doc.setFontSize(12)
  doc.setFont(undefined, 'bold')
  const subHeaderText = `Official Result - ${categoryName}`
  const subHeaderWidth = doc.getTextWidth(subHeaderText)
  doc.text(subHeaderText, (pageWidth - subHeaderWidth) / 2, currentY)
  
  currentY += 10
  
  // Prepare table data
  let headers = ['Rank', 'Bib', 'Name', 'Team/Kontingen']
  let tableData = []
  
  if (categoryType === 'Boulder') {
    // Add boulder columns (B1, B2, B3, B4)
    const totalBoulders = competition.total_boulders || 4
    for (let i = 1; i <= totalBoulders; i++) {
      headers.push(`B${i}`)
    }
    headers.push('Total Score')
    
    tableData = sortedLeaderboard.map((entry, index) => {
      const row = [
        entry.rank || index + 1,
        entry.bib_number || '-',
        entry.name || '-',
        entry.team || entry.school || entry.kontingen || '-'
      ]
      
      // Add boulder scores
      // Note: API returns scores with field 'boulderIndex' (1-based), not 'boulder_number'
      const scores = entry.scores || []
      for (let i = 1; i <= totalBoulders; i++) {
        // Find score by boulderIndex (from API) or boulder_number (if exists)
        const boulderScore = scores.find(s => 
          s.boulderIndex === i || 
          s.boulder_number === i || 
          s.boulder === i ||
          (Array.isArray(scores) && scores.indexOf(s) === i - 1) // Fallback: index-based
        )
        
        if (boulderScore) {
          // Check if disqualified
          if (boulderScore.isDisqualified || boulderScore.is_disqualified) {
            row.push('DNS')
          } else {
            // Format: T{topAttempts} z{zoneAttempts} or just z{zoneAttempts} if no top
            const topAttempts = boulderScore.topAttempts || boulderScore.top_attempt || 0
            const zoneAttempts = boulderScore.zoneAttempts || boulderScore.zone_attempt || 0
            const isTop = boulderScore.isTop || boulderScore.reached_top
            const isZone = boulderScore.isZone || boulderScore.reached_zone
            
            if (isTop && topAttempts > 0) {
              // Has Top: Always show T{topAttempts} z{zoneAttempts} (zone attempts still count even if Top is reached)
              const zonePart = zoneAttempts > 0 ? ` z${zoneAttempts}` : ' z0'
              row.push(`T${topAttempts}${zonePart}`)
            } else if (isZone && zoneAttempts > 0) {
              // Only Zone (no Top)
              row.push(`z${zoneAttempts}`)
            } else if (topAttempts > 0 || zoneAttempts > 0) {
              // Has attempts but no top/zone reached yet - show attempts
              const parts = []
              if (topAttempts > 0) parts.push(`T${topAttempts}`)
              if (zoneAttempts > 0) parts.push(`z${zoneAttempts}`)
              row.push(parts.length > 0 ? parts.join(' ') : '-')
            } else {
              // No attempts recorded
              row.push('-')
            }
          }
        } else {
          // No score data for this boulder
          row.push('-')
        }
      }
      
      row.push((entry.totalScore || 0).toFixed(1))
      return row
    })
  } else if (categoryType === 'Lead') {
    headers.push('Previous Round (QF)', 'Height/Score')
    
    tableData = sortedLeaderboard.map((entry, index) => [
      entry.rank || index + 1,
      entry.bib_number || '-',
      entry.name || '-',
      entry.team || entry.kontingen || '-',
      entry.previous_round_score || entry.qualification_score || '-',
      entry.height ? `${entry.height}m` : (entry.score || '-')
    ])
  } else if (categoryType === 'Speed') {
    headers.push('Lane A', 'Lane B', 'Total Time', 'Status')
    
    const formatTime = (time) => {
      if (!time) return '-'
      if (typeof time === 'number') return `${time.toFixed(2)}s`
      return time.toString()
    }
    
    tableData = sortedLeaderboard.map((entry, index) => [
      entry.rank || index + 1,
      entry.bib_number || '-',
      entry.name || '-',
      entry.team || entry.kontingen || '-',
      formatTime(entry.lane_a_time),
      formatTime(entry.lane_b_time),
      formatTime(entry.total_time),
      entry.status || 'VALID'
    ])
  }
  
  // Generate table with autoTable - Professional FPTI styling
  const autoTableOptions = {
    startY: currentY,
    head: [headers],
    body: tableData,
    theme: 'grid', // Use grid theme for visible vertical and horizontal lines
    headStyles: {
      fillColor: [27, 94, 32], // Dark Green (#1B5E20) - FPTI standard
      textColor: [255, 255, 255], // White (#FFFFFF)
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
      valign: 'middle',
      lineWidth: 0.1,
      lineColor: [0, 0, 0] // Black borders for header
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [0, 0, 0], // Black (#000000)
      fillColor: [255, 255, 255], // White (#FFFFFF) by default
      halign: 'left',
      valign: 'middle',
      lineWidth: 0.1, // Thin borders
      lineColor: [176, 190, 197] // Light Gray (#B0BEC5)
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 }, // Rank - Center
      1: { halign: 'center', cellWidth: 15 }, // Bib - Center
      2: { halign: 'left', cellWidth: 50 }, // Name - Left
      3: { halign: 'left', cellWidth: 40 }  // Team - Left
    },
    didParseCell: (data) => {
      // Qualification Logic: Apply background color based on qualification status
      if (data.section === 'body') {
        // Check if this row is within qualification quota (Top 8 + Ties)
        if (data.row.index < qualifiedCount && data.row.index >= 0) {
          // Qualified climber: Very Light Green background
          data.cell.styles.fillColor = [232, 245, 233] // Very Light Green (#E8F5E9)
        } else {
          // Non-qualified climber: White background
          data.cell.styles.fillColor = [255, 255, 255] // White (#FFFFFF)
        }
      }
      
      // Set alignment per column type
      if (data.column.index === 0) { // Rank - Center
        data.cell.styles.halign = 'center'
      } else if (data.column.index === 1) { // Bib - Center
        data.cell.styles.halign = 'center'
      } else if (data.column.index === 2 || data.column.index === 3) { 
        // Name, Team - Left aligned
        data.cell.styles.halign = 'left'
      } else {
        // Score columns (B1, B2, etc., Total Score) - Center aligned
        data.cell.styles.halign = 'center'
      }
    },
    margin: { top: currentY, left: 10, right: 10 }
  }
  
  // Adjust column widths and alignment for different categories
  if (categoryType === 'Boulder') {
    const totalBoulders = competition.total_boulders || 4
    autoTableOptions.columnStyles = {
      0: { halign: 'center', cellWidth: 12 }, // Rank
      1: { halign: 'center', cellWidth: 12 }, // Bib
      2: { halign: 'left', cellWidth: 50 }, // Name (more space)
      3: { halign: 'left', cellWidth: 40 }, // Team/Kontingen
    }
    // Boulder columns (B1, B2, B3, B4)
    for (let i = 0; i < totalBoulders; i++) {
      autoTableOptions.columnStyles[4 + i] = { halign: 'center', cellWidth: 14 } // B1, B2, etc.
    }
    // Total Score column - wider to avoid wrapping
    autoTableOptions.columnStyles[4 + totalBoulders] = { halign: 'center', cellWidth: 22 } // Total Score
  } else if (categoryType === 'Speed') {
    autoTableOptions.columnStyles = {
      0: { halign: 'center', cellWidth: 12 }, // Rank
      1: { halign: 'center', cellWidth: 12 }, // Bib
      2: { halign: 'left', cellWidth: 50 }, // Name
      3: { halign: 'left', cellWidth: 35 }, // Team
      4: { halign: 'center', cellWidth: 18 }, // Lane A
      5: { halign: 'center', cellWidth: 18 }, // Lane B
      6: { halign: 'center', cellWidth: 20 }, // Total Time
      7: { halign: 'center', cellWidth: 18 } // Status
    }
  } else if (categoryType === 'Lead') {
    autoTableOptions.columnStyles = {
      0: { halign: 'center', cellWidth: 12 }, // Rank
      1: { halign: 'center', cellWidth: 12 }, // Bib
      2: { halign: 'left', cellWidth: 50 }, // Name
      3: { halign: 'left', cellWidth: 35 }, // Team
      4: { halign: 'center', cellWidth: 28 }, // Previous Round
      5: { halign: 'center', cellWidth: 28 } // Height/Score
    }
  }
  
  // Generate table using autoTable - use functional syntax for Vite compatibility
  autoTable(doc, autoTableOptions)
  
  // Get final Y position after table
  let currentYAfterTable = doc.lastAutoTable.finalY || currentY + 50
  
  // Draw thick green line after last qualified climber (qualification cutoff indicator)
  if (qualifiedCount > 0 && doc.lastAutoTable && doc.lastAutoTable.finalY && tableData.length > 0) {
    // Calculate approximate row height
    const tableHeight = doc.lastAutoTable.finalY - currentY
    const headerHeight = 10 // Approximate header height
    const bodyHeight = tableHeight - headerHeight
    const rowHeight = bodyHeight / tableData.length
    
    // Calculate Y position of the bottom of the last qualified row
    const qualifiedRowBottom = currentY + headerHeight + (rowHeight * qualifiedCount)
    
    // Draw thick dark green line across the table width (cutoff indicator)
    if (qualifiedRowBottom < doc.lastAutoTable.finalY) {
      doc.setDrawColor(27, 94, 32) // Dark Green (#1B5E20)
      doc.setLineWidth(0.5) // Thick line (0.5mm)
      const tableLeft = 10
      const tableRight = pageWidth - 10
      doc.line(tableLeft, qualifiedRowBottom, tableRight, qualifiedRowBottom)
      doc.setLineWidth(0.1) // Reset to normal line width
    }
  }
  
  // Add section for qualified climbers (finalists) if this is qualification round
  // For Boulder: Qualification -> Final (no Semifinal), top 8 + ties go directly to Final
  // Always put qualified climbers section on page 2
  if ((round === 'qualification' || round === 'Qualification') && qualifiedCount > 0 && sortedLeaderboard.length > 0) {
    // Always add new page for qualified climbers section (page 2)
    doc.addPage()
    currentYAfterTable = 25 // Start from top of page 2 with proper margin
    
    // Title for qualified climbers section
    doc.setFontSize(11)
    doc.setFont(undefined, 'bold')
    doc.setTextColor(0, 0, 0)
    // For Boulder competitions: Qualification always goes directly to Final (no Semifinal)
    // For other competition types, check the round
    const nextRoundText = categoryType === 'Boulder' ? 'Final' :
                          round === 'qualification' || round === 'Qualification' ? 'Final' : 
                          round === 'semifinal' || round === 'Semifinal' ? 'Final' : 'Babak Selanjutnya'
    const qualifiedTitle = `Atlet yang Lolos ke ${nextRoundText}:`
    doc.text(qualifiedTitle, 15, currentYAfterTable)
    
    currentYAfterTable += 8
    
    // Get qualified climbers
    const qualifiedClimbers = sortedLeaderboard.slice(0, qualifiedCount)
    
    // Prepare data for qualified climbers table
    const qualifiedData = qualifiedClimbers.map((entry, index) => [
      entry.rank || index + 1,
      entry.bib_number || '-',
      entry.name || '-',
      entry.team || entry.school || entry.kontingen || '-'
    ])
    
    // Generate table for qualified climbers
    autoTable(doc, {
      startY: currentYAfterTable,
      head: [['Rank', 'Bib', 'Nama', 'Team/Kontingen']],
      body: qualifiedData,
      theme: 'grid',
      headStyles: {
        fillColor: [27, 94, 32], // Dark Green (#1B5E20)
        textColor: [255, 255, 255], // White
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [0, 0, 0],
        fillColor: [255, 255, 255],
        lineWidth: 0.1,
        lineColor: [176, 190, 197]
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 }, // Rank
        1: { halign: 'center', cellWidth: 15 }, // Bib
        2: { halign: 'left', cellWidth: 70 }, // Name
        3: { halign: 'left', cellWidth: 50 }  // Team
      },
      margin: { top: currentYAfterTable, left: 10, right: 10 }
    })
    
    // Update currentYAfterTable after qualified climbers table
    currentYAfterTable = doc.lastAutoTable.finalY + 5
  }
  
  // Footer section - check current Y position and add new page if needed
  const finalYPosition = doc.lastAutoTable ? doc.lastAutoTable.finalY : currentYAfterTable
  let footerY = pageHeight - 40
  
  // If content is too close to footer, move footer to next page
  if (finalYPosition > footerY - 15) {
    doc.addPage()
    footerY = pageHeight - 40
  }
  
  // Reset text color to black for footer
  doc.setTextColor(0, 0, 0)
  
  // Official Result text (bottom left)
  doc.setFontSize(10)
  doc.setFont(undefined, 'bold')
  doc.text('Official Result', 15, footerY)
  
  // Timestamp (bottom left, below Official Result)
  const now = new Date()
  const timestamp = now.toLocaleDateString('id-ID', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  }) + ', ' + now.toLocaleTimeString('id-ID', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
  doc.setFontSize(9)
  doc.setFont(undefined, 'normal')
  doc.text(timestamp, 15, footerY + 6)
  
  // Judge signature placeholder (bottom right) - with proper spacing
  doc.setFontSize(9)
  doc.setFont(undefined, 'normal')
  const judgeText = 'Chief Judge:'
  const judgeTextWidth = doc.getTextWidth(judgeText)
  const signatureX = pageWidth - 55
  doc.text(judgeText, signatureX - judgeTextWidth - 5, footerY)
  
  // Signature line (wider and properly positioned)
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.1)
  doc.line(signatureX, footerY + 3, pageWidth - 10, footerY + 3)
  
  // Optional: Add name placeholder below signature line
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  const namePlaceholder = '(Nama)'
  const nameWidth = doc.getTextWidth(namePlaceholder)
  doc.text(namePlaceholder, signatureX + (pageWidth - 10 - signatureX) / 2 - nameWidth / 2, footerY + 7, { align: 'center' })
  
  // Save PDF
  const filename = `Official_Result_${competition.name || 'competition'}_${round}_${categoryType}.pdf`.replace(/[^a-z0-9]/gi, '_')
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

