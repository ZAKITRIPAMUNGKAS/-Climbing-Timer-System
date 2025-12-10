/**
 * Utility functions untuk menghitung ranking Speed Climbing (Classic)
 * 
 * Qualification Rules:
 * - Total Score = Time Lane A + Time Lane B
 * - Ranking: Sort by Total Score ASCENDING (Lowest = Rank 1)
 * - If FALL/FALSE_START/DNS on either lane → INVALID (Unranked)
 * 
 * Finals Rules:
 * - Head-to-Head: Compare Time A vs Time B
 * - Winner: Lower time wins
 */

/**
 * Calculate total time and status for qualification
 * @param {number|null} laneATime - Time for Lane A
 * @param {number|null} laneBTime - Time for Lane B
 * @param {string} laneAStatus - Status for Lane A ('VALID', 'FALL', 'FALSE_START', 'DNS')
 * @param {string} laneBStatus - Status for Lane B ('VALID', 'FALL', 'FALSE_START', 'DNS')
 * @returns {Object} { totalTime, status }
 */
function calculateQualificationScore(laneATime, laneBTime, laneAStatus, laneBStatus) {
    // Check if any lane is invalid
    const isInvalid = 
        laneAStatus !== 'VALID' || 
        laneBStatus !== 'VALID' || 
        laneATime === null || 
        laneBTime === null;
    
    if (isInvalid) {
        return {
            totalTime: null,
            status: 'INVALID'
        };
    }
    
    // Calculate total time - round to 3 decimal places for consistency
    const totalTime = Math.round((laneATime + laneBTime) * 1000) / 1000;
    
    return {
        totalTime: totalTime,
        status: 'VALID'
    };
}

/**
 * Calculate winner for finals match
 * @param {number|null} timeA - Time for Climber A
 * @param {number|null} timeB - Time for Climber B
 * @param {string} statusA - Status for Climber A
 * @param {string} statusB - Status for Climber B
 * @param {number} climberAId - ID of Climber A
 * @param {number} climberBId - ID of Climber B
 * @param {number|null} rankA - Qualification rank of Climber A (lower = better)
 * @param {number|null} rankB - Qualification rank of Climber B (lower = better)
 * @returns {number|null} Winner ID (null if both invalid or tie)
 */
function calculateFinalsWinner(timeA, timeB, statusA, statusB, climberAId, climberBId, rankA = null, rankB = null) {
    // If both are invalid (FALL/FS/DNS), use qualification rank as tiebreaker
    if (statusA !== 'VALID' && statusB !== 'VALID') {
        // If both have ranks, lower rank (better seed) wins
        if (rankA !== null && rankB !== null) {
            return rankA < rankB ? climberAId : climberBId;
        }
        // If only one has rank, that one wins
        if (rankA !== null) return climberAId;
        if (rankB !== null) return climberBId;
        // No rank info, return null (manual decision needed)
        return null;
    }
    
    // If only A is valid, A wins
    if (statusA === 'VALID' && statusB !== 'VALID') {
        return climberAId;
    }
    
    // If only B is valid, B wins
    if (statusA !== 'VALID' && statusB === 'VALID') {
        return climberBId;
    }
    
    // Both are valid, compare times
    if (timeA !== null && timeB !== null) {
        if (timeA < timeB) {
            return climberAId;
        } else if (timeB < timeA) {
            return climberBId;
        } else {
            // Tie in time - use qualification rank as tiebreaker
            if (rankA !== null && rankB !== null) {
                return rankA < rankB ? climberAId : climberBId;
            }
            // No rank info for tiebreaker
            return null;
        }
    }
    
    return null;
}

/**
 * Sort qualification scores and assign ranks
 * @param {Array} scores - Array of qualification score objects
 * @returns {Array} Sorted scores with ranks assigned
 */
function rankQualificationScores(scores) {
    // Separate valid and invalid scores
    const validScores = scores.filter(s => s.status === 'VALID' && s.totalTime !== null);
    const invalidScores = scores.filter(s => s.status === 'INVALID' || s.totalTime === null);
    
    // Sort valid scores by totalTime ASCENDING
    validScores.sort((a, b) => {
        if (a.totalTime === null) return 1;
        if (b.totalTime === null) return -1;
        return a.totalTime - b.totalTime;
    });
    
    // Assign ranks to valid scores
    validScores.forEach((score, index) => {
        score.rank = index + 1;
    });
    
    // Invalid scores get null rank (unranked)
    invalidScores.forEach(score => {
        score.rank = null;
    });
    
    // Combine: valid (ranked) first, then invalid (unranked)
    return [...validScores, ...invalidScores];
}

module.exports = {
    calculateQualificationScore,
    calculateFinalsWinner,
    rankQualificationScores
};

