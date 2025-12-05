/**
 * Utility function untuk menghitung poin Boulder berdasarkan sistem Kejurnas FPTI
 * 
 * Rules:
 * - Base TOP Score: 25.0 points
 * - Base ZONE Score: 10.0 points
 * - Deduction: 0.1 points per extra attempt
 * 
 * Formula:
 * - If Top reached: Score = 25 - ((top_attempts - 1) * 0.1)
 * - If Zone reached (No Top): Score = 10 - ((zone_attempts - 1) * 0.1)
 * - If Fail: Score = 0
 * 
 * Note: If an athlete gets Top, the Zone score is ignored/overwritten by the Top score.
 * 
 * @param {boolean} isTop - Whether the climber reached the top
 * @param {number} topAttempts - Number of attempts to reach top (0 if not reached)
 * @param {boolean} isZone - Whether the climber reached the zone
 * @param {number} zoneAttempts - Number of attempts to reach zone (0 if not reached)
 * @returns {number} Calculated score (float)
 */
function calculateBoulderScore(isTop, topAttempts, isZone, zoneAttempts) {
    // If Top is reached, use Top formula
    if (isTop && topAttempts > 0) {
        // Score = 25 - ((top_attempts - 1) * 0.1)
        const score = 25.0 - ((topAttempts - 1) * 0.1);
        // Ensure score doesn't go below 0
        return Math.max(0, parseFloat(score.toFixed(1)));
    }
    
    // If Zone is reached (but no Top), use Zone formula
    if (isZone && zoneAttempts > 0) {
        // Score = 10 - ((zone_attempts - 1) * 0.1)
        const score = 10.0 - ((zoneAttempts - 1) * 0.1);
        // Ensure score doesn't go below 0
        return Math.max(0, parseFloat(score.toFixed(1)));
    }
    
    // If neither Top nor Zone reached, score is 0
    return 0.0;
}

module.exports = {
    calculateBoulderScore
};

