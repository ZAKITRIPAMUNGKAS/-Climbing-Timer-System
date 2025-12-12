/**
 * Socket Manager - Centralized Socket.IO management
 * - Auto-reconnect handling
 * - Fallback fetch on reconnect
 * - Event naming consistency
 * - Connection state management
 */

import { io } from 'socket.io-client'

class SocketManager {
  constructor() {
    this.socket = null
    this.reconnectCallbacks = new Map() // Map<event, callback[]>
    this.connectionState = 'disconnected' // 'connected' | 'disconnected' | 'connecting' | 'reconnecting'
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
  }

  /**
   * Initialize socket connection
   */
  connect(namespace = '/') {
    if (this.socket?.connected) {
      return this.socket
    }

    this.connectionState = 'connecting'
    this.socket = io(namespace, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
      timeout: 20000,
      transports: ['websocket', 'polling']
    })

    this.setupEventHandlers()
    return this.socket
  }

  /**
   * Setup socket event handlers
   */
  setupEventHandlers() {
    this.socket.on('connect', () => {
      console.log('[Socket] Connected:', this.socket.id)
      this.connectionState = 'connected'
      this.reconnectAttempts = 0
      
      // Trigger reconnect callbacks untuk sync data
      this.triggerReconnectCallbacks()
    })

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason)
      this.connectionState = 'disconnected'
    })

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('[Socket] Reconnect attempt:', attemptNumber)
      this.connectionState = 'reconnecting'
      this.reconnectAttempts = attemptNumber
    })

    this.socket.on('reconnect_failed', () => {
      console.error('[Socket] Reconnect failed after', this.maxReconnectAttempts, 'attempts')
      this.connectionState = 'disconnected'
    })

    this.socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message)
    })
  }

  /**
   * Register callback untuk dipanggil saat reconnect (fallback fetch)
   */
  onReconnect(eventKey, callback) {
    if (!this.reconnectCallbacks.has(eventKey)) {
      this.reconnectCallbacks.set(eventKey, [])
    }
    this.reconnectCallbacks.get(eventKey).push(callback)

    // Return unsubscribe function
    return () => {
      const callbacks = this.reconnectCallbacks.get(eventKey)
      if (callbacks) {
        const index = callbacks.indexOf(callback)
        if (index > -1) {
          callbacks.splice(index, 1)
        }
      }
    }
  }

  /**
   * Trigger all reconnect callbacks (fallback fetch)
   */
  triggerReconnectCallbacks() {
    this.reconnectCallbacks.forEach((callbacks, eventKey) => {
      console.log('[Socket] Triggering reconnect callbacks for:', eventKey)
      callbacks.forEach(callback => {
        try {
          callback()
        } catch (error) {
          console.error('[Socket] Error in reconnect callback:', error)
        }
      })
    })
  }

  /**
   * Get socket instance
   */
  getSocket() {
    if (!this.socket) {
      return this.connect()
    }
    return this.socket
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.socket?.connected || false
  }

  /**
   * Get connection state
   */
  getConnectionState() {
    return this.connectionState
  }

  /**
   * Disconnect socket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.connectionState = 'disconnected'
      this.reconnectCallbacks.clear()
    }
  }

  /**
   * Listen to event dengan auto-reconnect handling
   */
  on(event, callback) {
    const socket = this.getSocket()
    socket.on(event, callback)
    
    // Return unsubscribe function
    return () => {
      if (socket && socket.connected) {
        socket.off(event, callback)
      }
    }
  }

  /**
   * Remove event listener
   */
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback)
    }
  }

  /**
   * Emit event
   */
  emit(event, data) {
    if (this.isConnected()) {
      this.socket.emit(event, data)
    } else {
      console.warn('[Socket] Cannot emit, not connected:', event)
    }
  }
}

// Singleton instance
export const socketManager = new SocketManager()

// Boulder namespace (if needed)
export const boulderSocketManager = new SocketManager()

