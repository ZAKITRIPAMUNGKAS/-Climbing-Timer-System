/**
 * Request Queue untuk prevent data race conditions
 * Memastikan request di-queue dan dijalankan secara sequential untuk same resource
 */

class RequestQueue {
  constructor() {
    this.queues = new Map() // Map<resourceKey, QueueItem[]>
    this.processing = new Map() // Map<resourceKey, boolean>
  }

  /**
   * Generate unique key untuk resource (competition + climber + boulder)
   */
  getResourceKey(competitionId, climberId, boulderNumber) {
    return `${competitionId}_${climberId}_${boulderNumber || 'all'}`
  }

  /**
   * Add request to queue dan execute
   */
  async enqueue(resourceKey, requestFn) {
    return new Promise((resolve, reject) => {
      // Get or create queue for this resource
      if (!this.queues.has(resourceKey)) {
        this.queues.set(resourceKey, [])
        this.processing.set(resourceKey, false)
      }

      const queue = this.queues.get(resourceKey)
      
      // Add request to queue
      queue.push({
        requestFn,
        resolve,
        reject,
        timestamp: Date.now()
      })

      // Process queue if not already processing
      this.processQueue(resourceKey)
    })
  }

  /**
   * Process queue for specific resource (sequential)
   */
  async processQueue(resourceKey) {
    const isProcessing = this.processing.get(resourceKey)
    if (isProcessing) {
      return // Already processing, wait for current request
    }

    const queue = this.queues.get(resourceKey)
    if (!queue || queue.length === 0) {
      return // Queue empty
    }

    this.processing.set(resourceKey, true)

    try {
      while (queue.length > 0) {
        const item = queue.shift()
        
        try {
          // Timeout protection untuk prevent hanging requests (30 seconds)
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), 30000)
          })
          
          const result = await Promise.race([item.requestFn(), timeoutPromise])
          item.resolve(result)
        } catch (error) {
          console.error('[RequestQueue] Error processing request:', error)
          item.reject(error)
        }

        // Small delay between requests untuk prevent overwhelming
        if (queue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 50))
        }
      }
    } finally {
      this.processing.set(resourceKey, false)
      // Clean up empty queue
      const remainingQueue = this.queues.get(resourceKey)
      if (!remainingQueue || remainingQueue.length === 0) {
        this.queues.delete(resourceKey)
        this.processing.delete(resourceKey)
      }
    }
  }

  /**
   * Clear queue for specific resource (useful on unmount/error)
   */
  clearQueue(resourceKey) {
    const queue = this.queues.get(resourceKey)
    if (queue) {
      queue.forEach(item => {
        item.reject(new Error('Queue cleared'))
      })
      this.queues.delete(resourceKey)
      this.processing.delete(resourceKey)
    }
  }

  /**
   * Clear all queues
   */
  clearAll() {
    this.queues.forEach((queue, key) => {
      this.clearQueue(key)
    })
  }
}

// Singleton instance
export const requestQueue = new RequestQueue()

// Helper untuk boulder score update
export const queueBoulderScoreUpdate = async (competitionId, climberId, boulderNumber, updateFn) => {
  const resourceKey = requestQueue.getResourceKey(competitionId, climberId, boulderNumber)
  return requestQueue.enqueue(resourceKey, updateFn)
}

