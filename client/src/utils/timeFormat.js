/**
 * Convert seconds (decimal) to MM:SS.mmm format
 * @param {number|string} seconds - Time in seconds (e.g., 1.439)
 * @returns {string} Formatted time (e.g., "00:01.439")
 */
export function formatTimeMMSSmmm(seconds) {
  if (seconds === null || seconds === undefined || seconds === '' || isNaN(seconds)) {
    return ''
  }
  
  // Round to 3 decimal places first to ensure consistency
  const totalSeconds = Math.round(parseFloat(seconds) * 1000) / 1000
  const minutes = Math.floor(totalSeconds / 60)
  const secs = Math.floor(totalSeconds % 60)
  // Use Math.round instead of Math.floor to ensure proper rounding
  const milliseconds = Math.round((totalSeconds - Math.floor(totalSeconds)) * 1000)
  
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`
}

/**
 * Convert MM:SS.mmm format to seconds (decimal)
 * @param {string} timeString - Time in MM:SS.mmm format (e.g., "00:01.439")
 * @returns {number|null} Time in seconds (e.g., 1.439) or null if invalid
 */
export function parseTimeMMSSmmm(timeString) {
  if (!timeString || timeString.trim() === '') {
    return null
  }
  
  // Remove any whitespace
  timeString = timeString.trim()
  
  // Match pattern: MM:SS.mmm or MM:SS:mm or MM:SS:m
  const pattern = /^(\d{1,2}):(\d{2})\.(\d{1,3})$/
  const match = timeString.match(pattern)
  
  if (!match) {
    // Try to parse as decimal seconds (backward compatibility)
    const decimal = parseFloat(timeString)
    if (!isNaN(decimal)) {
      return decimal
    }
    return null
  }
  
  const minutes = parseInt(match[1], 10)
  const seconds = parseInt(match[2], 10)
  const milliseconds = parseInt(match[3].padEnd(3, '0'), 10) // Pad to 3 digits if needed
  
  const totalSeconds = minutes * 60 + seconds + milliseconds / 1000
  return parseFloat(totalSeconds.toFixed(3))
}

/**
 * Validate time input format
 * @param {string} timeString - Time string to validate
 * @returns {boolean} True if valid format
 */
export function isValidTimeFormat(timeString) {
  if (!timeString || timeString.trim() === '') {
    return true // Empty is valid (optional field)
  }
  
  // Check MM:SS.mmm format
  const pattern = /^(\d{1,2}):(\d{2})\.(\d{1,3})$/
  if (pattern.test(timeString.trim())) {
    return true
  }
  
  // Check decimal format (backward compatibility)
  const decimal = parseFloat(timeString)
  return !isNaN(decimal) && decimal >= 0
}

