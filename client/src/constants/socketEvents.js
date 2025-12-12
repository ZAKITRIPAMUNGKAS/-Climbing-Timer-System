/**
 * Socket Event Names - Centralized event naming untuk konsistensi
 * Format: CATEGORY:ACTION:TYPE
 */

export const SOCKET_EVENTS = {
  // Boulder Events
  BOULDER: {
    SCORE_UPDATED: 'boulder:score:updated',
    SCORE_BATCH_UPDATED: 'boulder:score:batch:updated',
  },
  
  // Speed Events
  SPEED: {
    QUALIFICATION_UPDATED: 'speed:qualification:updated',
    FINALS_UPDATED: 'speed:finals:updated',
    MATCH_UPDATED: 'speed:match:updated',
  },
  
  // Competition Events
  COMPETITION: {
    UPDATED: 'competition:updated',
    CREATED: 'competition:created',
    DELETED: 'competition:deleted',
  },
  
  // Timer Events (Speed)
  TIMER: {
    RACE_STATE: 'timer:race:state',
    PLAY_SOUND: 'timer:sound:play',
  },
  
  // Boulder Timer Events
  BOULDER_TIMER: {
    SYNC_TIME: 'boulder:timer:sync',
    PLAY_SOUND: 'boulder:timer:sound:play',
  },
}

// Legacy event names untuk backward compatibility (akan di-deprecate)
export const LEGACY_EVENTS = {
  SCORE_UPDATED: 'score-updated', // Deprecated: use SOCKET_EVENTS.BOULDER.SCORE_UPDATED
  SPEED_QUALIFICATION_UPDATED: 'speed-qualification-updated', // Deprecated: use SOCKET_EVENTS.SPEED.QUALIFICATION_UPDATED
  SPEED_FINALS_UPDATED: 'speed-finals-updated', // Deprecated: use SOCKET_EVENTS.SPEED.FINALS_UPDATED
}

