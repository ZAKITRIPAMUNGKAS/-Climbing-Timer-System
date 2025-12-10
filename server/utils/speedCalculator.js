/**
 * Utility functions untuk menghitung ranking Speed Climbing (Classic)
 * 
 * Qualification Rules:
 * - Total Score = Time Lane A + Time Lane B
 * - Ranking: Sort by Total Score ASCENDING (Lowest = Rank 1)
 * - If FALL/FALSE_START/DNS on either lane → INVALID (Unranked)
 * 
 * Finals Rules (Speed Classic):
 * - Each climber runs TWICE: Run 1 (Lane A) + Run 2 (Lane B)
 * - Winner: Lower TOTAL TIME (run1 + run2) wins
 * - If FALL/FS/DNS on either run → Invalid (use qualification rank as tiebreaker)
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
 * RULE: Waktu terendah (tercepat) = Rank 1, waktu lebih tinggi = rank lebih tinggi
 * @param {Array} scores - Array of qualification score objects with totalTime and status
 * @returns {Array} Sorted scores with ranks assigned (rank 1 = fastest time)
 */
function rankQualificationScores(scores) {
    // Separate valid and invalid scores
    const validScores = scores.filter(s => s.status === 'VALID' && (s.totalTime !== null || s.total_time !== null));
    const invalidScores = scores.filter(s => s.status === 'INVALID' || (s.totalTime === null && s.total_time === null));
    
    // Normalize totalTime field (handle both totalTime and total_time)
    validScores.forEach(score => {
        if (score.totalTime === undefined && score.total_time !== undefined) {
            score.totalTime = score.total_time;
        }
    });
    
    // Sort valid scores by totalTime ASCENDING (waktu terendah = rank 1)
    validScores.sort((a, b) => {
        const timeA = a.totalTime !== undefined ? a.totalTime : a.total_time;
        const timeB = b.totalTime !== undefined ? b.totalTime : b.total_time;
        
        if (timeA === null || timeA === undefined) return 1;
        if (timeB === null || timeB === undefined) return -1;
        return timeA - timeB; // ASCENDING: lower time = better rank
    });
    
    // Assign ranks to valid scores (waktu terendah = rank 1)
    validScores.forEach((score, index) => {
        score.rank = index + 1; // Index 0 = Rank 1, Index 1 = Rank 2, etc.
    });
    
    // Invalid scores get null rank (unranked)
    invalidScores.forEach(score => {
        score.rank = null;
    });
    
    // Combine: valid (ranked) first, then invalid (unranked)
    return [...validScores, ...invalidScores];
}

/**
 * Calculate total time for a climber's two runs (Speed Classic Finals)
 * @param {number|null} run1Time - Time for Run 1 (Lane A)
 * @param {number|null} run2Time - Time for Run 2 (Lane B)
 * @param {string} run1Status - Status for Run 1
 * @param {string} run2Status - Status for Run 2
 * @returns {Object} { totalTime, status, isValid }
 */
function calculateClassicFinalsTotal(run1Time, run2Time, run1Status, run2Status) {
    // Parse times to ensure they are numbers (database might return strings)
    const parsedRun1Time = run1Time !== null && run1Time !== undefined ? parseFloat(run1Time) : null;
    const parsedRun2Time = run2Time !== null && run2Time !== undefined ? parseFloat(run2Time) : null;
    
    // Check if any run is invalid
    const isInvalid = 
        run1Status !== 'VALID' || 
        run2Status !== 'VALID' || 
        parsedRun1Time === null || 
        parsedRun2Time === null ||
        isNaN(parsedRun1Time) ||
        isNaN(parsedRun2Time);
    
    if (isInvalid) {
        return {
            totalTime: null,
            status: 'INVALID',
            isValid: false
        };
    }
    
    // Calculate total time - round to 3 decimal places
    const totalTime = Math.round((parsedRun1Time + parsedRun2Time) * 1000) / 1000;
    
    return {
        totalTime: totalTime,
        status: 'VALID',
        isValid: true
    };
}

/**
 * Calculate winner for Speed Classic Finals match (two runs per climber)
 * @param {Object} climberA - { run1Time, run2Time, run1Status, run2Status, id, rank }
 * @param {Object} climberB - { run1Time, run2Time, run1Status, run2Status, id, rank }
 * @returns {number|null} Winner ID (null if both invalid or tie)
 */
function calculateClassicFinalsWinner(climberA, climberB) {
    const aTotal = calculateClassicFinalsTotal(
        climberA.run1Time, 
        climberA.run2Time, 
        climberA.run1Status || 'VALID', 
        climberA.run2Status || 'VALID'
    );
    
    const bTotal = calculateClassicFinalsTotal(
        climberB.run1Time, 
        climberB.run2Time, 
        climberB.run1Status || 'VALID', 
        climberB.run2Status || 'VALID'
    );
    
    // If both are invalid, use qualification rank as tiebreaker
    if (!aTotal.isValid && !bTotal.isValid) {
        if (climberA.rank !== null && climberB.rank !== null) {
            return climberA.rank < climberB.rank ? climberA.id : climberB.id;
        }
        if (climberA.rank !== null) return climberA.id;
        if (climberB.rank !== null) return climberB.id;
        return null;
    }
    
    // If only A is valid, A wins
    if (aTotal.isValid && !bTotal.isValid) {
        return climberA.id;
    }
    
    // If only B is valid, B wins
    if (!aTotal.isValid && bTotal.isValid) {
        return climberB.id;
    }
    
    // Both are valid, compare total times
    if (aTotal.totalTime !== null && bTotal.totalTime !== null) {
        // Debug logging
        console.log('[calculateClassicFinalsWinner] Comparing totals:', {
            climberA: { id: climberA.id, totalTime: aTotal.totalTime, rank: climberA.rank },
            climberB: { id: climberB.id, totalTime: bTotal.totalTime, rank: climberB.rank },
            aLessThanB: aTotal.totalTime < bTotal.totalTime,
            bLessThanA: bTotal.totalTime < aTotal.totalTime,
            equal: aTotal.totalTime === bTotal.totalTime
        });
        
        if (aTotal.totalTime < bTotal.totalTime) {
            console.log('[calculateClassicFinalsWinner] Winner: Climber A (lower total time)');
            return climberA.id;
        } else if (bTotal.totalTime < aTotal.totalTime) {
            console.log('[calculateClassicFinalsWinner] Winner: Climber B (lower total time)');
            return climberB.id;
        } else {
            // Tie in total time - use qualification rank as tiebreaker
            console.log('[calculateClassicFinalsWinner] Tie detected, using rank as tiebreaker');
            if (climberA.rank !== null && climberB.rank !== null) {
                const winner = climberA.rank < climberB.rank ? climberA.id : climberB.id;
                console.log('[calculateClassicFinalsWinner] Winner by rank:', winner === climberA.id ? 'Climber A' : 'Climber B');
                return winner;
            }
            return null;
        }
    }
    
    return null;
}

module.exports = {
    calculateQualificationScore,
    calculateFinalsWinner,
    calculateClassicFinalsTotal,
    calculateClassicFinalsWinner,
    rankQualificationScores
};

