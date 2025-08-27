// Utility functions for localStorage management

export const STORAGE_KEYS = {
  PUZZLE_STATE: "disrupt-puzzle-state",
  USER_PREFERENCES: "disrupt-puzzle-preferences",
} as const

export const storageUtils = {
  // Save data to localStorage
  save<T>(key: string, data: T): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
      console.error(`Failed to save to localStorage (${key}):`, error)
    }
  },

  // Load data from localStorage
  load<T>(key: string): T | null {
    if (typeof window === 'undefined') return null
    
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch (error) {
      console.error(`Failed to load from localStorage (${key}):`, error)
      return null
    }
  },

  // Remove data from localStorage
  remove(key: string): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error(`Failed to remove from localStorage (${key}):`, error)
    }
  },

  // Clear all puzzle-related data
  clearPuzzleData(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      this.remove(key)
    })
  },

  // Get storage usage info
  getStorageInfo(): { used: number; available: number; total: number } {
    if (typeof window === 'undefined') {
      return { used: 0, available: 0, total: 0 }
    }

    let used = 0
    let total = 0

    try {
      // Calculate used space
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length + key.length
        }
      }

      // Estimate total available space (varies by browser)
      total = 5 * 1024 * 1024 // 5MB estimate
    } catch (error) {
      console.error('Failed to calculate storage info:', error)
    }

    return {
      used,
      available: total - used,
      total
    }
  },

  // Debug function to log current puzzle state
  debugPuzzleState(): void {
    const state = this.load(STORAGE_KEYS.PUZZLE_STATE)
    console.log('Current puzzle state:', state)
    
    const storageInfo = this.getStorageInfo()
    console.log('Storage usage:', {
      used: `${(storageInfo.used / 1024).toFixed(2)} KB`,
      available: `${(storageInfo.available / 1024).toFixed(2)} KB`,
      total: `${(storageInfo.total / 1024).toFixed(2)} KB`
    })
  }
}
